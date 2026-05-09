import { escapeHtml, renderMarkdown } from "./markdown";
import { widgetStyles } from "./styles";
import { Context7TransportError, streamContext7Response } from "./transport";
import type {
  Context7Message,
  Context7Position,
  Context7Theme,
  Context7ToolCall,
  Context7ToolResult,
  Context7WidgetApi,
  Context7WidgetConfig,
  Context7WidgetEventDetail
} from "./types";

const registry = new Map<string, HTMLElement>();
const DEFAULT_INITIAL_MESSAGE =
  "Hello! I'm here to help you with documentation for **{library}**.\n\nAsk me about features, code examples, setup, configuration, API details, or best practices.";

let globalApiInstalled = false;

export class Context7WidgetElement extends HTMLElement {
  static observedAttributes = [
    "api-url",
    "color",
    "custom-trigger",
    "data-api-url",
    "data-color",
    "data-custom-trigger",
    "data-hide-default-button",
    "data-initial-message",
    "data-library",
    "data-placeholder",
    "data-position",
    "data-theme",
    "data-title",
    "data-widget-id",
    "hide-default-button",
    "initial-message",
    "library",
    "placeholder",
    "position",
    "theme",
    "title",
    "widget-id"
  ];

  private abortController: AbortController | null = null;
  private busy = false;
  private config: Context7WidgetConfig = readConfig(this);
  private lastFocus: Element | null = null;
  private messageCounter = 0;
  private messages: Context7Message[] = [];
  private registeredId = "";
  private readonly root: ShadowRoot;
  private toolCalls = new Map<string, HTMLElement>();
  private triggerElement: Element | null = null;

  private readonly onCustomTrigger = (event: Event) => {
    event.preventDefault();
    this.toggle();
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && this.isOpen()) {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== "Tab" || !this.isOpen()) return;
    trapFocus(event, this.root);
  };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    this.renderShell();
  }

  connectedCallback(): void {
    this.syncConfig();
    this.bindEvents();
    this.resetConversation();
    this.register();
    this.emit("c7:ready");
  }

  disconnectedCallback(): void {
    this.abortController?.abort();
    this.unbindCustomTrigger();
    this.unregister();
  }

  attributeChangedCallback(): void {
    const previousLibrary = this.config.library;
    this.syncConfig();
    this.updateStaticText();
    this.bindCustomTrigger();
    this.register();

    if (this.messages.length <= 1 && previousLibrary !== this.config.library) {
      this.resetConversation();
    }
  }

  open(): void {
    if (this.isOpen()) return;
    this.lastFocus = document.activeElement;
    this.setAttribute("open", "");
    this.emit("c7:open");
    window.setTimeout(() => this.input?.focus(), 20);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.removeAttribute("open");
    this.emit("c7:close");

    if (this.lastFocus instanceof HTMLElement) {
      this.lastFocus.focus();
    }
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  isOpen(): boolean {
    return this.hasAttribute("open");
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.setBusy(false);
  }

  async send(rawQuestion?: string): Promise<void> {
    const question = (rawQuestion ?? this.input?.value ?? "").trim();
    if (!question || this.busy) return;

    if (!this.config.library) {
      this.appendError("Missing data-library attribute.");
      return;
    }

    this.open();
    this.setBusy(true);
    this.input.value = "";

    const userMessage: Context7Message = {
      id: this.nextMessageId(),
      role: "user",
      content: question
    };

    this.messages.push(userMessage);
    this.appendMessage("user", escapeHtml(question));
    this.emit("c7:question", {
      message: userMessage,
      messages: [...this.messages],
      question
    });

    const typing = this.appendTyping();
    let answer = "";
    let answerElement: HTMLElement | null = null;
    let sawFirstToken = false;
    this.abortController = new AbortController();

    try {
      await streamContext7Response(
        this.config,
        this.messages,
        {
          onChunk: (delta) => {
            typing.remove();
            answer += delta;

            if (!answerElement) {
              answerElement = this.appendMessage("assistant", "");
            }

            answerElement.innerHTML = renderMarkdown(answer);

            if (!sawFirstToken) {
              sawFirstToken = true;
              this.emit("c7:first-token", { answer, question });
            }

            this.emit("c7:answer", { answer, question });
            this.scrollToBottom();
          },
          onToolCall: (toolCall) => {
            typing.remove();
            this.appendToolCall(toolCall);
            this.emit("c7:tool-call", { question, toolCall });
          },
          onToolResult: (toolResult) => {
            this.updateToolResult(toolResult);
            this.emit("c7:tool-result", { question, toolResult });
          }
        },
        this.abortController.signal
      );

      typing.remove();

      if (answer) {
        const assistantMessage: Context7Message = {
          id: this.nextMessageId(),
          role: "assistant",
          content: answer
        };
        this.messages.push(assistantMessage);
        this.emit("c7:answer-complete", {
          answer,
          message: assistantMessage,
          messages: [...this.messages],
          question
        });
      }
    } catch (error) {
      typing.remove();
      if (!isAbortError(error)) {
        const message =
          error instanceof Context7TransportError || error instanceof Error
            ? error.message
            : "Something went wrong.";
        this.appendError(message);
        this.emit("c7:error", { error: message, question });
      }
    } finally {
      this.abortController = null;
      this.setBusy(false);
      this.input?.focus();
    }
  }

  private renderShell(): void {
    this.root.innerHTML = `
      <style>${widgetStyles}</style>
      <div class="c7-backdrop" part="backdrop"></div>
      <section
        aria-label="Context7 documentation chat"
        aria-modal="false"
        class="c7-panel"
        part="panel"
        role="dialog"
      >
        <header class="c7-header" part="header">
          <div class="c7-title" data-c7-title part="title"></div>
          <button class="c7-close" data-c7-close part="close-button" type="button" aria-label="Close chat">
            <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </header>
        <div class="c7-messages" data-c7-messages part="messages" aria-live="polite"></div>
        <form class="c7-composer" data-c7-form part="composer">
          <input class="c7-input" data-c7-input part="input" type="text" autocomplete="off" />
          <button class="c7-send" data-c7-send part="send-button" type="submit">Send</button>
        </form>
        <footer class="c7-footer" part="footer">
          <a class="c7-powered" part="powered-by" href="https://context7.com" target="_blank" rel="noopener noreferrer">
            <span>Powered by</span>
            <span class="c7-mark" aria-hidden="true">7</span>
            <strong>Context7</strong>
          </a>
        </footer>
      </section>
      <button class="c7-launcher" data-c7-launcher part="launcher" type="button" aria-label="Open documentation chat">
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 9h8" />
          <path d="M8 13h6" />
          <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
        </svg>
      </button>
    `;
  }

  private bindEvents(): void {
    this.launcher?.addEventListener("click", () => this.toggle());
    this.closeButton?.addEventListener("click", () => this.close());
    this.form?.addEventListener("submit", (event) => {
      event.preventDefault();
      void this.send();
    });
    this.root.addEventListener("keydown", this.onKeyDown as EventListener);
  }

  private syncConfig(): void {
    this.config = readConfig(this);
    this.style.setProperty("--c7-accent", this.config.color);

    if (this.getAttribute("position") !== this.config.position) {
      this.setAttribute("position", this.config.position);
    }

    if (this.getAttribute("theme") !== this.config.theme) {
      this.setAttribute("theme", this.config.theme);
    }

    if (this.config.hideDefaultButton) {
      this.setAttribute("hide-default-button", "");
    } else if (!isTruthyAttribute(this.getAttribute("data-hide-default-button"))) {
      this.removeAttribute("hide-default-button");
    }
  }

  private updateStaticText(): void {
    if (this.titleElement) this.titleElement.textContent = this.config.title;
    if (this.input) this.input.placeholder = this.config.placeholder;
    if (this.panel) this.panel.setAttribute("aria-label", this.config.title);
  }

  private resetConversation(): void {
    this.messages = [];
    this.toolCalls.clear();
    this.messagesElement.innerHTML = "";
    const intro = this.config.initialMessage.replace(/\{library\}/g, this.config.library || "this library");
    this.appendMessage("assistant", renderMarkdown(intro));
  }

  private appendMessage(role: "assistant" | "user", html: string): HTMLElement {
    const message = document.createElement("div");
    message.className = `c7-message c7-message--${role}`;
    message.setAttribute("part", `message ${role}-message`);
    message.innerHTML = html;
    this.messagesElement.append(message);
    this.scrollToBottom();
    return message;
  }

  private appendError(message: string): void {
    const error = document.createElement("div");
    error.className = "c7-message c7-message--error";
    error.setAttribute("part", "message error-message");
    error.innerHTML = buildErrorHtml(message, this.config.library);
    this.messagesElement.append(error);
    this.scrollToBottom();
  }

  private appendTyping(): HTMLElement {
    const typing = document.createElement("div");
    typing.className = "c7-typing";
    typing.setAttribute("part", "typing");
    typing.innerHTML = "<span></span><span></span><span></span>";
    this.messagesElement.append(typing);
    this.scrollToBottom();
    return typing;
  }

  private appendToolCall(toolCall: Context7ToolCall): void {
    const tool = document.createElement("div");
    const query = typeof toolCall.args.query === "string" ? toolCall.args.query : "documentation";
    tool.className = "c7-tool-call";
    tool.setAttribute("part", "tool-call");
    tool.innerHTML = `
      <div class="c7-tool-header">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <span>Searching: ${escapeHtml(query)}</span>
        <svg class="c7-spinner" data-c7-tool-spinner viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      </div>
    `;
    this.toolCalls.set(toolCall.toolCallId, tool);
    this.messagesElement.append(tool);
    this.scrollToBottom();
  }

  private updateToolResult(toolResult: Context7ToolResult): void {
    const tool = this.toolCalls.get(toolResult.toolCallId);
    if (!tool) return;

    tool.querySelector("[data-c7-tool-spinner]")?.remove();

    const result = typeof toolResult.result === "string"
      ? toolResult.result
      : JSON.stringify(toolResult.result, null, 2);

    if (!result) return;

    const wrapper = document.createElement("div");
    wrapper.className = "c7-tool-result";
    wrapper.innerHTML = `
      <button class="c7-tool-toggle" part="tool-toggle" type="button" aria-expanded="false">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 9 6 6 6-6"></path>
        </svg>
        <span>View results</span>
      </button>
      <div class="c7-tool-content" hidden>
        <pre>${escapeHtml(result)}</pre>
      </div>
    `;

    const toggle = wrapper.querySelector<HTMLButtonElement>(".c7-tool-toggle");
    const content = wrapper.querySelector<HTMLElement>(".c7-tool-content");
    toggle?.addEventListener("click", () => {
      if (!toggle || !content) return;
      const isExpanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!isExpanded));
      content.hidden = isExpanded;
    });

    tool.append(wrapper);
    this.scrollToBottom();
  }

  private setBusy(isBusy: boolean): void {
    this.busy = isBusy;
    if (this.input) this.input.disabled = isBusy;
    if (this.sendButton) this.sendButton.disabled = isBusy;
  }

  private scrollToBottom(): void {
    this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
  }

  private bindCustomTrigger(): void {
    this.unbindCustomTrigger();

    if (!this.config.customTrigger) return;

    this.triggerElement = document.querySelector(this.config.customTrigger);
    this.triggerElement?.addEventListener("click", this.onCustomTrigger);
  }

  private unbindCustomTrigger(): void {
    this.triggerElement?.removeEventListener("click", this.onCustomTrigger);
    this.triggerElement = null;
  }

  private nextMessageId(): string {
    this.messageCounter += 1;
    return `c7m-${this.messageCounter}`;
  }

  private register(): void {
    installGlobalApi();

    if (this.registeredId && this.registeredId !== this.config.widgetId) {
      registry.delete(this.registeredId);
    }

    registry.set(this.config.widgetId, this);
    this.registeredId = this.config.widgetId;
  }

  private unregister(): void {
    if (!this.registeredId) return;
    if (registry.get(this.registeredId) === this) registry.delete(this.registeredId);
    this.registeredId = "";
  }

  private emit(name: string, detail: Partial<Context7WidgetEventDetail> = {}): void {
    this.dispatchEvent(
      new CustomEvent<Context7WidgetEventDetail>(name, {
        bubbles: true,
        composed: true,
        detail: {
          library: this.config.library,
          widget: this,
          widgetId: this.config.widgetId,
          ...detail
        }
      })
    );
  }

  private get closeButton(): HTMLButtonElement | null {
    return this.root.querySelector("[data-c7-close]");
  }

  private get form(): HTMLFormElement | null {
    return this.root.querySelector("[data-c7-form]");
  }

  private get input(): HTMLInputElement {
    return this.root.querySelector("[data-c7-input]") as HTMLInputElement;
  }

  private get launcher(): HTMLButtonElement | null {
    return this.root.querySelector("[data-c7-launcher]");
  }

  private get messagesElement(): HTMLElement {
    return this.root.querySelector("[data-c7-messages]") as HTMLElement;
  }

  private get panel(): HTMLElement | null {
    return this.root.querySelector(".c7-panel");
  }

  private get sendButton(): HTMLButtonElement | null {
    return this.root.querySelector("[data-c7-send]");
  }

  private get titleElement(): HTMLElement | null {
    return this.root.querySelector("[data-c7-title]");
  }
}

export function defineContext7Widget(tagName = "context7-widget"): void {
  if (customElements.get(tagName)) return;
  customElements.define(tagName, Context7WidgetElement);
}

function installGlobalApi(): void {
  if (globalApiInstalled || typeof window === "undefined") return;

  const api: Context7WidgetApi = {
    instances: registry,
    close: (widgetId?: string) => asWidget(resolveWidget(widgetId))?.close(),
    get: (widgetId?: string) => resolveWidget(widgetId),
    isOpen: (widgetId?: string) => asWidget(resolveWidget(widgetId))?.isOpen() ?? false,
    open: (widgetId?: string) => asWidget(resolveWidget(widgetId))?.open(),
    send: async (message: string, widgetId?: string) => {
      await asWidget(resolveWidget(widgetId))?.send(message);
    },
    toggle: (widgetId?: string) => asWidget(resolveWidget(widgetId))?.toggle()
  };

  window.Context7Widget = api;
  globalApiInstalled = true;
}

function resolveWidget(widgetId?: string): HTMLElement | undefined {
  if (widgetId) return registry.get(widgetId);
  return registry.get("default") ?? registry.values().next().value;
}

function asWidget(widget: HTMLElement | undefined): Context7WidgetElement | undefined {
  return widget instanceof Context7WidgetElement ? widget : undefined;
}

function readConfig(element: HTMLElement): Context7WidgetConfig {
  const library = readAttribute(element, "library", "data-library");
  return {
    apiUrl: readAttribute(element, "api-url", "data-api-url") || "https://context7.com",
    color: readAttribute(element, "color", "data-color") || "#059669",
    customTrigger: readAttribute(element, "custom-trigger", "data-custom-trigger"),
    hideDefaultButton:
      element.hasAttribute("hide-default-button") ||
      isTruthyAttribute(element.getAttribute("data-hide-default-button")),
    initialMessage:
      readAttribute(element, "initial-message", "data-initial-message") || DEFAULT_INITIAL_MESSAGE,
    library,
    placeholder: readAttribute(element, "placeholder", "data-placeholder") || "Ask about the docs...",
    position: normalizePosition(readAttribute(element, "position", "data-position")),
    theme: normalizeTheme(readAttribute(element, "theme", "data-theme")),
    title: readAttribute(element, "title", "data-title") || "Chat with Documentation",
    widgetId: readAttribute(element, "widget-id", "data-widget-id") || element.id || "default"
  };
}

function readAttribute(element: HTMLElement, ...names: string[]): string {
  for (const name of names) {
    const value = element.getAttribute(name);
    if (value) return value.trim();
  }
  return "";
}

function normalizePosition(value: string): Context7Position {
  if (
    value === "bottom-left" ||
    value === "top-right" ||
    value === "top-left" ||
    value === "bottom-right"
  ) {
    return value;
  }

  return "bottom-right";
}

function normalizeTheme(value: string): Context7Theme {
  if (value === "light" || value === "dark") return value;
  return "auto";
}

function isTruthyAttribute(value: string | null): boolean {
  return value === "" || value === "true" || value === "1";
}

function buildErrorHtml(message: string, library: string): string {
  const safeMessage = escapeHtml(message || "Something went wrong.");
  const safeLibrary = library.startsWith("/") ? library : `/${library}`;
  const adminUrl = escapeHtml(encodeURI(`https://context7.com${safeLibrary}/admin?tab=chat`));

  return `${safeMessage}<br><br>If you are the library owner, check your <a href="${adminUrl}" target="_blank" rel="noopener noreferrer">widget settings</a> on Context7.`;
}

function trapFocus(event: KeyboardEvent, root: ShadowRoot): void {
  const focusable = Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.offsetParent !== null || element === root.activeElement);

  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = root.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

declare global {
  interface HTMLElementTagNameMap {
    "context7-widget": Context7WidgetElement;
  }
}

import { renderWidgetBranding } from './branding.js';
import { resolveContext7WidgetConfig } from './config.js';
import {
  cancelRenderFrame,
  captureTriggerAccessibility,
  querySelectorSafely,
  requestRenderFrame,
  resolveContext7AnchorLayout,
  restoreTriggerAccessibility,
  trapFocus
} from './dom.js';
import { escapeHtml, renderMarkdown } from './markdown.js';
import { buildContext7ErrorHtml, isAbortError } from './runtime.js';
import { widgetStyles } from './styles.js';
import { Context7TransportError, streamContext7Response } from './transport.js';
import type {
  Context7ActiveRequest,
  Context7Message,
  Context7ToolCall,
  Context7ToolResult,
  Context7TriggerA11yState,
  Context7WidgetApi,
  Context7WidgetConfig,
  Context7WidgetEventDetailFor,
  Context7WidgetEventName,
  Context7WidgetEventPayload
} from './types.js';

const registry = new Map<string, Context7WidgetElement>();
const registryStacks = new Map<string, Context7WidgetElement[]>();
const BaseHTMLElement = typeof HTMLElement === 'undefined' ? (class {} as typeof HTMLElement) : HTMLElement;
const INITIAL_MESSAGE_ATTRIBUTES = new Set(['data-initial-message', 'data-welcome-message', 'initial-message']);
const LIBRARY_ATTRIBUTES = new Set(['data-library', 'library']);

let globalApiInstalled = false;
let instanceCounter = 0;
let sharedWidgetStyleSheet: CSSStyleSheet | false | undefined;

interface WidgetElements {
  readonly backdrop: HTMLElement;
  readonly closeButton: HTMLButtonElement;
  readonly form: HTMLFormElement;
  readonly input: HTMLInputElement;
  readonly launcher: HTMLButtonElement;
  readonly launcherLabel: HTMLElement;
  readonly messages: HTMLElement;
  readonly panel: HTMLElement;
  readonly sendButton: HTMLButtonElement;
  readonly title: HTMLElement;
}

export class Context7WidgetElement extends BaseHTMLElement {
  static observedAttributes = [
    'backdrop',
    'close-on-outside-click',
    'color',
    'custom-trigger',
    'data-backdrop',
    'data-close-on-outside-click',
    'data-color',
    'data-custom-trigger',
    'data-default-open',
    'data-initial-message',
    'data-launcher-label',
    'data-launcher-variant',
    'data-library',
    'data-panel-height',
    'data-panel-width',
    'data-placeholder',
    'data-position',
    'data-preset',
    'data-theme',
    'data-title',
    'data-welcome-message',
    'data-widget-id',
    'default-open',
    'dialog-title',
    'initial-message',
    'launcher-label',
    'launcher-variant',
    'library',
    'panel-height',
    'panel-width',
    'placeholder',
    'position',
    'preset',
    'theme',
    'widget-id'
  ];

  private activeRequest: Context7ActiveRequest | null = null;
  private activeAnchorElement: Element | null = null;
  private busy = false;
  private config: Context7WidgetConfig = readConfig(this);
  private conversationInitialized = false;
  private readonly elements: WidgetElements;
  private floatingLayoutFrame: number | null = null;
  private floatingResizeObserver: ResizeObserver | null = null;
  private floatingViewport: VisualViewport | null = null;
  private lastFocus: Element | null = null;
  private messageCounter = 0;
  private messages: Context7Message[] = [];
  private readonly panelId = `context7-widget-panel-${++instanceCounter}`;
  private registeredId = '';
  private readonly root: ShadowRoot;
  private toolCalls = new Map<string, HTMLElement>();
  private triggerAccessibilityState: Context7TriggerA11yState | null = null;
  private triggerElement: Element | null = null;

  private readonly onCustomTrigger = (event: Event) => {
    event.preventDefault();
    this.activeAnchorElement = event.currentTarget instanceof Element ? event.currentTarget : this.triggerElement;
    this.toggle();
  };

  private readonly onLauncherClick = (event: Event) => {
    this.activeAnchorElement = event.currentTarget instanceof Element ? event.currentTarget : this.launcher;
    this.toggle();
  };

  private readonly onBackdropClick = (event: Event) => {
    if (event.target === this.backdrop && this.config.closeOnOutsideClick) {
      this.close();
    }
  };

  private readonly onDocumentPointerDown = (event: Event) => {
    if (!this.isOpen() || !this.config.closeOnOutsideClick) return;

    const path = event.composedPath();
    if (path.includes(this)) return;
    if (this.triggerElement && path.includes(this.triggerElement)) return;

    this.close();
  };

  private readonly onFloatingLayout = (event: Event) => {
    if (event.type === 'scroll' && event.composedPath().includes(this)) return;
    this.scheduleAnchorPositionUpdate();
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab' || !this.isOpen() || this.config.position !== 'center') return;
    trapFocus(event, this.panel);
  };

  private readonly onCloseClick = () => {
    this.close();
  };

  private readonly onFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    if (this.busy) {
      this.cancel();
    } else {
      void this.send();
    }
  };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.renderShell();
    this.elements = collectWidgetElements(this.root);
    this.bindEvents();
  }

  connectedCallback(): void {
    this.syncConfig();
    this.updateStaticText();
    this.bindCustomTrigger();
    if (!this.conversationInitialized) this.reset();
    this.register();
    this.emit('c7:ready');
    if (this.isOpen()) {
      this.syncExpandedState();
      this.bindFloatingListeners();
      this.updateAnchorPosition();
    } else if (this.config.defaultOpen) {
      this.open();
    }
  }

  disconnectedCallback(): void {
    this.cancel();
    this.unbindFloatingListeners();
    this.unbindCustomTrigger();
    this.unregister();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    const previousLibrary = this.config.library;
    this.config = readConfig(this);
    this.updateStaticText();

    if (!this.isConnected) return;

    this.applyConfig();
    this.bindCustomTrigger();
    this.register();

    if (
      (LIBRARY_ATTRIBUTES.has(name) && previousLibrary !== this.config.library) ||
      INITIAL_MESSAGE_ATTRIBUTES.has(name)
    ) {
      this.cancel();
      this.reset();
    }

    if (this.config.defaultOpen && !this.isOpen()) {
      this.open();
    } else if (this.isOpen()) {
      this.unbindFloatingListeners();
      this.bindFloatingListeners();
      this.updateAnchorPosition();
    }
  }

  open(): void {
    if (this.isOpen()) return;
    this.lastFocus = document.activeElement;
    this.setAttribute('open', '');
    this.syncExpandedState();
    this.bindFloatingListeners();
    this.updateAnchorPosition();
    this.emit('c7:open');
    requestRenderFrame(() => {
      if (this.isConnected && this.isOpen()) this.input.focus({ preventScroll: true });
    });
  }

  close(): void {
    if (!this.isOpen()) return;
    this.removeAttribute('open');
    this.syncExpandedState();
    this.unbindFloatingListeners();
    this.emit('c7:close');

    if (this.lastFocus instanceof HTMLElement && this.lastFocus.isConnected) {
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
    return this.hasAttribute('open');
  }

  isBusy(): boolean {
    return this.busy;
  }

  getMessages(): readonly Context7Message[] {
    return [...this.messages];
  }

  reset(): void {
    this.cancel();
    this.messages = [];
    this.toolCalls.clear();
    this.messagesElement.innerHTML = '';
    const intro = this.config.initialMessage.replace(/\{library\}/g, this.config.library || 'this library');
    this.appendMessage('assistant', renderMarkdown(intro));
    this.conversationInitialized = true;
  }

  cancel(): void {
    const request = this.activeRequest;
    if (!request) return;

    this.activeRequest = null;
    request.controller.abort();
    request.typing.remove();
    cancelRenderFrame(request.renderFrame);
    this.setBusy(false);
    this.input?.focus();
  }

  async send(rawQuestion?: string): Promise<void> {
    const question = (rawQuestion ?? this.input?.value ?? '').trim();
    if (!question || this.busy) return;

    if (!this.config.library) {
      const message = 'Missing data-library attribute.';
      this.appendError(message);
      this.emit('c7:error', { error: message, question });
      return;
    }

    this.open();
    this.setBusy(true);
    this.input.value = '';

    const userMessage: Context7Message = {
      id: this.nextMessageId(),
      role: 'user',
      content: question
    };

    this.messages.push(userMessage);
    this.appendMessage('user', escapeHtml(question), userMessage.id);
    this.emit('c7:question', {
      message: userMessage,
      messages: [...this.messages],
      question
    });

    const typing = this.appendTyping();
    let answer = '';
    let answerElement: HTMLElement | null = null;
    let answerMessageId = '';
    let sawFirstToken = false;
    const request: Context7ActiveRequest = {
      controller: new AbortController(),
      renderFrame: null,
      typing
    };
    this.activeRequest = request;

    const renderAnswer = () => {
      request.renderFrame = null;
      if (this.activeRequest !== request || !answerElement) return;
      answerElement.innerHTML = renderMarkdown(answer);
      this.scrollToBottom();
    };

    const flushAnswer = () => {
      cancelRenderFrame(request.renderFrame);
      request.renderFrame = null;
      if (answerElement) answerElement.innerHTML = renderMarkdown(answer);
      this.scrollToBottom();
    };

    try {
      await streamContext7Response(
        this.config,
        this.messages,
        {
          onChunk: (delta) => {
            if (this.activeRequest !== request) return;
            typing.remove();
            answer += delta;

            if (!answerElement) {
              answerMessageId = this.nextMessageId();
              answerElement = this.appendMessage('assistant', '', answerMessageId);
            }

            request.renderFrame ??= requestRenderFrame(renderAnswer);

            if (!sawFirstToken) {
              sawFirstToken = true;
              this.emit('c7:first-token', { answer, question });
            }

            this.emit('c7:answer', { answer, question });
          },
          onToolCall: (toolCall) => {
            if (this.activeRequest !== request) return;
            typing.remove();
            this.appendToolCall(toolCall);
            this.emit('c7:tool-call', { question, toolCall });
          },
          onToolResult: (toolResult) => {
            if (this.activeRequest !== request) return;
            this.updateToolResult(toolResult);
            this.emit('c7:tool-result', { question, toolResult });
          }
        },
        request.controller.signal
      );

      if (this.activeRequest !== request) return;
      typing.remove();

      if (answer) {
        flushAnswer();
        const assistantMessage: Context7Message = {
          id: answerMessageId || this.nextMessageId(),
          role: 'assistant',
          content: answer
        };
        this.messages.push(assistantMessage);
        this.emit('c7:answer-complete', {
          answer,
          message: assistantMessage,
          messages: [...this.messages],
          question
        });
      }
    } catch (error) {
      typing.remove();
      if (this.activeRequest === request && !isAbortError(error)) {
        const message =
          error instanceof Context7TransportError || error instanceof Error ? error.message : 'Something went wrong.';
        this.appendError(message);
        this.emit('c7:error', { error: message, question });
      }
    } finally {
      if (this.activeRequest === request) {
        cancelRenderFrame(request.renderFrame);
        this.activeRequest = null;
        this.setBusy(false);
        this.input?.focus();
      }
    }
  }

  private renderShell(): void {
    const styleElement = adoptSharedWidgetStyles(this.root) ? '' : `<style>${widgetStyles}</style>`;
    this.root.innerHTML = `
      ${styleElement}
      <div class="c7-backdrop" data-c7-backdrop part="backdrop"></div>
      <section
        aria-label="Context7 documentation chat"
        aria-busy="false"
        aria-modal="false"
        class="c7-panel"
        id="${this.panelId}"
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
        <div
          aria-label="Documentation chat conversation"
          aria-live="polite"
          aria-relevant="additions text"
          class="c7-messages"
          data-c7-messages
          part="messages"
          role="log"
        ></div>
        <form class="c7-composer" data-c7-form part="composer">
          <input
            aria-label="Ask a documentation question"
            autocomplete="off"
            class="c7-input"
            data-c7-input
            part="input"
            type="text"
          />
          <button aria-label="Send question" class="c7-send" data-c7-send part="send-button" type="submit">
            Send
          </button>
        </form>
        <footer class="c7-footer" data-c7-footer part="footer">
          <span class="c7-branding" part="powered-by" aria-label="Powered by Context7, Enhanced by DeSource Labs">
            ${renderWidgetBranding()}
          </span>
        </footer>
      </section>
      <button
        aria-controls="${this.panelId}"
        aria-expanded="false"
        aria-haspopup="dialog"
        aria-label="Open documentation chat"
        class="c7-launcher"
        data-c7-launcher
        part="launcher"
        type="button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 9h8" />
          <path d="M8 13h6" />
          <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
        </svg>
        <span class="c7-launcher-label" data-c7-launcher-label></span>
      </button>
    `;
  }

  private bindEvents(): void {
    this.backdrop?.addEventListener('click', this.onBackdropClick);
    this.launcher?.addEventListener('click', this.onLauncherClick);
    this.closeButton?.addEventListener('click', this.onCloseClick);
    this.form?.addEventListener('submit', this.onFormSubmit);
    this.root.addEventListener('keydown', this.onKeyDown as (event: Event) => void);
  }

  private syncConfig(): void {
    this.config = readConfig(this);
    this.applyConfig();
  }

  private applyConfig(): void {
    syncStyleProperty(this, '--c7-accent', this.config.color);
    syncStyleProperty(this, '--c7-panel-height', this.config.panelHeight);
    syncStyleProperty(this, '--c7-panel-width', this.config.panelWidth);

    syncHostAttribute(this, 'launcher-variant', this.config.launcherVariant);
    syncHostAttribute(this, 'position', this.config.position);
    syncHostAttribute(this, 'preset', this.config.preset);
    syncHostAttribute(this, 'theme', this.config.theme);
    syncStateAttribute(this, 'backdrop-active', this.config.backdrop);
    syncStateAttribute(this, 'custom-trigger-active', Boolean(this.config.customTrigger));
  }

  private updateStaticText(): void {
    if (this.titleElement) this.titleElement.textContent = this.config.title;
    if (this.input) this.input.placeholder = this.config.placeholder;
    if (this.launcherLabelElement) this.launcherLabelElement.textContent = this.config.launcherLabel;
    if (this.launcher) this.launcher.setAttribute('aria-label', this.config.launcherLabel);
    if (this.panel) {
      this.panel.setAttribute('aria-label', this.config.title);
      this.panel.setAttribute('aria-modal', String(this.config.position === 'center'));
    }
  }

  private appendMessage(role: 'assistant' | 'user', html: string, id = this.nextMessageId()): HTMLElement {
    const message = document.createElement('div');
    message.className = `c7-message c7-message--${role}`;
    message.dataset.messageId = id;
    message.setAttribute('part', `message ${role}-message`);
    message.innerHTML = html;
    this.messagesElement.append(message);
    this.scrollToBottom();
    return message;
  }

  private appendError(message: string): void {
    const error = document.createElement('div');
    error.className = 'c7-message c7-message--error';
    error.setAttribute('part', 'message error-message');
    error.setAttribute('role', 'alert');
    error.innerHTML = buildContext7ErrorHtml(message, this.config.library);
    this.messagesElement.append(error);
    this.scrollToBottom();
  }

  private appendTyping(): HTMLElement {
    const typing = document.createElement('div');
    typing.className = 'c7-typing';
    typing.setAttribute('part', 'typing');
    typing.setAttribute('role', 'status');
    typing.setAttribute('aria-label', 'Context7 is responding');
    typing.innerHTML =
      '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
    this.messagesElement.append(typing);
    this.scrollToBottom();
    return typing;
  }

  private appendToolCall(toolCall: Context7ToolCall): void {
    const tool = document.createElement('div');
    const query = typeof toolCall.args.query === 'string' ? toolCall.args.query : 'documentation';
    tool.className = 'c7-tool-call';
    tool.setAttribute('part', 'tool-call');
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

    tool.querySelector('[data-c7-tool-spinner]')?.remove();

    const result =
      typeof toolResult.result === 'string' ? toolResult.result : JSON.stringify(toolResult.result, null, 2);

    if (!result) return;

    const wrapper = document.createElement('div');
    const resultId = `${this.panelId}-${this.nextMessageId()}-tool-result`;
    wrapper.className = 'c7-tool-result';
    wrapper.innerHTML = `
      <button
        aria-controls="${resultId}"
        aria-expanded="false"
        class="c7-tool-toggle"
        part="tool-toggle"
        type="button"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 9 6 6 6-6"></path>
        </svg>
        <span>View results</span>
      </button>
      <div aria-label="Documentation search results" class="c7-tool-content" hidden id="${resultId}" role="region">
        <pre>${escapeHtml(result)}</pre>
      </div>
    `;

    const toggle = wrapper.querySelector<HTMLButtonElement>('.c7-tool-toggle');
    const content = wrapper.querySelector<HTMLElement>('.c7-tool-content');
    toggle?.addEventListener('click', () => {
      if (!toggle || !content) return;
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
      content.hidden = isExpanded;
      const label = toggle.querySelector('span');
      if (label) label.textContent = isExpanded ? 'View results' : 'Hide results';
    });

    tool.append(wrapper);
    this.scrollToBottom();
  }

  private setBusy(isBusy: boolean): void {
    this.busy = isBusy;
    if (this.input) this.input.disabled = isBusy;
    if (this.panel) this.panel.setAttribute('aria-busy', String(isBusy));
    if (this.sendButton) {
      this.sendButton.textContent = isBusy ? 'Stop' : 'Send';
      this.sendButton.setAttribute('aria-label', isBusy ? 'Stop response' : 'Send question');
    }
  }

  private scrollToBottom(): void {
    this.messagesElement.scrollTop = this.messagesElement.scrollHeight;
  }

  private bindFloatingListeners(): void {
    this.unbindFloatingListeners();
    if (this.config.closeOnOutsideClick) {
      document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
    }

    if (this.config.position === 'anchor') {
      window.addEventListener('resize', this.onFloatingLayout);
      window.addEventListener('scroll', this.onFloatingLayout, true);
      this.floatingViewport = window.visualViewport;
      this.floatingViewport?.addEventListener('resize', this.onFloatingLayout);
      this.floatingViewport?.addEventListener('scroll', this.onFloatingLayout);

      if (typeof ResizeObserver === 'function') {
        this.floatingResizeObserver = new ResizeObserver(() => this.scheduleAnchorPositionUpdate());
        const anchor = this.getAnchorElement();
        if (anchor) this.floatingResizeObserver.observe(anchor);
        this.floatingResizeObserver.observe(this.panel);
      }
    }
  }

  private unbindFloatingListeners(): void {
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    window.removeEventListener('resize', this.onFloatingLayout);
    window.removeEventListener('scroll', this.onFloatingLayout, true);
    this.floatingViewport?.removeEventListener('resize', this.onFloatingLayout);
    this.floatingViewport?.removeEventListener('scroll', this.onFloatingLayout);
    this.floatingViewport = null;
    this.floatingResizeObserver?.disconnect();
    this.floatingResizeObserver = null;
    cancelRenderFrame(this.floatingLayoutFrame);
    this.floatingLayoutFrame = null;
  }

  private scheduleAnchorPositionUpdate(): void {
    if (!this.isOpen() || this.floatingLayoutFrame !== null) return;

    this.floatingLayoutFrame = requestRenderFrame(() => {
      this.floatingLayoutFrame = null;
      if (this.isOpen()) this.updateAnchorPosition();
    });
  }

  private updateAnchorPosition(): void {
    if (this.config.position !== 'anchor') return;

    const anchor = this.getAnchorElement();
    const panel = this.panel;
    if (!anchor || !panel) return;

    const rect = anchor.getBoundingClientRect();
    this.style.removeProperty('--c7-anchor-max-height');
    this.style.removeProperty('--c7-anchor-max-width');
    const panelWidth = panel.offsetWidth || 400;
    const panelHeight = panel.offsetHeight || 600;
    const viewport = window.visualViewport;
    const viewportWidth = viewport?.width || window.innerWidth || document.documentElement.clientWidth || panelWidth;
    const viewportHeight =
      viewport?.height || window.innerHeight || document.documentElement.clientHeight || panelHeight;
    const { left, maxHeight, maxWidth, origin, placement, top } = resolveContext7AnchorLayout({
      anchor: rect,
      panelHeight,
      panelWidth,
      viewportHeight,
      viewportLeft: viewport?.offsetLeft,
      viewportTop: viewport?.offsetTop,
      viewportWidth
    });

    this.style.setProperty('--c7-anchor-left', `${left}px`);
    this.style.setProperty('--c7-anchor-max-height', `${maxHeight}px`);
    this.style.setProperty('--c7-anchor-max-width', `${maxWidth}px`);
    this.style.setProperty('--c7-anchor-top', `${top}px`);
    this.style.setProperty('--c7-anchor-origin', origin);
    this.style.setProperty('--c7-anchor-translate-y', placement === 'top' ? '8px' : '-8px');
  }

  private getAnchorElement(): Element | null {
    if (this.activeAnchorElement instanceof Element && this.activeAnchorElement.isConnected) {
      return this.activeAnchorElement;
    }

    if (this.triggerElement instanceof Element && this.triggerElement.isConnected) return this.triggerElement;
    return this.launcher;
  }

  private bindCustomTrigger(): void {
    this.unbindCustomTrigger();

    if (!this.config.customTrigger) return;

    this.triggerElement = querySelectorSafely(this.config.customTrigger);
    this.triggerElement?.addEventListener('click', this.onCustomTrigger);
    if (this.triggerElement) {
      this.triggerAccessibilityState = captureTriggerAccessibility(this.triggerElement);
      this.triggerElement.setAttribute('aria-controls', this.panelId);
      this.triggerElement.setAttribute('aria-haspopup', 'dialog');
      this.triggerElement.setAttribute('aria-expanded', String(this.isOpen()));
    }
  }

  private unbindCustomTrigger(): void {
    if (this.activeAnchorElement === this.triggerElement) {
      this.activeAnchorElement = null;
    }
    this.triggerElement?.removeEventListener('click', this.onCustomTrigger);
    if (this.triggerAccessibilityState) restoreTriggerAccessibility(this.triggerAccessibilityState);
    this.triggerAccessibilityState = null;
    this.triggerElement = null;
  }

  private syncExpandedState(): void {
    const expanded = String(this.isOpen());
    this.launcher?.setAttribute('aria-expanded', expanded);
    this.triggerElement?.setAttribute('aria-expanded', expanded);
  }

  private nextMessageId(): string {
    this.messageCounter += 1;
    return `c7m-${this.messageCounter}`;
  }

  private register(): void {
    installGlobalApi();

    if (this.registeredId === this.config.widgetId) return;
    if (this.registeredId) this.unregister();

    const registrations = registryStacks.get(this.config.widgetId) ?? [];
    registrations.push(this);
    registryStacks.set(this.config.widgetId, registrations);
    registry.set(this.config.widgetId, this);
    this.registeredId = this.config.widgetId;
  }

  private unregister(): void {
    if (!this.registeredId) return;
    const registrations = registryStacks.get(this.registeredId);
    const index = registrations?.indexOf(this) ?? -1;
    if (registrations && index >= 0) registrations.splice(index, 1);

    if (!registrations?.length) {
      registryStacks.delete(this.registeredId);
      registry.delete(this.registeredId);
    } else {
      const previous = registrations[registrations.length - 1];
      if (previous) registry.set(this.registeredId, previous);
    }
    this.registeredId = '';
  }

  private emit<EventName extends Context7WidgetEventName>(
    name: EventName,
    ...args: keyof Context7WidgetEventPayload<EventName> extends never
      ? [detail?: Context7WidgetEventPayload<EventName>]
      : [detail: Context7WidgetEventPayload<EventName>]
  ): void {
    const payload = args[0] ?? {};
    const detail = {
      library: this.config.library,
      widget: this,
      widgetId: this.config.widgetId,
      ...payload
    } as unknown as Context7WidgetEventDetailFor<EventName>;

    this.dispatchEvent(
      new CustomEvent<Context7WidgetEventDetailFor<EventName>>(name, {
        bubbles: true,
        composed: true,
        detail
      })
    );
  }

  private get closeButton(): HTMLButtonElement {
    return this.elements.closeButton;
  }

  private get backdrop(): HTMLElement {
    return this.elements.backdrop;
  }

  private get form(): HTMLFormElement {
    return this.elements.form;
  }

  private get input(): HTMLInputElement {
    return this.elements.input;
  }

  private get launcher(): HTMLButtonElement {
    return this.elements.launcher;
  }

  private get launcherLabelElement(): HTMLElement {
    return this.elements.launcherLabel;
  }

  private get messagesElement(): HTMLElement {
    return this.elements.messages;
  }

  private get panel(): HTMLElement {
    return this.elements.panel;
  }

  private get sendButton(): HTMLButtonElement {
    return this.elements.sendButton;
  }

  private get titleElement(): HTMLElement {
    return this.elements.title;
  }
}

export function defineContext7Widget(tagName = 'context7-widget'): void {
  if (typeof customElements === 'undefined') return;
  if (customElements.get(tagName)) return;
  const WidgetElement = tagName === 'context7-widget' ? Context7WidgetElement : class extends Context7WidgetElement {};
  customElements.define(tagName, WidgetElement);
}

function installGlobalApi(): void {
  if (globalApiInstalled || typeof window === 'undefined') return;

  const api: Context7WidgetApi = {
    instances: registry,
    cancel: (widgetId?: string) => resolveWidget(widgetId)?.cancel(),
    close: (widgetId?: string) => resolveWidget(widgetId)?.close(),
    get: (widgetId?: string) => resolveWidget(widgetId),
    getMessages: (widgetId?: string) => resolveWidget(widgetId)?.getMessages() ?? [],
    isBusy: (widgetId?: string) => resolveWidget(widgetId)?.isBusy() ?? false,
    isOpen: (widgetId?: string) => resolveWidget(widgetId)?.isOpen() ?? false,
    open: (widgetId?: string) => resolveWidget(widgetId)?.open(),
    reset: (widgetId?: string) => resolveWidget(widgetId)?.reset(),
    send: async (message: string, widgetId?: string) => {
      await resolveWidget(widgetId)?.send(message);
    },
    toggle: (widgetId?: string) => resolveWidget(widgetId)?.toggle()
  };

  window.Context7Widget = api;
  globalApiInstalled = true;
}

function resolveWidget(widgetId?: string): Context7WidgetElement | undefined {
  if (widgetId) return registry.get(widgetId);
  return registry.get('default') ?? registry.values().next().value;
}

function readConfig(element: HTMLElement): Context7WidgetConfig {
  return resolveContext7WidgetConfig({
    backdrop: readBooleanAttribute(element, undefined, 'backdrop', 'data-backdrop'),
    closeOnOutsideClick: readBooleanAttribute(
      element,
      undefined,
      'close-on-outside-click',
      'data-close-on-outside-click'
    ),
    color: readAttribute(element, 'color', 'data-color'),
    customTrigger: readAttribute(element, 'custom-trigger', 'data-custom-trigger'),
    defaultOpen: readBooleanAttribute(element, undefined, 'default-open', 'data-default-open'),
    initialMessage: readAttribute(element, 'initial-message', 'data-initial-message', 'data-welcome-message'),
    launcherLabel: readAttribute(element, 'launcher-label', 'data-launcher-label'),
    launcherVariant: readAttribute(element, 'launcher-variant', 'data-launcher-variant'),
    library: readAttribute(element, 'library', 'data-library'),
    panelHeight: readAttribute(element, 'panel-height', 'data-panel-height'),
    panelWidth: readAttribute(element, 'panel-width', 'data-panel-width'),
    placeholder: readAttribute(element, 'placeholder', 'data-placeholder'),
    position: readAttribute(element, 'position', 'data-position'),
    preset: readAttribute(element, 'preset', 'data-preset'),
    theme: readAttribute(element, 'theme', 'data-theme'),
    title: readAttribute(element, 'dialog-title', 'data-title'),
    widgetId: readAttribute(element, 'widget-id', 'data-widget-id') || element.id
  });
}

function readAttribute(element: HTMLElement, ...names: string[]): string {
  for (const name of names) {
    const value = element.getAttribute(name);
    if (value) return value.trim();
  }
  return '';
}

function readBooleanAttribute(
  element: HTMLElement,
  defaultValue: boolean | undefined,
  ...names: string[]
): boolean | undefined {
  for (const name of names) {
    if (!element.hasAttribute(name)) continue;
    const value = element.getAttribute(name);
    if (isFalseyAttribute(value)) return false;
    if (isTruthyAttribute(value)) return true;
    return true;
  }

  return defaultValue;
}

function isTruthyAttribute(value: string | null): boolean {
  return value === '' || value === 'true' || value === '1' || value === 'yes';
}

function isFalseyAttribute(value: string | null): boolean {
  return value === 'false' || value === '0' || value === 'no';
}

function syncHostAttribute(element: HTMLElement, name: string, value: string): void {
  if (element.getAttribute(name) !== value) {
    element.setAttribute(name, value);
  }
}

function syncStateAttribute(element: HTMLElement, name: string, active: boolean): void {
  if (active) {
    if (!element.hasAttribute(name)) element.setAttribute(name, '');
  } else {
    element.removeAttribute(name);
  }
}

function syncStyleProperty(element: HTMLElement, name: string, value: string): void {
  if (value) {
    element.style.setProperty(name, value);
  } else {
    element.style.removeProperty(name);
  }
}

function collectWidgetElements(root: ShadowRoot): WidgetElements {
  return {
    backdrop: requireElement(root, '[data-c7-backdrop]'),
    closeButton: requireElement(root, '[data-c7-close]'),
    form: requireElement(root, '[data-c7-form]'),
    input: requireElement(root, '[data-c7-input]'),
    launcher: requireElement(root, '[data-c7-launcher]'),
    launcherLabel: requireElement(root, '[data-c7-launcher-label]'),
    messages: requireElement(root, '[data-c7-messages]'),
    panel: requireElement(root, '.c7-panel'),
    sendButton: requireElement(root, '[data-c7-send]'),
    title: requireElement(root, '[data-c7-title]')
  };
}

function requireElement<ElementType extends Element>(root: ShadowRoot, selector: string): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Context7 widget template is missing ${selector}.`);
  return element;
}

function adoptSharedWidgetStyles(root: ShadowRoot): boolean {
  if (sharedWidgetStyleSheet === false) return false;
  if (
    typeof CSSStyleSheet === 'undefined' ||
    !('adoptedStyleSheets' in root) ||
    typeof CSSStyleSheet.prototype.replaceSync !== 'function'
  ) {
    return false;
  }

  try {
    if (!sharedWidgetStyleSheet) {
      sharedWidgetStyleSheet = new CSSStyleSheet();
      sharedWidgetStyleSheet.replaceSync(widgetStyles);
    }
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sharedWidgetStyleSheet];
    return true;
  } catch {
    sharedWidgetStyleSheet = false;
    return false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'context7-widget': Context7WidgetElement;
  }
}

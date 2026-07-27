import { renderWidgetBranding } from './branding';
import { escapeHtml, renderMarkdown } from './markdown';
import { buildContext7ErrorHtml, DEFAULT_CONTEXT7_INITIAL_MESSAGE, isAbortError } from './runtime';
import { widgetStyles } from './styles';
import { Context7TransportError, streamContext7Response } from './transport';
import type {
  Context7LauncherVariant,
  Context7Message,
  Context7Position,
  Context7Theme,
  Context7ToolCall,
  Context7ToolResult,
  Context7WidgetApi,
  Context7WidgetConfig,
  Context7WidgetEventDetail,
  Context7WidgetPreset
} from './types';

const registry = new Map<string, HTMLElement>();
const BaseHTMLElement = typeof HTMLElement === 'undefined' ? (class {} as typeof HTMLElement) : HTMLElement;

let globalApiInstalled = false;

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
    'title',
    'widget-id'
  ];

  private abortController: AbortController | null = null;
  private busy = false;
  private config: Context7WidgetConfig = readConfig(this);
  private lastFocus: Element | null = null;
  private messageCounter = 0;
  private messages: Context7Message[] = [];
  private registeredId = '';
  private readonly root: ShadowRoot;
  private activeAnchorElement: Element | null = null;
  private toolCalls = new Map<string, HTMLElement>();
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

  private readonly onFloatingLayout = () => {
    if (this.isOpen()) this.updateAnchorPosition();
  };

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key !== 'Tab' || !this.isOpen()) return;
    trapFocus(event, this.root);
  };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.renderShell();
  }

  connectedCallback(): void {
    this.syncConfig();
    this.bindEvents();
    this.bindCustomTrigger();
    this.resetConversation();
    this.register();
    this.emit('c7:ready');
    if (this.config.defaultOpen) this.open();
  }

  disconnectedCallback(): void {
    this.abortController?.abort();
    this.unbindFloatingListeners();
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
    this.updateAnchorPosition();
    this.setAttribute('open', '');
    this.bindFloatingListeners();
    this.emit('c7:open');
    window.setTimeout(() => this.input?.focus(), 20);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.removeAttribute('open');
    this.unbindFloatingListeners();
    this.emit('c7:close');

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
    return this.hasAttribute('open');
  }

  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.setBusy(false);
  }

  async send(rawQuestion?: string): Promise<void> {
    const question = (rawQuestion ?? this.input?.value ?? '').trim();
    if (!question || this.busy) return;

    if (!this.config.library) {
      this.appendError('Missing data-library attribute.');
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
    this.appendMessage('user', escapeHtml(question));
    this.emit('c7:question', {
      message: userMessage,
      messages: [...this.messages],
      question
    });

    const typing = this.appendTyping();
    let answer = '';
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
              answerElement = this.appendMessage('assistant', '');
            }

            answerElement.innerHTML = renderMarkdown(answer);

            if (!sawFirstToken) {
              sawFirstToken = true;
              this.emit('c7:first-token', { answer, question });
            }

            this.emit('c7:answer', { answer, question });
            this.scrollToBottom();
          },
          onToolCall: (toolCall) => {
            typing.remove();
            this.appendToolCall(toolCall);
            this.emit('c7:tool-call', { question, toolCall });
          },
          onToolResult: (toolResult) => {
            this.updateToolResult(toolResult);
            this.emit('c7:tool-result', { question, toolResult });
          }
        },
        this.abortController.signal
      );

      typing.remove();

      if (answer) {
        const assistantMessage: Context7Message = {
          id: this.nextMessageId(),
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
      if (!isAbortError(error)) {
        const message =
          error instanceof Context7TransportError || error instanceof Error ? error.message : 'Something went wrong.';
        this.appendError(message);
        this.emit('c7:error', { error: message, question });
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
      <div class="c7-backdrop" data-c7-backdrop part="backdrop"></div>
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
        <footer class="c7-footer" data-c7-footer part="footer">
          <span class="c7-branding" part="powered-by" aria-label="Powered by Context7, Enhanced by DeSource Labs">
            ${renderWidgetBranding()}
          </span>
        </footer>
      </section>
      <button class="c7-launcher" data-c7-launcher part="launcher" type="button" aria-label="Open documentation chat">
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
    this.closeButton?.addEventListener('click', () => this.close());
    this.form?.addEventListener('submit', (event) => {
      event.preventDefault();
      void this.send();
    });
    this.root.addEventListener('keydown', this.onKeyDown as (event: Event) => void);
  }

  private syncConfig(): void {
    this.config = readConfig(this);
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

  private resetConversation(): void {
    this.messages = [];
    this.toolCalls.clear();
    this.messagesElement.innerHTML = '';
    const intro = this.config.initialMessage.replace(/\{library\}/g, this.config.library || 'this library');
    this.appendMessage('assistant', renderMarkdown(intro));
  }

  private appendMessage(role: 'assistant' | 'user', html: string): HTMLElement {
    const message = document.createElement('div');
    message.className = `c7-message c7-message--${role}`;
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
    error.innerHTML = buildContext7ErrorHtml(message, this.config.library);
    this.messagesElement.append(error);
    this.scrollToBottom();
  }

  private appendTyping(): HTMLElement {
    const typing = document.createElement('div');
    typing.className = 'c7-typing';
    typing.setAttribute('part', 'typing');
    typing.innerHTML = '<span></span><span></span><span></span>';
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
    wrapper.className = 'c7-tool-result';
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

    const toggle = wrapper.querySelector<HTMLButtonElement>('.c7-tool-toggle');
    const content = wrapper.querySelector<HTMLElement>('.c7-tool-content');
    toggle?.addEventListener('click', () => {
      if (!toggle || !content) return;
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isExpanded));
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

  private bindFloatingListeners(): void {
    document.addEventListener('pointerdown', this.onDocumentPointerDown, true);

    if (this.config.position === 'anchor') {
      window.addEventListener('resize', this.onFloatingLayout);
      window.addEventListener('scroll', this.onFloatingLayout, true);
    }
  }

  private unbindFloatingListeners(): void {
    document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    window.removeEventListener('resize', this.onFloatingLayout);
    window.removeEventListener('scroll', this.onFloatingLayout, true);
  }

  private updateAnchorPosition(): void {
    if (this.config.position !== 'anchor') return;

    const anchor = this.getAnchorElement();
    const panel = this.panel;
    if (!anchor || !panel) return;

    const rect = anchor.getBoundingClientRect();
    const panelWidth = panel.offsetWidth || 400;
    const panelHeight = panel.offsetHeight || 600;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth || panelWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || panelHeight;
    const gap = 12;
    const margin = 12;
    let left = rect.right - panelWidth;
    let { top, origin } = resolveAnchorVerticalPosition(rect, panelHeight, viewportHeight, gap, margin, 'right');

    const maxLeft = Math.max(margin, viewportWidth - panelWidth - margin);
    const maxTop = Math.max(margin, viewportHeight - panelHeight - margin);
    left = clamp(left, margin, maxLeft);
    top = clamp(top, margin, maxTop);

    this.style.setProperty('--c7-anchor-left', `${left}px`);
    this.style.setProperty('--c7-anchor-top', `${top}px`);
    this.style.setProperty('--c7-anchor-origin', origin);
  }

  private getAnchorElement(): HTMLElement | null {
    if (this.activeAnchorElement instanceof HTMLElement && this.activeAnchorElement.isConnected) {
      return this.activeAnchorElement;
    }

    if (this.triggerElement instanceof HTMLElement) return this.triggerElement;
    return this.launcher;
  }

  private bindCustomTrigger(): void {
    this.unbindCustomTrigger();

    if (!this.config.customTrigger) return;

    this.triggerElement = document.querySelector(this.config.customTrigger);
    this.triggerElement?.addEventListener('click', this.onCustomTrigger);
  }

  private unbindCustomTrigger(): void {
    if (this.activeAnchorElement === this.triggerElement) {
      this.activeAnchorElement = null;
    }
    this.triggerElement?.removeEventListener('click', this.onCustomTrigger);
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
    this.registeredId = '';
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
    return this.root.querySelector('[data-c7-close]');
  }

  private get backdrop(): HTMLElement | null {
    return this.root.querySelector('[data-c7-backdrop]');
  }

  private get form(): HTMLFormElement | null {
    return this.root.querySelector('[data-c7-form]');
  }

  private get input(): HTMLInputElement {
    return this.root.querySelector('[data-c7-input]') as HTMLInputElement;
  }

  private get launcher(): HTMLButtonElement | null {
    return this.root.querySelector('[data-c7-launcher]');
  }

  private get launcherLabelElement(): HTMLElement | null {
    return this.root.querySelector('[data-c7-launcher-label]');
  }

  private get messagesElement(): HTMLElement {
    return this.root.querySelector('[data-c7-messages]') as HTMLElement;
  }

  private get panel(): HTMLElement | null {
    return this.root.querySelector('.c7-panel');
  }

  private get sendButton(): HTMLButtonElement | null {
    return this.root.querySelector('[data-c7-send]');
  }

  private get titleElement(): HTMLElement | null {
    return this.root.querySelector('[data-c7-title]');
  }
}

export function defineContext7Widget(tagName = 'context7-widget'): void {
  if (typeof customElements === 'undefined') return;
  if (customElements.get(tagName)) return;
  customElements.define(tagName, Context7WidgetElement);
}

function installGlobalApi(): void {
  if (globalApiInstalled || typeof window === 'undefined') return;

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
  return registry.get('default') ?? registry.values().next().value;
}

function asWidget(widget: HTMLElement | undefined): Context7WidgetElement | undefined {
  return widget instanceof Context7WidgetElement ? widget : undefined;
}

function readConfig(element: HTMLElement): Context7WidgetConfig {
  const library = readAttribute(element, 'library', 'data-library');
  const position = normalizePosition(readAttribute(element, 'position', 'data-position'));
  return {
    backdrop: readBooleanAttribute(element, position === 'center', 'backdrop', 'data-backdrop'),
    closeOnOutsideClick: readBooleanAttribute(element, true, 'close-on-outside-click', 'data-close-on-outside-click'),
    color: readAttribute(element, 'color', 'data-color'),
    customTrigger: readAttribute(element, 'custom-trigger', 'data-custom-trigger'),
    defaultOpen: readBooleanAttribute(element, false, 'default-open', 'data-default-open'),
    initialMessage:
      readAttribute(element, 'initial-message', 'data-initial-message', 'welcome-message', 'data-welcome-message') ||
      DEFAULT_CONTEXT7_INITIAL_MESSAGE,
    launcherLabel: readAttribute(element, 'launcher-label', 'data-launcher-label') || 'Ask Docs AI',
    launcherVariant: normalizeLauncherVariant(readAttribute(element, 'launcher-variant', 'data-launcher-variant')),
    library,
    panelHeight: readAttribute(element, 'panel-height', 'data-panel-height'),
    panelWidth: readAttribute(element, 'panel-width', 'data-panel-width'),
    placeholder: readAttribute(element, 'placeholder', 'data-placeholder') || 'Ask about the docs...',
    position,
    preset: normalizePreset(readAttribute(element, 'preset', 'data-preset')),
    theme: normalizeTheme(readAttribute(element, 'theme', 'data-theme')),
    title: readAttribute(element, 'title', 'data-title') || 'Chat with Documentation',
    widgetId: readAttribute(element, 'widget-id', 'data-widget-id') || element.id || 'default'
  };
}

function readAttribute(element: HTMLElement, ...names: string[]): string {
  for (const name of names) {
    const value = element.getAttribute(name);
    if (value) return value.trim();
  }
  return '';
}

function normalizePosition(value: string): Context7Position {
  if (
    value === 'bottom-left' ||
    value === 'top-right' ||
    value === 'top-left' ||
    value === 'bottom-right' ||
    value === 'center' ||
    value === 'anchor'
  ) {
    return value;
  }

  return 'bottom-right';
}

function normalizeLauncherVariant(value: string): Context7LauncherVariant {
  if (value === 'pill' || value === 'badge') return value;
  return 'icon';
}

function normalizePreset(value: string): Context7WidgetPreset {
  if (value === 'minimal' || value === 'glass' || value === 'neo' || value === 'terminal' || value === 'brutalist') {
    return value;
  }

  return 'default';
}

function normalizeTheme(value: string): Context7Theme {
  if (value === 'light' || value === 'dark') return value;
  return 'auto';
}

function readBooleanAttribute(element: HTMLElement, defaultValue: boolean, ...names: string[]): boolean {
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

function resolveAnchorVerticalPosition(
  rect: DOMRect,
  panelHeight: number,
  viewportHeight: number,
  gap: number,
  margin: number,
  horizontalOrigin: 'left' | 'right'
): { origin: string; top: number } {
  const above = rect.top - panelHeight - gap;
  const below = rect.bottom + gap;
  const spaceAbove = rect.top - margin - gap;
  const spaceBelow = viewportHeight - rect.bottom - margin - gap;
  const hasSpaceAbove = above >= margin;
  const hasSpaceBelow = below + panelHeight <= viewportHeight - margin;

  if (hasSpaceAbove || (!hasSpaceBelow && spaceAbove >= spaceBelow)) {
    return {
      origin: `bottom ${horizontalOrigin}`,
      top: above
    };
  }

  return {
    origin: `top ${horizontalOrigin}`,
    top: below
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
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
  if (!first || !last) return;

  const active = root.activeElement;

  if (event.shiftKey && active === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'context7-widget': Context7WidgetElement;
  }
}

import { renderWidgetBranding } from './branding.js';
import { resolveContext7WidgetConfig } from './config.js';
import { context7CopyIconsHtml, createContext7CopyActionController, syncContext7CopyButton } from './copy-action.js';
import {
  cancelRenderFrame,
  captureTriggerAccessibility,
  isContext7WidgetTriggerElement,
  requestRenderFrame,
  resolveContext7CustomTrigger,
  restoreTriggerAccessibility,
  trapFocus,
  updateAnchorPosition
} from './dom.js';
import { createContext7ConversationEngine } from './engine.js';
import { escapeHtml, renderMarkdown, resolveContext7MarkdownBaseUrl } from './markdown.js';
import { acquireContext7Modal } from './modal.js';
import { createContext7ConversationRenderBridge, formatContext7ToolResult, getContext7ToolQuery } from './renderer.js';
import { buildContext7ErrorHtml } from './runtime.js';
import { widgetStyles } from './styles.js';
import type {
  Context7ConversationEvent,
  Context7ConversationState,
  Context7Message,
  Context7ToolCall,
  Context7ToolResult,
  Context7TriggerA11yState,
  Context7WidgetApi,
  Context7WidgetConfig,
  Context7WidgetEventDetailFor,
  Context7WidgetEventName,
  Context7WidgetEventPayload,
  Context7WidgetLabels,
  Context7WidgetSendResult,
  Context7WidgetTrigger
} from './types.js';

const registry = new Map<string, Context7WidgetElement>();
const registryStacks = new Map<string, Context7WidgetElement[]>();
const BaseHTMLElement = typeof HTMLElement === 'undefined' ? (class {} as typeof HTMLElement) : HTMLElement;
const INITIAL_MESSAGE_ATTRIBUTES = new Set(['data-initial-message', 'data-welcome-message', 'initial-message']);
const LIBRARY_ATTRIBUTES = new Set(['data-library', 'library']);
const REFLECTED_CONFIG_ATTRIBUTES = new Set(['launcher-variant', 'position', 'preset', 'theme']);

let globalApiInstalled = false;
let instanceCounter = 0;
let sharedWidgetStyleSheet: CSSStyleSheet | false | undefined;

interface WidgetElements {
  readonly backdrop: HTMLElement;
  readonly branding: HTMLElement;
  readonly closeButton: HTMLButtonElement;
  readonly context7Attribution: HTMLAnchorElement;
  readonly deSourceLabsAttribution: HTMLAnchorElement;
  readonly enhancedBy: HTMLElement;
  readonly form: HTMLFormElement;
  readonly input: HTMLTextAreaElement;
  readonly launcher: HTMLButtonElement;
  readonly launcherLabel: HTMLElement;
  readonly messages: HTMLElement;
  readonly panel: HTMLElement;
  readonly poweredBy: HTMLElement;
  readonly sendButton: HTMLButtonElement;
  readonly title: HTMLElement;
}

interface WidgetAnswerRender {
  answer: string;
  answerElement: HTMLElement | null;
  renderFrame: number | null;
  readonly typing: HTMLElement;
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
    'data-link-base-url',
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
    'link-base-url',
    'panel-height',
    'panel-width',
    'placeholder',
    'position',
    'preset',
    'theme',
    'widget-id'
  ];

  private activeAnchorElement: Element | null = null;
  private config: Context7WidgetConfig = readConfig(this);
  private conversationInitialized = false;
  private readonly copyActions = createContext7CopyActionController<HTMLButtonElement>({
    onChange: (button, copied) => this.syncCopyButton(button, copied)
  });
  private readonly copyValues = new WeakMap<HTMLButtonElement, string>();
  private customTriggerElement: Element | null = null;
  private labelsInput: Partial<Context7WidgetLabels> | undefined;
  private customTriggerObserver: MutationObserver | null = null;
  private customTriggerSelectorInvalid = false;
  private customTriggerWarningKey = '';
  private readonly engine = createContext7ConversationEngine({
    missingLibraryMessage: () => this.config.labels.missingLibrary,
    nextMessageId: () => this.nextMessageId(),
    resolveConfig: () => this.config
  });
  private readonly elements: WidgetElements;
  private floatingLayoutFrame: number | null = null;
  private floatingResizeObserver: ResizeObserver | null = null;
  private floatingViewport: VisualViewport | null = null;
  private lastFocus: Element | null = null;
  private messageCounter = 0;
  private releaseModal: (() => void) | null = null;
  private readonly panelId = `context7-widget-panel-${++instanceCounter}`;
  private readonly reflectedConfigAttributes = new Set<string>();
  private readonly reflectingConfigAttributes = new Set<string>();
  private registeredId = '';
  private readonly root: ShadowRoot;
  private readonly renderBridge = createContext7ConversationRenderBridge<WidgetAnswerRender>({
    clearAnswer: (render) => this.clearAnswerRender(render),
    discardAnswer: (render) => this.discardAnswerRender(render),
    emit: (event) => this.emit(event.type, event.detail),
    flushAnswer: (render, event) => this.flushAnswerRender(render, event.detail.answer),
    onAnswer: (event, render) => this.renderAnswer(event, render),
    onError: (event) =>
      this.appendError(String(event.detail.error || this.config.labels.errorFallback), event.detail.question),
    onQuestion: (event) => this.renderQuestion(event),
    onToolCall: (event, render) => {
      render?.typing.remove();
      this.appendToolCall(event.detail.toolCall);
    },
    onToolResult: (event) => this.updateToolResult(event.detail.toolResult)
  });
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

    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.isComposing &&
      event.target === this.input &&
      !this.isBusy()
    ) {
      event.preventDefault();
      this.form.requestSubmit();
      return;
    }

    if (event.key === 'Tab' && this.isOpen() && this.config.position === 'center') trapFocus(event, this.panel);
  };

  private readonly onInput = () => this.resizeInput();

  private readonly onDelegatedCopyClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-c7-copy-answer], [data-c7-copy-code]');
    if (!button || !this.messagesElement.contains(button)) return;
    event.stopPropagation();

    const value = button.hasAttribute('data-c7-copy-code')
      ? (button.closest('.c7-code-block')?.querySelector('code')?.textContent ?? '')
      : (this.copyValues.get(button) ?? '');
    void this.copyActions.copy(button, value);
  };

  private readonly onCloseClick = () => {
    this.close();
  };

  private readonly onFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    if (this.isBusy()) {
      this.cancel();
    } else {
      void this.send();
    }
  };

  private readonly onConversationState = (state: Context7ConversationState) => {
    this.setBusy(state.busy);
    if (!state.busy) this.renderBridge.clearActiveAnswer();
  };

  private readonly onConversationEvent = (event: Context7ConversationEvent) => {
    this.renderBridge.handleEvent(event);
  };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.renderShell();
    this.elements = collectWidgetElements(this.root);
    this.updateStaticText();
    this.bindEvents();
    this.engine.subscribe(this.onConversationState);
    this.engine.subscribeEvents(this.onConversationEvent);
  }

  get customTrigger(): Context7WidgetTrigger | '' {
    return this.customTriggerElement ?? this.config.customTrigger;
  }

  set customTrigger(value: Context7WidgetTrigger | null | undefined) {
    this.customTriggerElement = isContext7WidgetTriggerElement(value) ? value : null;
    if (typeof value === 'string' && value) {
      this.setAttribute('custom-trigger', value);
    } else {
      this.removeAttribute('custom-trigger');
      this.removeAttribute('data-custom-trigger');
    }

    this.config = readConfig(this, this.reflectedConfigAttributes, this.labelsInput);
    if (!this.isConnected) return;

    this.applyConfig();
    this.bindCustomTrigger();
    if (this.isOpen()) {
      this.unbindFloatingListeners();
      this.bindFloatingListeners();
      this.updateAnchorPosition();
    }
  }

  get labels(): Context7WidgetLabels {
    return this.config.labels;
  }

  set labels(value: Partial<Context7WidgetLabels> | null | undefined) {
    this.labelsInput = value ?? undefined;
    this.config = readConfig(this, this.reflectedConfigAttributes, this.labelsInput);
    this.updateStaticText();
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
    this.copyActions.reset(false);
    this.releaseModalState();
    this.unbindFloatingListeners();
    this.unbindCustomTrigger();
    this.unregister();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    if (this.reflectingConfigAttributes.has(name)) return;
    if (REFLECTED_CONFIG_ATTRIBUTES.has(name)) this.reflectedConfigAttributes.delete(name);
    const previousLibrary = this.config.library;
    this.config = readConfig(this, this.reflectedConfigAttributes, this.labelsInput);
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
      this.syncModalState();
      this.unbindFloatingListeners();
      this.bindFloatingListeners();
      this.updateAnchorPosition();
    }
  }

  open(): void {
    if (this.isOpen()) return;
    this.lastFocus = document.activeElement;
    this.setAttribute('open', '');
    this.syncModalState();
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
    this.releaseModalState();
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
    return this.engine.isBusy();
  }

  getMessages(): readonly Context7Message[] {
    return this.engine.getMessages();
  }

  reset(): void {
    this.engine.reset();
    this.renderBridge.clearActiveAnswer();
    this.copyActions.reset(false);
    this.toolCalls.clear();
    this.messagesElement.innerHTML = '';
    const intro = this.config.initialMessage.replace(
      /\{library\}/g,
      this.config.library || this.config.labels.libraryFallback
    );
    const introElement = this.appendMessage('assistant', this.renderMarkdown(intro));
    this.addAnswerActions(introElement, intro);
    this.conversationInitialized = true;
  }

  async retry(): Promise<Context7WidgetSendResult> {
    this.open();
    const result = await this.engine.retry();
    if (!this.isBusy()) this.input?.focus();
    return result;
  }

  cancel(): void {
    this.engine.cancel();
    this.input?.focus();
  }

  async send(rawQuestion?: string): Promise<Context7WidgetSendResult> {
    const question = (rawQuestion ?? this.input?.value ?? '').trim();
    if (question && !this.isBusy() && this.config.library) {
      this.open();
      this.input.value = '';
      this.resizeInput();
    }
    const result = await this.engine.send(question);
    if (!this.isBusy()) this.input?.focus();
    return result;
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
          <textarea
            aria-label="Ask a documentation question"
            autocomplete="off"
            class="c7-input"
            data-c7-input
            part="input"
            rows="1"
          ></textarea>
          <button aria-label="Send question" class="c7-send" data-c7-send part="send-button" type="submit">
            Send
          </button>
        </form>
        <footer class="c7-footer" data-c7-footer part="footer">
          <span class="c7-branding" data-c7-branding part="powered-by">
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
    this.input?.addEventListener('input', this.onInput);
    this.messagesElement?.addEventListener('click', this.onDelegatedCopyClick);
    this.root.addEventListener('keydown', this.onKeyDown as (event: Event) => void);
  }

  private syncConfig(): void {
    this.config = readConfig(this, this.reflectedConfigAttributes, this.labelsInput);
    this.applyConfig();
  }

  private applyConfig(): void {
    syncStyleProperty(this, '--c7-accent', this.config.color);
    syncStyleProperty(this, '--c7-panel-height', this.config.panelHeight);
    syncStyleProperty(this, '--c7-panel-width', this.config.panelWidth);

    this.reflectConfigAttribute('launcher-variant', this.config.launcherVariant);
    this.reflectConfigAttribute('position', this.config.position);
    this.reflectConfigAttribute('preset', this.config.preset);
    this.reflectConfigAttribute('theme', this.config.theme);
    syncStateAttribute(this, 'backdrop-active', this.config.backdrop);
    this.syncCustomTriggerState();
    if (this.isOpen()) this.syncModalState();
  }

  private updateStaticText(): void {
    const labels = this.config.labels;
    if (this.titleElement) this.titleElement.textContent = this.config.title;
    if (this.input) {
      this.input.placeholder = this.config.placeholder;
      this.input.setAttribute('aria-label', labels.input);
    }
    this.closeButton?.setAttribute('aria-label', labels.close);
    this.messagesElement?.setAttribute('aria-label', labels.conversation);
    if (this.launcherLabelElement) this.launcherLabelElement.textContent = this.config.launcherLabel;
    if (this.launcher) this.launcher.setAttribute('aria-label', this.config.launcherLabel);
    if (this.panel) {
      this.panel.setAttribute('aria-label', this.config.title);
      this.panel.setAttribute('aria-modal', String(this.config.position === 'center'));
    }
    this.elements.branding.setAttribute('aria-label', labels.branding);
    this.elements.context7Attribution.setAttribute('aria-label', labels.context7Attribution);
    this.elements.context7Attribution.setAttribute('title', labels.context7Attribution);
    this.elements.poweredBy.textContent = labels.poweredBy;
    this.elements.deSourceLabsAttribution.setAttribute('aria-label', labels.deSourceLabsAttribution);
    this.elements.deSourceLabsAttribution.setAttribute('title', labels.deSourceLabsAttribution);
    this.elements.enhancedBy.textContent = labels.enhancedBy;
    for (const button of this.messagesElement.querySelectorAll<HTMLButtonElement>(
      '[data-c7-copy-answer], [data-c7-copy-code]'
    )) {
      this.syncCopyButton(button, this.copyActions.isCopied(button));
    }
    this.setBusy(this.isBusy());
  }

  private reflectConfigAttribute(name: string, value: string): void {
    if (this.getAttribute(name) === value) return;
    this.reflectedConfigAttributes.add(name);
    this.reflectingConfigAttributes.add(name);
    this.setAttribute(name, value);
    this.reflectingConfigAttributes.delete(name);
  }

  private renderQuestion(event: Context7ConversationEvent<'c7:question'>): WidgetAnswerRender | null {
    const detail = event.detail;
    if (!detail.retry) this.appendMessage('user', escapeHtml(detail.question), detail.message.id);
    return event.request
      ? {
          answer: '',
          answerElement: null,
          renderFrame: null,
          typing: this.appendTyping()
        }
      : null;
  }

  private renderAnswer(event: Context7ConversationEvent<'c7:answer'>, render: WidgetAnswerRender): void {
    const detail = event.detail;
    render.typing.remove();
    render.answer = detail.answer;
    if (!render.answerElement) render.answerElement = this.appendMessage('assistant', '');
    render.renderFrame ??= requestRenderFrame(() => {
      render.renderFrame = null;
      if (!render.answerElement) return;
      render.answerElement.textContent = render.answer;
      this.scrollToBottom();
    });
  }

  private flushAnswerRender(render: WidgetAnswerRender, answer: string): void {
    cancelRenderFrame(render.renderFrame);
    render.renderFrame = null;
    render.typing.remove();
    render.answer = answer;
    if (answer && !render.answerElement) render.answerElement = this.appendMessage('assistant', '');
    if (render.answerElement) {
      render.answerElement.innerHTML = this.renderMarkdown(answer);
      this.addAnswerActions(render.answerElement, answer);
      this.scrollToBottom();
    }
  }

  private clearAnswerRender(render: WidgetAnswerRender): void {
    cancelRenderFrame(render.renderFrame);
    render.typing.remove();
  }

  private renderMarkdown(content: string): string {
    return renderMarkdown(content, {
      baseUrl: resolveContext7MarkdownBaseUrl(this.config.library, this.config.linkBaseUrl),
      copyCodeLabel: this.config.labels.copyCode
    });
  }

  private discardAnswerRender(render: WidgetAnswerRender): void {
    cancelRenderFrame(render.renderFrame);
    render.typing.remove();
    render.answerElement?.remove();
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

  private addAnswerActions(message: HTMLElement, answer: string): void {
    if (!answer || message.querySelector('[data-c7-copy-answer]')) return;
    const button = document.createElement('button');
    button.className = 'c7-copy-answer';
    button.type = 'button';
    button.setAttribute('data-c7-copy-answer', '');
    button.innerHTML = context7CopyIconsHtml;
    this.syncCopyButton(button, false);
    this.copyValues.set(button, answer);
    message.append(button);
  }

  private syncCopyButton(button: HTMLButtonElement, copied: boolean): void {
    const copyLabel = button.hasAttribute('data-c7-copy-code')
      ? this.config.labels.copyCode
      : this.config.labels.copyAnswer;
    syncContext7CopyButton(button, copied, copyLabel, this.config.labels.copied);
  }

  private appendError(message: string, _question: string): void {
    const error = document.createElement('div');
    error.className = 'c7-message c7-message--error';
    error.setAttribute('part', 'message error-message');
    error.setAttribute('role', 'alert');
    const content = document.createElement('div');
    content.innerHTML = buildContext7ErrorHtml(message, this.config.library, this.config.labels);
    const retry = document.createElement('button');
    retry.className = 'c7-retry';
    retry.type = 'button';
    retry.textContent = this.config.labels.retry;
    retry.addEventListener('click', () => {
      error.remove();
      void this.retry();
    });
    error.append(content, retry);
    this.messagesElement.append(error);
    this.scrollToBottom();
  }

  private appendTyping(): HTMLElement {
    const typing = document.createElement('div');
    typing.className = 'c7-typing';
    typing.setAttribute('part', 'typing');
    typing.setAttribute('role', 'status');
    typing.setAttribute('aria-label', this.config.labels.responding);
    typing.innerHTML =
      '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
    this.messagesElement.append(typing);
    this.scrollToBottom();
    return typing;
  }

  private appendToolCall(toolCall: Context7ToolCall): void {
    const tool = document.createElement('div');
    const query = getContext7ToolQuery(toolCall);
    tool.className = 'c7-tool-call';
    tool.setAttribute('part', 'tool-call');
    tool.innerHTML = `
      <div class="c7-tool-header">
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <span>${escapeHtml(this.config.labels.searching)}: ${escapeHtml(query)}</span>
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

    const result = formatContext7ToolResult(toolResult.result);

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
        <span>${escapeHtml(this.config.labels.viewResults)}</span>
      </button>
      <div aria-label="${escapeHtml(this.config.labels.searchResults)}" class="c7-tool-content" hidden id="${resultId}" role="region">
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
      if (label) label.textContent = isExpanded ? this.config.labels.viewResults : this.config.labels.hideResults;
    });

    tool.append(wrapper);
    this.scrollToBottom();
  }

  private setBusy(isBusy: boolean): void {
    const moveFocus = isBusy && this.root.activeElement === this.input;
    if (this.input) this.input.readOnly = isBusy;
    if (this.panel) this.panel.setAttribute('aria-busy', String(isBusy));
    if (this.sendButton) {
      this.sendButton.textContent = isBusy ? this.config.labels.stop : this.config.labels.send;
      this.sendButton.setAttribute(
        'aria-label',
        isBusy ? this.config.labels.stopResponse : this.config.labels.sendQuestion
      );
      if (moveFocus) this.sendButton.focus({ preventScroll: true });
    }
  }

  private resizeInput(): void {
    if (!this.input) return;
    this.input.style.height = 'auto';
    this.input.style.height = `${Math.min(this.input.scrollHeight, 84)}px`;
  }

  private syncModalState(): void {
    this.releaseModalState();
    if (this.isOpen() && this.config.position === 'center' && this.isConnected) {
      this.releaseModal = acquireContext7Modal(this);
    }
  }

  private releaseModalState(): void {
    this.releaseModal?.();
    this.releaseModal = null;
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
    updateAnchorPosition(this.config.position, this.getAnchorElement(), this.panel, this.style);
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

    const trigger = this.getCustomTrigger();
    this.customTriggerSelectorInvalid = false;
    if (!trigger) return;

    const resolution = resolveContext7CustomTrigger(trigger, false);
    this.customTriggerSelectorInvalid = resolution.invalidSelector;
    const element = resolution.element;

    if (element?.isConnected) {
      this.triggerElement = element;
      this.triggerElement.addEventListener('click', this.onCustomTrigger);
      this.triggerAccessibilityState = captureTriggerAccessibility(this.triggerElement);
      this.triggerElement.setAttribute('aria-controls', this.panelId);
      this.triggerElement.setAttribute('aria-haspopup', 'dialog');
      this.triggerElement.setAttribute('aria-expanded', String(this.isOpen()));
      this.customTriggerWarningKey = '';
    } else {
      this.warnCustomTriggerBindingFailure(trigger, resolution.invalidSelector);
    }

    this.syncCustomTriggerState();
    this.observeCustomTrigger();
  }

  private unbindCustomTrigger(): void {
    this.customTriggerObserver?.disconnect();
    this.customTriggerObserver = null;
    if (this.activeAnchorElement === this.triggerElement) {
      this.activeAnchorElement = null;
    }
    this.triggerElement?.removeEventListener('click', this.onCustomTrigger);
    if (this.triggerAccessibilityState) restoreTriggerAccessibility(this.triggerAccessibilityState);
    this.triggerAccessibilityState = null;
    this.triggerElement = null;
    this.syncCustomTriggerState();
  }

  private getCustomTrigger(): Context7WidgetTrigger | null {
    return this.customTriggerElement ?? (this.config.customTrigger || null);
  }

  private observeCustomTrigger(): void {
    const trigger = this.getCustomTrigger();
    if (!trigger || this.customTriggerSelectorInvalid || typeof MutationObserver !== 'function') return;

    const observerTarget = document.documentElement ?? document.body;
    if (!observerTarget) return;

    this.customTriggerObserver = new MutationObserver(() => {
      if (!this.isConnected || this.triggerElement?.isConnected) return;
      this.bindCustomTrigger();
      if (this.isOpen()) {
        this.unbindFloatingListeners();
        this.bindFloatingListeners();
        this.updateAnchorPosition();
      }
    });
    this.customTriggerObserver.observe(observerTarget, { childList: true, subtree: true });
  }

  private warnCustomTriggerBindingFailure(trigger: Context7WidgetTrigger, invalidSelector: boolean): void {
    const warningKey = isContext7WidgetTriggerElement(trigger) ? 'element' : `selector:${trigger}`;
    if (this.customTriggerWarningKey === warningKey) return;
    this.customTriggerWarningKey = warningKey;

    if (isContext7WidgetTriggerElement(trigger)) {
      console.warn('[Context7 Widget] Custom trigger element is not connected. Keeping the built-in launcher visible.');
      return;
    }

    if (invalidSelector) {
      console.warn(`[Context7 Widget] Invalid custom trigger selector: ${trigger}`);
      return;
    }

    console.warn(
      `[Context7 Widget] Custom trigger selector was not found: ${trigger}. Keeping the built-in launcher visible.`
    );
  }

  private syncCustomTriggerState(): void {
    syncStateAttribute(this, 'custom-trigger-active', Boolean(this.triggerElement?.isConnected));
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

  private get input(): HTMLTextAreaElement {
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
    retry: async (widgetId?: string) => await resolveWidget(widgetId)?.retry(),
    send: async (message: string, widgetId?: string) => await resolveWidget(widgetId)?.send(message),
    toggle: (widgetId?: string) => resolveWidget(widgetId)?.toggle()
  };

  window.Context7Widget = api;
  globalApiInstalled = true;
}

function resolveWidget(widgetId?: string): Context7WidgetElement | undefined {
  if (widgetId) return registry.get(widgetId);
  return registry.get('default') ?? registry.values().next().value;
}

function readConfig(
  element: HTMLElement,
  reflectedAttributes: ReadonlySet<string> = new Set(),
  labels?: Partial<Context7WidgetLabels>
): Context7WidgetConfig {
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
    labels,
    launcherLabel: readAttribute(element, 'launcher-label', 'data-launcher-label'),
    launcherVariant: readAttribute(element, reflectedAttributes, 'launcher-variant', 'data-launcher-variant'),
    library: readAttribute(element, 'library', 'data-library'),
    linkBaseUrl: readAttribute(element, 'link-base-url', 'data-link-base-url'),
    panelHeight: readAttribute(element, 'panel-height', 'data-panel-height'),
    panelWidth: readAttribute(element, 'panel-width', 'data-panel-width'),
    placeholder: readAttribute(element, 'placeholder', 'data-placeholder'),
    position: readAttribute(element, reflectedAttributes, 'position', 'data-position'),
    preset: readAttribute(element, reflectedAttributes, 'preset', 'data-preset'),
    theme: readAttribute(element, reflectedAttributes, 'theme', 'data-theme'),
    title: readAttribute(element, 'dialog-title', 'data-title'),
    widgetId: readAttribute(element, 'widget-id', 'data-widget-id') || element.id
  });
}

function readAttribute(
  element: HTMLElement,
  reflectedAttributesOrName: ReadonlySet<string> | string,
  ...additionalNames: string[]
): string {
  const reflectedAttributes =
    typeof reflectedAttributesOrName === 'string' ? new Set<string>() : reflectedAttributesOrName;
  const names =
    typeof reflectedAttributesOrName === 'string' ? [reflectedAttributesOrName, ...additionalNames] : additionalNames;
  for (const name of names) {
    if (reflectedAttributes.has(name)) continue;
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
    branding: requireElement(root, '[data-c7-branding]'),
    closeButton: requireElement(root, '[data-c7-close]'),
    context7Attribution: requireElement(root, '[data-c7-context7-attribution]'),
    deSourceLabsAttribution: requireElement(root, '[data-c7-desource-attribution]'),
    enhancedBy: requireElement(root, '[data-c7-enhanced-by]'),
    form: requireElement(root, '[data-c7-form]'),
    input: requireElement(root, '[data-c7-input]'),
    launcher: requireElement(root, '[data-c7-launcher]'),
    launcherLabel: requireElement(root, '[data-c7-launcher-label]'),
    messages: requireElement(root, '[data-c7-messages]'),
    panel: requireElement(root, '.c7-panel'),
    poweredBy: requireElement(root, '[data-c7-powered-by]'),
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

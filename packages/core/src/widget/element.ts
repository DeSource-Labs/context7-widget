import { renderWidgetBranding } from './branding.js';
import { resolveContext7WidgetConfig } from '../shared/config.js';
import { isContext7WidgetTriggerElement } from '../shared/dom.js';
import {
  useContext7Session,
  type Context7Session,
  type Context7SessionErrorItem,
  type Context7SessionEvent,
  type Context7SessionItem,
  type Context7SessionMessageItem,
  type Context7SessionSnapshot,
  type Context7SessionToolItem
} from '../shared/session.js';
import { widgetStyles } from './styles.js';
import type {
  Context7Message,
  Context7WidgetApi,
  Context7WidgetConfig,
  Context7WidgetEventDetailFor,
  Context7WidgetEventName,
  Context7WidgetEventPayload,
  Context7WidgetSendResult,
  Context7WidgetTrigger
} from '../types.js';

const registry = new Map<string, Context7WidgetElement>();

const registryStacks = new Map<string, Context7WidgetElement[]>();

const BaseHTMLElement = typeof HTMLElement === 'undefined' ? (class {} as typeof HTMLElement) : HTMLElement;

const INITIAL_MESSAGE_ATTRIBUTES = new Set(['data-initial-message', 'data-welcome-message', 'initial-message']);

const LIBRARY_ATTRIBUTES = new Set(['data-library', 'library']);

const CUSTOM_TRIGGER_ATTRIBUTES = new Set(['custom-trigger', 'data-custom-trigger']);

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

    'backdrop',
    'close-on-outside-click',
    'color',
    'custom-trigger',
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

  private config: Context7WidgetConfig = readConfig(this);
  private conversationInitialized = false;
  private customTriggerElement: Element | null = null;

  private readonly elements: WidgetElements;
  private readonly panelId = `context7-widget-panel-${++instanceCounter}`;
  private registeredId = '';
  private readonly root: ShadowRoot;
  private readonly session: Context7Session;

  private lastRenderedItems: readonly Context7SessionItem[] | null = null;

  private readonly itemElements = new Map<string, HTMLElement>();
  private readonly renderedItems = new Map<string, Context7SessionItem>();

  private typingElement: HTMLElement | null = null;

  private renderedBusy: boolean | null = null;

  private renderedTyping: boolean | null = null;

  private readonly onLauncherClick = (event: Event) => this.session.openFrom(event.currentTarget);

  private readonly onBackdropClick = (event: Event) => {
    if (event.target === this.backdrop) {
      this.session.backdropClick();
    }
  };

  private readonly onCloseClick = () => this.session.close();

  private readonly onFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (this.session.isBusy()) {
      this.session.cancel();
    } else {
      void this.session.send(this.input.value);
    }
  };

  private readonly onKeyDown = (event: Event) => {
    if (event instanceof KeyboardEvent) {
      this.session.handleKeyDown(event);
    }
  };

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.renderShell();

    this.elements = collectWidgetElements(this.root);

    this.session = useContext7Session({
      elements: {
        input: () => this.input,
        launcher: () => this.launcher,
        messages: () => this.messagesElement,
        panel: () => this.panel,
        root: () => this
      },
      getConfig: () => ({
        closeOnOutsideClick: this.config.closeOnOutsideClick,
        initialMessage: this.config.initialMessage,
        library: this.config.library,
        position: this.config.position
      }),
      getCustomTrigger: () => this.getCustomTrigger(),
      missingLibraryMessage: 'Missing data-library attribute.',
      onEvent: (event) => this.onSessionEvent(event),
      panelId: this.panelId
    });

    this.session.subscribe((snapshot) => this.renderSession(snapshot));

    this.bindEvents();
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

    this.config = readConfig(this);

    if (!this.isConnected) return;

    this.applyConfig();

    this.session.refreshTrigger();

    if (this.session.isOpen()) {
      this.session.refreshLayout();
    }
  }

  connectedCallback(): void {
    this.syncConfig();

    this.updateStaticText();

    /*
     * Preserve declarative <context7-widget open>.
     * Do not emit an artificial open lifecycle event.
     */
    this.session.syncOpen(this.hasAttribute('open'));

    this.session.mount();

    if (!this.conversationInitialized) {
      this.reset();
    }

    this.register();

    this.emit('c7:ready');

    if (!this.session.isOpen() && this.config.defaultOpen) {
      this.open();
    }
  }

  disconnectedCallback(): void {
    /*
     * Do not destroy the session here:
     * a Custom Element may later be reconnected.
     */
    this.session.unmount();

    this.unregister();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;

    const previousLibrary = this.config.library;

    this.config = readConfig(this);

    this.updateStaticText();

    if (!this.isConnected) return;

    this.applyConfig();
    this.register();

    if (CUSTOM_TRIGGER_ATTRIBUTES.has(name)) {
      this.session.refreshTrigger();
    }

    if (
      (LIBRARY_ATTRIBUTES.has(name) && previousLibrary !== this.config.library) ||
      INITIAL_MESSAGE_ATTRIBUTES.has(name)
    ) {
      this.reset();
    }

    if (this.config.defaultOpen && !this.session.isOpen()) {
      this.open();
    } else if (this.session.isOpen()) {
      this.session.refreshLayout();
    }
  }

  open(): void {
    this.session.open();
  }

  close(): void {
    this.session.close();
  }

  toggle(): void {
    this.session.toggle();
  }

  isOpen(): boolean {
    return this.session.isOpen();
  }

  isBusy(): boolean {
    return this.session.isBusy();
  }

  getMessages(): readonly Context7Message[] {
    return this.session.getMessages();
  }

  reset(): void {
    this.session.reset();

    this.conversationInitialized = true;
  }

  cancel(): void {
    this.session.cancel();
  }

  async send(rawQuestion?: string): Promise<Context7WidgetSendResult> {
    return await this.session.send(rawQuestion ?? this.input.value);
  }

  private onSessionEvent(event: Context7SessionEvent): void {
    switch (event.type) {
      case 'open':
        this.emit('c7:open');
        return;

      case 'close':
        this.emit('c7:close');
        return;

      case 'question':
        this.input.value = '';

        this.emit('c7:question', event.detail);

        return;

      case 'first-token':
        this.emit('c7:first-token', event.detail);

        return;

      case 'answer':
        this.emit('c7:answer', event.detail);

        return;

      case 'answer-complete':
        this.emit('c7:answer-complete', event.detail);

        return;

      case 'cancel':
        this.emit('c7:cancel', event.detail);

        return;

      case 'tool-call':
        this.emit('c7:tool-call', event.detail);

        return;

      case 'tool-result':
        this.emit('c7:tool-result', event.detail);

        return;

      case 'error':
        this.emit('c7:error', event.detail);
    }
  }

  private renderSession(snapshot: Context7SessionSnapshot): void {
    syncStateAttribute(this, 'open', snapshot.open);

    syncStateAttribute(this, 'custom-trigger-active', snapshot.customTriggerBound);

    this.launcher.setAttribute('aria-expanded', String(snapshot.open));

    if (this.renderedBusy !== snapshot.busy) {
      this.renderedBusy = snapshot.busy;

      this.setBusy(snapshot.busy);
    }

    if (this.lastRenderedItems !== snapshot.items) {
      this.lastRenderedItems = snapshot.items;

      this.renderItems(snapshot.items);
    }

    if (this.renderedTyping !== snapshot.typing) {
      this.renderedTyping = snapshot.typing;

      this.renderTyping(snapshot.typing);
    }
  }

  private renderItems(items: readonly Context7SessionItem[]): void {
    const nextIds = new Set<string>();

    for (const item of items) {
      nextIds.add(item.id);

      let element = this.itemElements.get(item.id);

      if (!element) {
        element = this.createItemElement(item);

        this.itemElements.set(item.id, element);

        this.messagesElement.append(element);
      }

      const previous = this.renderedItems.get(item.id);

      /*
       * Session items are immutable.
       * Reference equality therefore gives us a very cheap keyed update.
       */
      if (previous === item) {
        continue;
      }

      this.renderItem(element, item);

      this.renderedItems.set(item.id, item);
    }

    for (const [id, element] of this.itemElements) {
      if (nextIds.has(id)) {
        continue;
      }

      element.remove();

      this.itemElements.delete(id);
      this.renderedItems.delete(id);
    }
  }

  private createItemElement(item: Context7SessionItem): HTMLElement {
    switch (item.kind) {
      case 'message':
        return this.createMessageElement(item);

      case 'error':
        return this.createErrorElement();

      case 'tool':
        return this.createToolElement(item);
    }
  }

  private renderItem(element: HTMLElement, item: Context7SessionItem): void {
    switch (item.kind) {
      case 'message':
        this.renderMessageItem(element, item);

        return;

      case 'error':
        this.renderErrorItem(element, item);

        return;

      case 'tool':
        this.renderToolItem(element, item);
    }
  }

  private createMessageElement(item: Context7SessionMessageItem): HTMLElement {
    const element = document.createElement('div');

    element.dataset.messageId = item.id;

    this.renderMessageItem(element, item);

    return element;
  }

  private renderMessageItem(element: HTMLElement, item: Context7SessionMessageItem): void {
    element.className = `c7-message c7-message--${item.role}`;

    element.setAttribute('part', `message ${item.role}-message`);

    if (item.status) {
      element.dataset.status = item.status;
    } else {
      delete element.dataset.status;
    }

    if (item.role === 'assistant') {
      /*
       * The only data-derived innerHTML sink in the Web Component.
       *
       * item.html can only be created by session.ts -> renderMarkdown().
       */
      element.innerHTML = item.html;
    } else {
      element.textContent = item.content;
    }
  }

  private createErrorElement(): HTMLElement {
    const element = document.createElement('div');

    element.className = 'c7-message c7-message--error';

    element.setAttribute('part', 'message error-message');

    element.setAttribute('role', 'alert');

    return element;
  }

  private renderErrorItem(element: HTMLElement, item: Context7SessionErrorItem): void {
    element.replaceChildren(document.createTextNode(item.message));

    if (!item.adminUrl) return;

    element.append(
      document.createElement('br'),
      document.createElement('br'),
      document.createTextNode('If you are the library owner, check your ')
    );

    const link = document.createElement('a');

    link.href = item.adminUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    link.textContent = 'widget settings';

    element.append(link, document.createTextNode(' on Context7.'));
  }

  private createToolElement(item: Context7SessionToolItem): HTMLElement {
    const tool = document.createElement('div');

    tool.className = 'c7-tool-call';

    tool.setAttribute('part', 'tool-call');

    /*
     * Static library-owned markup only.
     * No user/server values are interpolated here.
     */
    tool.innerHTML = `
      <div class="c7-tool-header">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>

        <span data-c7-tool-query></span>

        <svg
          class="c7-spinner"
          data-c7-tool-spinner
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
      </div>

      <div
        class="c7-tool-result"
        data-c7-tool-result
        hidden
      >
        <button
          class="c7-tool-toggle"
          data-c7-tool-toggle
          part="tool-toggle"
          type="button"
          aria-expanded="false"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="m6 9 6 6 6-6"></path>
          </svg>

          <span data-c7-tool-label>
            View results
          </span>
        </button>

        <div
          aria-label="Documentation search results"
          class="c7-tool-content"
          data-c7-tool-content
          hidden
          role="region"
        >
          <pre data-c7-tool-pre></pre>
        </div>
      </div>
    `;

    const toggle = requireElement<HTMLButtonElement>(tool, '[data-c7-tool-toggle]');

    toggle.addEventListener('click', () => {
      this.session.toggleTool(item.id);
    });

    this.renderToolItem(tool, item);

    return tool;
  }

  private renderToolItem(element: HTMLElement, item: Context7SessionToolItem): void {
    const query = requireElement<HTMLElement>(element, '[data-c7-tool-query]');

    const spinner = requireElement<HTMLElement>(element, '[data-c7-tool-spinner]');

    const result = requireElement<HTMLElement>(element, '[data-c7-tool-result]');

    const toggle = requireElement<HTMLButtonElement>(element, '[data-c7-tool-toggle]');

    const label = requireElement<HTMLElement>(element, '[data-c7-tool-label]');

    const content = requireElement<HTMLElement>(element, '[data-c7-tool-content]');

    const pre = requireElement<HTMLElement>(element, '[data-c7-tool-pre]');

    query.textContent = `Searching: ${item.query}`;

    spinner.hidden = item.hasResult;

    result.hidden = !item.hasResult;

    toggle.setAttribute('aria-controls', item.contentId);

    toggle.setAttribute('aria-expanded', String(item.expanded));

    label.textContent = item.expanded ? 'Hide results' : 'View results';

    content.id = item.contentId;

    content.hidden = !item.expanded;

    pre.textContent = item.result;
  }

  private renderTyping(visible: boolean): void {
    if (!visible) {
      this.typingElement?.remove();
      this.typingElement = null;
      return;
    }

    if (this.typingElement) {
      return;
    }

    const typing = document.createElement('div');

    typing.className = 'c7-typing';

    typing.setAttribute('part', 'typing');

    typing.setAttribute('role', 'status');

    typing.setAttribute('aria-label', 'Context7 is responding');

    for (let index = 0; index < 3; index += 1) {
      const dot = document.createElement('span');

      dot.setAttribute('aria-hidden', 'true');

      typing.append(dot);
    }

    this.typingElement = typing;

    this.messagesElement.append(typing);
  }

  private renderShell(): void {
    const styleElement = adoptSharedWidgetStyles(this.root) ? '' : `<style>${widgetStyles}</style>`;

    /*
     * This is static library template construction.
     *
     * It is intentionally allowed to use innerHTML: no external value is
     * interpolated into this template. renderWidgetBranding() is also
     * library-owned static branding markup.
     */
    this.root.innerHTML = `
      ${styleElement}

      <div
        class="c7-backdrop"
        data-c7-backdrop
        part="backdrop"
        aria-hidden="true"
      ></div>

      <section
        aria-label="Context7 documentation chat"
        aria-busy="false"
        aria-modal="false"
        class="c7-panel"
        id="${this.panelId}"
        part="panel"
        role="dialog"
      >
        <header
          class="c7-header"
          part="header"
        >
          <div
            class="c7-title"
            data-c7-title
            part="title"
          ></div>

          <button
            class="c7-close"
            data-c7-close
            part="close-button"
            type="button"
            aria-label="Close chat"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
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

        <form
          class="c7-composer"
          data-c7-form
          part="composer"
        >
          <input
            aria-label="Ask a documentation question"
            autocomplete="off"
            class="c7-input"
            data-c7-input
            part="input"
            type="text"
          />

          <button
            aria-label="Send question"
            class="c7-send"
            data-c7-send
            part="send-button"
            type="submit"
          >
            Send
          </button>
        </form>

        <footer
          class="c7-footer"
          data-c7-footer
          part="footer"
        >
          <span
            class="c7-branding"
            part="powered-by"
            aria-label="Powered by Context7, Enhanced by DeSource Labs"
          >
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
        <svg
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M8 9h8"></path>
          <path d="M8 13h6"></path>
          <path
            d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12"
          ></path>
        </svg>

        <span
          class="c7-launcher-label"
          data-c7-launcher-label
        ></span>
      </button>
    `;
  }

  private bindEvents(): void {
    this.backdrop.addEventListener('click', this.onBackdropClick);

    this.launcher.addEventListener('click', this.onLauncherClick);

    this.closeButton.addEventListener('click', this.onCloseClick);

    this.form.addEventListener('submit', this.onFormSubmit);

    this.root.addEventListener('keydown', this.onKeyDown);
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
  }

  private updateStaticText(): void {
    this.titleElement.textContent = this.config.title;

    this.input.placeholder = this.config.placeholder;

    this.launcherLabelElement.textContent = this.config.launcherLabel;

    this.launcher.setAttribute('aria-label', this.config.launcherLabel);

    this.panel.setAttribute('aria-label', this.config.title);

    this.panel.setAttribute('aria-modal', String(this.config.position === 'center'));
  }

  private setBusy(busy: boolean): void {
    this.input.disabled = busy;

    this.panel.setAttribute('aria-busy', String(busy));

    this.sendButton.textContent = busy ? 'Stop' : 'Send';

    this.sendButton.setAttribute('aria-label', busy ? 'Stop response' : 'Send question');
  }

  private getCustomTrigger(): Context7WidgetTrigger | null {
    return this.customTriggerElement ?? (this.config.customTrigger || null);
  }

  private register(): void {
    installGlobalApi();

    if (this.registeredId === this.config.widgetId) {
      return;
    }

    if (this.registeredId) {
      this.unregister();
    }

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

    if (registrations && index >= 0) {
      registrations.splice(index, 1);
    }

    if (!registrations?.length) {
      registryStacks.delete(this.registeredId);

      registry.delete(this.registeredId);
    } else {
      const previous = registrations[registrations.length - 1];

      if (previous) {
        registry.set(this.registeredId, previous);
      }
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

  private get backdrop(): HTMLElement {
    return this.elements.backdrop;
  }

  private get closeButton(): HTMLButtonElement {
    return this.elements.closeButton;
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
  if (typeof customElements === 'undefined') {
    return;
  }

  if (customElements.get(tagName)) {
    return;
  }

  const WidgetElement = tagName === 'context7-widget' ? Context7WidgetElement : class extends Context7WidgetElement {};

  customElements.define(tagName, WidgetElement);
}

function installGlobalApi(): void {
  if (globalApiInstalled || typeof window === 'undefined') {
    return;
  }

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
    send: async (message: string, widgetId?: string) => await resolveWidget(widgetId)?.send(message),
    toggle: (widgetId?: string) => resolveWidget(widgetId)?.toggle()
  };

  window.Context7Widget = api;
  globalApiInstalled = true;
}

function resolveWidget(widgetId?: string): Context7WidgetElement | undefined {
  if (widgetId) {
    return registry.get(widgetId);
  }

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

    if (value) {
      return value.trim();
    }
  }

  return '';
}

function readBooleanAttribute(
  element: HTMLElement,
  defaultValue: boolean | undefined,
  ...names: string[]
): boolean | undefined {
  for (const name of names) {
    if (!element.hasAttribute(name)) {
      continue;
    }

    const value = element.getAttribute(name);

    if (isFalseyAttribute(value)) {
      return false;
    }

    if (isTruthyAttribute(value)) {
      return true;
    }

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
    if (!element.hasAttribute(name)) {
      element.setAttribute(name, '');
    }

    return;
  }

  element.removeAttribute(name);
}

function syncStyleProperty(element: HTMLElement, name: string, value: string): void {
  if (value) {
    element.style.setProperty(name, value);

    return;
  }

  element.style.removeProperty(name);
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

function requireElement<ElementType extends Element>(root: ShadowRoot | HTMLElement, selector: string): ElementType {
  const element = root.querySelector<ElementType>(selector);

  if (!element) {
    throw new Error(`Context7 widget template is missing ${selector}.`);
  }

  return element;
}

function adoptSharedWidgetStyles(root: ShadowRoot): boolean {
  if (sharedWidgetStyleSheet === false) {
    return false;
  }

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

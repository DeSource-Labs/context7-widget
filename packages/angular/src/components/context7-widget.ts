import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
  viewChild,
  type AfterViewInit,
  type OnChanges,
  type OnDestroy,
  type SimpleChanges
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import {
  CONTEXT7_URL,
  DESOURCE_LABS_URL,
  acquireContext7Modal,
  buildContext7ErrorHtml,
  callContext7ListenerSafely,
  cancelRenderFrame,
  captureTriggerAccessibility,
  compactContext7WidgetOptions,
  createContext7CompletedMarkdownRenderer,
  createContext7CopyActionController,
  createContext7ConversationEngine,
  createContext7ConversationRenderBridge,
  deSourceLabsLogoUrl,
  formatContext7ToolResult,
  getContext7ToolQuery,
  isContext7WidgetTriggerElement,
  mergeContext7WidgetOptions,
  normalizeContext7WidgetTrigger,
  renderMarkdown,
  requestRenderFrame,
  resolveContext7CustomTrigger,
  resolveContext7MarkdownBaseUrl,
  resolveContext7WidgetConfig,
  restoreTriggerAccessibility,
  syncContext7CopyButton,
  trapFocus,
  updateAnchorPosition as updateContext7AnchorPosition,
  type Context7ConversationEngine,
  type Context7ConversationEvent,
  type Context7ConversationRenderBridge,
  type Context7ConversationState,
  type Context7Message,
  type Context7RenderedErrorHtml,
  type Context7ToolCall,
  type Context7ToolResult,
  type Context7TriggerA11yState,
  type Context7WidgetAnswerCompleteEventDetail,
  type Context7WidgetAnswerEventDetail,
  type Context7WidgetCancelEventDetail,
  type Context7WidgetErrorEventDetail,
  type Context7WidgetLifecycleEventDetail,
  type Context7WidgetOptions,
  type Context7WidgetQuestionEventDetail,
  type Context7WidgetSendResult,
  type Context7WidgetToolCallEventDetail,
  type Context7WidgetToolResultEventDetail
} from '@desource/context7-widget/kit';
import { Context7WidgetTrigger } from '../directives/context7-widget-trigger';
import { registerAngularContext7Widget, unregisterAngularContext7Widget } from '../internal/registry';
import { CONTEXT7_WIDGET_DEFAULTS } from '../provider';
import type {
  Context7AngularCustomTrigger,
  Context7WidgetHandle,
  Context7WidgetStateListener,
  DisplayItem,
  MessageDisplayItem
} from '../types';

const STICKY_SCROLL_THRESHOLD = 48;
const QUEUED_SCROLL_FRAME = -1;
let browserInstanceCounter = 0;

type AngularAnswerRender = {
  answer: string;
  answerItemId: string | undefined;
  renderFrame: number | null;
};

type CopyActionKey = HTMLButtonElement | string;

@Component({
  selector: 'context7-angular-widget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'context7-widget',
    '[attr.backdrop-active]': "resolvedConfig().backdrop ? '' : null",
    '[attr.close-on-outside-click]': 'resolvedCloseOnOutsideClick()',
    '[attr.color]': 'resolvedConfig().color || null',
    '[attr.custom-trigger]': 'customTriggerSelector()',
    '[attr.custom-trigger-active]': "hasCustomTrigger() ? '' : null",
    '[attr.default-open]': 'resolvedConfig().defaultOpen',
    '[attr.launcher-variant]': 'resolvedConfig().launcherVariant',
    '[attr.library]': 'resolvedLibrary()',
    '[attr.open]': "isOpen() ? '' : null",
    '[attr.panel-height]': 'resolvedConfig().panelHeight || null',
    '[attr.panel-width]': 'resolvedConfig().panelWidth || null',
    '[attr.position]': 'resolvedPosition()',
    '[attr.preset]': 'resolvedConfig().preset',
    '[attr.theme]': 'resolvedConfig().theme',
    '[attr.widget-id]': 'resolvedConfig().widgetId',
    '[style.--c7-accent]': 'resolvedConfig().color || null',
    '[style.--c7-panel-height]': 'resolvedConfig().panelHeight || null',
    '[style.--c7-panel-width]': 'resolvedConfig().panelWidth || null',
    '(keydown)': 'onKeyDown($event)'
  },
  template: `
    <div class="c7-backdrop" data-c7-backdrop part="backdrop" aria-hidden="true" (click)="onBackdropClick()"></div>

    @if (rendersManagedTrigger()) {
      <button
        #managedTrigger
        class="context7-widget-trigger"
        type="button"
        [id]="managedTriggerId()"
        [attr.aria-controls]="panelId()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="resolvedConfig().launcherLabel"
        aria-haspopup="dialog"
        [attr.data-preset]="resolvedConfig().preset"
        [attr.data-theme]="resolvedConfig().theme"
        (click)="openFrom($event.currentTarget)"
      >
        @if (triggerContent()) {
          <ng-content select="[context7WidgetTrigger]" />
        } @else {
          {{ resolvedConfig().launcherLabel }}
        }
      </button>
    }

    <section
      #panel
      class="c7-panel"
      part="panel"
      role="dialog"
      [id]="panelId()"
      [attr.aria-label]="resolvedConfig().title"
      [attr.aria-busy]="busy()"
      [attr.aria-modal]="resolvedPosition() === 'center'"
    >
      <header class="c7-header" part="header">
        <div class="c7-title" part="title">{{ resolvedConfig().title }}</div>
        <button
          class="c7-close"
          part="close-button"
          type="button"
          [attr.aria-label]="resolvedLabels().close"
          (click)="close()"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div
        #messagesElement
        class="c7-messages"
        part="messages"
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        [attr.aria-label]="resolvedLabels().conversation"
        (click)="onDelegatedCopyClick($event)"
        (scroll)="onMessagesScroll()"
      >
        @for (item of displayItems(); track item.id) {
          @if (item.kind === 'message') {
            <div
              class="c7-message"
              [class.c7-message--assistant]="item.role === 'assistant'"
              [class.c7-message--user]="item.role === 'user'"
              [attr.part]="'message ' + item.role + '-message'"
            >
              @if (item.role === 'assistant' && !item.streaming) {
                <div [innerHTML]="renderCompletedMarkdown(item)"></div>
                <button
                  class="c7-copy-answer"
                  data-c7-copy-answer
                  type="button"
                  [attr.aria-disabled]="copiedAnswerIds().has(item.id) ? 'true' : null"
                  [attr.aria-label]="
                    copiedAnswerIds().has(item.id) ? resolvedLabels().copied : resolvedLabels().copyAnswer
                  "
                  [attr.data-c7-copied]="copiedAnswerIds().has(item.id) ? '' : null"
                  [title]="copiedAnswerIds().has(item.id) ? resolvedLabels().copied : resolvedLabels().copyAnswer"
                  (click)="copyAnswer($event, item)"
                >
                  <svg
                    class="c7-copy-icon"
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <path class="c7-copy-icon--copy" d="M5 5h9v9H5zM2 11V2h9"></path>
                    <path class="c7-copy-icon--copied" d="m3 8 3 3 7-7"></path>
                  </svg>
                  <span aria-live="polite" class="c7-copy-status">{{
                    copiedAnswerIds().has(item.id) ? resolvedLabels().copied : ''
                  }}</span>
                </button>
              } @else {
                <div>{{ item.content }}</div>
              }
            </div>
          } @else if (item.kind === 'error') {
            <div class="c7-message c7-message--error" part="message error-message" role="alert">
              <div [innerHTML]="trustedErrorHtml(item.html)"></div>
              <button class="c7-retry" type="button" (click)="retryError(item.id)">{{ resolvedLabels().retry }}</button>
            </div>
          } @else {
            <div class="c7-tool-call" part="tool-call">
              <div class="c7-tool-header">
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span>{{ resolvedLabels().searching }}: {{ item.query }}</span>
                @if (!item.hasResult) {
                  <svg
                    class="c7-spinner"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                }
              </div>
              @if (item.hasResult) {
                <div class="c7-tool-result">
                  <button
                    class="c7-tool-toggle"
                    part="tool-toggle"
                    type="button"
                    [attr.aria-controls]="item.contentId"
                    [attr.aria-expanded]="item.expanded"
                    (click)="toggleTool(item.id)"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                    <span>{{ item.expanded ? resolvedLabels().hideResults : resolvedLabels().viewResults }}</span>
                  </button>
                  <div
                    class="c7-tool-content"
                    role="region"
                    [hidden]="!item.expanded"
                    [id]="item.contentId"
                    [attr.aria-label]="resolvedLabels().searchResults"
                  >
                    <pre>{{ item.result }}</pre>
                  </div>
                </div>
              }
            </div>
          }
        }

        @if (showTyping()) {
          <div class="c7-typing" part="typing" role="status" [attr.aria-label]="resolvedLabels().responding">
            <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
          </div>
        }
      </div>

      <form class="c7-composer" part="composer" (submit)="onSubmit($event)">
        <textarea
          #inputElement
          class="c7-input"
          part="input"
          autocomplete="off"
          rows="1"
          [value]="draft()"
          [readOnly]="busy()"
          [placeholder]="resolvedConfig().placeholder"
          [attr.aria-label]="resolvedLabels().input"
          (input)="onDraftInput($event)"
        ></textarea>
        <button
          #sendButton
          class="c7-send"
          part="send-button"
          type="submit"
          [attr.aria-label]="busy() ? resolvedLabels().stopResponse : resolvedLabels().sendQuestion"
        >
          {{ busy() ? resolvedLabels().stop : resolvedLabels().send }}
        </button>
      </form>

      <footer class="c7-footer" part="footer">
        <span class="c7-branding" part="powered-by" [attr.aria-label]="resolvedLabels().branding">
          <a
            class="c7-brand-link"
            [href]="context7Url"
            target="_blank"
            rel="noopener noreferrer"
            [attr.aria-label]="resolvedLabels().context7Attribution"
            [title]="resolvedLabels().context7Attribution"
          >
            <span class="c7-brand-prefix">{{ resolvedLabels().poweredBy }}</span>
            <svg
              class="c7-brand-logo c7-brand-logo--context7"
              aria-hidden="true"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="28" height="28" rx="4" fill="currentColor"></rect>
              <path
                d="M10.5724 15.2565C10.5724 17.5025 9.6613 19.3778 8.17805 21.1047H11.6319L11.6319 22.7786H6.33459V21.1895C7.95557 19.3566 8.58065 17.8628 8.58065 15.2565L10.5724 15.2565Z"
                fill="var(--c7-footer-background, #000000)"
              ></path>
              <path
                d="M17.4276 15.2565C17.4276 17.5025 18.3387 19.3778 19.822 21.1047H16.3681V22.7786H21.6654V21.1895C20.0444 19.3566 19.4194 17.8628 19.4194 15.2565H17.4276Z"
                fill="var(--c7-footer-background, #000000)"
              ></path>
              <path
                d="M10.5724 12.7435C10.5724 10.4975 9.66131 8.62224 8.17807 6.89532L11.6319 6.89532V5.22137L6.33461 5.22137V6.81056C7.95558 8.64343 8.58066 10.1373 8.58066 12.7435L10.5724 12.7435Z"
                fill="var(--c7-footer-background, #000000)"
              ></path>
              <path
                d="M17.4276 12.7435C17.4276 10.4975 18.3387 8.62224 19.822 6.89532L16.3681 6.89532L16.3681 5.22138L21.6654 5.22138V6.81056C20.0445 8.64343 19.4194 10.1373 19.4194 12.7435H17.4276Z"
                fill="var(--c7-footer-background, #000000)"
              ></path>
            </svg>
          </a>
          <span class="c7-brand-separator" aria-hidden="true">·</span>
          <a
            class="c7-brand-link"
            [href]="deSourceLabsUrl"
            target="_blank"
            rel="noopener noreferrer"
            [attr.aria-label]="resolvedLabels().deSourceLabsAttribution"
            [title]="resolvedLabels().deSourceLabsAttribution"
          >
            <span class="c7-brand-prefix">{{ resolvedLabels().enhancedBy }}</span>
            <img class="c7-brand-logo c7-brand-logo--desource" [src]="deSourceLabsLogo" alt="" />
          </a>
        </span>
      </footer>
    </section>

    @if (!hasCustomTrigger()) {
      <button
        #launcher
        class="c7-launcher"
        part="launcher"
        type="button"
        aria-haspopup="dialog"
        [attr.aria-controls]="panelId()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-label]="resolvedConfig().launcherLabel"
        (click)="openFrom($event.currentTarget)"
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
          <path d="M8 9h8" />
          <path d="M8 13h6" />
          <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
        </svg>
        <span class="c7-launcher-label">{{ resolvedConfig().launcherLabel }}</span>
      </button>
    }

    <ng-content />
  `
})
export class Context7Widget implements AfterViewInit, OnChanges, OnDestroy, Context7WidgetHandle {
  readonly backdrop = input<boolean | undefined, unknown>(undefined, { transform: optionalBooleanAttribute });
  readonly closeOnOutsideClick = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute
  });
  readonly color = input<string>();
  readonly customTrigger = input<Context7AngularCustomTrigger>();
  readonly defaultOpen = input<boolean | undefined, unknown>(undefined, { transform: optionalBooleanAttribute });
  readonly initialMessage = input<string>();
  readonly labels = input<Context7WidgetOptions['labels']>();
  readonly launcherLabel = input<string>();
  readonly launcherVariant = input<Context7WidgetOptions['launcherVariant']>();
  readonly library = input<string>();
  readonly linkBaseUrl = input<string>();
  readonly panelHeight = input<string>();
  readonly panelWidth = input<string>();
  readonly placeholder = input<string>();
  readonly position = input<Context7WidgetOptions['position']>();
  readonly preset = input<Context7WidgetOptions['preset']>();
  readonly theme = input<Context7WidgetOptions['theme']>();
  readonly title = input<string>();
  readonly widgetId = input<string>();
  readonly controlledOpen = input<boolean | undefined, unknown>(undefined, {
    alias: 'open',
    transform: optionalBooleanAttribute
  });

  readonly openChange = output<boolean>();
  readonly ready = output<Context7WidgetLifecycleEventDetail>();
  readonly opened = output<Context7WidgetLifecycleEventDetail>();
  readonly closed = output<Context7WidgetLifecycleEventDetail>();
  readonly cancelled = output<Context7WidgetCancelEventDetail>();
  readonly question = output<Context7WidgetQuestionEventDetail>();
  readonly firstToken = output<Context7WidgetAnswerEventDetail>();
  readonly answer = output<Context7WidgetAnswerEventDetail>();
  readonly answerComplete = output<Context7WidgetAnswerCompleteEventDetail>();
  readonly toolCall = output<Context7WidgetToolCallEventDetail>();
  readonly toolResult = output<Context7WidgetToolResultEventDetail>();
  readonly error = output<Context7WidgetErrorEventDetail>();

  private readonly openState = signal(false);
  private readonly busyState = signal(false);
  private readonly messageState = signal<readonly Context7Message[]>([]);
  readonly isOpen = this.openState.asReadonly();
  readonly busy = this.busyState.asReadonly();
  readonly messages = this.messageState.asReadonly();

  protected readonly context7Url = CONTEXT7_URL;
  protected readonly deSourceLabsUrl = DESOURCE_LABS_URL;
  protected readonly deSourceLabsLogo = deSourceLabsLogoUrl;
  protected readonly draft = signal('');
  protected readonly displayItems = signal<DisplayItem[]>([]);
  protected readonly copiedAnswerIds = signal<ReadonlySet<string>>(new Set());
  protected readonly showTyping = signal(false);
  protected readonly panelId = signal('');
  protected readonly managedTriggerId = signal('');

  private readonly defaults = inject(CONTEXT7_WIDGET_DEFAULTS);
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  protected readonly inputElement = viewChild<ElementRef<HTMLTextAreaElement>>('inputElement');
  protected readonly sendButton = viewChild<ElementRef<HTMLButtonElement>>('sendButton');
  protected readonly launcher = viewChild<ElementRef<HTMLButtonElement>>('launcher');
  protected readonly managedTrigger = viewChild<ElementRef<HTMLButtonElement>>('managedTrigger');
  protected readonly messagesElement = viewChild<ElementRef<HTMLElement>>('messagesElement');
  protected readonly triggerContent = contentChild(Context7WidgetTrigger);
  protected readonly resolvedConfig = computed(() => {
    const defaultOptions = compactContext7WidgetOptions({
      ...this.defaults,
      customTrigger: undefined
    } as Partial<Context7WidgetOptions>);
    const provided = compactContext7WidgetOptions({
      backdrop: this.backdrop(),
      closeOnOutsideClick: this.closeOnOutsideClick(),
      color: this.color(),
      defaultOpen: this.defaultOpen(),
      initialMessage: this.initialMessage(),
      labels: this.labels(),
      launcherLabel: this.launcherLabel(),
      launcherVariant: this.launcherVariant(),
      library: this.library(),
      linkBaseUrl: this.linkBaseUrl(),
      panelHeight: this.panelHeight(),
      panelWidth: this.panelWidth(),
      placeholder: this.placeholder(),
      position: this.position(),
      preset: this.preset(),
      theme: this.theme(),
      title: this.title(),
      widgetId: this.widgetId()
    });
    return resolveContext7WidgetConfig(mergeContext7WidgetOptions(defaultOptions, provided));
  });
  protected readonly resolvedLibrary = computed(() => this.resolvedConfig().library);
  protected readonly resolvedPosition = computed(() => this.resolvedConfig().position);
  protected readonly resolvedCloseOnOutsideClick = computed(() => this.resolvedConfig().closeOnOutsideClick);
  protected readonly resolvedLabels = computed(() => this.resolvedConfig().labels);
  private readonly resolvedMarkdownBaseUrl = computed(() =>
    resolveContext7MarkdownBaseUrl(this.resolvedLibrary(), this.resolvedConfig().linkBaseUrl)
  );
  private readonly resolvedCustomTrigger = computed(() =>
    normalizeAngularCustomTrigger(this.customTrigger() ?? this.defaults.customTrigger)
  );
  protected readonly rendersManagedTrigger = computed(() => this.resolvedCustomTrigger() === true);
  private readonly hasBoundExternalTrigger = signal(false);
  protected readonly hasCustomTrigger = computed(() => this.rendersManagedTrigger() || this.hasBoundExternalTrigger());
  protected readonly customTriggerSelector = computed(() => {
    const trigger = this.resolvedCustomTrigger();
    if (trigger === true) return this.managedTriggerId() ? `#${this.managedTriggerId()}` : null;
    return typeof trigger === 'string' ? normalizeContext7WidgetTrigger(trigger) || null : null;
  });

  private readonly stateListeners = new Set<Context7WidgetStateListener>();
  private readonly renderCompletedMarkdownCached = createContext7CompletedMarkdownRenderer<SafeHtml>(
    (markdown, options) => this.sanitizer.bypassSecurityTrustHtml(renderMarkdown(markdown, options))
  );
  private readonly errorHtmlCache = new Map<string, SafeHtml>();
  private readonly engine: Context7ConversationEngine;
  private readonly renderBridge: Context7ConversationRenderBridge<AngularAnswerRender>;
  private readonly unsubscribeEngineState: () => void;
  private readonly unsubscribeEngineEvents: () => void;
  private readonly copyActions = createContext7CopyActionController<CopyActionKey>({
    onChange: (key, copied) => {
      if (typeof key === 'string') {
        const next = new Set(this.copiedAnswerIds());
        if (copied) next.add(key);
        else next.delete(key);
        this.copiedAnswerIds.set(next);
        return;
      }
      syncContext7CopyButton(key, copied, this.resolvedLabels().copyCode, this.resolvedLabels().copied);
    }
  });

  private initialized = false;
  private messageCounter = 0;
  private customTriggerObserver: MutationObserver | null = null;
  private customTriggerSelectorInvalid = false;
  private customTriggerWarningKey = '';
  private externalTrigger: Element | null = null;
  private externalTriggerAccessibility: Context7TriggerA11yState | null = null;
  private activeAnchor: Element | null = null;
  private floatingLayoutFrame: number | null = null;
  private floatingResizeObserver: ResizeObserver | null = null;
  private floatingViewport: VisualViewport | null = null;
  private lastFocus: Element | null = null;
  private releaseModal: (() => void) | null = null;
  private registeredWidgetId = '';
  private shouldStickToBottom = true;
  private scrollFrame: number | null = null;
  private scrollGeneration = 0;

  constructor() {
    this.engine = createContext7ConversationEngine({
      missingLibraryMessage: () => this.resolvedLabels().missingLibrary,
      nextMessageId: () => this.nextMessageId(),
      resolveConfig: () => ({ library: this.resolvedLibrary() })
    });
    this.renderBridge = createContext7ConversationRenderBridge<AngularAnswerRender>({
      clearAnswer: (render) => cancelRenderFrame(render.renderFrame),
      discardAnswer: (render) => {
        cancelRenderFrame(render.renderFrame);
        if (render.answerItemId) {
          this.displayItems.update((items) => items.filter((item) => item.id !== render.answerItemId));
        }
      },
      emit: (event) => this.emitConversationEvent(event),
      flushAnswer: (render, event) => this.flushAnswerRender(render, event.detail.answer),
      onAnswer: (event, render) => this.renderAnswer(event, render),
      onError: (event) => {
        this.displayItems.update((items) => [
          ...items,
          {
            html: buildContext7ErrorHtml(
              String(event.detail.error || this.resolvedLabels().errorFallback),
              this.resolvedLibrary(),
              this.resolvedLabels()
            ),
            id: this.nextMessageId(),
            kind: 'error',
            question: event.detail.question
          }
        ]);
        this.scrollToBottom();
      },
      onQuestion: (event) => {
        if (!event.detail.retry) {
          this.displayItems.update((items) => [...items, { ...event.detail.message, kind: 'message' }]);
        }
        this.showTyping.set(true);
        this.scrollToBottom();
        return { answer: '', answerItemId: undefined, renderFrame: null };
      },
      onToolCall: (event) => {
        this.showTyping.set(false);
        this.appendToolCall(event.detail.toolCall);
      },
      onToolResult: (event) => this.updateToolResult(event.detail.toolResult)
    });
    this.unsubscribeEngineState = this.engine.subscribe((state) => this.onConversationState(state), {
      includeTransient: false
    });
    this.unsubscribeEngineEvents = this.engine.subscribeEvents((event) => this.renderBridge.handleEvent(event));
  }

  get element(): HTMLElement | null {
    return this.host.nativeElement;
  }

  ngAfterViewInit(): void {
    if (!this.browser) return;
    const instanceId = ++browserInstanceCounter;
    this.panelId.set(`context7-widget-panel-${instanceId}`);
    this.managedTriggerId.set(`context7-widget-trigger-${instanceId}`);
    this.initialized = true;
    this.reset();
    this.bindExternalTrigger();
    this.register();
    this.ready.emit(this.detail());
    const requestedOpen = this.controlledOpen();
    if (requestedOpen !== undefined) this.commitOpen(requestedOpen);
    else if (this.resolvedConfig().defaultOpen) this.open();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized || !this.browser) return;
    if (changes['library'] || changes['initialMessage']) this.reset();
    if (changes['customTrigger']) {
      this.bindExternalTrigger();
      this.activeAnchor = null;
    }
    if (changes['controlledOpen']) {
      const value = this.controlledOpen();
      if (value !== undefined) this.commitOpen(value);
    }
    if (changes['defaultOpen'] && this.controlledOpen() === undefined && this.resolvedConfig().defaultOpen) {
      this.open();
    }
    if (changes['position']) this.syncPositionBehavior();
    if (changes['closeOnOutsideClick'] && this.isOpen()) this.bindFloatingListeners();
    if (changes['widgetId']) this.register();
  }

  ngOnDestroy(): void {
    this.engine.cancel();
    this.cancelScheduledScroll();
    this.copyActions.reset(false);
    this.unsubscribeEngineState();
    this.unsubscribeEngineEvents();
    if (this.browser) {
      this.unbindFloatingListeners();
      this.unbindExternalTrigger();
      this.releaseModalState();
    }
    this.stateListeners.clear();
    if (this.registeredWidgetId) unregisterAngularContext7Widget(this.registeredWidgetId, this);
  }

  open(): void {
    if (this.isOpen()) return;
    this.openChange.emit(true);
    if (this.controlledOpen() === undefined) this.commitOpen(true);
  }

  close(): void {
    if (!this.isOpen()) return;
    this.openChange.emit(false);
    if (this.controlledOpen() === undefined) this.commitOpen(false);
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  cancel(): void {
    this.engine.cancel();
    this.focusInput();
  }

  reset(): void {
    this.engine.reset();
    this.renderBridge.clearActiveAnswer();
    this.copyActions.reset(false);
    this.copiedAnswerIds.set(new Set());
    this.errorHtmlCache.clear();
    const intro = this.resolvedConfig().initialMessage.replace(
      /\{library\}/g,
      this.resolvedLibrary() || this.resolvedLabels().libraryFallback
    );
    this.displayItems.set([{ content: intro, id: this.nextMessageId(), kind: 'message', role: 'assistant' }]);
    this.cancelScheduledScroll();
    this.shouldStickToBottom = true;
    this.scrollToBottom();
  }

  async retry(): Promise<Context7WidgetSendResult> {
    this.open();
    const result = await this.engine.retry();
    if (!this.busy()) this.focusInput();
    return result;
  }

  async send(rawQuestion: string): Promise<Context7WidgetSendResult> {
    const question = rawQuestion.trim();
    if (question && !this.busy() && this.resolvedLibrary()) {
      this.open();
      this.draft.set('');
      this.resizeInput();
    }
    const result = await this.engine.send(question);
    if (!this.busy()) this.focusInput();
    return result;
  }

  isBusy(): boolean {
    return this.busy();
  }

  getMessages(): readonly Context7Message[] {
    return this.engine.getMessages();
  }

  subscribe(listener: Context7WidgetStateListener): () => void {
    this.stateListeners.add(listener);
    callContext7ListenerSafely(listener, {
      busy: this.busy(),
      messages: this.getMessages(),
      open: this.isOpen()
    });
    return () => this.stateListeners.delete(listener);
  }

  protected openFrom(target: EventTarget | null): void {
    if (target instanceof Element) this.activeAnchor = target;
    this.toggle();
  }

  protected onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    if (this.busy()) this.cancel();
    else void this.send(this.draft());
  }

  protected onDraftInput(event: Event): void {
    const element = event.currentTarget;
    if (!(element instanceof HTMLTextAreaElement)) return;
    this.draft.set(element.value);
    this.resizeInput();
  }

  protected onBackdropClick(): void {
    if (this.resolvedCloseOnOutsideClick()) this.close();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.isOpen()) {
      event.preventDefault();
      this.close();
      return;
    }
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.isComposing &&
      event.target === this.inputElement()?.nativeElement &&
      !this.busy()
    ) {
      event.preventDefault();
      void this.send(this.draft());
      return;
    }
    if (event.key === 'Tab' && this.isOpen() && this.resolvedPosition() === 'center') {
      const panel = this.panel()?.nativeElement;
      if (panel) trapFocus(event, panel);
    }
  }

  protected renderCompletedMarkdown(item: MessageDisplayItem): SafeHtml {
    return this.renderCompletedMarkdownCached(item, {
      baseUrl: this.resolvedMarkdownBaseUrl(),
      copyCodeLabel: this.resolvedLabels().copyCode
    });
  }

  protected trustedErrorHtml(html: Context7RenderedErrorHtml): SafeHtml {
    const cached = this.errorHtmlCache.get(html);
    if (cached) return cached;
    const trusted = this.sanitizer.bypassSecurityTrustHtml(html);
    this.errorHtmlCache.set(html, trusted);
    return trusted;
  }

  protected copyAnswer(event: Event, item: MessageDisplayItem): void {
    event.stopPropagation();
    void this.copyActions.copy(item.id, item.content);
  }

  protected onDelegatedCopyClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-c7-copy-code]');
    const messages = this.messagesElement()?.nativeElement;
    if (!button || !messages?.contains(button)) return;
    event.stopPropagation();
    const code = button.closest('.c7-code-block')?.querySelector('code')?.textContent ?? '';
    void this.copyActions.copy(button, code);
  }

  protected retryError(id: string): void {
    this.displayItems.update((items) => items.filter((item) => item.id !== id));
    void this.retry();
  }

  protected toggleTool(id: string): void {
    this.displayItems.update((items) =>
      items.map((item) => (item.id === id && item.kind === 'tool' ? { ...item, expanded: !item.expanded } : item))
    );
  }

  protected onMessagesScroll(): void {
    const element = this.messagesElement()?.nativeElement;
    if (!element) return;
    const wasSticky = this.shouldStickToBottom;
    this.shouldStickToBottom =
      element.scrollHeight - element.clientHeight - element.scrollTop <= STICKY_SCROLL_THRESHOLD;
    if (!wasSticky && this.shouldStickToBottom) this.scrollToBottom();
  }

  private commitOpen(value: boolean): void {
    if (this.isOpen() === value) return;
    if (!value) {
      this.openState.set(false);
      this.syncExternalTriggerExpandedState();
      this.unbindFloatingListeners();
      this.releaseModalState();
      this.closed.emit(this.detail());
      this.notifyState();
      if (this.lastFocus instanceof HTMLElement && this.lastFocus.isConnected) this.lastFocus.focus();
      return;
    }
    this.lastFocus = this.document.activeElement;
    this.openState.set(true);
    this.syncModalState();
    this.syncExternalTriggerExpandedState();
    this.bindFloatingListeners();
    this.opened.emit(this.detail());
    this.notifyState();
    requestRenderFrame(() => {
      this.updateAnchorPosition();
      if (this.isOpen()) this.focusInput();
    });
  }

  private detail(): Context7WidgetLifecycleEventDetail {
    return {
      library: this.resolvedLibrary(),
      widget: this.host.nativeElement,
      widgetId: this.resolvedConfig().widgetId
    };
  }

  private nextMessageId(): string {
    this.messageCounter += 1;
    return `c7m-${this.messageCounter}`;
  }

  private onConversationState(state: Context7ConversationState): void {
    const moveFocus = this.browser && state.busy && this.document.activeElement === this.inputElement()?.nativeElement;
    this.busyState.set(state.busy);
    this.messageState.set(state.messages);
    if (!state.busy) {
      this.showTyping.set(false);
      this.renderBridge?.clearActiveAnswer();
    }
    this.notifyState(state.messages);
    if (moveFocus) this.sendButton()?.nativeElement.focus({ preventScroll: true });
  }

  private emitConversationEvent(event: Context7ConversationEvent): void {
    const base = this.detail();
    switch (event.type) {
      case 'c7:cancel':
        this.cancelled.emit({ ...base, ...event.detail });
        break;
      case 'c7:question':
        this.question.emit({ ...base, ...event.detail });
        break;
      case 'c7:first-token':
        this.firstToken.emit({ ...base, ...event.detail });
        break;
      case 'c7:answer':
        this.answer.emit({ ...base, ...event.detail });
        break;
      case 'c7:answer-complete':
        this.answerComplete.emit({ ...base, ...event.detail });
        break;
      case 'c7:tool-call':
        this.toolCall.emit({ ...base, ...event.detail });
        break;
      case 'c7:tool-result':
        this.toolResult.emit({ ...base, ...event.detail });
        break;
      case 'c7:error':
        this.error.emit({ ...base, ...event.detail });
        break;
    }
  }

  private renderAnswer(event: Context7ConversationEvent<'c7:answer'>, render: AngularAnswerRender): void {
    this.showTyping.set(false);
    render.answer = event.detail.answer;
    if (!render.answerItemId) {
      render.answerItemId = this.nextMessageId();
      this.displayItems.update((items) => [
        ...items,
        { content: '', id: render.answerItemId!, kind: 'message', role: 'assistant', streaming: true }
      ]);
    }
    render.renderFrame ??= requestRenderFrame(() => {
      render.renderFrame = null;
      const answerId = render.answerItemId;
      this.displayItems.update((items) =>
        items.map((item) =>
          item.id === answerId && item.kind === 'message' ? { ...item, content: render.answer } : item
        )
      );
      this.scrollToBottom();
    });
  }

  private flushAnswerRender(render: AngularAnswerRender, answer: string): void {
    cancelRenderFrame(render.renderFrame);
    render.renderFrame = null;
    const answerId = render.answerItemId;
    if (!answerId) return;
    this.displayItems.update((items) =>
      items.map((item) =>
        item.id === answerId && item.kind === 'message' ? { ...item, content: answer, streaming: false } : item
      )
    );
    this.scrollToBottom();
  }

  private appendToolCall(toolCall: Context7ToolCall): void {
    const id = this.nextMessageId();
    this.displayItems.update((items) => [
      ...items,
      {
        contentId: `${this.panelId()}-${id}-tool-result`,
        expanded: false,
        hasResult: false,
        id,
        kind: 'tool',
        query: getContext7ToolQuery(toolCall),
        result: '',
        toolCallId: toolCall.toolCallId
      }
    ]);
    this.scrollToBottom();
  }

  private updateToolResult(toolResult: Context7ToolResult): void {
    const result = formatContext7ToolResult(toolResult.result);
    if (result) {
      this.displayItems.update((items) =>
        items.map((item) =>
          item.kind === 'tool' && item.toolCallId === toolResult.toolCallId
            ? { ...item, hasResult: true, result }
            : item
        )
      );
    }
    this.scrollToBottom();
  }

  private notifyState(messages = this.getMessages()): void {
    if (this.stateListeners.size === 0) return;
    const state = { busy: this.busy(), messages, open: this.isOpen() } as const;
    for (const listener of this.stateListeners) callContext7ListenerSafely(listener, state);
  }

  private scrollToBottom(): void {
    if (!this.shouldStickToBottom || this.scrollFrame !== null) return;
    this.scrollFrame = QUEUED_SCROLL_FRAME;
    const generation = this.scrollGeneration;
    queueMicrotask(() => {
      if (generation !== this.scrollGeneration) return;
      this.scrollFrame = requestRenderFrame(() => {
        if (generation !== this.scrollGeneration) return;
        this.scrollFrame = null;
        const element = this.messagesElement()?.nativeElement;
        if (this.shouldStickToBottom && element) element.scrollTop = element.scrollHeight;
      });
    });
  }

  private cancelScheduledScroll(): void {
    this.scrollGeneration += 1;
    if (this.scrollFrame !== QUEUED_SCROLL_FRAME) cancelRenderFrame(this.scrollFrame);
    this.scrollFrame = null;
  }

  private resizeInput(): void {
    const element = this.inputElement()?.nativeElement;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${Math.min(element.scrollHeight, 84)}px`;
  }

  private focusInput(): void {
    this.inputElement()?.nativeElement.focus({ preventScroll: true });
  }

  private bindExternalTrigger(): void {
    this.unbindExternalTrigger();
    this.customTriggerSelectorInvalid = false;
    const trigger = normalizeExternalTrigger(this.resolvedCustomTrigger());
    if (!trigger) return;
    const resolution = resolveContext7CustomTrigger(trigger, false);
    this.customTriggerSelectorInvalid = resolution.invalidSelector;
    if (resolution.element?.isConnected) {
      this.externalTrigger = resolution.element;
      this.externalTrigger.addEventListener('click', this.onExternalTriggerClick);
      this.externalTriggerAccessibility = captureTriggerAccessibility(this.externalTrigger);
      this.externalTrigger.setAttribute('aria-controls', this.panelId());
      this.externalTrigger.setAttribute('aria-haspopup', 'dialog');
      this.externalTrigger.setAttribute('aria-expanded', String(this.isOpen()));
      this.hasBoundExternalTrigger.set(true);
      this.customTriggerWarningKey = '';
    } else {
      this.warnExternalTriggerBindingFailure(trigger, resolution.invalidSelector);
    }
    this.observeExternalTrigger();
  }

  private unbindExternalTrigger(): void {
    this.customTriggerObserver?.disconnect();
    this.customTriggerObserver = null;
    if (this.activeAnchor === this.externalTrigger) this.activeAnchor = null;
    this.externalTrigger?.removeEventListener('click', this.onExternalTriggerClick);
    if (this.externalTriggerAccessibility) restoreTriggerAccessibility(this.externalTriggerAccessibility);
    this.externalTriggerAccessibility = null;
    this.externalTrigger = null;
    this.hasBoundExternalTrigger.set(false);
  }

  private readonly onExternalTriggerClick = (event: Event): void => {
    event.preventDefault();
    this.activeAnchor = event.currentTarget as Element;
    this.toggle();
  };

  private syncExternalTriggerExpandedState(): void {
    this.externalTrigger?.setAttribute('aria-expanded', String(this.isOpen()));
  }

  private observeExternalTrigger(): void {
    const trigger = normalizeExternalTrigger(this.resolvedCustomTrigger());
    if (!trigger || this.customTriggerSelectorInvalid || typeof MutationObserver !== 'function') return;
    this.customTriggerObserver = new MutationObserver(() => {
      if (this.externalTrigger?.isConnected) return;
      this.bindExternalTrigger();
      if (this.isOpen()) {
        this.bindFloatingListeners();
        this.updateAnchorPosition();
      }
    });
    this.customTriggerObserver.observe(this.document.documentElement, { childList: true, subtree: true });
  }

  private warnExternalTriggerBindingFailure(trigger: Element | string, invalidSelector: boolean): void {
    const warningKey = isContext7WidgetTriggerElement(trigger) ? 'element' : `selector:${trigger}`;
    if (this.customTriggerWarningKey === warningKey) return;
    this.customTriggerWarningKey = warningKey;
    if (isContext7WidgetTriggerElement(trigger)) {
      console.warn('[Context7 Widget] Custom trigger element is not connected. Keeping the built-in launcher visible.');
    } else if (invalidSelector) {
      console.warn(`[Context7 Widget] Invalid custom trigger selector: ${trigger}`);
    } else {
      console.warn(
        `[Context7 Widget] Custom trigger selector was not found: ${trigger}. Keeping the built-in launcher visible.`
      );
    }
  }

  private readonly onDocumentPointerDown = (event: Event): void => {
    if (!this.isOpen() || !this.resolvedCloseOnOutsideClick()) return;
    const path = event.composedPath();
    if (path.includes(this.host.nativeElement) || (this.externalTrigger && path.includes(this.externalTrigger))) return;
    this.close();
  };

  private readonly onFloatingLayout = (event: Event): void => {
    if (event.type === 'scroll' && event.composedPath().includes(this.host.nativeElement)) return;
    this.scheduleAnchorPositionUpdate();
  };

  private scheduleAnchorPositionUpdate(): void {
    if (!this.isOpen() || this.floatingLayoutFrame !== null) return;
    this.floatingLayoutFrame = requestRenderFrame(() => {
      this.floatingLayoutFrame = null;
      if (this.isOpen()) this.updateAnchorPosition();
    });
  }

  private bindFloatingListeners(): void {
    this.unbindFloatingListeners();
    if (this.resolvedCloseOnOutsideClick()) {
      this.document.addEventListener('pointerdown', this.onDocumentPointerDown, true);
    }
    if (this.resolvedPosition() !== 'anchor') return;
    const view = this.document.defaultView;
    if (!view) return;
    view.addEventListener('resize', this.onFloatingLayout);
    view.addEventListener('scroll', this.onFloatingLayout, true);
    this.floatingViewport = view.visualViewport;
    this.floatingViewport?.addEventListener('resize', this.onFloatingLayout);
    this.floatingViewport?.addEventListener('scroll', this.onFloatingLayout);
    if (typeof ResizeObserver === 'function') {
      this.floatingResizeObserver = new ResizeObserver(() => this.scheduleAnchorPositionUpdate());
      const anchor = this.getAnchorElement();
      if (anchor) this.floatingResizeObserver.observe(anchor);
      const panel = this.panel()?.nativeElement;
      if (panel) this.floatingResizeObserver.observe(panel);
    }
  }

  private unbindFloatingListeners(): void {
    this.document.removeEventListener('pointerdown', this.onDocumentPointerDown, true);
    const view = this.document.defaultView;
    view?.removeEventListener('resize', this.onFloatingLayout);
    view?.removeEventListener('scroll', this.onFloatingLayout, true);
    this.floatingViewport?.removeEventListener('resize', this.onFloatingLayout);
    this.floatingViewport?.removeEventListener('scroll', this.onFloatingLayout);
    this.floatingViewport = null;
    this.floatingResizeObserver?.disconnect();
    this.floatingResizeObserver = null;
    cancelRenderFrame(this.floatingLayoutFrame);
    this.floatingLayoutFrame = null;
  }

  private getAnchorElement(): Element | null {
    return (
      (this.activeAnchor?.isConnected ? this.activeAnchor : null) ??
      this.managedTrigger()?.nativeElement ??
      (this.externalTrigger?.isConnected ? this.externalTrigger : null) ??
      this.launcher()?.nativeElement ??
      null
    );
  }

  private updateAnchorPosition(): void {
    updateContext7AnchorPosition(
      this.resolvedPosition(),
      this.getAnchorElement(),
      this.panel()?.nativeElement,
      this.host.nativeElement.style
    );
  }

  private syncPositionBehavior(): void {
    this.syncModalState();
    this.unbindFloatingListeners();
    if (this.isOpen()) {
      this.bindFloatingListeners();
      this.updateAnchorPosition();
    }
  }

  private releaseModalState(): void {
    this.releaseModal?.();
    this.releaseModal = null;
  }

  private syncModalState(): void {
    this.releaseModalState();
    if (this.isOpen() && this.resolvedPosition() === 'center') {
      this.releaseModal = acquireContext7Modal(this.host.nativeElement);
    }
  }

  private register(): void {
    const widgetId = this.resolvedConfig().widgetId;
    if (this.registeredWidgetId === widgetId) return;
    if (this.registeredWidgetId && this.registeredWidgetId !== widgetId) {
      unregisterAngularContext7Widget(this.registeredWidgetId, this);
    }
    registerAngularContext7Widget(widgetId, this);
    this.registeredWidgetId = widgetId;
  }
}

function optionalBooleanAttribute(value: unknown): boolean | undefined {
  return value === undefined ? undefined : booleanAttribute(value);
}

function normalizeAngularCustomTrigger(
  value: Context7AngularCustomTrigger | null | undefined
): Element | string | true | undefined {
  const resolved = value instanceof ElementRef ? value.nativeElement : value;
  return resolved === true || typeof resolved === 'string' || isContext7WidgetTriggerElement(resolved)
    ? resolved
    : undefined;
}

function normalizeExternalTrigger(trigger: Element | string | true | undefined): Element | string | null {
  if (typeof trigger === 'string') return normalizeContext7WidgetTrigger(trigger) || null;
  return isContext7WidgetTriggerElement(trigger) ? trigger : null;
}

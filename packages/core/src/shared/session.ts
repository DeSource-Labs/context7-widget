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
import { renderMarkdown } from './markdown.js';
import { streamContext7Response, isAbortError } from './transport.js';
import type {
  Context7Message,
  Context7MessageStatus,
  Context7ToolCall,
  Context7ToolResult,
  Context7TriggerA11yState,
  Context7WidgetConfig,
  Context7WidgetEventPayload,
  Context7WidgetSendResult,
  Context7WidgetTrigger
} from '../types.js';

/**
 * Only renderMarkdown() in this module is allowed to produce this type.
 *
 * Component may inject Context7RenderedMarkdown because the
 * markdown renderer escapes arbitrary input and only emits the small,
 * controlled HTML subset supported by Context7.
 */
declare const context7RenderedMarkdownBrand: unique symbol;

export type Context7RenderedMarkdown = string & { readonly [context7RenderedMarkdownBrand]: true };

export type Context7SessionMessageItem =
  | {
      readonly content: string;
      readonly id: string;
      readonly kind: 'message';
      readonly role: 'user';
      readonly status?: Context7MessageStatus;
    }
  | {
      readonly content: string;
      readonly html: Context7RenderedMarkdown;
      readonly id: string;
      readonly kind: 'message';
      readonly role: 'assistant';
      readonly status?: Context7MessageStatus;
    };

export interface Context7SessionErrorItem {
  readonly adminUrl?: string;
  readonly id: string;
  readonly kind: 'error';
  readonly message: string;
}

export interface Context7SessionToolItem {
  readonly contentId: string;
  readonly expanded: boolean;
  readonly hasResult: boolean;
  readonly id: string;
  readonly kind: 'tool';
  readonly query: string;
  readonly result: string;
  readonly toolCallId: string;
}

export type Context7SessionItem = Context7SessionErrorItem | Context7SessionMessageItem | Context7SessionToolItem;

export interface Context7SessionSnapshot {
  readonly busy: boolean;
  readonly customTriggerBound: boolean;
  readonly items: readonly Context7SessionItem[];
  readonly messages: readonly Context7Message[];
  readonly open: boolean;
  readonly typing: boolean;
}

export interface Context7SessionElements {
  readonly input: () => HTMLInputElement | null;
  readonly launcher: () => HTMLElement | null;
  readonly messages: () => HTMLElement | null;
  readonly panel: () => HTMLElement | null;
  readonly root: () => HTMLElement | null;
}

type SessionConfig = Pick<Context7WidgetConfig, 'closeOnOutsideClick' | 'initialMessage' | 'library' | 'position'>;

export type Context7SessionEvent =
  | {
      readonly type: 'open';
    }
  | {
      readonly type: 'close';
    }
  | {
      readonly type: 'question';
      readonly detail: Context7WidgetEventPayload<'c7:question'>;
    }
  | {
      readonly type: 'first-token';
      readonly detail: Context7WidgetEventPayload<'c7:first-token'>;
    }
  | {
      readonly type: 'answer';
      readonly detail: Context7WidgetEventPayload<'c7:answer'>;
    }
  | {
      readonly type: 'answer-complete';
      readonly detail: Context7WidgetEventPayload<'c7:answer-complete'>;
    }
  | {
      readonly type: 'cancel';
      readonly detail: Context7WidgetEventPayload<'c7:cancel'>;
    }
  | {
      readonly type: 'tool-call';
      readonly detail: Context7WidgetEventPayload<'c7:tool-call'>;
    }
  | {
      readonly type: 'tool-result';
      readonly detail: Context7WidgetEventPayload<'c7:tool-result'>;
    }
  | {
      readonly type: 'error';
      readonly detail: Context7WidgetEventPayload<'c7:error'>;
    };

export interface Context7SessionOptions {
  readonly elements: Context7SessionElements;

  readonly getConfig: () => SessionConfig;

  /**
   * Return the actual trigger consumed by the browser controller.
   *
   * Each package may map their `customTrigger: true` to their framework-owned
   * managed trigger element here.
   */
  readonly getCustomTrigger: () => Context7WidgetTrigger | null;

  readonly initialOpen?: boolean;

  readonly missingLibraryMessage?: string;

  readonly onEvent?: (event: Context7SessionEvent) => void;

  readonly panelId: string;
}

export interface Context7Session {
  backdropClick(): void;
  cancel(): void;
  close(): void;
  destroy(): void;

  getMessages(): readonly Context7Message[];
  getSnapshot(): Context7SessionSnapshot;

  handleKeyDown(event: KeyboardEvent): void;

  isBusy(): boolean;
  isOpen(): boolean;

  mount(): void;

  open(): void;
  openFrom(target: EventTarget | null): void;

  refreshLayout(): void;
  refreshTrigger(): void;

  reset(): void;

  send(question: string): Promise<Context7WidgetSendResult>;

  /**
   * Used by the Web Component to import an existing declarative `open`
   * attribute without incorrectly emitting an open/close lifecycle event.
   */
  syncOpen(value: boolean): void;

  subscribe(listener: (snapshot: Context7SessionSnapshot) => void): () => void;

  toggle(): void;
  toggleTool(id: string): void;

  unmount(): void;
}

interface ActiveRequest {
  answer: string;
  answerItemIndex: number;
  assistantMessage?: Context7Message;
  readonly controller: AbortController;
  readonly question: string;
  renderFrame: number | null;
  sawFirstToken: boolean;
  sendResult?: Context7WidgetSendResult;
}

const EMPTY_RENDERED_MARKDOWN = '' as Context7RenderedMarkdown;

export function useContext7Session(options: Context7SessionOptions): Context7Session {
  let open = options.initialOpen ?? false;
  let busy = false;
  let typing = false;
  let mounted = false;
  let customTriggerBound = false;

  let items: Context7SessionItem[] = [];
  let messages: Context7Message[] = [];

  let messageCounter = 0;

  let activeRequest: ActiveRequest | null = null;

  const listeners = new Set<(snapshot: Context7SessionSnapshot) => void>();

  let snapshot = createSnapshot();

  let activeAnchor: Element | null = null;

  let customTriggerSource: Context7WidgetTrigger | null = null;
  let customTriggerElement: Element | null = null;
  let customTriggerAccessibility: Context7TriggerA11yState | null = null;
  let customTriggerObserver: MutationObserver | null = null;
  let customTriggerSelectorInvalid = false;
  let customTriggerWarningKey = '';

  let floatingLayoutFrame: number | null = null;
  let floatingResizeObserver: ResizeObserver | null = null;
  let floatingViewport: VisualViewport | null = null;

  let scrollFrame: number | null = null;
  let focusFrame: number | null = null;
  let lastFocus: Element | null = null;

  function createSnapshot(): Context7SessionSnapshot {
    return {
      busy,
      customTriggerBound,
      items,
      messages,
      open,
      typing
    };
  }

  function publish(scroll = false): void {
    snapshot = createSnapshot();

    for (const listener of listeners) {
      listener(snapshot);
    }

    if (scroll) {
      scheduleScrollToBottom();
    }
  }

  function emit(event: Context7SessionEvent): void {
    options.onEvent?.(event);
  }

  function nextMessageId(): string {
    messageCounter += 1;
    return `c7m-${messageCounter}`;
  }

  function getMessages(): readonly Context7Message[] {
    return [...messages];
  }

  function createSendResult<Status extends Context7WidgetSendResult['status']>(
    status: Status,
    question: string,
    resultOptions: {
      readonly answer?: string;
      readonly error?: Error | string;
      readonly message?: Context7Message;
    } = {}
  ): Context7WidgetSendResult & { readonly status: Status } {
    return {
      answer: resultOptions.answer ?? '',
      error: resultOptions.error,
      message: resultOptions.message,
      messages: getMessages(),
      question,
      status
    };
  }

  function renderAssistantMarkdown(content: string): Context7RenderedMarkdown {
    return renderMarkdown(content) as Context7RenderedMarkdown;
  }

  function createAssistantItem(content: string, id = nextMessageId()): Context7SessionMessageItem {
    return {
      content,
      html: content ? renderAssistantMarkdown(content) : EMPTY_RENDERED_MARKDOWN,
      id,
      kind: 'message',
      role: 'assistant'
    };
  }

  function replaceItemAt(index: number, item: Context7SessionItem): void {
    const nextItems = items.slice();
    nextItems[index] = item;
    items = nextItems;
  }

  function createAdminUrl(library: string): string | undefined {
    if (!library) return undefined;

    const normalizedLibrary = library.startsWith('/') ? library : `/${library}`;

    return encodeURI(`https://context7.com${normalizedLibrary}/admin?tab=chat`);
  }

  function appendError(message: string): void {
    const library = options.getConfig().library;

    items = [
      ...items,
      {
        adminUrl: createAdminUrl(library),
        id: nextMessageId(),
        kind: 'error',
        message
      }
    ];
  }

  function formatToolResult(result: unknown): string {
    return typeof result === 'string' ? result : (JSON.stringify(result, null, 2) ?? String(result ?? ''));
  }

  function appendToolCall(toolCall: Context7ToolCall): void {
    const id = nextMessageId();

    items = [
      ...items,
      {
        contentId: `${options.panelId}-${id}-tool-result`,
        expanded: false,
        hasResult: false,
        id,
        kind: 'tool',
        query: typeof toolCall.args.query === 'string' ? toolCall.args.query : 'documentation',
        result: '',
        toolCallId: toolCall.toolCallId
      }
    ];
  }

  function updateToolResult(toolResult: Context7ToolResult): void {
    const index = items.findIndex((item) => item.kind === 'tool' && item.toolCallId === toolResult.toolCallId);

    if (index === -1) return;

    const item = items[index];

    if (!item || item.kind !== 'tool') return;

    replaceItemAt(index, {
      ...item,
      hasResult: true,
      result: formatToolResult(toolResult.result)
    });
  }

  function toggleTool(id: string): void {
    const index = items.findIndex((item) => item.kind === 'tool' && item.id === id);

    if (index === -1) return;

    const item = items[index];

    if (!item || item.kind !== 'tool' || !item.hasResult) return;

    replaceItemAt(index, {
      ...item,
      expanded: !item.expanded
    });

    publish();
  }

  function ensureAnswerItem(request: ActiveRequest): void {
    if (request.answerItemIndex !== -1) return;

    request.answerItemIndex = items.length;

    items = [...items, createAssistantItem('')];
  }

  function applyAnswer(request: ActiveRequest, shouldPublish: boolean): void {
    if (request.answerItemIndex === -1) return;

    const current = items[request.answerItemIndex];

    if (!current || current.kind !== 'message' || current.role !== 'assistant' || current.content === request.answer) {
      return;
    }

    replaceItemAt(request.answerItemIndex, {
      ...current,
      content: request.answer,
      html: renderAssistantMarkdown(request.answer)
    });

    if (shouldPublish) {
      publish(true);
    }
  }

  function flushAnswer(request: ActiveRequest, shouldPublish = true): void {
    cancelRenderFrame(request.renderFrame);
    request.renderFrame = null;

    applyAnswer(request, shouldPublish);
  }

  function commitAnswer(request: ActiveRequest, status?: Context7MessageStatus): Context7Message | undefined {
    if (!request.answer || request.assistantMessage) {
      return request.assistantMessage;
    }

    ensureAnswerItem(request);
    flushAnswer(request, false);

    const item = items[request.answerItemIndex];

    const assistantMessage: Context7Message = {
      content: request.answer,
      id: item && item.kind === 'message' ? item.id : nextMessageId(),
      role: 'assistant',
      ...(status ? { status } : {})
    };

    request.assistantMessage = assistantMessage;

    messages = [...messages, assistantMessage];

    if (status && item && item.kind === 'message' && item.role === 'assistant') {
      replaceItemAt(request.answerItemIndex, {
        ...item,
        status
      });
    }

    return assistantMessage;
  }

  function scheduleAnswerRender(request: ActiveRequest): void {
    if (request.renderFrame !== null) return;

    request.renderFrame = requestRenderFrame(() => {
      request.renderFrame = null;

      if (activeRequest !== request) return;

      applyAnswer(request, true);
    });
  }

  function scheduleScrollToBottom(): void {
    if (!mounted || scrollFrame !== null) return;

    scrollFrame = requestRenderFrame(() => {
      scrollFrame = null;

      if (!mounted) return;

      const element = options.elements.messages();

      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }

  function scheduleFocusInput(): void {
    if (!mounted || !open || focusFrame !== null) return;

    focusFrame = requestRenderFrame(() => {
      focusFrame = null;

      if (!mounted || !open) return;

      options.elements.input()?.focus({
        preventScroll: true
      });
    });
  }

  function cancelScheduledFocus(): void {
    cancelRenderFrame(focusFrame);
    focusFrame = null;
  }

  function cancelScheduledScroll(): void {
    cancelRenderFrame(scrollFrame);
    scrollFrame = null;
  }

  function syncExternalTriggerExpandedState(): void {
    customTriggerElement?.setAttribute('aria-expanded', String(open));
  }

  function getAnchorElement(): Element | null {
    if (activeAnchor?.isConnected) {
      return activeAnchor;
    }

    if (customTriggerElement?.isConnected) {
      return customTriggerElement;
    }

    const launcher = options.elements.launcher();

    return launcher?.isConnected ? launcher : null;
  }

  function updateFloatingPosition(): void {
    const config = options.getConfig();
    const root = options.elements.root();

    updateAnchorPosition(config.position, getAnchorElement(), options.elements.panel(), root?.style);
  }

  function scheduleAnchorPositionUpdate(): void {
    if (!mounted || !open || floatingLayoutFrame !== null) {
      return;
    }

    floatingLayoutFrame = requestRenderFrame(() => {
      floatingLayoutFrame = null;

      if (mounted && open) {
        updateFloatingPosition();
      }
    });
  }

  function onFloatingLayout(event: Event): void {
    const root = options.elements.root();

    if (event.type === 'scroll' && root && event.composedPath().includes(root)) {
      return;
    }

    scheduleAnchorPositionUpdate();
  }

  function onDocumentPointerDown(event: Event): void {
    if (!mounted || !open) return;

    const config = options.getConfig();

    if (!config.closeOnOutsideClick) return;

    const path = event.composedPath();
    const root = options.elements.root();

    if (root && path.includes(root)) return;

    if (customTriggerElement && path.includes(customTriggerElement)) {
      return;
    }

    close();
  }

  function bindFloatingListeners(): void {
    unbindFloatingListeners();

    if (!mounted || !open) return;

    const config = options.getConfig();

    if (config.closeOnOutsideClick) {
      document.addEventListener('pointerdown', onDocumentPointerDown, true);
    }

    if (config.position !== 'anchor') return;

    window.addEventListener('resize', onFloatingLayout);

    window.addEventListener('scroll', onFloatingLayout, true);

    floatingViewport = window.visualViewport;

    floatingViewport?.addEventListener('resize', onFloatingLayout);

    floatingViewport?.addEventListener('scroll', onFloatingLayout);

    if (typeof ResizeObserver !== 'function') return;

    floatingResizeObserver = new ResizeObserver(scheduleAnchorPositionUpdate);

    const anchor = getAnchorElement();
    const panel = options.elements.panel();

    if (anchor) {
      floatingResizeObserver.observe(anchor);
    }

    if (panel) {
      floatingResizeObserver.observe(panel);
    }
  }

  function unbindFloatingListeners(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', onFloatingLayout);

      window.removeEventListener('scroll', onFloatingLayout, true);
    }

    floatingViewport?.removeEventListener('resize', onFloatingLayout);

    floatingViewport?.removeEventListener('scroll', onFloatingLayout);

    floatingViewport = null;

    floatingResizeObserver?.disconnect();
    floatingResizeObserver = null;

    cancelRenderFrame(floatingLayoutFrame);
    floatingLayoutFrame = null;
  }

  function warnTriggerBindingFailure(trigger: Context7WidgetTrigger, invalidSelector: boolean): void {
    const warningKey = isContext7WidgetTriggerElement(trigger) ? 'element' : `selector:${trigger}`;

    if (customTriggerWarningKey === warningKey) return;

    customTriggerWarningKey = warningKey;

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

  function clearCustomTriggerBinding(): void {
    customTriggerObserver?.disconnect();
    customTriggerObserver = null;

    if (activeAnchor === customTriggerElement) {
      activeAnchor = null;
    }

    customTriggerElement?.removeEventListener('click', onCustomTriggerClick);

    if (customTriggerAccessibility) {
      restoreTriggerAccessibility(customTriggerAccessibility);
    }

    customTriggerAccessibility = null;
    customTriggerElement = null;
    customTriggerSelectorInvalid = false;
    customTriggerBound = false;
  }

  function observeCustomTrigger(): void {
    if (!customTriggerSource || customTriggerSelectorInvalid || typeof MutationObserver !== 'function') {
      return;
    }

    const observerTarget = document.documentElement ?? document.body;

    if (!observerTarget) return;

    customTriggerObserver = new MutationObserver(() => {
      if (!mounted) return;

      if (customTriggerElement?.isConnected) return;

      bindCustomTrigger(customTriggerSource);
    });

    customTriggerObserver.observe(observerTarget, {
      childList: true,
      subtree: true
    });
  }

  function bindCustomTrigger(trigger: Context7WidgetTrigger | null): void {
    const wasBound = customTriggerBound;

    clearCustomTriggerBinding();

    customTriggerSource = trigger;

    if (!trigger) {
      if (wasBound !== customTriggerBound) {
        publish();
      }

      return;
    }

    const resolution = resolveContext7CustomTrigger(trigger, false);

    customTriggerSelectorInvalid = resolution.invalidSelector;

    const element = resolution.element;

    if (element?.isConnected) {
      customTriggerElement = element;

      customTriggerAccessibility = captureTriggerAccessibility(element);

      element.setAttribute('aria-controls', options.panelId);

      element.setAttribute('aria-haspopup', 'dialog');

      element.setAttribute('aria-expanded', String(open));

      element.addEventListener('click', onCustomTriggerClick);

      customTriggerBound = true;
      customTriggerWarningKey = '';
    } else {
      warnTriggerBindingFailure(trigger, resolution.invalidSelector);
    }

    observeCustomTrigger();

    if (wasBound !== customTriggerBound) {
      publish();
    }
  }

  function onCustomTriggerClick(event: Event): void {
    event.preventDefault();

    openFrom(event.currentTarget);
  }

  function refreshTrigger(): void {
    if (!mounted) return;

    const trigger = options.getCustomTrigger();

    if (
      trigger === customTriggerSource &&
      (customTriggerElement?.isConnected || customTriggerObserver || trigger === null)
    ) {
      syncExternalTriggerExpandedState();
      return;
    }

    bindCustomTrigger(trigger);

    if (open) {
      refreshLayout();
    }
  }

  function refreshLayout(): void {
    unbindFloatingListeners();

    if (!mounted || !open) return;

    bindFloatingListeners();
    updateFloatingPosition();
  }

  function openFrom(target: EventTarget | null): void {
    if (target instanceof Element) {
      activeAnchor = target;
    }

    toggle();
  }

  function openSession(): void {
    if (open) return;

    if (mounted && typeof document !== 'undefined') {
      lastFocus = document.activeElement;
    }

    open = true;

    syncExternalTriggerExpandedState();

    if (mounted) {
      bindFloatingListeners();
      updateFloatingPosition();
      scheduleFocusInput();
    }

    publish();

    emit({
      type: 'open'
    });
  }

  function close(): void {
    if (!open) return;

    open = false;

    cancelScheduledFocus();

    syncExternalTriggerExpandedState();
    unbindFloatingListeners();

    publish();

    emit({
      type: 'close'
    });

    if (mounted && lastFocus instanceof HTMLElement && lastFocus.isConnected) {
      lastFocus.focus();
    }
  }

  function syncOpen(value: boolean): void {
    if (open === value) return;

    open = value;

    syncExternalTriggerExpandedState();

    publish();

    if (mounted) {
      refreshLayout();
    }
  }

  function toggle(): void {
    if (open) {
      close();
    } else {
      openSession();
    }
  }

  function backdropClick(): void {
    if (options.getConfig().closeOnOutsideClick) {
      close();
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      close();
      return;
    }

    if (event.key === 'Tab' && open && options.getConfig().position === 'center') {
      const panel = options.elements.panel();

      if (panel) {
        trapFocus(event, panel);
      }
    }
  }

  function reset(): void {
    cancel();

    const config = options.getConfig();

    const intro = config.initialMessage.replace(/\{library\}/g, config.library || 'this library');

    messages = [];

    items = [createAssistantItem(intro)];

    typing = false;

    publish(true);
  }

  function cancel(): void {
    const request = activeRequest;

    if (!request) return;

    const message = commitAnswer(request, 'cancelled');

    const result = createSendResult('cancelled', request.question, {
      answer: request.answer,
      message
    });

    request.sendResult = result;

    activeRequest = null;

    request.controller.abort();

    cancelRenderFrame(request.renderFrame);
    request.renderFrame = null;

    busy = false;
    typing = false;

    publish(true);

    emit({
      type: 'cancel',
      detail: result
    });

    scheduleFocusInput();
  }

  async function send(rawQuestion: string): Promise<Context7WidgetSendResult> {
    const question = rawQuestion.trim();

    if (!question) {
      return createSendResult('empty', question);
    }

    if (busy) {
      return createSendResult('busy', question);
    }

    const config = options.getConfig();

    if (!config.library) {
      const message = options.missingLibraryMessage ?? 'Missing library configuration.';

      appendError(message);

      publish(true);

      emit({
        type: 'error',
        detail: {
          error: message,
          question
        }
      });

      return createSendResult('error', question, {
        error: message
      });
    }

    openSession();

    busy = true;

    const userMessage: Context7Message = {
      content: question,
      id: nextMessageId(),
      role: 'user'
    };

    messages = [...messages, userMessage];

    items = [
      ...items,
      {
        ...userMessage,
        kind: 'message'
      }
    ] as Context7SessionItem[];

    typing = true;

    publish(true);

    emit({
      type: 'question',
      detail: {
        message: userMessage,
        messages: getMessages(),
        question
      }
    });

    const request: ActiveRequest = {
      answer: '',
      answerItemIndex: -1,
      controller: new AbortController(),
      question,
      renderFrame: null,
      sawFirstToken: false
    };

    activeRequest = request;

    try {
      await streamContext7Response(
        {
          library: config.library
        },
        messages,
        {
          onChunk(delta) {
            if (activeRequest !== request) return;

            const shouldPublishImmediately = typing || request.answerItemIndex === -1;

            typing = false;
            request.answer += delta;

            ensureAnswerItem(request);
            scheduleAnswerRender(request);

            if (shouldPublishImmediately) {
              publish(true);
            }

            const answerDetail = {
              answer: request.answer,
              question
            } as const;

            if (!request.sawFirstToken) {
              request.sawFirstToken = true;

              emit({
                type: 'first-token',
                detail: answerDetail
              });
            }

            emit({
              type: 'answer',
              detail: answerDetail
            });
          },

          onToolCall(toolCall) {
            if (activeRequest !== request) return;

            typing = false;

            appendToolCall(toolCall);

            publish(true);

            emit({
              type: 'tool-call',
              detail: {
                question,
                toolCall
              }
            });
          },

          onToolResult(toolResult) {
            if (activeRequest !== request) return;

            updateToolResult(toolResult);

            publish(true);

            emit({
              type: 'tool-result',
              detail: {
                question,
                toolResult
              }
            });
          }
        },
        request.controller.signal
      );

      if (activeRequest !== request) {
        return (
          request.sendResult ??
          createSendResult('cancelled', question, {
            answer: request.answer
          })
        );
      }

      typing = false;

      if (request.answer) {
        const message = commitAnswer(request);

        const result = createSendResult('complete', question, {
          answer: request.answer,
          message
        });

        request.sendResult = result;

        emit({
          type: 'answer-complete',
          detail: {
            answer: request.answer,
            message: message as Context7Message,
            messages: getMessages(),
            question
          }
        });

        return result;
      }

      const result = createSendResult('complete', question);

      request.sendResult = result;

      return result;
    } catch (error) {
      if (activeRequest !== request) {
        return (
          request.sendResult ??
          createSendResult('cancelled', question, {
            answer: request.answer
          })
        );
      }

      if (!isAbortError(error)) {
        const message = error instanceof Error ? error.message : 'Something went wrong.';

        appendError(message);

        const result = createSendResult('error', question, {
          answer: request.answer,
          error: message
        });

        request.sendResult = result;

        emit({
          type: 'error',
          detail: {
            error: message,
            question
          }
        });

        return result;
      }

      return createSendResult('cancelled', question, {
        answer: request.answer
      });
    } finally {
      if (activeRequest === request) {
        cancelRenderFrame(request.renderFrame);

        request.renderFrame = null;
        activeRequest = null;

        busy = false;
        typing = false;

        publish(true);

        scheduleFocusInput();
      }
    }
  }

  function mount(): void {
    if (mounted) return;

    mounted = true;

    bindCustomTrigger(options.getCustomTrigger());

    if (open) {
      bindFloatingListeners();
      updateFloatingPosition();
    }
  }

  function unmount(): void {
    if (!mounted) return;

    mounted = false;

    cancel();

    unbindFloatingListeners();

    const wasBound = customTriggerBound;

    clearCustomTriggerBinding();
    customTriggerSource = null;

    cancelScheduledFocus();
    cancelScheduledScroll();

    if (wasBound) {
      publish();
    }
  }

  function destroy(): void {
    unmount();
    listeners.clear();
  }

  const session: Context7Session = {
    backdropClick,
    cancel,
    close,
    destroy,

    getMessages,

    getSnapshot() {
      return snapshot;
    },

    handleKeyDown,

    isBusy() {
      return busy;
    },

    isOpen() {
      return open;
    },

    mount,

    open: openSession,
    openFrom,

    refreshLayout,
    refreshTrigger,

    reset,
    send,

    syncOpen,

    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot);

      return () => {
        listeners.delete(listener);
      };
    },

    toggle,
    toggleTool,

    unmount
  };

  return session;
}

import {
  CONTEXT7_URL,
  DESOURCE_LABS_URL,
  acquireContext7Modal,
  buildContext7ErrorHtml,
  callContext7ListenerSafely,
  cancelRenderFrame,
  captureTriggerAccessibility,
  compactContext7WidgetOptions,
  createContext7CopyActionController,
  createContext7ConversationEngine,
  createContext7ConversationRenderBridge,
  deSourceLabsLogoUrl,
  formatContext7ToolResult,
  getContext7ToolQuery,
  isContext7WidgetTriggerElement,
  normalizeContext7WidgetTrigger,
  renderMarkdown,
  requestRenderFrame,
  resolveContext7CustomTrigger,
  resolveContext7MarkdownBaseUrl,
  resolveContext7WidgetConfig,
  restoreTriggerAccessibility,
  syncContext7CopyButton,
  trapFocus,
  updateAnchorPosition,
  type Context7ConversationEvent,
  type Context7ConversationState,
  type Context7CopyActionController,
  type Context7Message,
  type Context7RenderedMarkdown,
  type Context7ToolCall,
  type Context7ToolResult,
  type Context7TriggerA11yState,
  type Context7WidgetLifecycleEventDetail,
  type Context7WidgetSendResult
} from '@desource/context7-widget/kit';
import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type SubmitEvent as ReactSubmitEvent,
  type UIEvent as ReactUIEvent
} from 'react';
import { registerReactContext7Widget, unregisterReactContext7Widget } from '../internal/registry';
import type {
  Context7ReactCustomTrigger,
  Context7WidgetHandle,
  Context7WidgetProps,
  Context7WidgetStateListener,
  DisplayItem,
  MessageDisplayItem
} from '../types';

interface ReactAnswerRender {
  answer: string;
  itemId: string | null;
  renderFrame: number | null;
}

interface WidgetActions {
  cancel(): void;
  close(): void;
  open(): void;
  reset(): void;
  retry(): Promise<Context7WidgetSendResult>;
  send(message?: string): Promise<Context7WidgetSendResult>;
  toggle(): void;
}

type CopyActionKey = HTMLButtonElement | string;

interface CompletedMarkdownProps {
  readonly content: string;
  readonly copyCodeLabel: string;
  readonly library: string;
  readonly linkBaseUrl: string;
}

const STICKY_SCROLL_THRESHOLD = 48;

const CLOSE_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const LAUNCHER_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M8 9h8" />
    <path d="M8 13h6" />
    <path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12" />
  </svg>
);

const CompletedMarkdown = memo(function CompletedMarkdown({
  content,
  copyCodeLabel,
  library,
  linkBaseUrl
}: CompletedMarkdownProps) {
  const html = useMemo<Context7RenderedMarkdown>(
    () =>
      renderMarkdown(content, {
        baseUrl: resolveContext7MarkdownBaseUrl(library, linkBaseUrl),
        copyCodeLabel
      }),
    [content, copyCodeLabel, library, linkBaseUrl]
  );

  // This sink only receives branded output from the escaping core renderer.
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
});

export const Context7Widget = forwardRef<Context7WidgetHandle, Context7WidgetProps>(
  function Context7Widget(props, forwardedRef) {
    const config = useMemo(
      () =>
        resolveContext7WidgetConfig(
          compactContext7WidgetOptions({
            backdrop: props.backdrop,
            closeOnOutsideClick: props.closeOnOutsideClick,
            color: props.color,
            defaultOpen: props.defaultOpen,
            initialMessage: props.initialMessage,
            labels: props.labels,
            launcherLabel: props.launcherLabel,
            launcherVariant: props.launcherVariant,
            library: props.library,
            linkBaseUrl: props.linkBaseUrl,
            panelHeight: props.panelHeight,
            panelWidth: props.panelWidth,
            placeholder: props.placeholder,
            position: props.position,
            preset: props.preset,
            theme: props.theme,
            title: props.title,
            widgetId: props.widgetId
          })
        ),
      [
        props.backdrop,
        props.closeOnOutsideClick,
        props.color,
        props.defaultOpen,
        props.initialMessage,
        props.labels,
        props.launcherLabel,
        props.launcherVariant,
        props.library,
        props.linkBaseUrl,
        props.panelHeight,
        props.panelWidth,
        props.placeholder,
        props.position,
        props.preset,
        props.theme,
        props.title,
        props.widgetId
      ]
    );
    const configRef = useRef(config);
    configRef.current = config;
    const initialMessageLibrary = config.library || config.labels.libraryFallback;
    const propsRef = useRef(props);
    propsRef.current = props;

    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const sendButtonRef = useRef<HTMLButtonElement>(null);
    const launcherRef = useRef<HTMLButtonElement>(null);
    const managedTriggerRef = useRef<HTMLButtonElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);
    const externalTriggerRef = useRef<Element | null>(null);
    const activeAnchorRef = useRef<Element | null>(null);
    const lastFocusRef = useRef<Element | null>(null);
    const messageCounterRef = useRef(0);
    const mountedRef = useRef(false);
    const previousOpenRef = useRef(false);
    const shouldFocusStopRef = useRef(false);
    const stickToBottomRef = useRef(true);
    const stateListenersRef = useRef(new Set<Context7WidgetStateListener>());

    const [internalOpen, setInternalOpen] = useState(() => Boolean(props.defaultOpen));
    const actualOpen = props.open ?? internalOpen;
    const openRef = useRef(actualOpen);
    openRef.current = actualOpen;
    const [busy, setBusy] = useState(false);
    const busyRef = useRef(busy);
    busyRef.current = busy;
    const [conversation, setConversation] = useState<readonly Context7Message[]>([]);
    const conversationRef = useRef(conversation);
    conversationRef.current = conversation;
    const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
    const [copiedAnswerIds, setCopiedAnswerIds] = useState<ReadonlySet<string>>(new Set());
    const [draft, setDraft] = useState('');
    const [showTyping, setShowTyping] = useState(false);
    const [hasBoundExternalTrigger, setHasBoundExternalTrigger] = useState(false);
    const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '-');
    const managedTriggerId = `context7-widget-trigger-${instanceId}`;
    const panelId = `context7-widget-panel-${instanceId}`;

    const copyActionsRef = useRef<Context7CopyActionController<CopyActionKey> | null>(null);
    copyActionsRef.current ??= createContext7CopyActionController<CopyActionKey>({
      onChange(key, copied) {
        if (typeof key === 'string') {
          setCopiedAnswerIds((current) => {
            const next = new Set(current);
            if (copied) next.add(key);
            else next.delete(key);
            return next;
          });
          return;
        }
        syncContext7CopyButton(key, copied, configRef.current.labels.copyCode, configRef.current.labels.copied);
      }
    });
    const copyActions = copyActionsRef.current;

    const getAnchorElement = useCallback((): Element | null => {
      return (
        (activeAnchorRef.current?.isConnected ? activeAnchorRef.current : null) ??
        managedTriggerRef.current ??
        (externalTriggerRef.current?.isConnected ? externalTriggerRef.current : null) ??
        launcherRef.current
      );
    }, []);

    const updateAnchor = useCallback((): void => {
      updateAnchorPosition(configRef.current.position, getAnchorElement(), panelRef.current, rootRef.current?.style);
    }, [getAnchorElement]);

    const nextMessageId = (): string => {
      messageCounterRef.current += 1;
      return `c7m-${messageCounterRef.current}`;
    };

    const engineRef = useRef<ReturnType<typeof createContext7ConversationEngine> | null>(null);
    engineRef.current ??= createContext7ConversationEngine({
      missingLibraryMessage: () => configRef.current.labels.missingLibrary,
      nextMessageId,
      resolveConfig: () => ({ library: configRef.current.library })
    });
    const engine = engineRef.current;

    function baseDetail(): Context7WidgetLifecycleEventDetail {
      return {
        library: configRef.current.library,
        widget: rootRef.current as HTMLElement,
        widgetId: configRef.current.widgetId
      };
    }

    function emitEngineEvent(event: Context7ConversationEvent): void {
      const callbacks = propsRef.current;
      switch (event.type) {
        case 'c7:answer':
          callbacks.onAnswer?.({ ...baseDetail(), ...event.detail });
          break;
        case 'c7:answer-complete':
          callbacks.onAnswerComplete?.({ ...baseDetail(), ...event.detail });
          break;
        case 'c7:cancel':
          callbacks.onCancel?.({ ...baseDetail(), ...event.detail });
          break;
        case 'c7:error':
          callbacks.onError?.({ ...baseDetail(), ...event.detail });
          break;
        case 'c7:first-token':
          callbacks.onFirstToken?.({ ...baseDetail(), ...event.detail });
          break;
        case 'c7:question':
          callbacks.onQuestion?.({ ...baseDetail(), ...event.detail });
          break;
        case 'c7:tool-call':
          callbacks.onToolCall?.({ ...baseDetail(), ...event.detail });
          break;
        case 'c7:tool-result':
          callbacks.onToolResult?.({ ...baseDetail(), ...event.detail });
          break;
      }
    }

    function updateMessage(id: string, update: (item: MessageDisplayItem) => MessageDisplayItem): void {
      setDisplayItems((items) =>
        items.map((item) => (item.kind === 'message' && item.id === id ? update(item) : item))
      );
    }

    function renderQuestion(event: Context7ConversationEvent<'c7:question'>): ReactAnswerRender | null {
      if (!event.detail.retry) setDisplayItems((items) => [...items, { ...event.detail.message, kind: 'message' }]);
      setShowTyping(Boolean(event.request));
      return event.request ? { answer: '', itemId: null, renderFrame: null } : null;
    }

    function renderAnswer(event: Context7ConversationEvent<'c7:answer'>, render: ReactAnswerRender): void {
      setShowTyping(false);
      render.answer = event.detail.answer;
      if (!render.itemId) {
        render.itemId = nextMessageId();
        setDisplayItems((items) => [
          ...items,
          { content: '', id: render.itemId as string, kind: 'message', role: 'assistant', streaming: true }
        ]);
      }
      const itemId = render.itemId;
      render.renderFrame ??= requestRenderFrame(() => {
        render.renderFrame = null;
        updateMessage(itemId, (item) => ({ ...item, content: render.answer }));
      });
    }

    function flushAnswer(render: ReactAnswerRender, answer: string): void {
      cancelRenderFrame(render.renderFrame);
      render.renderFrame = null;
      setShowTyping(false);
      if (!render.itemId && answer) {
        render.itemId = nextMessageId();
        setDisplayItems((items) => [
          ...items,
          { content: answer, id: render.itemId as string, kind: 'message', role: 'assistant' }
        ]);
      } else if (render.itemId) {
        updateMessage(render.itemId, (item) => ({ ...item, content: answer, streaming: false }));
      }
    }

    function appendToolCall(toolCall: Context7ToolCall): void {
      const id = nextMessageId();
      setDisplayItems((items) => [
        ...items,
        {
          contentId: `${panelId}-${id}-tool-result`,
          expanded: false,
          hasResult: false,
          id,
          kind: 'tool',
          query: getContext7ToolQuery(toolCall),
          result: '',
          toolCallId: toolCall.toolCallId
        }
      ]);
    }

    function updateToolResult(toolResult: Context7ToolResult): void {
      const result = formatContext7ToolResult(toolResult.result);
      if (!result) return;
      setDisplayItems((items) =>
        items.map((item) =>
          item.kind === 'tool' && item.toolCallId === toolResult.toolCallId
            ? { ...item, hasResult: true, result }
            : item
        )
      );
    }

    const renderBridgeRef = useRef<ReturnType<typeof createContext7ConversationRenderBridge<ReactAnswerRender>> | null>(
      null
    );
    renderBridgeRef.current ??= createContext7ConversationRenderBridge<ReactAnswerRender>({
      clearAnswer: (render) => cancelRenderFrame(render.renderFrame),
      discardAnswer(render) {
        cancelRenderFrame(render.renderFrame);
        if (render.itemId) setDisplayItems((items) => items.filter((item) => item.id !== render.itemId));
      },
      emit: emitEngineEvent,
      flushAnswer: (render, event) => flushAnswer(render, event.detail.answer),
      onAnswer: renderAnswer,
      onError(event) {
        setShowTyping(false);
        setDisplayItems((items) => [
          ...items,
          {
            html: buildContext7ErrorHtml(
              String(event.detail.error || configRef.current.labels.errorFallback),
              configRef.current.library,
              configRef.current.labels
            ),
            id: nextMessageId(),
            kind: 'error',
            question: event.detail.question
          }
        ]);
      },
      onQuestion: renderQuestion,
      onToolCall(event) {
        setShowTyping(false);
        appendToolCall(event.detail.toolCall);
      },
      onToolResult: (event) => updateToolResult(event.detail.toolResult)
    });
    const renderBridge = renderBridgeRef.current;

    const actionsRef = useRef<WidgetActions | null>(null);

    function requestOpen(value: boolean): void {
      if (openRef.current === value) return;
      propsRef.current.onOpenChange?.(value);
      if (propsRef.current.open === undefined) setInternalOpen(value);
    }

    function open(): void {
      requestOpen(true);
    }

    function close(): void {
      requestOpen(false);
    }

    function toggle(): void {
      requestOpen(!openRef.current);
    }

    function cancel(): void {
      engine.cancel();
      inputRef.current?.focus();
    }

    function reset(): void {
      stickToBottomRef.current = true;
      engine.reset();
      renderBridge.clearActiveAnswer();
      copyActions.reset(false);
      setCopiedAnswerIds(new Set());
      const current = configRef.current;
      const intro = current.initialMessage.replace(/\{library\}/g, current.library || current.labels.libraryFallback);
      setDisplayItems([{ content: intro, id: nextMessageId(), kind: 'message', role: 'assistant' }]);
      setConversation([]);
      setShowTyping(false);
    }

    async function retry(): Promise<Context7WidgetSendResult> {
      open();
      const result = await engine.retry();
      if (!engine.isBusy()) inputRef.current?.focus();
      return result;
    }

    async function send(rawQuestion?: string): Promise<Context7WidgetSendResult> {
      const question = (rawQuestion ?? inputRef.current?.value ?? draft).trim();
      if (question && !engine.isBusy() && configRef.current.library) {
        open();
        setDraft('');
        requestRenderFrame(resizeInput);
      }
      const moveFocus = shouldFocusStopRef.current || document.activeElement === inputRef.current;
      const pending = engine.send(question);
      shouldFocusStopRef.current = moveFocus && engine.isBusy();
      const result = await pending;
      if (!engine.isBusy()) inputRef.current?.focus();
      return result;
    }

    actionsRef.current = { cancel, close, open, reset, retry, send, toggle };

    const handle = useMemo<Context7WidgetHandle>(
      () => ({
        get element() {
          return rootRef.current;
        },
        cancel: () => actionsRef.current?.cancel(),
        close: () => actionsRef.current?.close(),
        getMessages: () => engine.getMessages(),
        isBusy: () => engine.isBusy(),
        isOpen: () => openRef.current,
        open: () => actionsRef.current?.open(),
        reset: () => actionsRef.current?.reset(),
        retry: async () => await actionsRef.current?.retry(),
        send: async (message) => await actionsRef.current?.send(message),
        subscribe(listener) {
          stateListenersRef.current.add(listener);
          callContext7ListenerSafely(listener, {
            busy: busyRef.current,
            messages: conversationRef.current,
            open: openRef.current
          });
          return () => stateListenersRef.current.delete(listener);
        },
        toggle: () => actionsRef.current?.toggle()
      }),
      [engine]
    );
    useImperativeHandle(forwardedRef, () => handle, [handle]);

    useEffect(() => {
      const unsubscribeState = engine.subscribe(
        (state: Context7ConversationState) => {
          if (busyRef.current !== state.busy) {
            busyRef.current = state.busy;
            setBusy(state.busy);
          }
          if (!areContext7MessagesEqual(conversationRef.current, state.messages)) {
            const messages = [...state.messages];
            conversationRef.current = messages;
            setConversation(messages);
          }
          if (!state.busy) {
            setShowTyping(false);
            renderBridge.clearActiveAnswer();
          }
        },
        { includeTransient: false }
      );
      const unsubscribeEvents = engine.subscribeEvents((event) => renderBridge.handleEvent(event));
      return () => {
        engine.cancel();
        copyActions.reset(false);
        unsubscribeEvents();
        unsubscribeState();
        renderBridge.clearActiveAnswer();
      };
    }, [copyActions, engine, renderBridge]);

    useEffect(() => {
      stickToBottomRef.current = true;
      engine.reset();
      renderBridge.clearActiveAnswer();
      copyActions.reset(false);
      setCopiedAnswerIds(new Set());
      const intro = config.initialMessage.replace(/\{library\}/g, initialMessageLibrary);
      setDisplayItems([{ content: intro, id: nextMessageId(), kind: 'message', role: 'assistant' }]);
      setConversation([]);
      setShowTyping(false);
    }, [config.initialMessage, copyActions, engine, initialMessageLibrary, renderBridge]);

    useLayoutEffect(() => {
      const messages = messagesRef.current;
      if (!messages || !stickToBottomRef.current) return;
      messages.scrollTop = messages.scrollHeight;
    }, [displayItems, showTyping]);

    useEffect(() => {
      const state = { busy, messages: conversation, open: actualOpen } as const;
      for (const listener of stateListenersRef.current) callContext7ListenerSafely(listener, state);
    }, [actualOpen, busy, conversation]);

    useEffect(() => {
      if (!busy || !shouldFocusStopRef.current) return;
      shouldFocusStopRef.current = false;
      sendButtonRef.current?.focus({ preventScroll: true });
    }, [busy]);

    useEffect(() => {
      const stateListeners = stateListenersRef.current;
      mountedRef.current = true;
      propsRef.current.onReady?.(baseDetail());
      return () => {
        mountedRef.current = false;
        stateListeners.clear();
      };
    }, []);

    useEffect(() => {
      registerReactContext7Widget(config.widgetId, handle);
      return () => unregisterReactContext7Widget(config.widgetId, handle);
    }, [config.widgetId, handle]);

    useEffect(() => {
      if (!mountedRef.current || previousOpenRef.current === actualOpen) return;
      previousOpenRef.current = actualOpen;
      externalTriggerRef.current?.setAttribute('aria-expanded', String(actualOpen));
      launcherRef.current?.setAttribute('aria-expanded', String(actualOpen));
      if (actualOpen) {
        lastFocusRef.current = document.activeElement;
        propsRef.current.onOpen?.(baseDetail());
        requestRenderFrame(() => {
          updateAnchor();
          if (openRef.current && !engine.isBusy()) inputRef.current?.focus({ preventScroll: true });
        });
      } else {
        propsRef.current.onClose?.(baseDetail());
        const lastFocus = lastFocusRef.current;
        if (lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus();
        lastFocusRef.current = null;
      }
    }, [actualOpen, engine, updateAnchor]);

    useEffect(() => {
      if (!actualOpen || config.position !== 'center' || !rootRef.current) return;
      return acquireContext7Modal(rootRef.current);
    }, [actualOpen, config.position]);

    useEffect(() => {
      let trigger: Element | null = null;
      let accessibility: Context7TriggerA11yState | null = null;
      let observer: MutationObserver | null = null;
      let invalidSelector = false;

      if (!shouldObserveReactCustomTrigger(props.customTrigger)) return;

      const unbind = () => {
        trigger?.removeEventListener('click', onTriggerClick);
        if (accessibility) restoreTriggerAccessibility(accessibility);
        if (activeAnchorRef.current === trigger) activeAnchorRef.current = null;
        if (externalTriggerRef.current === trigger) externalTriggerRef.current = null;
        trigger = null;
        accessibility = null;
        setHasBoundExternalTrigger(false);
      };
      const bind = () => {
        if (trigger?.isConnected) return;
        unbind();
        const candidate = resolveReactCustomTrigger(propsRef.current.customTrigger);
        if (!candidate || candidate === true) return;
        const triggerTarget = typeof candidate === 'string' ? normalizeContext7WidgetTrigger(candidate) : candidate;
        if (!triggerTarget) return;
        const resolution = resolveContext7CustomTrigger(triggerTarget, false);
        invalidSelector = resolution.invalidSelector;
        if (invalidSelector) {
          observer?.disconnect();
          observer = null;
          return;
        }
        if (!resolution.element?.isConnected) return;
        trigger = resolution.element;
        accessibility = captureTriggerAccessibility(trigger);
        trigger.setAttribute('aria-controls', panelId);
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-expanded', String(openRef.current));
        trigger.addEventListener('click', onTriggerClick);
        externalTriggerRef.current = trigger;
        setHasBoundExternalTrigger(true);
      };
      function onTriggerClick(event: Event): void {
        event.preventDefault();
        activeAnchorRef.current = trigger;
        actionsRef.current?.toggle();
      }

      bind();
      if (!invalidSelector && typeof MutationObserver === 'function') {
        observer = new MutationObserver(bind);
        observer.observe(document.documentElement, { childList: true, subtree: true });
      }
      return () => {
        observer?.disconnect();
        unbind();
      };
    }, [panelId, props.customTrigger]);

    useEffect(() => {
      if (!actualOpen) return;
      let frame: number | null = null;
      let resizeObserver: ResizeObserver | null = null;
      const viewport = window.visualViewport;
      const schedule = () => {
        if (frame !== null) return;
        frame = requestRenderFrame(() => {
          frame = null;
          if (openRef.current) updateAnchor();
        });
      };
      const onLayout = (event: Event) => {
        if (event.type === 'scroll' && rootRef.current && event.composedPath().includes(rootRef.current)) return;
        schedule();
      };
      const onOutside = (event: Event) => {
        if (!configRef.current.closeOnOutsideClick) return;
        const path = event.composedPath();
        if (rootRef.current && path.includes(rootRef.current)) return;
        if (externalTriggerRef.current && path.includes(externalTriggerRef.current)) return;
        actionsRef.current?.close();
      };

      if (config.closeOnOutsideClick) document.addEventListener('pointerdown', onOutside, true);
      if (config.position === 'anchor') {
        window.addEventListener('resize', onLayout);
        window.addEventListener('scroll', onLayout, true);
        viewport?.addEventListener('resize', onLayout);
        viewport?.addEventListener('scroll', onLayout);
        if (typeof ResizeObserver === 'function') {
          resizeObserver = new ResizeObserver(schedule);
          const anchor = getAnchorElement();
          if (anchor) resizeObserver.observe(anchor);
          if (panelRef.current) resizeObserver.observe(panelRef.current);
        }
        updateAnchor();
      }

      return () => {
        document.removeEventListener('pointerdown', onOutside, true);
        window.removeEventListener('resize', onLayout);
        window.removeEventListener('scroll', onLayout, true);
        viewport?.removeEventListener('resize', onLayout);
        viewport?.removeEventListener('scroll', onLayout);
        resizeObserver?.disconnect();
        cancelRenderFrame(frame);
      };
    }, [
      actualOpen,
      config.closeOnOutsideClick,
      config.position,
      getAnchorElement,
      hasBoundExternalTrigger,
      updateAnchor
    ]);

    function resizeInput(): void {
      const input = inputRef.current;
      if (!input) return;
      input.style.height = 'auto';
      input.style.height = `${Math.min(input.scrollHeight, 84)}px`;
    }

    function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
      if (event.key === 'Escape' && actualOpen) {
        event.preventDefault();
        close();
      } else if (
        event.key === 'Enter' &&
        !event.shiftKey &&
        !event.nativeEvent.isComposing &&
        event.target === inputRef.current &&
        !busy
      ) {
        event.preventDefault();
        shouldFocusStopRef.current = true;
        void send();
      } else if (event.key === 'Tab' && actualOpen && config.position === 'center' && panelRef.current) {
        trapFocus(event.nativeEvent, panelRef.current);
      }
      props.rootProps?.onKeyDown?.(event);
    }

    function onSubmit(event: ReactSubmitEvent<HTMLFormElement>): void {
      event.preventDefault();
      if (busy) cancel();
      else void send();
    }

    function onLauncherClick(event: ReactMouseEvent<HTMLButtonElement>): void {
      activeAnchorRef.current = event.currentTarget;
      toggle();
    }

    function onDelegatedCopyClick(event: ReactMouseEvent<HTMLDivElement>): void {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const button = target.closest<HTMLButtonElement>('[data-c7-copy-code]');
      if (!button || !messagesRef.current?.contains(button)) return;
      event.stopPropagation();
      const code = button.closest('.c7-code-block')?.querySelector('code')?.textContent ?? '';
      void copyActions.copy(button, code);
    }

    function onMessagesScroll(event: ReactUIEvent<HTMLDivElement>): void {
      stickToBottomRef.current = isNearBottom(event.currentTarget);
    }

    function retryError(id: string): void {
      setDisplayItems((items) => items.filter((item) => item.id !== id));
      void retry();
    }

    function toggleTool(id: string): void {
      setDisplayItems((items) =>
        items.map((item) => (item.kind === 'tool' && item.id === id ? { ...item, expanded: !item.expanded } : item))
      );
    }

    const resolvedCustomTrigger = resolveReactCustomTrigger(props.customTrigger);
    const rendersManagedTrigger = resolvedCustomTrigger === true;
    const hasCustomTrigger = rendersManagedTrigger || hasBoundExternalTrigger;
    const customTriggerSelector = rendersManagedTrigger
      ? `#${managedTriggerId}`
      : typeof resolvedCustomTrigger === 'string'
        ? normalizeContext7WidgetTrigger(resolvedCustomTrigger)
        : undefined;
    const rootProps = props.rootProps;
    const className = ['context7-widget', rootProps?.className].filter(Boolean).join(' ');
    const style = {
      ...rootProps?.style,
      '--c7-accent': config.color || undefined,
      '--c7-panel-height': config.panelHeight || undefined,
      '--c7-panel-width': config.panelWidth || undefined
    } as import('react').CSSProperties & Record<string, string | number | undefined>;
    const hostAttributes: Record<string, boolean | string | undefined> = {
      'backdrop-active': config.backdrop ? '' : undefined,
      'close-on-outside-click': String(config.closeOnOutsideClick),
      color: config.color || undefined,
      'custom-trigger': customTriggerSelector,
      'custom-trigger-active': hasCustomTrigger ? '' : undefined,
      'default-open': String(config.defaultOpen),
      'launcher-variant': config.launcherVariant,
      library: config.library,
      open: actualOpen || undefined,
      'panel-height': config.panelHeight || undefined,
      'panel-width': config.panelWidth || undefined,
      position: config.position,
      preset: config.preset,
      theme: config.theme,
      'widget-id': config.widgetId
    };

    return (
      <div {...rootProps} {...hostAttributes} ref={rootRef} className={className} style={style} onKeyDown={onKeyDown}>
        <div
          className="c7-backdrop"
          data-c7-backdrop
          part="backdrop"
          aria-hidden="true"
          onClick={() => {
            if (config.closeOnOutsideClick) close();
          }}
        />

        {rendersManagedTrigger ? (
          <button
            id={managedTriggerId}
            ref={managedTriggerRef}
            className="context7-widget-trigger"
            type="button"
            aria-label={config.launcherLabel}
            aria-controls={panelId}
            aria-expanded={actualOpen}
            aria-haspopup="dialog"
            data-preset={config.preset}
            data-theme={config.theme}
            onClick={onLauncherClick}
          >
            {typeof props.trigger === 'function'
              ? props.trigger({ label: config.launcherLabel, triggerId: managedTriggerId })
              : (props.trigger ?? config.launcherLabel)}
          </button>
        ) : null}

        <section
          id={panelId}
          ref={panelRef}
          aria-label={config.title}
          aria-busy={busy}
          aria-modal={config.position === 'center'}
          className="c7-panel"
          part="panel"
          role="dialog"
        >
          <header className="c7-header" part="header">
            <div className="c7-title" part="title">
              {config.title}
            </div>
            <button
              className="c7-close"
              part="close-button"
              type="button"
              aria-label={config.labels.close}
              onClick={close}
            >
              {CLOSE_ICON}
            </button>
          </header>

          <div
            ref={messagesRef}
            aria-label={config.labels.conversation}
            aria-live="polite"
            aria-relevant="additions text"
            className="c7-messages"
            part="messages"
            role="log"
            onClick={onDelegatedCopyClick}
            onScroll={onMessagesScroll}
          >
            {displayItems.map((item) => {
              if (item.kind === 'message') {
                const copied = item.role === 'assistant' && copiedAnswerIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    className={`c7-message c7-message--${item.role}`}
                    part={`message ${item.role}-message`}
                  >
                    {item.role === 'assistant' && !item.streaming ? (
                      <CompletedMarkdown
                        content={item.content}
                        copyCodeLabel={config.labels.copyCode}
                        library={config.library}
                        linkBaseUrl={config.linkBaseUrl}
                      />
                    ) : (
                      <div>{item.content}</div>
                    )}
                    {item.role === 'assistant' && !item.streaming ? (
                      <button
                        aria-disabled={copied || undefined}
                        aria-label={copied ? config.labels.copied : config.labels.copyAnswer}
                        className="c7-copy-answer"
                        data-c7-copy-answer
                        data-c7-copied={copied ? '' : undefined}
                        title={copied ? config.labels.copied : config.labels.copyAnswer}
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void copyActions.copy(item.id, item.content);
                        }}
                      >
                        <svg
                          className="c7-copy-icon"
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path className="c7-copy-icon--copy" d="M5 5h9v9H5zM2 11V2h9"></path>
                          <path className="c7-copy-icon--copied" d="m3 8 3 3 7-7"></path>
                        </svg>
                        <span aria-live="polite" className="c7-copy-status">
                          {copied ? config.labels.copied : ''}
                        </span>
                      </button>
                    ) : null}
                  </div>
                );
              }

              if (item.kind === 'error') {
                return (
                  <div key={item.id} className="c7-message c7-message--error" part="message error-message" role="alert">
                    {/* This sink only receives escaped output from buildContext7ErrorHtml. */}
                    <div dangerouslySetInnerHTML={{ __html: item.html }} />
                    <button className="c7-retry" type="button" onClick={() => retryError(item.id)}>
                      {config.labels.retry}
                    </button>
                  </div>
                );
              }

              return (
                <div key={item.id} className="c7-tool-call" part="tool-call">
                  <div className="c7-tool-header">
                    {SEARCH_ICON}
                    <span>
                      {config.labels.searching}: {item.query}
                    </span>
                    {!item.hasResult ? (
                      <svg
                        className="c7-spinner"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                    ) : null}
                  </div>
                  {item.hasResult ? (
                    <div className="c7-tool-result">
                      <button
                        className="c7-tool-toggle"
                        part="tool-toggle"
                        type="button"
                        aria-controls={item.contentId}
                        aria-expanded={item.expanded}
                        onClick={() => toggleTool(item.id)}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                        <span>{item.expanded ? config.labels.hideResults : config.labels.viewResults}</span>
                      </button>
                      <div
                        id={item.contentId}
                        aria-label={config.labels.searchResults}
                        className="c7-tool-content"
                        role="region"
                        hidden={!item.expanded}
                      >
                        <pre>{item.result}</pre>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}

            {showTyping ? (
              <div aria-label={config.labels.responding} className="c7-typing" part="typing" role="status">
                <span aria-hidden="true" />
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </div>
            ) : null}
          </div>

          <form className="c7-composer" part="composer" onSubmit={onSubmit}>
            <textarea
              ref={inputRef}
              value={draft}
              aria-label={config.labels.input}
              className="c7-input"
              part="input"
              autoComplete="off"
              readOnly={busy}
              rows={1}
              placeholder={config.placeholder}
              onChange={(event) => {
                setDraft(event.currentTarget.value);
                resizeInput();
              }}
            />
            <button
              ref={sendButtonRef}
              aria-label={busy ? config.labels.stopResponse : config.labels.sendQuestion}
              className="c7-send"
              part="send-button"
              type="submit"
            >
              {busy ? config.labels.stop : config.labels.send}
            </button>
          </form>

          <footer className="c7-footer" part="footer">
            <span className="c7-branding" part="powered-by" aria-label={config.labels.branding}>
              <a
                className="c7-brand-link"
                href={CONTEXT7_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={config.labels.context7Attribution}
                title={config.labels.context7Attribution}
              >
                <span className="c7-brand-prefix">{config.labels.poweredBy}</span>
                <svg
                  className="c7-brand-logo c7-brand-logo--context7"
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
              <span className="c7-brand-separator" aria-hidden="true">
                ·
              </span>
              <a
                className="c7-brand-link"
                href={DESOURCE_LABS_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={config.labels.deSourceLabsAttribution}
                title={config.labels.deSourceLabsAttribution}
              >
                <span className="c7-brand-prefix">{config.labels.enhancedBy}</span>
                <img className="c7-brand-logo c7-brand-logo--desource" src={deSourceLabsLogoUrl} alt="" />
              </a>
            </span>
          </footer>
        </section>

        {!hasCustomTrigger ? (
          <button
            ref={launcherRef}
            className="c7-launcher"
            part="launcher"
            type="button"
            aria-controls={panelId}
            aria-expanded={actualOpen}
            aria-label={config.launcherLabel}
            aria-haspopup="dialog"
            onClick={onLauncherClick}
          >
            {LAUNCHER_ICON}
            <span className="c7-launcher-label">{config.launcherLabel}</span>
          </button>
        ) : null}

        {props.children}
      </div>
    );
  }
);

function resolveReactCustomTrigger(value: Context7ReactCustomTrigger | undefined): Element | string | true | undefined {
  if (value === true || typeof value === 'string' || isContext7WidgetTriggerElement(value)) return value;
  const current = value && typeof value === 'object' && 'current' in value ? value.current : null;
  return isContext7WidgetTriggerElement(current) ? current : undefined;
}

function shouldObserveReactCustomTrigger(value: Context7ReactCustomTrigger | undefined): boolean {
  if (typeof value === 'string') return Boolean(normalizeContext7WidgetTrigger(value));
  if (isContext7WidgetTriggerElement(value)) return true;
  return Boolean(value && value !== true && typeof value === 'object' && 'current' in value);
}

function areContext7MessagesEqual(current: readonly Context7Message[], next: readonly Context7Message[]): boolean {
  if (current === next) return true;
  if (current.length !== next.length) return false;
  return current.every((message, index) => message === next[index]);
}

function isNearBottom(element: HTMLElement): boolean {
  return element.scrollHeight - element.scrollTop - element.clientHeight <= STICKY_SCROLL_THRESHOLD;
}

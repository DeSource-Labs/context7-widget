<svelte:options runes={true} />

<script lang="ts">
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
    createContext7CompletedMarkdownRenderer,
    createContext7ConversationEngine,
    createContext7ConversationRenderBridge,
    deSourceLabsLogoUrl,
    formatContext7ToolResult,
    getContext7ToolQuery,
    isContext7WidgetTriggerElement,
    normalizeContext7WidgetTrigger,
    requestRenderFrame,
    resolveContext7CustomTrigger,
    resolveContext7MarkdownBaseUrl,
    resolveContext7WidgetConfig,
    restoreTriggerAccessibility,
    syncContext7CopyButton,
    trapFocus,
    updateAnchorPosition as positionAnchor,
    type Context7ConversationEvent,
    type Context7ConversationState,
    type Context7Message,
    type Context7RenderedMarkdown,
    type Context7ToolCall,
    type Context7ToolResult,
    type Context7TriggerA11yState,
    type Context7WidgetEventName,
    type Context7WidgetLifecycleEventDetail,
    type Context7WidgetSendResult
  } from '@desource/context7-widget/kit';
  import { onMount, tick } from 'svelte';
  import { registerSvelteContext7Widget, unregisterSvelteContext7Widget } from './internal/registry.js';
  import type {
    Context7WidgetCallbacks,
    Context7WidgetHandle,
    Context7WidgetProps,
    Context7WidgetState,
    Context7WidgetStateListener,
    DisplayItem,
    MessageDisplayItem,
    ToolDisplayItem
  } from './types.js';

  let {
    backdrop,
    children,
    closeOnOutsideClick,
    color,
    customTrigger,
    defaultOpen,
    initialMessage,
    labels,
    launcherLabel,
    launcherVariant,
    library,
    linkBaseUrl,
    onAnswer,
    onAnswerComplete,
    onCancel,
    onClose,
    onError,
    onFirstToken,
    onOpen,
    onQuestion,
    onReady,
    onToolCall,
    onToolResult,
    open: openState = $bindable(),
    panelHeight,
    panelWidth,
    placeholder,
    position,
    preset,
    rootProps,
    theme,
    title,
    trigger,
    widgetId
  }: Context7WidgetProps = $props();

  const rawInstanceId = $props.id();
  const instanceId = rawInstanceId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const managedTriggerId = `context7-widget-trigger-${instanceId}`;
  const panelId = `context7-widget-panel-${instanceId}`;
  const STICKY_SCROLL_THRESHOLD = 48;
  const QUEUED_SCROLL_FRAME = -1;
  let root = $state<HTMLElement>();
  let panel = $state<HTMLElement>();
  let input = $state<HTMLTextAreaElement>();
  let sendButton = $state<HTMLButtonElement>();
  let launcher = $state<HTMLButtonElement>();
  let managedTrigger = $state<HTMLButtonElement>();
  let messagesElement = $state<HTMLElement>();
  let isOpenState = $state(false);
  let busy = $state(false);
  let draft = $state('');
  let displayItems = $state<DisplayItem[]>([]);
  let copiedAnswerIds = $state<ReadonlySet<string>>(new Set());
  let showTyping = $state(false);
  let activeAnchor = $state<Element | null>(null);
  let hasBoundExternalTrigger = $state(false);
  let mounted = $state(false);
  let messageCounter = 0;
  let customTriggerObserver: MutationObserver | null = null;
  let customTriggerSelectorInvalid = false;
  let customTriggerWarningKey = '';
  let externalTrigger: Element | null = null;
  let externalTriggerAccessibility: Context7TriggerA11yState | null = null;
  let floatingLayoutFrame: number | null = null;
  let floatingResizeObserver: ResizeObserver | null = null;
  let floatingViewport: VisualViewport | null = null;
  let lastFocus: Element | null = null;
  let releaseModal: (() => void) | null = null;
  let registeredWidgetId = '';
  let shouldStickToBottom = true;
  let scrollFrame: number | null = null;
  let scrollGeneration = 0;
  let previousResetKey = '';
  let previousTrigger: Element | string | true | undefined;
  let previousPosition = '';
  let previousCloseOnOutsideClick: boolean | undefined;
  let previousWidgetId = '';
  let previousDefaultOpen = false;
  // Imperative subscriptions never participate in template reactivity.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const stateListeners = new Set<Context7WidgetStateListener>();

  type SvelteAnswerRender = {
    answer: string;
    answerItem: MessageDisplayItem | undefined;
    renderFrame: number | null;
  };

  const callbacks = $derived<Context7WidgetCallbacks>({
    onAnswer,
    onAnswerComplete,
    onCancel,
    onClose,
    onError,
    onFirstToken,
    onOpen,
    onQuestion,
    onReady,
    onToolCall,
    onToolResult
  });
  const resolvedConfig = $derived.by(() =>
    resolveContext7WidgetConfig(
      compactContext7WidgetOptions({
        backdrop,
        closeOnOutsideClick,
        color,
        defaultOpen,
        initialMessage,
        labels,
        launcherLabel,
        launcherVariant,
        library,
        linkBaseUrl,
        panelHeight,
        panelWidth,
        placeholder,
        position,
        preset,
        theme,
        title,
        widgetId
      })
    )
  );
  const resolvedCustomTrigger = $derived(resolveSvelteCustomTrigger(customTrigger));
  const rendersManagedTrigger = $derived(resolvedCustomTrigger === true);
  const hasCustomTrigger = $derived(rendersManagedTrigger || hasBoundExternalTrigger);
  const customTriggerSelector = $derived(
    resolvedCustomTrigger === true
      ? `#${managedTriggerId}`
      : typeof resolvedCustomTrigger === 'string'
        ? normalizeContext7WidgetTrigger(resolvedCustomTrigger)
        : undefined
  );
  const widgetStyle = $derived(
    [
      rootProps?.style ?? '',
      resolvedConfig.color ? `--c7-accent:${resolvedConfig.color}` : '',
      resolvedConfig.panelHeight ? `--c7-panel-height:${resolvedConfig.panelHeight}` : '',
      resolvedConfig.panelWidth ? `--c7-panel-width:${resolvedConfig.panelWidth}` : ''
    ]
      .filter(Boolean)
      .join(';')
  );
  const reflectedAttributes = $derived<Record<string, string | undefined>>({
    'backdrop-active': resolvedConfig.backdrop ? '' : undefined,
    'close-on-outside-click': String(resolvedConfig.closeOnOutsideClick),
    color: resolvedConfig.color || undefined,
    'custom-trigger': customTriggerSelector,
    'custom-trigger-active': hasCustomTrigger ? '' : undefined,
    'default-open': String(resolvedConfig.defaultOpen),
    'launcher-variant': resolvedConfig.launcherVariant,
    library: resolvedConfig.library,
    open: isOpenState ? '' : undefined,
    'panel-height': resolvedConfig.panelHeight || undefined,
    'panel-width': resolvedConfig.panelWidth || undefined,
    position: resolvedConfig.position,
    preset: resolvedConfig.preset,
    theme: resolvedConfig.theme,
    'widget-id': resolvedConfig.widgetId
  });

  type CopyActionKey = HTMLButtonElement | string;
  const copyActions = createContext7CopyActionController<CopyActionKey>({
    onChange(key, copied) {
      if (typeof key === 'string') {
        // Reassigning the $state value makes this immutable Set replacement reactive.
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        const next = new Set(copiedAnswerIds);
        if (copied) next.add(key);
        else next.delete(key);
        copiedAnswerIds = next;
      } else {
        syncContext7CopyButton(key, copied, resolvedConfig.labels.copyCode, resolvedConfig.labels.copied);
      }
    }
  });
  const renderCompletedMarkdownCached = createContext7CompletedMarkdownRenderer();

  function renderCompletedMarkdown(item: MessageDisplayItem): Context7RenderedMarkdown {
    return renderCompletedMarkdownCached(item, {
      baseUrl: resolveContext7MarkdownBaseUrl(resolvedConfig.library, resolvedConfig.linkBaseUrl),
      copyCodeLabel: resolvedConfig.labels.copyCode
    });
  }

  function resolveSvelteCustomTrigger(
    value: Context7WidgetProps['customTrigger']
  ): Element | string | true | undefined {
    return value === true || typeof value === 'string' || isContext7WidgetTriggerElement(value) ? value : undefined;
  }

  function nextMessageId(): string {
    return `c7m-${++messageCounter}`;
  }

  const engine = createContext7ConversationEngine({
    missingLibraryMessage: () => resolvedConfig.labels.missingLibrary,
    nextMessageId,
    resolveConfig: () => ({ library: resolvedConfig.library })
  });

  function detail(): Context7WidgetLifecycleEventDetail {
    return { library: resolvedConfig.library, widget: root!, widgetId: resolvedConfig.widgetId };
  }

  function emitCallback(eventName: Context7WidgetEventName, eventDetail: unknown): void {
    const callback = {
      'c7:answer': callbacks.onAnswer,
      'c7:answer-complete': callbacks.onAnswerComplete,
      'c7:cancel': callbacks.onCancel,
      'c7:close': callbacks.onClose,
      'c7:error': callbacks.onError,
      'c7:first-token': callbacks.onFirstToken,
      'c7:open': callbacks.onOpen,
      'c7:question': callbacks.onQuestion,
      'c7:ready': callbacks.onReady,
      'c7:tool-call': callbacks.onToolCall,
      'c7:tool-result': callbacks.onToolResult
    }[eventName] as ((value: never) => void) | undefined;
    if (callback) callContext7ListenerSafely(callback, eventDetail as never);
  }

  export function reset(): void {
    if (!mounted) return;
    engine.reset();
    renderBridge.clearActiveAnswer();
    copyActions.reset(false);
    copiedAnswerIds = new Set();
    const intro = resolvedConfig.initialMessage.replace(
      /\{library\}/g,
      resolvedConfig.library || resolvedConfig.labels.libraryFallback
    );
    displayItems = [{ content: intro, id: nextMessageId(), kind: 'message', role: 'assistant' }];
    cancelScheduledScroll();
    shouldStickToBottom = true;
    scrollToBottom();
    notifyState();
  }

  function openFrom(target: EventTarget | null): void {
    if (target instanceof Element) activeAnchor = target;
    toggle();
  }

  function commitOpen(value: boolean): void {
    if (!mounted) return;
    if (isOpenState === value) return;
    isOpenState = value;
    openState = value;
    if (!value) {
      syncExternalTriggerExpandedState();
      unbindFloatingListeners();
      releaseModalState();
      emitCallback('c7:close', detail());
      notifyState();
      if (lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus();
      return;
    }
    lastFocus = document.activeElement;
    syncModalState();
    syncExternalTriggerExpandedState();
    bindFloatingListeners();
    emitCallback('c7:open', detail());
    notifyState();
    void tick().then(() => {
      updateAnchorPosition();
      if (isOpenState) focusInput();
    });
  }

  export function open(): void {
    commitOpen(true);
  }
  export function close(): void {
    commitOpen(false);
  }
  export function toggle(): void {
    commitOpen(!isOpenState);
  }
  export function cancel(): void {
    if (!mounted) return;
    engine.cancel();
    void tick().then(() => input?.focus());
  }

  function releaseModalState(): void {
    releaseModal?.();
    releaseModal = null;
  }

  function syncModalState(): void {
    releaseModalState();
    if (isOpenState && resolvedConfig.position === 'center' && root) releaseModal = acquireContext7Modal(root);
  }

  export async function retry(): Promise<Context7WidgetSendResult | undefined> {
    if (!mounted) return undefined;
    open();
    const result = await engine.retry();
    if (!busy) input?.focus();
    return result;
  }

  function retryError(id: string): void {
    displayItems = displayItems.filter((item) => item.id !== id);
    void retry();
  }

  export async function send(rawQuestion?: string): Promise<Context7WidgetSendResult | undefined> {
    if (!mounted) return undefined;
    const question = (rawQuestion ?? draft).trim();
    if (question && !busy && resolvedConfig.library) {
      open();
      draft = '';
      void tick().then(resizeInput);
    }
    const result = await engine.send(question);
    if (!busy) input?.focus();
    return result;
  }

  function onConversationState(state: Context7ConversationState): void {
    const moveFocus = state.busy && document.activeElement === input;
    busy = state.busy;
    if (!state.busy) {
      showTyping = false;
      renderBridge.clearActiveAnswer();
    }
    notifyState(state.messages);
    if (moveFocus) void tick().then(() => sendButton?.focus({ preventScroll: true }));
  }

  function renderQuestion(event: Context7ConversationEvent<'c7:question'>): SvelteAnswerRender {
    if (!event.detail.retry) displayItems.push({ ...event.detail.message, kind: 'message' });
    showTyping = true;
    scrollToBottom();
    return { answer: '', answerItem: undefined, renderFrame: null };
  }

  function renderAnswer(event: Context7ConversationEvent<'c7:answer'>, render: SvelteAnswerRender): void {
    showTyping = false;
    render.answer = event.detail.answer;
    if (!render.answerItem) {
      displayItems.push({ content: '', id: nextMessageId(), kind: 'message', role: 'assistant', streaming: true });
      render.answerItem = displayItems[displayItems.length - 1] as MessageDisplayItem;
    }
    render.renderFrame ??= requestRenderFrame(() => {
      render.renderFrame = null;
      render.answerItem!.content = render.answer;
      scrollToBottom();
    });
  }

  function flushAnswerRender(render: SvelteAnswerRender, answer: string): void {
    cancelRenderFrame(render.renderFrame);
    render.renderFrame = null;
    if (render.answerItem) {
      render.answerItem.content = answer;
      render.answerItem.streaming = false;
      scrollToBottom();
    }
  }
  function clearAnswerRender(render: SvelteAnswerRender): void {
    cancelRenderFrame(render.renderFrame);
  }
  function discardAnswerRender(render: SvelteAnswerRender): void {
    cancelRenderFrame(render.renderFrame);
    if (render.answerItem) displayItems = displayItems.filter((item) => item !== render.answerItem);
  }

  const renderBridge = createContext7ConversationRenderBridge<SvelteAnswerRender>({
    clearAnswer: clearAnswerRender,
    discardAnswer: discardAnswerRender,
    emit: (event) => emitCallback(event.type, { ...detail(), ...event.detail }),
    flushAnswer: (render, event) => flushAnswerRender(render, event.detail.answer),
    onAnswer: renderAnswer,
    onError(event) {
      displayItems.push({
        html: buildContext7ErrorHtml(
          String(event.detail.error || resolvedConfig.labels.errorFallback),
          resolvedConfig.library,
          resolvedConfig.labels
        ),
        id: nextMessageId(),
        kind: 'error',
        question: event.detail.question
      });
      scrollToBottom();
    },
    onQuestion: renderQuestion,
    onToolCall(event) {
      showTyping = false;
      appendToolCall(event.detail.toolCall);
    },
    onToolResult: (event) => updateToolResult(event.detail.toolResult)
  });

  function appendToolCall(toolCall: Context7ToolCall): void {
    const id = nextMessageId();
    displayItems.push({
      contentId: `${panelId}-${id}-tool-result`,
      expanded: false,
      hasResult: false,
      id,
      kind: 'tool',
      query: getContext7ToolQuery(toolCall),
      result: '',
      toolCallId: toolCall.toolCallId
    });
    scrollToBottom();
  }

  function updateToolResult(toolResult: Context7ToolResult): void {
    const item = displayItems.find(
      (candidate): candidate is ToolDisplayItem =>
        candidate.kind === 'tool' && candidate.toolCallId === toolResult.toolCallId
    );
    if (item) {
      const result = formatContext7ToolResult(toolResult.result);
      if (!result) return;
      item.hasResult = true;
      item.result = result;
    }
    scrollToBottom();
  }

  function scrollToBottom(): void {
    if (!shouldStickToBottom || scrollFrame !== null) return;
    scrollFrame = QUEUED_SCROLL_FRAME;
    const generation = scrollGeneration;
    void tick().then(() => {
      if (generation !== scrollGeneration) return;
      scrollFrame = requestRenderFrame(() => {
        if (generation !== scrollGeneration) return;
        scrollFrame = null;
        if (shouldStickToBottom && messagesElement) messagesElement.scrollTop = messagesElement.scrollHeight;
      });
    });
  }

  function cancelScheduledScroll(): void {
    scrollGeneration += 1;
    if (scrollFrame !== QUEUED_SCROLL_FRAME) cancelRenderFrame(scrollFrame);
    scrollFrame = null;
  }

  function onMessagesScroll(): void {
    if (!messagesElement) return;
    const wasSticky = shouldStickToBottom;
    shouldStickToBottom =
      messagesElement.scrollHeight - messagesElement.clientHeight - messagesElement.scrollTop <=
      STICKY_SCROLL_THRESHOLD;
    if (!wasSticky && shouldStickToBottom) scrollToBottom();
  }

  function resizeInput(): void {
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 84)}px`;
  }
  function copyAnswer(item: MessageDisplayItem): void {
    void copyActions.copy(item.id, item.content);
  }

  function onDelegatedCopyClick(event: Event): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLButtonElement>('[data-c7-copy-code]');
    if (!button || !messagesElement?.contains(button)) return;
    event.stopPropagation();
    const code = button.closest('.c7-code-block')?.querySelector('code')?.textContent ?? '';
    void copyActions.copy(button, code);
  }

  function onBackdropClick(): void {
    if (resolvedConfig.closeOnOutsideClick) close();
  }

  function onDocumentPointerDown(event: Event): void {
    if (!isOpenState || !resolvedConfig.closeOnOutsideClick) return;
    const path = event.composedPath();
    if (root && path.includes(root)) return;
    if (externalTrigger && path.includes(externalTrigger)) return;
    close();
  }

  function onKeyDown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }): void {
    if (event.key === 'Escape' && isOpenState) {
      event.preventDefault();
      close();
    } else if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.target === input && !busy) {
      event.preventDefault();
      void send();
    } else if (event.key === 'Tab' && isOpenState && resolvedConfig.position === 'center' && panel) {
      trapFocus(event, panel);
    }
    rootProps?.onkeydown?.(event);
  }

  function bindExternalTrigger(): void {
    unbindExternalTrigger();
    customTriggerSelectorInvalid = false;
    const triggerTarget = normalizeExternalTrigger(resolvedCustomTrigger);
    if (!triggerTarget) return;
    const resolution = resolveContext7CustomTrigger(triggerTarget, false);
    customTriggerSelectorInvalid = resolution.invalidSelector;
    if (resolution.element?.isConnected) {
      externalTrigger = resolution.element;
      externalTrigger.addEventListener('click', onExternalTriggerClick);
      externalTriggerAccessibility = captureTriggerAccessibility(externalTrigger);
      externalTrigger.setAttribute('aria-controls', panelId);
      externalTrigger.setAttribute('aria-haspopup', 'dialog');
      externalTrigger.setAttribute('aria-expanded', String(isOpenState));
      hasBoundExternalTrigger = true;
      customTriggerWarningKey = '';
    } else warnExternalTriggerBindingFailure(triggerTarget, resolution.invalidSelector);
    observeExternalTrigger();
  }

  function unbindExternalTrigger(): void {
    customTriggerObserver?.disconnect();
    customTriggerObserver = null;
    if (activeAnchor === externalTrigger) activeAnchor = null;
    externalTrigger?.removeEventListener('click', onExternalTriggerClick);
    if (externalTriggerAccessibility) restoreTriggerAccessibility(externalTriggerAccessibility);
    externalTriggerAccessibility = null;
    externalTrigger = null;
    hasBoundExternalTrigger = false;
  }
  function syncExternalTriggerExpandedState(): void {
    externalTrigger?.setAttribute('aria-expanded', String(isOpenState));
  }
  function normalizeExternalTrigger(value: Element | string | true | undefined): Element | string | null {
    if (typeof value === 'string') return normalizeContext7WidgetTrigger(value) || null;
    return isContext7WidgetTriggerElement(value) ? value : null;
  }

  function observeExternalTrigger(): void {
    const triggerTarget = normalizeExternalTrigger(resolvedCustomTrigger);
    if (!triggerTarget || customTriggerSelectorInvalid || typeof MutationObserver !== 'function') return;
    customTriggerObserver = new MutationObserver(() => {
      if (externalTrigger?.isConnected) return;
      bindExternalTrigger();
      if (isOpenState) {
        bindFloatingListeners();
        updateAnchorPosition();
      }
    });
    customTriggerObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  function warnExternalTriggerBindingFailure(triggerTarget: Element | string, invalidSelector: boolean): void {
    const warningKey = isContext7WidgetTriggerElement(triggerTarget) ? 'element' : `selector:${triggerTarget}`;
    if (customTriggerWarningKey === warningKey) return;
    customTriggerWarningKey = warningKey;
    if (isContext7WidgetTriggerElement(triggerTarget))
      console.warn('[Context7 Widget] Custom trigger element is not connected. Keeping the built-in launcher visible.');
    else if (invalidSelector) console.warn(`[Context7 Widget] Invalid custom trigger selector: ${triggerTarget}`);
    else
      console.warn(
        `[Context7 Widget] Custom trigger selector was not found: ${triggerTarget}. Keeping the built-in launcher visible.`
      );
  }

  function onExternalTriggerClick(event: Event): void {
    event.preventDefault();
    activeAnchor = event.currentTarget as Element;
    toggle();
  }
  function scheduleAnchorPositionUpdate(): void {
    if (!isOpenState || floatingLayoutFrame !== null) return;
    floatingLayoutFrame = requestRenderFrame(() => {
      floatingLayoutFrame = null;
      if (isOpenState) updateAnchorPosition();
    });
  }
  function onFloatingLayout(event: Event): void {
    if (event.type === 'scroll' && root && event.composedPath().includes(root)) return;
    scheduleAnchorPositionUpdate();
  }

  function bindFloatingListeners(): void {
    unbindFloatingListeners();
    if (resolvedConfig.closeOnOutsideClick) document.addEventListener('pointerdown', onDocumentPointerDown, true);
    if (resolvedConfig.position !== 'anchor') return;
    window.addEventListener('resize', onFloatingLayout);
    window.addEventListener('scroll', onFloatingLayout, true);
    floatingViewport = window.visualViewport;
    floatingViewport?.addEventListener('resize', onFloatingLayout);
    floatingViewport?.addEventListener('scroll', onFloatingLayout);
    if (typeof ResizeObserver === 'function') {
      floatingResizeObserver = new ResizeObserver(scheduleAnchorPositionUpdate);
      const anchor = getAnchorElement();
      if (anchor) floatingResizeObserver.observe(anchor);
      if (panel) floatingResizeObserver.observe(panel);
    }
  }

  function unbindFloatingListeners(): void {
    document.removeEventListener('pointerdown', onDocumentPointerDown, true);
    window.removeEventListener('resize', onFloatingLayout);
    window.removeEventListener('scroll', onFloatingLayout, true);
    floatingViewport?.removeEventListener('resize', onFloatingLayout);
    floatingViewport?.removeEventListener('scroll', onFloatingLayout);
    floatingViewport = null;
    floatingResizeObserver?.disconnect();
    floatingResizeObserver = null;
    cancelRenderFrame(floatingLayoutFrame);
    floatingLayoutFrame = null;
  }

  function getAnchorElement(): Element | null {
    return (
      (activeAnchor?.isConnected ? activeAnchor : null) ??
      managedTrigger ??
      (externalTrigger?.isConnected ? externalTrigger : null) ??
      launcher ??
      null
    );
  }
  function updateAnchorPosition(): void {
    positionAnchor(resolvedConfig.position, getAnchorElement(), panel, root?.style);
  }

  export function getMessages(): readonly Context7Message[] {
    return engine.getMessages();
  }
  export function isOpen(): boolean {
    return isOpenState;
  }
  export function isBusy(): boolean {
    return busy;
  }
  function notifyState(messages: readonly Context7Message[] = getMessages()): void {
    if (stateListeners.size === 0) return;
    const state: Context7WidgetState = { busy, messages, open: isOpenState };
    for (const listener of stateListeners) callContext7ListenerSafely(listener, state);
  }
  export function subscribe(listener: Context7WidgetStateListener): () => void {
    stateListeners.add(listener);
    callContext7ListenerSafely(listener, { busy, messages: getMessages(), open: isOpenState });
    return () => stateListeners.delete(listener);
  }
  export function element(): HTMLElement | null {
    return root ?? null;
  }

  const exposed: Context7WidgetHandle = {
    cancel,
    close,
    element,
    getMessages,
    isBusy,
    isOpen,
    open,
    reset,
    retry,
    send,
    subscribe,
    toggle
  };
  function register(): void {
    const currentId = resolvedConfig.widgetId;
    if (registeredWidgetId && registeredWidgetId !== currentId)
      unregisterSvelteContext7Widget(registeredWidgetId, exposed);
    registerSvelteContext7Widget(currentId, exposed);
    registeredWidgetId = currentId;
  }
  function focusInput(): void {
    input?.focus({ preventScroll: true });
  }

  const unsubscribeEngineState = engine.subscribe(onConversationState, { includeTransient: false });
  const unsubscribeEngineEvents = engine.subscribeEvents((event) => renderBridge.handleEvent(event));

  $effect(() => {
    if (!mounted) return;
    const key = `${resolvedConfig.library}\u0000${resolvedConfig.initialMessage}`;
    if (key !== previousResetKey) {
      previousResetKey = key;
      reset();
    }
  });
  $effect(() => {
    if (!mounted || resolvedCustomTrigger === previousTrigger) return;
    previousTrigger = resolvedCustomTrigger;
    bindExternalTrigger();
    activeAnchor = null;
  });
  $effect(() => {
    if (!mounted || resolvedConfig.position === previousPosition) return;
    previousPosition = resolvedConfig.position;
    syncModalState();
    unbindFloatingListeners();
    if (isOpenState) {
      bindFloatingListeners();
      updateAnchorPosition();
    }
  });
  $effect(() => {
    if (!mounted || resolvedConfig.closeOnOutsideClick === previousCloseOnOutsideClick) return;
    previousCloseOnOutsideClick = resolvedConfig.closeOnOutsideClick;
    if (isOpenState) bindFloatingListeners();
  });
  $effect(() => {
    if (!mounted || resolvedConfig.widgetId === previousWidgetId) return;
    previousWidgetId = resolvedConfig.widgetId;
    register();
  });
  $effect(() => {
    if (!mounted || resolvedConfig.defaultOpen === previousDefaultOpen) return;
    previousDefaultOpen = resolvedConfig.defaultOpen;
    if (resolvedConfig.defaultOpen && openState === undefined) open();
  });
  $effect(() => {
    if (mounted && openState !== undefined) commitOpen(openState);
  });

  onMount(() => {
    mounted = true;
    previousResetKey = `${resolvedConfig.library}\u0000${resolvedConfig.initialMessage}`;
    previousTrigger = resolvedCustomTrigger;
    previousPosition = resolvedConfig.position;
    previousCloseOnOutsideClick = resolvedConfig.closeOnOutsideClick;
    previousWidgetId = resolvedConfig.widgetId;
    previousDefaultOpen = resolvedConfig.defaultOpen;
    reset();
    bindExternalTrigger();
    register();
    messagesElement?.addEventListener('click', onDelegatedCopyClick);
    emitCallback('c7:ready', detail());
    if (openState !== undefined) commitOpen(openState);
    else if (resolvedConfig.defaultOpen) open();
    return () => {
      cancel();
      mounted = false;
      isOpenState = false;
      cancelScheduledScroll();
      copyActions.reset(false);
      unsubscribeEngineState();
      unsubscribeEngineEvents();
      unbindFloatingListeners();
      unbindExternalTrigger();
      messagesElement?.removeEventListener('click', onDelegatedCopyClick);
      releaseModalState();
      stateListeners.clear();
      if (registeredWidgetId) unregisterSvelteContext7Widget(registeredWidgetId, exposed);
    };
  });
</script>

<div
  {...rootProps}
  {...reflectedAttributes}
  bind:this={root}
  class={['context7-widget', rootProps?.class]}
  style={widgetStyle}
  onkeydown={onKeyDown}
>
  <div class="c7-backdrop" data-c7-backdrop part="backdrop" aria-hidden="true" onclick={onBackdropClick}></div>

  {#if rendersManagedTrigger}
    <button
      id={managedTriggerId}
      bind:this={managedTrigger}
      class="context7-widget-trigger"
      type="button"
      aria-controls={panelId}
      aria-expanded={isOpenState}
      aria-label={resolvedConfig.launcherLabel}
      aria-haspopup="dialog"
      data-preset={resolvedConfig.preset}
      data-theme={resolvedConfig.theme}
      onclick={(event) => openFrom(event.currentTarget)}
    >
      {#if trigger}
        {@render trigger({ label: resolvedConfig.launcherLabel, triggerId: managedTriggerId })}
      {:else}
        {resolvedConfig.launcherLabel}
      {/if}
    </button>
  {/if}

  <dialog
    id={panelId}
    bind:this={panel}
    open={isOpenState}
    aria-label={resolvedConfig.title}
    aria-busy={busy}
    aria-modal={resolvedConfig.position === 'center'}
    class="c7-panel"
    part="panel"
  >
    <header class="c7-header" part="header">
      <div class="c7-title" part="title">{resolvedConfig.title}</div>
      <button
        class="c7-close"
        part="close-button"
        type="button"
        aria-label={resolvedConfig.labels.close}
        onclick={close}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
    </header>

    <div
      bind:this={messagesElement}
      aria-label={resolvedConfig.labels.conversation}
      aria-live="polite"
      aria-relevant="additions text"
      class="c7-messages"
      part="messages"
      role="log"
      onscroll={onMessagesScroll}
    >
      {#each displayItems as item (item.id)}
        {#if item.kind === 'message'}
          <div class={`c7-message c7-message--${item.role}`} part={`message ${item.role}-message`}>
            {#if item.role === 'assistant' && !item.streaming}
              <!-- The core renderer escapes raw HTML and returns a branded trusted value. -->
              <div>{@html renderCompletedMarkdown(item)}</div>
              <button
                aria-disabled={copiedAnswerIds.has(item.id) ? 'true' : undefined}
                aria-label={copiedAnswerIds.has(item.id)
                  ? resolvedConfig.labels.copied
                  : resolvedConfig.labels.copyAnswer}
                class="c7-copy-answer"
                data-c7-copy-answer
                data-c7-copied={copiedAnswerIds.has(item.id) ? '' : undefined}
                title={copiedAnswerIds.has(item.id) ? resolvedConfig.labels.copied : resolvedConfig.labels.copyAnswer}
                type="button"
                onclick={(event) => {
                  event.stopPropagation();
                  copyAnswer(item);
                }}
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
                <span aria-live="polite" class="c7-copy-status">
                  {copiedAnswerIds.has(item.id) ? resolvedConfig.labels.copied : ''}
                </span>
              </button>
            {:else}
              <div>{item.content}</div>
            {/if}
          </div>
        {:else if item.kind === 'error'}
          <div class="c7-message c7-message--error" part="message error-message" role="alert">
            <!-- Error HTML is escaped and branded by the shared core error renderer. -->
            <div>{@html item.html}</div>
            <button class="c7-retry" type="button" onclick={() => retryError(item.id)}>
              {resolvedConfig.labels.retry}
            </button>
          </div>
        {:else}
          <div class="c7-tool-call" part="tool-call">
            <div class="c7-tool-header">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path>
              </svg>
              <span>{resolvedConfig.labels.searching}: {item.query}</span>
              {#if !item.hasResult}
                <svg
                  class="c7-spinner"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
              {/if}
            </div>
            {#if item.hasResult}
              <div class="c7-tool-result">
                <button
                  class="c7-tool-toggle"
                  part="tool-toggle"
                  type="button"
                  aria-controls={item.contentId}
                  aria-expanded={item.expanded}
                  onclick={() => (item.expanded = !item.expanded)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                  <span>{item.expanded ? resolvedConfig.labels.hideResults : resolvedConfig.labels.viewResults}</span>
                </button>
                <section
                  id={item.contentId}
                  aria-label={resolvedConfig.labels.searchResults}
                  class="c7-tool-content"
                  hidden={!item.expanded}
                >
                  <pre>{item.result}</pre>
                </section>
              </div>
            {/if}
          </div>
        {/if}
      {/each}

      {#if showTyping}
        <output aria-label={resolvedConfig.labels.responding} class="c7-typing" part="typing">
          <span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>
        </output>
      {/if}
    </div>

    <form
      class="c7-composer"
      part="composer"
      onsubmit={(event) => {
        event.preventDefault();
        if (busy) cancel();
        else void send();
      }}
    >
      <textarea
        bind:this={input}
        bind:value={draft}
        aria-label={resolvedConfig.labels.input}
        class="c7-input"
        part="input"
        autocomplete="off"
        readonly={busy}
        rows="1"
        placeholder={resolvedConfig.placeholder}
        oninput={resizeInput}></textarea>
      <button
        bind:this={sendButton}
        aria-label={busy ? resolvedConfig.labels.stopResponse : resolvedConfig.labels.sendQuestion}
        class="c7-send"
        part="send-button"
        type="submit">{busy ? resolvedConfig.labels.stop : resolvedConfig.labels.send}</button
      >
    </form>

    <footer class="c7-footer" part="footer">
      <span class="c7-branding" part="powered-by" aria-label={resolvedConfig.labels.branding}>
        <a
          class="c7-brand-link"
          href={CONTEXT7_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={resolvedConfig.labels.context7Attribution}
          title={resolvedConfig.labels.context7Attribution}
        >
          <span class="c7-brand-prefix">{resolvedConfig.labels.poweredBy}</span>
          <svg class="c7-brand-logo c7-brand-logo--context7" aria-hidden="true" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="4" fill="currentColor"></rect>
            <path
              d="M10.6 15.3c0 2.2-.9 4.1-2.4 5.8h3.4v1.7H6.3v-1.6c1.7-1.8 2.3-3.3 2.3-5.9h2Zm6.8 0c0 2.2.9 4.1 2.4 5.8h-3.4v1.7h5.3v-1.6c-1.7-1.8-2.3-3.3-2.3-5.9h-2ZM10.6 12.7c0-2.2-.9-4.1-2.4-5.8h3.4V5.2H6.3v1.6c1.7 1.8 2.3 3.3 2.3 5.9h2Zm6.8 0c0-2.2.9-4.1 2.4-5.8h-3.4V5.2h5.3v1.6c-1.7 1.8-2.3 3.3-2.3 5.9h-2Z"
              fill="var(--c7-footer-background, #000)"
            ></path>
          </svg>
        </a>
        <span class="c7-brand-separator" aria-hidden="true">·</span>
        <a
          class="c7-brand-link"
          href={DESOURCE_LABS_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={resolvedConfig.labels.deSourceLabsAttribution}
          title={resolvedConfig.labels.deSourceLabsAttribution}
        >
          <span class="c7-brand-prefix">{resolvedConfig.labels.enhancedBy}</span>
          <img class="c7-brand-logo c7-brand-logo--desource" src={deSourceLabsLogoUrl} alt="" />
        </a>
      </span>
    </footer>
  </dialog>

  {#if !hasCustomTrigger}
    <button
      bind:this={launcher}
      class="c7-launcher"
      part="launcher"
      type="button"
      aria-controls={panelId}
      aria-expanded={isOpenState}
      aria-label={resolvedConfig.launcherLabel}
      aria-haspopup="dialog"
      onclick={(event) => openFrom(event.currentTarget)}
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
        <path d="M8 9h8"></path><path d="M8 13h6"></path><path
          d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5l-5 3v-3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h12"
        ></path>
      </svg>
      <span class="c7-launcher-label">{resolvedConfig.launcherLabel}</span>
    </button>
  {/if}

  {#if children}{@render children()}{/if}
</div>

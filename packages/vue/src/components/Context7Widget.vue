<template>
  <div
    ref="root"
    v-bind="attrs"
    class="context7-widget"
    :backdrop-active="resolvedConfig.backdrop ? '' : undefined"
    :close-on-outside-click="String(resolvedCloseOnOutsideClick)"
    :color="resolvedConfig.color || undefined"
    :custom-trigger="customTriggerSelector"
    :custom-trigger-active="hasCustomTrigger ? '' : undefined"
    :default-open="String(resolvedConfig.defaultOpen)"
    :launcher-variant="resolvedConfig.launcherVariant"
    :library="resolvedLibrary"
    :open="isOpen ? '' : undefined"
    :panel-height="resolvedConfig.panelHeight || undefined"
    :panel-width="resolvedConfig.panelWidth || undefined"
    :position="resolvedPosition"
    :preset="resolvedConfig.preset"
    :style="widgetStyle"
    :theme="resolvedConfig.theme"
    :widget-id="resolvedConfig.widgetId"
    @keydown="onKeyDown"
  >
    <div class="c7-backdrop" data-c7-backdrop part="backdrop" aria-hidden="true" @click="onBackdropClick" />

    <button
      v-if="rendersManagedTrigger"
      :id="managedTriggerId"
      ref="managedTrigger"
      class="context7-widget-trigger"
      type="button"
      :aria-controls="panelId"
      :aria-expanded="isOpen"
      :aria-label="resolvedConfig.launcherLabel"
      aria-haspopup="dialog"
      :data-preset="resolvedConfig.preset"
      :data-theme="resolvedConfig.theme"
      @click="openFrom($event.currentTarget)"
    >
      <slot name="trigger" :label="resolvedConfig.launcherLabel" :trigger-id="managedTriggerId">
        {{ resolvedConfig.launcherLabel }}
      </slot>
    </button>

    <dialog
      :id="panelId"
      ref="panel"
      :open="isOpen"
      :aria-label="resolvedConfig.title"
      :aria-busy="busy"
      :aria-modal="resolvedPosition === 'center'"
      class="c7-panel"
      part="panel"
    >
      <header class="c7-header" part="header">
        <div class="c7-title" part="title">{{ resolvedConfig.title }}</div>
        <button class="c7-close" part="close-button" type="button" :aria-label="resolvedLabels.close" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div
        ref="messagesElement"
        :aria-label="resolvedLabels.conversation"
        aria-live="polite"
        aria-relevant="additions text"
        class="c7-messages"
        part="messages"
        role="log"
        @click="onDelegatedCopyClick"
        @scroll="onMessagesScroll"
      >
        <template v-for="item in displayItems" :key="item.id">
          <div
            v-if="item.kind === 'message'"
            :class="['c7-message', `c7-message--${item.role}`]"
            :part="`message ${item.role}-message`"
          >
            <div v-if="item.role === 'assistant' && !item.streaming" v-html="renderCompletedMarkdown(item)" />
            <div v-else>{{ item.content }}</div>
            <button
              v-if="item.role === 'assistant' && !item.streaming"
              :aria-disabled="copiedAnswerIds.has(item.id) ? 'true' : undefined"
              :aria-label="copiedAnswerIds.has(item.id) ? resolvedLabels.copied : resolvedLabels.copyAnswer"
              class="c7-copy-answer"
              data-c7-copy-answer
              :data-c7-copied="copiedAnswerIds.has(item.id) ? '' : undefined"
              :title="copiedAnswerIds.has(item.id) ? resolvedLabels.copied : resolvedLabels.copyAnswer"
              type="button"
              @click.stop="copyAnswer(item)"
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
                {{ copiedAnswerIds.has(item.id) ? resolvedLabels.copied : '' }}
              </span>
            </button>
          </div>

          <div
            v-else-if="item.kind === 'error'"
            class="c7-message c7-message--error"
            part="message error-message"
            role="alert"
          >
            <div v-html="item.html" />
            <button class="c7-retry" type="button" @click="retryError(item.id)">
              {{ resolvedLabels.retry }}
            </button>
          </div>

          <div v-else class="c7-tool-call" part="tool-call">
            <div class="c7-tool-header">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span>{{ resolvedLabels.searching }}: {{ item.query }}</span>
              <svg
                v-if="!item.hasResult"
                class="c7-spinner"
                viewBox="0 0 24 24"
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            </div>

            <div v-if="item.hasResult" class="c7-tool-result">
              <button
                class="c7-tool-toggle"
                part="tool-toggle"
                type="button"
                :aria-controls="item.contentId"
                :aria-expanded="item.expanded"
                @click="item.expanded = !item.expanded"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span>{{ item.expanded ? resolvedLabels.hideResults : resolvedLabels.viewResults }}</span>
              </button>
              <section
                :id="item.contentId"
                :aria-label="resolvedLabels.searchResults"
                :hidden="!item.expanded"
                class="c7-tool-content"
              >
                <pre>{{ item.result }}</pre>
              </section>
            </div>
          </div>
        </template>

        <output v-if="showTyping" :aria-label="resolvedLabels.responding" class="c7-typing" part="typing">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </output>
      </div>

      <form class="c7-composer" part="composer" @submit.prevent="busy ? cancel() : send()">
        <textarea
          ref="input"
          v-model="draft"
          :aria-label="resolvedLabels.input"
          class="c7-input"
          part="input"
          autocomplete="off"
          :readonly="busy"
          rows="1"
          :placeholder="resolvedConfig.placeholder"
          @input="resizeInput"
        />
        <button
          ref="sendButton"
          :aria-label="busy ? resolvedLabels.stopResponse : resolvedLabels.sendQuestion"
          class="c7-send"
          part="send-button"
          type="submit"
        >
          {{ busy ? resolvedLabels.stop : resolvedLabels.send }}
        </button>
      </form>

      <footer class="c7-footer" part="footer">
        <span class="c7-branding" part="powered-by" :aria-label="resolvedLabels.branding">
          <a
            class="c7-brand-link"
            :href="CONTEXT7_URL"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="resolvedLabels.context7Attribution"
            :title="resolvedLabels.context7Attribution"
          >
            <span class="c7-brand-prefix">{{ resolvedLabels.poweredBy }}</span>
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
            :href="DESOURCE_LABS_URL"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="resolvedLabels.deSourceLabsAttribution"
            :title="resolvedLabels.deSourceLabsAttribution"
          >
            <span class="c7-brand-prefix">{{ resolvedLabels.enhancedBy }}</span>
            <img class="c7-brand-logo c7-brand-logo--desource" :src="deSourceLabsLogoUrl" alt="" />
          </a>
        </span>
      </footer>
    </dialog>

    <button
      v-if="!hasCustomTrigger"
      ref="launcher"
      class="c7-launcher"
      part="launcher"
      type="button"
      :aria-controls="panelId"
      :aria-expanded="isOpen"
      :aria-label="resolvedConfig.launcherLabel"
      aria-haspopup="dialog"
      @click="openFrom($event.currentTarget)"
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
      <span class="c7-launcher-label">{{ resolvedConfig.launcherLabel }}</span>
    </button>

    <slot />
  </div>
</template>

<script setup lang="ts">
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
  mergeContext7WidgetOptions,
  normalizeContext7WidgetTrigger,
  requestRenderFrame,
  resolveContext7MarkdownBaseUrl,
  resolveContext7CustomTrigger,
  resolveContext7WidgetConfig,
  restoreTriggerAccessibility,
  syncContext7CopyButton,
  trapFocus,
  updateAnchorPosition as _updateAnchorPosition,
  type Context7ConversationEvent,
  type Context7ConversationState,
  type Context7Message,
  type Context7RenderedMarkdown,
  type Context7ToolCall,
  type Context7ToolResult,
  type Context7TriggerA11yState,
  type Context7WidgetLifecycleEventDetail,
  type Context7WidgetSendResult
} from '@desource/context7-widget/kit';
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toValue,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
  type MaybeRefOrGetter
} from 'vue';
import { context7WidgetDefaultsKey } from '../internal/injection';
import { registerVueContext7Widget, unregisterVueContext7Widget } from '../internal/registry';
import type {
  Context7WidgetEmits,
  Context7WidgetExpose,
  Context7WidgetProps,
  Context7WidgetSlots,
  Context7WidgetStateListener,
  Context7WidgetCustomTrigger,
  DisplayItem,
  MessageDisplayItem,
  ToolDisplayItem
} from '../types';

defineOptions({
  name: 'Context7Widget',
  inheritAttrs: false
});

const props = withDefaults(defineProps<Context7WidgetProps>(), {
  backdrop: undefined,
  closeOnOutsideClick: undefined,
  defaultOpen: undefined,
  open: undefined
});
const slots = defineSlots<Context7WidgetSlots>();
const emit = defineEmits<Context7WidgetEmits>();

const attrs = useAttrs();
const defaults = inject(context7WidgetDefaultsKey, {});
const root = useTemplateRef('root');
const panel = useTemplateRef('panel');
const input = useTemplateRef('input');
const sendButton = useTemplateRef('sendButton');
const launcher = useTemplateRef('launcher');
const managedTrigger = useTemplateRef('managedTrigger');
const messagesElement = useTemplateRef('messagesElement');
const isOpen = ref(false);
const busy = ref(false);
const draft = ref('');
const displayItems = ref<DisplayItem[]>([]);
const copiedAnswerIds = ref<ReadonlySet<string>>(new Set());
const showTyping = ref(false);
const activeAnchor = ref<Element | null>(null);
const hasBoundExternalTrigger = ref(false);
const messageCounter = ref(0);
const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '-');
const managedTriggerId = `context7-widget-trigger-${instanceId}`;
const panelId = `context7-widget-panel-${instanceId}`;
const stateListeners = new Set<Context7WidgetStateListener>();
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

const STICKY_SCROLL_THRESHOLD = 48;
const QUEUED_SCROLL_FRAME = -1;

type VueAnswerRender = {
  answer: string;
  answerItem: MessageDisplayItem | undefined;
  renderFrame: number | null;
};

const resolvedConfig = computed(() => {
  const { customTrigger: _customTrigger, open: _open, ...widgetProps } = props;
  const { customTrigger: _defaultCustomTrigger, ...defaultOptions } = defaults;
  const provided = compactContext7WidgetOptions(widgetProps);
  return resolveContext7WidgetConfig(mergeContext7WidgetOptions(defaultOptions, provided));
});
const resolvedLibrary = computed(() => resolvedConfig.value.library);
const resolvedPosition = computed(() => resolvedConfig.value.position);
const resolvedCloseOnOutsideClick = computed(() => resolvedConfig.value.closeOnOutsideClick);
const resolvedLabels = computed(() => resolvedConfig.value.labels);
const resolvedCustomTrigger = computed(() => resolveVueCustomTrigger(props.customTrigger ?? defaults.customTrigger));
const rendersManagedTrigger = computed(() => resolvedCustomTrigger.value === true);
const hasCustomTrigger = computed(() => rendersManagedTrigger.value || hasBoundExternalTrigger.value);
const customTriggerSelector = computed(() => {
  if (resolvedCustomTrigger.value === true) return `#${managedTriggerId}`;
  if (typeof resolvedCustomTrigger.value === 'string')
    return normalizeContext7WidgetTrigger(resolvedCustomTrigger.value);
  return undefined;
});
const widgetStyle = computed(() => ({
  '--c7-accent': resolvedConfig.value.color || undefined,
  '--c7-panel-height': resolvedConfig.value.panelHeight || undefined,
  '--c7-panel-width': resolvedConfig.value.panelWidth || undefined
}));

type CopyActionKey = HTMLButtonElement | string;

const copyActions = createContext7CopyActionController<CopyActionKey>({
  onChange(key, copied) {
    if (typeof key === 'string') {
      const next = new Set(copiedAnswerIds.value);
      if (copied) next.add(key);
      else next.delete(key);
      copiedAnswerIds.value = next;
      return;
    }
    syncContext7CopyButton(key, copied, resolvedLabels.value.copyCode, resolvedLabels.value.copied);
  }
});

const detail = (): Context7WidgetLifecycleEventDetail => ({
  library: resolvedLibrary.value,
  widget: root.value as HTMLElement,
  widgetId: resolvedConfig.value.widgetId
});

const renderCompletedMarkdownCached = createContext7CompletedMarkdownRenderer();
const renderCompletedMarkdown = (item: MessageDisplayItem): Context7RenderedMarkdown =>
  renderCompletedMarkdownCached(item, {
    baseUrl: resolveContext7MarkdownBaseUrl(resolvedLibrary.value, resolvedConfig.value.linkBaseUrl),
    copyCodeLabel: resolvedConfig.value.labels.copyCode
  });

const resolveVueCustomTrigger = (
  value: Context7WidgetCustomTrigger | undefined
): Element | string | true | undefined => {
  const resolved = toValue(value as MaybeRefOrGetter<Element | boolean | string | null | undefined>);
  return resolved === true || typeof resolved === 'string' || isContext7WidgetTriggerElement(resolved)
    ? resolved
    : undefined;
};

const nextMessageId = (): string => {
  messageCounter.value += 1;
  return `c7m-${messageCounter.value}`;
};

const engine = createContext7ConversationEngine({
  missingLibraryMessage: () => resolvedLabels.value.missingLibrary,
  nextMessageId,
  resolveConfig: () => ({ library: resolvedLibrary.value })
});

const reset = () => {
  engine.reset();
  renderBridge.clearActiveAnswer();
  copyActions.reset(false);
  copiedAnswerIds.value = new Set();
  const intro = resolvedConfig.value.initialMessage.replace(
    /\{library\}/g,
    resolvedLibrary.value || resolvedLabels.value.libraryFallback
  );
  displayItems.value = [{ content: intro, id: nextMessageId(), kind: 'message', role: 'assistant' }];
  cancelScheduledScroll();
  shouldStickToBottom = true;
  scrollToBottom();
};

const openFrom = (target: EventTarget | null) => {
  if (target instanceof Element) activeAnchor.value = target;
  toggle();
};

const commitOpen = (value: boolean) => {
  if (isOpen.value === value) return;
  if (!value) {
    isOpen.value = false;
    syncExternalTriggerExpandedState();
    unbindFloatingListeners();
    releaseModalState();
    emit('close', detail());
    notifyState();
    if (lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus();
    return;
  }

  lastFocus = document.activeElement;
  isOpen.value = true;
  syncModalState();
  syncExternalTriggerExpandedState();
  bindFloatingListeners();
  emit('open', detail());
  notifyState();
  nextTick(() => {
    updateAnchorPosition();
    if (isOpen.value) focusInput();
  });
};

const open = () => {
  if (isOpen.value) return;
  emit('update:open', true);
  if (props.open !== undefined) {
    return;
  }
  commitOpen(true);
};

const close = () => {
  if (!isOpen.value) return;
  emit('update:open', false);
  if (props.open !== undefined) {
    return;
  }
  commitOpen(false);
};

const toggle = () => (isOpen.value ? close() : open());

const cancel = () => {
  engine.cancel();
  void nextTick(() => input.value?.focus());
};

const releaseModalState = () => {
  releaseModal?.();
  releaseModal = null;
};

const syncModalState = () => {
  releaseModalState();
  if (isOpen.value && resolvedPosition.value === 'center' && root.value) {
    releaseModal = acquireContext7Modal(root.value);
  }
};

const retry = async (): Promise<Context7WidgetSendResult> => {
  open();
  const result = await engine.retry();
  if (!busy.value) input.value?.focus();
  return result;
};

const retryError = (id: string) => {
  displayItems.value = displayItems.value.filter((item) => item.id !== id);
  void retry();
};

const send = async (rawQuestion?: string): Promise<Context7WidgetSendResult> => {
  const question = (rawQuestion ?? draft.value).trim();
  if (question && !busy.value && resolvedLibrary.value) {
    open();
    draft.value = '';
    void nextTick(resizeInput);
  }
  const result = await engine.send(question);
  if (!busy.value) input.value?.focus();
  return result;
};

const onConversationState = (state: Context7ConversationState) => {
  const moveFocus = state.busy && document.activeElement === input.value;
  busy.value = state.busy;
  if (!state.busy) {
    showTyping.value = false;
    renderBridge.clearActiveAnswer();
  }
  notifyState(state.messages);
  if (moveFocus) void nextTick(() => sendButton.value?.focus({ preventScroll: true }));
};

const onConversationEvent = (event: Context7ConversationEvent) => {
  renderBridge.handleEvent(event);
};

const renderQuestion = (event: Context7ConversationEvent<'c7:question'>): VueAnswerRender => {
  if (!event.detail.retry) displayItems.value.push({ ...event.detail.message, kind: 'message' });
  showTyping.value = true;
  scrollToBottom();
  return { answer: '', answerItem: undefined, renderFrame: null };
};

const renderAnswer = (event: Context7ConversationEvent<'c7:answer'>, render: VueAnswerRender) => {
  showTyping.value = false;
  render.answer = event.detail.answer;
  if (!render.answerItem) {
    render.answerItem = reactive<MessageDisplayItem>({
      content: '',
      id: nextMessageId(),
      kind: 'message',
      role: 'assistant',
      streaming: true
    });
    displayItems.value.push(render.answerItem);
  }
  render.renderFrame ??= requestRenderFrame(() => {
    render.renderFrame = null;
    render.answerItem!.content = render.answer;
    void scrollToBottom();
  });
};

const flushAnswerRender = (render: VueAnswerRender, answer: string) => {
  cancelRenderFrame(render.renderFrame);
  render.renderFrame = null;
  if (render.answerItem) {
    render.answerItem.content = answer;
    render.answerItem.streaming = false;
    void scrollToBottom();
  }
};

const clearAnswerRender = (render: VueAnswerRender) => {
  cancelRenderFrame(render.renderFrame);
};

const discardAnswerRender = (render: VueAnswerRender) => {
  cancelRenderFrame(render.renderFrame);
  if (render.answerItem) displayItems.value = displayItems.value.filter((item) => item !== render.answerItem);
};

const renderBridge = createContext7ConversationRenderBridge<VueAnswerRender>({
  clearAnswer: clearAnswerRender,
  discardAnswer: discardAnswerRender,
  emit(event) {
    emit(event.type.slice(3) as never, { ...detail(), ...event.detail });
  },
  flushAnswer: (render, event) => flushAnswerRender(render, event.detail.answer),
  onAnswer: renderAnswer,
  onError(event) {
    displayItems.value.push({
      html: buildContext7ErrorHtml(
        String(event.detail.error || resolvedLabels.value.errorFallback),
        resolvedLibrary.value,
        resolvedLabels.value
      ),
      id: nextMessageId(),
      kind: 'error',
      question: event.detail.question
    });
    void scrollToBottom();
  },
  onQuestion: renderQuestion,
  onToolCall(event) {
    showTyping.value = false;
    appendToolCall(event.detail.toolCall);
  },
  onToolResult: (event) => updateToolResult(event.detail.toolResult)
});

const appendToolCall = (toolCall: Context7ToolCall) => {
  const id = nextMessageId();
  displayItems.value.push({
    contentId: `${panelId}-${id}-tool-result`,
    expanded: false,
    hasResult: false,
    id,
    kind: 'tool',
    query: getContext7ToolQuery(toolCall),
    result: '',
    toolCallId: toolCall.toolCallId
  });
  void scrollToBottom();
};

const updateToolResult = (toolResult: Context7ToolResult) => {
  const item = displayItems.value.find(
    (candidate): candidate is ToolDisplayItem =>
      candidate.kind === 'tool' && candidate.toolCallId === toolResult.toolCallId
  );
  if (item) {
    const result = formatContext7ToolResult(toolResult.result);
    if (!result) return;
    item.hasResult = true;
    item.result = result;
  }
  void scrollToBottom();
};

const scrollToBottom = () => {
  if (!shouldStickToBottom || scrollFrame !== null) return;
  scrollFrame = QUEUED_SCROLL_FRAME;
  const generation = scrollGeneration;

  void nextTick(() => {
    if (generation !== scrollGeneration) return;
    scrollFrame = requestRenderFrame(() => {
      if (generation !== scrollGeneration) return;
      scrollFrame = null;
      const element = messagesElement.value;
      if (shouldStickToBottom && element) element.scrollTop = element.scrollHeight;
    });
  });
};

const cancelScheduledScroll = () => {
  scrollGeneration += 1;
  if (scrollFrame !== QUEUED_SCROLL_FRAME) cancelRenderFrame(scrollFrame);
  scrollFrame = null;
};

const onMessagesScroll = () => {
  const element = messagesElement.value;
  if (!element) return;
  const wasSticky = shouldStickToBottom;
  shouldStickToBottom = element.scrollHeight - element.clientHeight - element.scrollTop <= STICKY_SCROLL_THRESHOLD;
  if (!wasSticky && shouldStickToBottom) scrollToBottom();
};

const resizeInput = () => {
  const element = input.value;
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, 84)}px`;
};

const copyAnswer = (item: MessageDisplayItem) => void copyActions.copy(item.id, item.content);

const onDelegatedCopyClick = (event: Event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-c7-copy-code]');
  if (!button || !messagesElement.value?.contains(button)) return;
  event.stopPropagation();
  const code = button.closest('.c7-code-block')?.querySelector('code')?.textContent ?? '';
  void copyActions.copy(button, code);
};

const onBackdropClick = () => {
  if (resolvedCloseOnOutsideClick.value) close();
};

const onDocumentPointerDown = (event: Event) => {
  if (!isOpen.value || !resolvedCloseOnOutsideClick.value) return;
  const path = event.composedPath();
  if (root.value && path.includes(root.value)) return;
  if (externalTrigger && path.includes(externalTrigger)) return;
  close();
};

const onKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault();
    close();
    return;
  }
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing && event.target === input.value && !busy.value) {
    event.preventDefault();
    void send();
    return;
  }
  if (event.key === 'Tab' && isOpen.value && resolvedPosition.value === 'center' && root.value) {
    if (panel.value) trapFocus(event, panel.value);
  }
};

const bindExternalTrigger = () => {
  unbindExternalTrigger();
  customTriggerSelectorInvalid = false;

  const trigger = normalizeExternalTrigger(resolvedCustomTrigger.value);
  if (!trigger) return;

  const resolution = resolveContext7CustomTrigger(trigger, false);
  customTriggerSelectorInvalid = resolution.invalidSelector;

  if (resolution.element?.isConnected) {
    externalTrigger = resolution.element;
    externalTrigger.addEventListener('click', onExternalTriggerClick);
    externalTriggerAccessibility = captureTriggerAccessibility(externalTrigger);
    externalTrigger.setAttribute('aria-controls', panelId);
    externalTrigger.setAttribute('aria-haspopup', 'dialog');
    externalTrigger.setAttribute('aria-expanded', String(isOpen.value));
    hasBoundExternalTrigger.value = true;
    customTriggerWarningKey = '';
  } else {
    warnExternalTriggerBindingFailure(trigger, resolution.invalidSelector);
  }

  observeExternalTrigger();
};

const unbindExternalTrigger = () => {
  customTriggerObserver?.disconnect();
  customTriggerObserver = null;
  if (activeAnchor.value === externalTrigger) activeAnchor.value = null;
  externalTrigger?.removeEventListener('click', onExternalTriggerClick);
  if (externalTriggerAccessibility) restoreTriggerAccessibility(externalTriggerAccessibility);
  externalTriggerAccessibility = null;
  externalTrigger = null;
  hasBoundExternalTrigger.value = false;
};

const syncExternalTriggerExpandedState = () => externalTrigger?.setAttribute('aria-expanded', String(isOpen.value));

const normalizeExternalTrigger = (trigger: Element | string | true | undefined): Element | string | null => {
  if (typeof trigger === 'string') return normalizeContext7WidgetTrigger(trigger) || null;
  return isContext7WidgetTriggerElement(trigger) ? trigger : null;
};

const observeExternalTrigger = () => {
  const trigger = normalizeExternalTrigger(resolvedCustomTrigger.value);
  if (!trigger || customTriggerSelectorInvalid || typeof MutationObserver !== 'function') return;

  customTriggerObserver = new MutationObserver(() => {
    if (externalTrigger?.isConnected) return;
    bindExternalTrigger();
    if (isOpen.value) {
      bindFloatingListeners();
      updateAnchorPosition();
    }
  });
  customTriggerObserver.observe(document.documentElement, { childList: true, subtree: true });
};

const warnExternalTriggerBindingFailure = (trigger: Element | string, invalidSelector: boolean) => {
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
};

const onExternalTriggerClick = (event: Event) => {
  event.preventDefault();
  activeAnchor.value = event.currentTarget as Element;
  toggle();
};

const scheduleAnchorPositionUpdate = () => {
  if (!isOpen.value || floatingLayoutFrame !== null) return;
  floatingLayoutFrame = requestRenderFrame(() => {
    floatingLayoutFrame = null;
    if (isOpen.value) updateAnchorPosition();
  });
};

const onFloatingLayout = (event: Event) => {
  if (event.type === 'scroll' && root.value && event.composedPath().includes(root.value)) return;
  scheduleAnchorPositionUpdate();
};

const bindFloatingListeners = () => {
  unbindFloatingListeners();
  if (resolvedCloseOnOutsideClick.value) {
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
  }
  if (resolvedPosition.value === 'anchor') {
    window.addEventListener('resize', onFloatingLayout);
    window.addEventListener('scroll', onFloatingLayout, true);
    floatingViewport = window.visualViewport;
    floatingViewport?.addEventListener('resize', onFloatingLayout);
    floatingViewport?.addEventListener('scroll', onFloatingLayout);

    if (typeof ResizeObserver === 'function') {
      floatingResizeObserver = new ResizeObserver(scheduleAnchorPositionUpdate);
      const anchor = getAnchorElement();
      if (anchor) floatingResizeObserver.observe(anchor);
      if (panel.value) floatingResizeObserver.observe(panel.value);
    }
  }
};

const unbindFloatingListeners = () => {
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
};

const getAnchorElement = (): Element | null =>
  (activeAnchor.value?.isConnected ? activeAnchor.value : null) ??
  managedTrigger.value ??
  (externalTrigger?.isConnected ? externalTrigger : null) ??
  launcher.value;

const updateAnchorPosition = () =>
  _updateAnchorPosition(resolvedPosition.value, getAnchorElement(), panel.value, root.value?.style);

const register = () => {
  const widgetId = resolvedConfig.value.widgetId;
  if (registeredWidgetId && registeredWidgetId !== widgetId) {
    unregisterVueContext7Widget(registeredWidgetId, exposed);
  }
  registerVueContext7Widget(widgetId, exposed);
  registeredWidgetId = widgetId;
};

const getMessages = (): readonly Context7Message[] => engine.getMessages();

const notifyState = (messages?: readonly Context7Message[]) => {
  if (stateListeners.size === 0) return;
  const state = {
    busy: busy.value,
    messages: messages ?? getMessages(),
    open: isOpen.value
  } as const;
  for (const listener of stateListeners) callContext7ListenerSafely(listener, state);
};

function subscribe(listener: Context7WidgetStateListener): () => void {
  stateListeners.add(listener);
  callContext7ListenerSafely(listener, {
    busy: busy.value,
    messages: getMessages(),
    open: isOpen.value
  });
  return () => stateListeners.delete(listener);
}

const unsubscribeEngineState = engine.subscribe(onConversationState, { includeTransient: false });
const unsubscribeEngineEvents = engine.subscribeEvents(onConversationEvent);

const exposed: Context7WidgetExpose = {
  get element() {
    return root.value;
  },
  cancel,
  close,
  getMessages,
  isBusy: () => busy.value,
  isOpen: () => isOpen.value,
  open,
  reset,
  retry,
  send,
  subscribe,
  toggle
};

watch([resolvedLibrary, () => resolvedConfig.value.initialMessage], reset);
watch(
  resolvedCustomTrigger,
  () => {
    bindExternalTrigger();
    activeAnchor.value = null;
  },
  { flush: 'post' }
);
watch(
  () => resolvedConfig.value.defaultOpen,
  (value) => {
    if (value && props.open === undefined) open();
  }
);
watch(resolvedPosition, () => {
  syncModalState();
  unbindFloatingListeners();
  if (isOpen.value) {
    bindFloatingListeners();
    updateAnchorPosition();
  }
});
watch(resolvedCloseOnOutsideClick, () => {
  if (isOpen.value) bindFloatingListeners();
});
watch(() => resolvedConfig.value.widgetId, register);
watch(
  () => props.open,
  (value) => {
    if (value !== undefined) commitOpen(value);
  }
);

onMounted(() => {
  reset();
  bindExternalTrigger();
  register();
  emit('ready', detail());
  if (props.open !== undefined) commitOpen(props.open);
  else if (resolvedConfig.value.defaultOpen) open();
});

onBeforeUnmount(() => {
  cancel();
  cancelScheduledScroll();
  copyActions.reset(false);
  unsubscribeEngineState();
  unsubscribeEngineEvents();
  unbindFloatingListeners();
  unbindExternalTrigger();
  releaseModalState();
  stateListeners.clear();
  if (registeredWidgetId) unregisterVueContext7Widget(registeredWidgetId, exposed);
});

defineExpose(exposed);

const focusInput = () => {
  input.value?.focus({ preventScroll: true });
};
</script>

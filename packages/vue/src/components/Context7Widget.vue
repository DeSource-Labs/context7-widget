<template>
  <div
    ref="root"
    v-bind="attrs"
    class="context7-widget"
    :backdrop-active="resolvedBackdrop ? '' : undefined"
    :close-on-outside-click="String(resolvedCloseOnOutsideClick)"
    :color="resolvedColor || undefined"
    :custom-trigger="customTriggerSelector"
    :custom-trigger-active="hasCustomTrigger ? '' : undefined"
    :default-open="String(resolvedDefaultOpen)"
    :launcher-variant="resolvedLauncherVariant"
    :library="resolvedLibrary"
    :open="isOpen ? '' : undefined"
    :panel-height="resolvedPanelHeight || undefined"
    :panel-width="resolvedPanelWidth || undefined"
    :position="resolvedPosition"
    :preset="resolvedPreset"
    :style="widgetStyle"
    :theme="resolvedTheme"
    :widget-id="resolvedWidgetId"
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
      aria-haspopup="dialog"
      :data-preset="resolvedPreset"
      :data-theme="resolvedTheme"
      @click="openFrom($event.currentTarget)"
    >
      <slot name="trigger" :label="resolvedLauncherLabel" :trigger-id="managedTriggerId">
        {{ resolvedLauncherLabel }}
      </slot>
    </button>

    <section
      :id="panelId"
      ref="panel"
      :aria-label="resolvedTitle"
      :aria-busy="busy"
      :aria-modal="resolvedPosition === 'center'"
      class="c7-panel"
      part="panel"
      role="dialog"
    >
      <header class="c7-header" part="header">
        <div class="c7-title" part="title">{{ resolvedTitle }}</div>
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
        @click="onMessagesClick"
      >
        <template v-for="item in displayItems" :key="item.id">
          <div
            v-if="item.kind === 'message'"
            :class="['c7-message', `c7-message--${item.role}`]"
            :part="`message ${item.role}-message`"
          >
            <div v-safe-html="renderMessage(item)" />
            <button
              v-if="item.role === 'assistant' && !item.streaming"
              :aria-label="resolvedLabels.copyAnswer"
              class="c7-copy-answer"
              data-c7-copy-answer
              type="button"
              @click="copyAnswer(item, $event.currentTarget)"
            >
              {{ resolvedLabels.copyAnswer }}
            </button>
          </div>

          <div
            v-else-if="item.kind === 'error'"
            class="c7-message c7-message--error"
            part="message error-message"
            role="alert"
          >
            <div v-safe-html="item.html" />
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
              <div
                v-show="item.expanded"
                :id="item.contentId"
                :aria-label="resolvedLabels.searchResults"
                class="c7-tool-content"
                role="region"
              >
                <pre>{{ item.result }}</pre>
              </div>
            </div>
          </div>
        </template>

        <div v-if="showTyping" :aria-label="resolvedLabels.responding" class="c7-typing" part="typing" role="status">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
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
          :placeholder="resolvedPlaceholder"
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
            v-safe-html="
              `<span class='c7-brand-prefix'>${escapeHtml(resolvedLabels.poweredBy)}</span>` + context7LogoSvg
            "
            class="c7-brand-link"
            :href="CONTEXT7_URL"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="resolvedLabels.context7Attribution"
            :title="resolvedLabels.context7Attribution"
          />
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
    </section>

    <button
      v-if="!hasCustomTrigger"
      ref="launcher"
      class="c7-launcher"
      part="launcher"
      type="button"
      :aria-controls="panelId"
      :aria-expanded="isOpen"
      :aria-label="resolvedLauncherLabel"
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
      <span class="c7-launcher-label">{{ resolvedLauncherLabel }}</span>
    </button>

    <slot />
  </div>
</template>

<script setup lang="ts">
import {
  CONTEXT7_URL,
  DESOURCE_LABS_URL,
  buildContext7ErrorHtml,
  acquireContext7Modal,
  cancelRenderFrame,
  captureTriggerAccessibility,
  compactContext7WidgetOptions,
  copyText,
  context7LogoSvg,
  createContext7ConversationEngine,
  createContext7ConversationRenderBridge,
  deSourceLabsLogoUrl,
  escapeHtml,
  formatContext7ToolResult,
  getContext7ToolQuery,
  isContext7WidgetTriggerElement,
  normalizeContext7WidgetTrigger,
  renderMarkdown,
  requestRenderFrame,
  resolveContext7MarkdownBaseUrl,
  resolveContext7CustomTrigger,
  resolveContext7WidgetConfig,
  restoreTriggerAccessibility,
  trapFocus,
  updateAnchorPosition as _updateAnchorPosition,
  type Context7ConversationEvent,
  type Context7ConversationState,
  type Context7Message,
  type Context7ToolCall,
  type Context7ToolResult,
  type Context7TriggerA11yState,
  type Context7WidgetLifecycleEventDetail,
  type Context7WidgetOptions,
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
  type Directive,
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
defineSlots<Context7WidgetSlots>();
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
const conversation = ref<Context7Message[]>([]);
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

type VueAnswerRender = {
  answer: string;
  answerItem: MessageDisplayItem | undefined;
  renderFrame: number | null;
};

const vSafeHtml: Directive<HTMLElement, string> = {
  beforeMount(element, binding) {
    element.innerHTML = binding.value;
  },
  updated(element, binding) {
    if (binding.value !== binding.oldValue) element.innerHTML = binding.value;
  }
};

const options = computed<Partial<Context7WidgetOptions>>(() => {
  const { customTrigger: _customTrigger, open: _open, ...widgetProps } = props;
  const { customTrigger: _defaultCustomTrigger, ...defaultOptions } = defaults;
  const provided = compactContext7WidgetOptions(widgetProps);
  return compactContext7WidgetOptions({ ...defaultOptions, ...provided });
});
const resolvedConfig = computed(() => resolveContext7WidgetConfig(options.value));
const resolvedLibrary = computed(() => resolvedConfig.value.library);
const resolvedPosition = computed(() => resolvedConfig.value.position);
const resolvedPreset = computed(() => resolvedConfig.value.preset);
const resolvedTheme = computed(() => resolvedConfig.value.theme);
const resolvedBackdrop = computed(() => resolvedConfig.value.backdrop);
const resolvedCloseOnOutsideClick = computed(() => resolvedConfig.value.closeOnOutsideClick);
const resolvedColor = computed(() => resolvedConfig.value.color);
const resolvedDefaultOpen = computed(() => resolvedConfig.value.defaultOpen);
const resolvedInitialMessage = computed(() => resolvedConfig.value.initialMessage);
const resolvedLabels = computed(() => resolvedConfig.value.labels);
const resolvedLauncherLabel = computed(() => resolvedConfig.value.launcherLabel);
const resolvedLauncherVariant = computed(() => resolvedConfig.value.launcherVariant);
const resolvedPanelHeight = computed(() => resolvedConfig.value.panelHeight);
const resolvedPanelWidth = computed(() => resolvedConfig.value.panelWidth);
const resolvedPlaceholder = computed(() => resolvedConfig.value.placeholder);
const resolvedTitle = computed(() => resolvedConfig.value.title);
const resolvedWidgetId = computed(() => resolvedConfig.value.widgetId);
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
  '--c7-accent': resolvedColor.value || undefined,
  '--c7-panel-height': resolvedPanelHeight.value || undefined,
  '--c7-panel-width': resolvedPanelWidth.value || undefined
}));

const detail = (): Context7WidgetLifecycleEventDetail => ({
  library: resolvedLibrary.value,
  widget: root.value as HTMLElement,
  widgetId: resolvedWidgetId.value
});

const renderMessage = (item: MessageDisplayItem): string =>
  item.role === 'assistant' && !item.streaming
    ? renderMarkdown(item.content, {
        baseUrl: resolveContext7MarkdownBaseUrl(resolvedLibrary.value, resolvedConfig.value.linkBaseUrl),
        copyCodeLabel: resolvedConfig.value.labels.copyCode
      })
    : escapeHtml(item.content);

const resolveVueCustomTrigger = (
  value: Context7WidgetCustomTrigger | undefined
): Element | string | true | undefined => {
  if (value === true || typeof value === 'string' || isContext7WidgetTriggerElement(value)) return value;
  const resolved = toValue(value as MaybeRefOrGetter<Element | null | undefined>);
  return isContext7WidgetTriggerElement(resolved) ? resolved : undefined;
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
  const intro = resolvedInitialMessage.value.replace(
    /\{library\}/g,
    resolvedLibrary.value || resolvedLabels.value.libraryFallback
  );
  displayItems.value = [{ content: intro, id: nextMessageId(), kind: 'message', role: 'assistant' }];
  conversation.value = [];
  showTyping.value = false;
  notifyState();
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
  conversation.value = [...state.messages];
  if (!state.busy) {
    showTyping.value = false;
    renderBridge.clearActiveAnswer();
  }
  notifyState();
  if (moveFocus) void nextTick(() => sendButton.value?.focus({ preventScroll: true }));
};

const onConversationEvent = (event: Context7ConversationEvent) => {
  renderBridge.handleEvent(event);
};

const renderQuestion = (event: Context7ConversationEvent<'c7:question'>): VueAnswerRender | null => {
  if (!event.detail.retry) displayItems.value.push({ ...event.detail.message, kind: 'message' });
  showTyping.value = Boolean(event.request);
  return event.request ? { answer: '', answerItem: undefined, renderFrame: null } : null;
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
    if (!render.answerItem) return;
    render.answerItem.content = render.answer;
    void scrollToBottom();
  });
};

const flushAnswerRender = (render: VueAnswerRender, answer: string) => {
  cancelRenderFrame(render.renderFrame);
  render.renderFrame = null;
  render.answer = answer;
  if (answer && !render.answerItem) {
    render.answerItem = reactive<MessageDisplayItem>({
      content: '',
      id: nextMessageId(),
      kind: 'message',
      role: 'assistant',
      streaming: true
    });
    displayItems.value.push(render.answerItem);
  }
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

const vueEventNameByEngineEvent = {
  'c7:answer': 'answer',
  'c7:answer-complete': 'answer-complete',
  'c7:cancel': 'cancel',
  'c7:error': 'error',
  'c7:first-token': 'first-token',
  'c7:question': 'question',
  'c7:tool-call': 'tool-call',
  'c7:tool-result': 'tool-result'
} as const;

const renderBridge = createContext7ConversationRenderBridge<VueAnswerRender>({
  clearAnswer: clearAnswerRender,
  discardAnswer: discardAnswerRender,
  emit(event) {
    emit(vueEventNameByEngineEvent[event.type] as never, { ...detail(), ...event.detail });
  },
  flushAnswer: (render, event) => flushAnswerRender(render, event.detail.answer),
  onAnswer: renderAnswer,
  onError(event) {
    showTyping.value = false;
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

const scrollToBottom = async () => {
  await nextTick();
  if (messagesElement.value) messagesElement.value.scrollTop = messagesElement.value.scrollHeight;
};

const resizeInput = () => {
  const element = input.value;
  if (!element) return;
  element.style.height = 'auto';
  element.style.height = `${Math.min(element.scrollHeight, 84)}px`;
};

const showCopied = (target: EventTarget | null) => {
  if (!(target instanceof HTMLButtonElement)) return;
  const originalText = target.textContent ?? '';
  const originalLabel = target.getAttribute('aria-label');
  target.textContent = resolvedLabels.value.copied;
  target.setAttribute('aria-label', resolvedLabels.value.copied);
  window.setTimeout(() => {
    if (!target.isConnected) return;
    target.textContent = originalText;
    if (originalLabel) target.setAttribute('aria-label', originalLabel);
  }, 1600);
};

const copyAnswer = (item: MessageDisplayItem, target: EventTarget | null) => {
  void copyText(item.content).then((copied) => {
    if (copied) showCopied(target);
  });
};

const onMessagesClick = (event: Event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  const button = target.closest<HTMLButtonElement>('[data-c7-copy-code]');
  if (!button) return;
  const code = button.closest('.c7-code-block')?.querySelector('code')?.textContent ?? '';
  void copyText(code).then((copied) => {
    if (copied) showCopied(button);
  });
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

  const observerTarget = document.documentElement;

  customTriggerObserver = new MutationObserver(() => {
    if (externalTrigger?.isConnected) return;
    bindExternalTrigger();
    if (isOpen.value) {
      bindFloatingListeners();
      updateAnchorPosition();
    }
  });
  customTriggerObserver.observe(observerTarget, { childList: true, subtree: true });
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
  if (event.currentTarget instanceof Element) activeAnchor.value = event.currentTarget;
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
  if (registeredWidgetId && registeredWidgetId !== resolvedWidgetId.value) {
    unregisterVueContext7Widget(registeredWidgetId, exposed);
  }
  registerVueContext7Widget(resolvedWidgetId.value, exposed);
  registeredWidgetId = resolvedWidgetId.value;
};

const getMessages = (): readonly Context7Message[] => engine.getMessages();

const notifyState = () => {
  if (stateListeners.size === 0) return;
  const state = {
    busy: busy.value,
    messages: getMessages(),
    open: isOpen.value
  } as const;
  for (const listener of stateListeners) listener(state);
};

function subscribe(listener: Context7WidgetStateListener): () => void {
  stateListeners.add(listener);
  listener({
    busy: busy.value,
    messages: getMessages(),
    open: isOpen.value
  });
  return () => stateListeners.delete(listener);
}

const unsubscribeEngineState = engine.subscribe(onConversationState);
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

watch([resolvedLibrary, resolvedInitialMessage], reset);
watch(
  resolvedCustomTrigger,
  () => {
    bindExternalTrigger();
    activeAnchor.value = null;
  },
  { flush: 'post' }
);
watch(resolvedDefaultOpen, (value) => {
  if (value && props.open === undefined) open();
});
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
watch(resolvedWidgetId, register);
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
  else if (resolvedDefaultOpen.value) open();
});

onBeforeUnmount(() => {
  cancel();
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

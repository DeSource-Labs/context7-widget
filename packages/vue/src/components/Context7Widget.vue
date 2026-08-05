<template>
  <div
    ref="root"
    v-bind="attrs"
    class="context7-widget"
    :backdrop-active="resolvedBackdrop ? '' : undefined"
    :close-on-outside-click="String(resolvedCloseOnOutsideClick)"
    :color="resolvedColor || undefined"
    :custom-trigger="customTriggerSelector"
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
        <button class="c7-close" part="close-button" type="button" aria-label="Close chat" @click="close">
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </header>

      <div
        ref="messagesElement"
        aria-label="Documentation chat conversation"
        aria-live="polite"
        aria-relevant="additions text"
        class="c7-messages"
        part="messages"
        role="log"
      >
        <template v-for="item in displayItems" :key="item.id">
          <div
            v-if="item.kind === 'message'"
            v-safe-html="renderMessage(item)"
            :class="['c7-message', `c7-message--${item.role}`]"
            :part="`message ${item.role}-message`"
          />

          <div
            v-else-if="item.kind === 'error'"
            v-safe-html="item.html"
            class="c7-message c7-message--error"
            part="message error-message"
            role="alert"
          />

          <div v-else class="c7-tool-call" part="tool-call">
            <div class="c7-tool-header">
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <span>Searching: {{ item.query }}</span>
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
                <span>{{ item.expanded ? 'Hide results' : 'View results' }}</span>
              </button>
              <div
                v-show="item.expanded"
                :id="item.contentId"
                aria-label="Documentation search results"
                class="c7-tool-content"
                role="region"
              >
                <pre>{{ item.result }}</pre>
              </div>
            </div>
          </div>
        </template>

        <div v-if="showTyping" aria-label="Context7 is responding" class="c7-typing" part="typing" role="status">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </div>
      </div>

      <form class="c7-composer" part="composer" @submit.prevent="busy ? cancel() : send()">
        <input
          ref="input"
          v-model="draft"
          aria-label="Ask a documentation question"
          class="c7-input"
          part="input"
          type="text"
          autocomplete="off"
          :disabled="busy"
          :placeholder="resolvedPlaceholder"
        />
        <button :aria-label="busy ? 'Stop response' : 'Send question'" class="c7-send" part="send-button" type="submit">
          {{ busy ? 'Stop' : 'Send' }}
        </button>
      </form>

      <footer class="c7-footer" part="footer">
        <span class="c7-branding" part="powered-by" aria-label="Powered by Context7, Enhanced by DeSource Labs">
          <a
            v-safe-html="`<span class='c7-brand-prefix'>Powered by</span>` + context7LogoSvg"
            class="c7-brand-link"
            :href="CONTEXT7_URL"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Powered by Context7"
            title="Powered by Context7"
          />
          <span class="c7-brand-separator" aria-hidden="true">·</span>
          <a
            class="c7-brand-link"
            :href="DESOURCE_LABS_URL"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enhanced by DeSource Labs"
            title="Enhanced by DeSource Labs"
          >
            <span class="c7-brand-prefix">Enhanced by</span>
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
  Context7TransportError,
  DESOURCE_LABS_URL,
  buildContext7ErrorHtml,
  cancelRenderFrame,
  captureTriggerAccessibility,
  compactContext7WidgetOptions,
  context7LogoSvg,
  deSourceLabsLogoUrl,
  escapeHtml,
  isAbortError,
  normalizeContext7WidgetTrigger,
  querySelectorSafely,
  renderMarkdown,
  requestRenderFrame,
  resolveContext7AnchorLayout,
  resolveContext7WidgetConfig,
  restoreTriggerAccessibility,
  streamContext7Response,
  trapFocus,
  type Context7Message,
  type Context7ToolCall,
  type Context7ToolResult,
  type Context7TriggerA11yState,
  type Context7WidgetAnswerCompleteEventDetail,
  type Context7WidgetAnswerEventDetail,
  type Context7WidgetErrorEventDetail,
  type Context7WidgetLifecycleEventDetail,
  type Context7WidgetOptions,
  type Context7WidgetQuestionEventDetail,
  type Context7WidgetToolCallEventDetail,
  type Context7WidgetToolResultEventDetail
} from '@desource/context7-widget/kit';
import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
  type Directive
} from 'vue';
import { context7WidgetDefaultsKey } from '../internal/injection';
import { registerVueContext7Widget, unregisterVueContext7Widget } from '../internal/registry';
import type {
  Context7ActiveRequest,
  Context7WidgetEmits,
  Context7WidgetExpose,
  Context7WidgetProps,
  Context7WidgetSlots,
  Context7WidgetStateListener,
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
  defaultOpen: undefined
});
defineSlots<Context7WidgetSlots>();
const emit = defineEmits<Context7WidgetEmits>();

const attrs = useAttrs();
const defaults = inject(context7WidgetDefaultsKey, {});
const root = useTemplateRef('root');
const panel = useTemplateRef('panel');
const input = useTemplateRef('input');
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
const messageCounter = ref(0);
const instanceId = useId().replace(/[^a-zA-Z0-9_-]/g, '-');
const managedTriggerId = `context7-widget-trigger-${instanceId}`;
const panelId = `context7-widget-panel-${instanceId}`;
const stateListeners = new Set<Context7WidgetStateListener>();
let activeRequest: Context7ActiveRequest | null = null;
let externalTrigger: Element | null = null;
let externalTriggerAccessibility: Context7TriggerA11yState | null = null;
let floatingLayoutFrame: number | null = null;
let floatingResizeObserver: ResizeObserver | null = null;
let floatingViewport: VisualViewport | null = null;
let lastFocus: Element | null = null;
let registeredWidgetId = '';

const vSafeHtml: Directive<HTMLElement, string> = {
  beforeMount(element, binding) {
    element.innerHTML = binding.value;
  },
  updated(element, binding) {
    if (binding.value !== binding.oldValue) element.innerHTML = binding.value;
  }
};

const options = computed<Partial<Context7WidgetOptions>>(() => {
  const { customTrigger: _customTrigger, ...widgetProps } = props;
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
const resolvedLauncherLabel = computed(() => resolvedConfig.value.launcherLabel);
const resolvedLauncherVariant = computed(() => resolvedConfig.value.launcherVariant);
const resolvedPanelHeight = computed(() => resolvedConfig.value.panelHeight);
const resolvedPanelWidth = computed(() => resolvedConfig.value.panelWidth);
const resolvedPlaceholder = computed(() => resolvedConfig.value.placeholder);
const resolvedTitle = computed(() => resolvedConfig.value.title);
const resolvedWidgetId = computed(() => resolvedConfig.value.widgetId);
const resolvedCustomTrigger = computed(() => props.customTrigger ?? defaults.customTrigger);
const rendersManagedTrigger = computed(() => resolvedCustomTrigger.value === true);
const hasCustomTrigger = computed(
  () => resolvedCustomTrigger.value === true || typeof resolvedCustomTrigger.value === 'string'
);
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

const reset = () => {
  cancel();
  const intro = resolvedInitialMessage.value.replace(/\{library\}/g, resolvedLibrary.value || 'this library');
  displayItems.value = [{ content: intro, id: nextMessageId(), kind: 'message', role: 'assistant' }];
  conversation.value = [];
  notifyState();
};

const renderMessage = (item: MessageDisplayItem): string =>
  item.role === 'assistant' ? renderMarkdown(item.content) : escapeHtml(item.content);

const nextMessageId = (): string => {
  messageCounter.value += 1;
  return `c7m-${messageCounter.value}`;
};

const openFrom = (target: EventTarget | null) => {
  if (target instanceof Element) activeAnchor.value = target;
  toggle();
};

const open = () => {
  if (isOpen.value) return;
  lastFocus = document.activeElement;
  isOpen.value = true;
  syncExternalTriggerExpandedState();
  bindFloatingListeners();
  emit('open', detail());
  notifyState();
  nextTick(() => {
    updateAnchorPosition();
    if (isOpen.value) focusInput();
  });
};

const close = () => {
  if (!isOpen.value) return;
  isOpen.value = false;
  syncExternalTriggerExpandedState();
  unbindFloatingListeners();
  emit('close', detail());
  notifyState();
  if (lastFocus instanceof HTMLElement && lastFocus.isConnected) lastFocus.focus();
};

const toggle = () => (isOpen.value ? close() : open());

const cancel = () => {
  const request = activeRequest;
  if (!request) return;

  activeRequest = null;
  request.controller.abort();
  cancelRenderFrame(request.renderFrame);
  busy.value = false;
  showTyping.value = false;
  notifyState();
  void nextTick(() => input.value?.focus());
};

const send = async (rawQuestion?: string) => {
  const question = (rawQuestion ?? draft.value).trim();
  if (!question || busy.value) return;

  if (!resolvedLibrary.value) {
    const message = 'Missing library prop.';
    displayItems.value.push({
      html: buildContext7ErrorHtml(message, resolvedLibrary.value),
      id: nextMessageId(),
      kind: 'error'
    });
    emit('error', { ...detail(), error: message, question } satisfies Context7WidgetErrorEventDetail);
    await scrollToBottom();
    return;
  }

  open();
  busy.value = true;
  draft.value = '';

  const userMessage: Context7Message = {
    content: question,
    id: nextMessageId(),
    role: 'user'
  };
  conversation.value.push(userMessage);
  displayItems.value.push({ ...userMessage, kind: 'message' });
  emit('question', {
    ...detail(),
    message: userMessage,
    messages: [...conversation.value],
    question
  } satisfies Context7WidgetQuestionEventDetail);

  showTyping.value = true;
  let answer = '';
  let answerItem: MessageDisplayItem | undefined;
  let sawFirstToken = false;
  const request: Context7ActiveRequest = {
    controller: new AbortController(),
    renderFrame: null
  };
  activeRequest = request;
  notifyState();

  const renderAnswer = () => {
    request.renderFrame = null;
    if (activeRequest !== request || !answerItem) return;
    answerItem.content = answer;
    void scrollToBottom();
  };

  const flushAnswer = () => {
    cancelRenderFrame(request.renderFrame);
    request.renderFrame = null;
    if (answerItem) answerItem.content = answer;
  };

  try {
    await streamContext7Response(
      { library: resolvedLibrary.value },
      conversation.value,
      {
        onChunk(delta) {
          if (activeRequest !== request) return;
          showTyping.value = false;
          answer += delta;
          if (!answerItem) {
            answerItem = reactive<MessageDisplayItem>({
              content: '',
              id: nextMessageId(),
              kind: 'message',
              role: 'assistant'
            });
            displayItems.value.push(answerItem);
          }
          request.renderFrame ??= requestRenderFrame(renderAnswer);

          const answerDetail = { ...detail(), answer, question } satisfies Context7WidgetAnswerEventDetail;
          if (!sawFirstToken) {
            sawFirstToken = true;
            emit('first-token', answerDetail);
          }
          emit('answer', answerDetail);
        },
        onToolCall(toolCall) {
          if (activeRequest !== request) return;
          showTyping.value = false;
          appendToolCall(toolCall);
          emit('tool-call', { ...detail(), question, toolCall } satisfies Context7WidgetToolCallEventDetail);
        },
        onToolResult(toolResult) {
          if (activeRequest !== request) return;
          updateToolResult(toolResult);
          emit('tool-result', { ...detail(), question, toolResult } satisfies Context7WidgetToolResultEventDetail);
        }
      },
      request.controller.signal
    );

    if (activeRequest !== request) return;
    showTyping.value = false;
    if (answer) {
      flushAnswer();
      const assistantMessage: Context7Message = {
        content: answer,
        id: answerItem?.id ?? nextMessageId(),
        role: 'assistant'
      };
      conversation.value.push(assistantMessage);
      notifyState();
      emit('answer-complete', {
        ...detail(),
        answer,
        message: assistantMessage,
        messages: [...conversation.value],
        question
      } satisfies Context7WidgetAnswerCompleteEventDetail);
    }
  } catch (error) {
    if (activeRequest === request) {
      showTyping.value = false;
    }
    if (activeRequest === request && !isAbortError(error)) {
      const message =
        error instanceof Context7TransportError || error instanceof Error ? error.message : 'Something went wrong.';
      displayItems.value.push({
        html: buildContext7ErrorHtml(message, resolvedLibrary.value),
        id: nextMessageId(),
        kind: 'error'
      });
      emit('error', { ...detail(), error: message, question } satisfies Context7WidgetErrorEventDetail);
    }
  } finally {
    if (activeRequest === request) {
      cancelRenderFrame(request.renderFrame);
      activeRequest = null;
      busy.value = false;
      notifyState();
      await scrollToBottom();
      input.value?.focus();
    }
  }
};

const appendToolCall = (toolCall: Context7ToolCall) => {
  const id = nextMessageId();
  displayItems.value.push({
    contentId: `${panelId}-${id}-tool-result`,
    expanded: false,
    hasResult: false,
    id,
    kind: 'tool',
    query: typeof toolCall.args.query === 'string' ? toolCall.args.query : 'documentation',
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
    item.hasResult = true;
    item.result = formatToolResult(toolResult.result);
  }
  void scrollToBottom();
};

const formatToolResult = (result: unknown) =>
  typeof result === 'string' ? result : (JSON.stringify(result, null, 2) ?? String(result ?? ''));

const scrollToBottom = async () => {
  await nextTick();
  if (messagesElement.value) messagesElement.value.scrollTop = messagesElement.value.scrollHeight;
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
  if (event.key === 'Tab' && isOpen.value && resolvedPosition.value === 'center' && root.value) {
    if (panel.value) trapFocus(event, panel.value);
  }
};

const bindExternalTrigger = () => {
  unbindExternalTrigger();
  if (typeof resolvedCustomTrigger.value !== 'string') return;
  const selector = normalizeContext7WidgetTrigger(resolvedCustomTrigger.value);
  if (!selector) return;
  externalTrigger = querySelectorSafely(selector);
  externalTrigger?.addEventListener('click', onExternalTriggerClick);
  if (externalTrigger) {
    externalTriggerAccessibility = captureTriggerAccessibility(externalTrigger);
    externalTrigger.setAttribute('aria-controls', panelId);
    externalTrigger.setAttribute('aria-haspopup', 'dialog');
    externalTrigger.setAttribute('aria-expanded', String(isOpen.value));
  }
};

const unbindExternalTrigger = () => {
  externalTrigger?.removeEventListener('click', onExternalTriggerClick);
  if (externalTriggerAccessibility) restoreTriggerAccessibility(externalTriggerAccessibility);
  externalTriggerAccessibility = null;
  externalTrigger = null;
};

const syncExternalTriggerExpandedState = () => externalTrigger?.setAttribute('aria-expanded', String(isOpen.value));

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

const updateAnchorPosition = () => {
  if (resolvedPosition.value !== 'anchor' || !root.value || !panel.value) return;
  const anchor = getAnchorElement();
  if (!anchor) return;

  const rect = anchor.getBoundingClientRect();
  root.value.style.removeProperty('--c7-anchor-max-height');
  root.value.style.removeProperty('--c7-anchor-max-width');
  const panelWidth = panel.value.offsetWidth || 400;
  const panelHeight = panel.value.offsetHeight || 600;
  const viewport = window.visualViewport;
  const viewportWidth = viewport?.width ?? window.innerWidth ?? document.documentElement.clientWidth ?? panelWidth;
  const viewportHeight = viewport?.height ?? window.innerHeight ?? document.documentElement.clientHeight ?? panelHeight;
  const { left, maxHeight, maxWidth, origin, placement, top } = resolveContext7AnchorLayout({
    anchor: rect,
    panelHeight,
    panelWidth,
    viewportHeight,
    viewportLeft: viewport?.offsetLeft,
    viewportTop: viewport?.offsetTop,
    viewportWidth
  });
  root.value.style.setProperty('--c7-anchor-left', `${left}px`);
  root.value.style.setProperty('--c7-anchor-max-height', `${maxHeight}px`);
  root.value.style.setProperty('--c7-anchor-max-width', `${maxWidth}px`);
  root.value.style.setProperty('--c7-anchor-top', `${top}px`);
  root.value.style.setProperty('--c7-anchor-origin', origin);
  root.value.style.setProperty('--c7-anchor-translate-y', placement === 'top' ? '8px' : '-8px');
};

const register = () => {
  if (registeredWidgetId && registeredWidgetId !== resolvedWidgetId.value) {
    unregisterVueContext7Widget(registeredWidgetId, exposed);
  }
  registerVueContext7Widget(resolvedWidgetId.value, exposed);
  registeredWidgetId = resolvedWidgetId.value;
};

const getMessages = (): readonly Context7Message[] => [...conversation.value];

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
  if (value) open();
});
watch(resolvedPosition, () => {
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

onMounted(() => {
  reset();
  bindExternalTrigger();
  register();
  emit('ready', detail());
  if (resolvedDefaultOpen.value) open();
});

onBeforeUnmount(() => {
  cancel();
  unbindFloatingListeners();
  unbindExternalTrigger();
  stateListeners.clear();
  if (registeredWidgetId) unregisterVueContext7Widget(registeredWidgetId, exposed);
});

defineExpose(exposed);

const focusInput = () => {
  const inputElement = input.value ?? root.value?.querySelector<HTMLInputElement>('.c7-input');
  inputElement?.focus({ preventScroll: true });
};
</script>

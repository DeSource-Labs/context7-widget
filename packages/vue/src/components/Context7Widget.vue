<template>
  <div
    ref="root"
    v-bind="attrs"
    class="context7-widget"
    :backdrop-active="resolvedBackdrop ? '' : undefined"
    :close-on-outside-click="String(resolvedCloseOnOutsideClick)"
    :color="resolvedColor || undefined"
    :custom-trigger="customTriggerSelector"
    :data-position="resolvedPosition"
    :data-preset="resolvedPreset"
    :data-theme="resolvedTheme"
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
    :title="resolvedTitle"
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
      ref="panel"
      :aria-label="resolvedTitle"
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

      <div ref="messagesElement" class="c7-messages" part="messages" aria-live="polite">
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
                :aria-expanded="item.expanded"
                @click="item.expanded = !item.expanded"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="m6 9 6 6 6-6" />
                </svg>
                <span>View results</span>
              </button>
              <div v-show="item.expanded" class="c7-tool-content">
                <pre>{{ formatToolResult(item.result) }}</pre>
              </div>
            </div>
          </div>
        </template>

        <div v-if="showTyping" class="c7-typing" part="typing">
          <span />
          <span />
          <span />
        </div>
      </div>

      <form class="c7-composer" part="composer" @submit.prevent="send()">
        <input
          ref="input"
          v-model="draft"
          class="c7-input"
          part="input"
          type="text"
          autocomplete="off"
          :disabled="busy"
          :placeholder="resolvedPlaceholder"
        />
        <button class="c7-send" part="send-button" type="submit" :disabled="busy">Send</button>
      </form>

      <footer class="c7-footer" part="footer">
        <div class="c7-branding" part="powered-by" aria-label="Powered by Context7, Enhanced by DeSource Labs">
          <span class="c7-brand-prefix">Powered by</span>
          <a
            v-safe-html="context7LogoSvg"
            class="c7-brand-link"
            :href="CONTEXT7_URL"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Powered by Context7"
            title="Powered by Context7"
          />
          <span class="c7-brand-separator" aria-hidden="true">·</span>
          <span class="c7-brand-prefix">Enhanced by</span>
          <a
            class="c7-brand-link"
            :href="DESOURCE_LABS_URL"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Enhanced by DeSource Labs"
            title="Enhanced by DeSource Labs"
          >
            <img class="c7-brand-logo c7-brand-logo--desource" :src="deSourceLabsLogoUrl" alt="" />
          </a>
        </div>
      </footer>
    </section>

    <button
      v-if="!hasCustomTrigger"
      ref="launcher"
      class="c7-launcher"
      part="launcher"
      type="button"
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
  DEFAULT_CONTEXT7_INITIAL_MESSAGE,
  DESOURCE_LABS_URL,
  buildContext7ErrorHtml,
  compactContext7WidgetOptions,
  context7LogoSvg,
  deSourceLabsLogoUrl,
  escapeHtml,
  isAbortError,
  renderMarkdown,
  streamContext7Response,
  type Context7Message,
  type Context7ToolCall,
  type Context7ToolResult,
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
  ref,
  useAttrs,
  useId,
  useTemplateRef,
  watch,
  type Directive
} from 'vue';
import { context7WidgetDefaultsKey } from '../internal/injection';
import { registerVueContext7Widget, unregisterVueContext7Widget } from '../internal/registry';
import type { Context7WidgetEmits, Context7WidgetExpose, Context7WidgetProps, Context7WidgetSlots } from '../types';

type MessageDisplayItem = {
  content: string;
  id: string;
  kind: 'message';
  role: 'assistant' | 'user';
};

type ErrorDisplayItem = {
  html: string;
  id: string;
  kind: 'error';
};

type ToolDisplayItem = {
  expanded: boolean;
  hasResult: boolean;
  id: string;
  kind: 'tool';
  query: string;
  result?: unknown;
  toolCallId: string;
};

type DisplayItem = ErrorDisplayItem | MessageDisplayItem | ToolDisplayItem;

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
const activeAnchor = ref<HTMLElement | null>(null);
const abortController = ref<AbortController | null>(null);
const messageCounter = ref(0);
const managedTriggerId = `context7-widget-trigger-${useId().replace(/[^a-zA-Z0-9_-]/g, '-')}`;
let externalTrigger: Element | null = null;
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
  const provided = compactContext7WidgetOptions(widgetProps);
  return compactContext7WidgetOptions({ ...defaults, ...provided });
});
const resolvedLibrary = computed(() => options.value.library ?? '');
const resolvedPosition = computed(() => options.value.position ?? 'bottom-right');
const resolvedPreset = computed(() => options.value.preset ?? 'default');
const resolvedTheme = computed(() => options.value.theme ?? 'auto');
const resolvedBackdrop = computed(() => options.value.backdrop ?? resolvedPosition.value === 'center');
const resolvedCloseOnOutsideClick = computed(() => options.value.closeOnOutsideClick ?? true);
const resolvedColor = computed(() => options.value.color ?? '');
const resolvedDefaultOpen = computed(() => options.value.defaultOpen ?? false);
const resolvedInitialMessage = computed(() => options.value.initialMessage ?? DEFAULT_CONTEXT7_INITIAL_MESSAGE);
const resolvedLauncherLabel = computed(() => options.value.launcherLabel ?? 'Ask Docs AI');
const resolvedLauncherVariant = computed(() => options.value.launcherVariant ?? 'icon');
const resolvedPanelHeight = computed(() => options.value.panelHeight ?? '');
const resolvedPanelWidth = computed(() => options.value.panelWidth ?? '');
const resolvedPlaceholder = computed(() => options.value.placeholder ?? 'Ask about the docs...');
const resolvedTitle = computed(() => options.value.title ?? 'Chat with Documentation');
const resolvedWidgetId = computed(() => options.value.widgetId ?? 'default');
const resolvedCustomTrigger = computed(() => props.customTrigger ?? defaults.customTrigger);
const rendersManagedTrigger = computed(() => resolvedCustomTrigger.value === true);
const hasCustomTrigger = computed(
  () => resolvedCustomTrigger.value === true || typeof resolvedCustomTrigger.value === 'string'
);
const customTriggerSelector = computed(() => {
  if (resolvedCustomTrigger.value === true) return `#${managedTriggerId}`;
  if (typeof resolvedCustomTrigger.value === 'string') return normalizeCustomTriggerId(resolvedCustomTrigger.value);
  return undefined;
});
const widgetStyle = computed(() => ({
  '--c7-accent': resolvedColor.value || undefined,
  '--c7-panel-height': resolvedPanelHeight.value || undefined,
  '--c7-panel-width': resolvedPanelWidth.value || undefined
}));

function detail(): Context7WidgetLifecycleEventDetail {
  return {
    library: resolvedLibrary.value,
    widget: root.value as HTMLElement,
    widgetId: resolvedWidgetId.value
  };
}

function resetConversation(): void {
  const intro = resolvedInitialMessage.value.replace(/\{library\}/g, resolvedLibrary.value || 'this library');
  displayItems.value = [{ content: intro, id: nextMessageId(), kind: 'message', role: 'assistant' }];
  conversation.value = [];
}

function renderMessage(item: MessageDisplayItem): string {
  return item.role === 'assistant' ? renderMarkdown(item.content) : escapeHtml(item.content);
}

function nextMessageId(): string {
  messageCounter.value += 1;
  return `c7m-${messageCounter.value}`;
}

function openFrom(target: EventTarget | null): void {
  if (target instanceof HTMLElement) activeAnchor.value = target;
  toggle();
}

function open(): void {
  if (isOpen.value) return;
  lastFocus = document.activeElement;
  updateAnchorPosition();
  isOpen.value = true;
  bindFloatingListeners();
  emit('open', detail());
  void nextTick(() => input.value?.focus());
}

function close(): void {
  if (!isOpen.value) return;
  isOpen.value = false;
  unbindFloatingListeners();
  emit('close', detail());
  if (lastFocus instanceof HTMLElement) lastFocus.focus();
}

function toggle(): void {
  if (isOpen.value) close();
  else open();
}

function cancel(): void {
  abortController.value?.abort();
  abortController.value = null;
  busy.value = false;
  showTyping.value = false;
}

async function send(rawQuestion?: string): Promise<void> {
  const question = (rawQuestion ?? draft.value).trim();
  if (!question || busy.value) return;

  if (!resolvedLibrary.value) {
    displayItems.value.push({
      html: buildContext7ErrorHtml('Missing library prop.', resolvedLibrary.value),
      id: nextMessageId(),
      kind: 'error'
    });
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
  abortController.value = new AbortController();

  try {
    await streamContext7Response(
      { library: resolvedLibrary.value },
      conversation.value,
      {
        onChunk(delta) {
          showTyping.value = false;
          answer += delta;
          if (!answerItem) {
            answerItem = { content: '', id: nextMessageId(), kind: 'message', role: 'assistant' };
            displayItems.value.push(answerItem);
          }
          answerItem.content = answer;

          const answerDetail = { ...detail(), answer, question } satisfies Context7WidgetAnswerEventDetail;
          if (!sawFirstToken) {
            sawFirstToken = true;
            emit('first-token', answerDetail);
          }
          emit('answer', answerDetail);
          void scrollToBottom();
        },
        onToolCall(toolCall) {
          showTyping.value = false;
          appendToolCall(toolCall);
          emit('tool-call', { ...detail(), question, toolCall } satisfies Context7WidgetToolCallEventDetail);
        },
        onToolResult(toolResult) {
          updateToolResult(toolResult);
          emit('tool-result', { ...detail(), question, toolResult } satisfies Context7WidgetToolResultEventDetail);
        }
      },
      abortController.value.signal
    );

    showTyping.value = false;
    if (answer) {
      const assistantMessage: Context7Message = {
        content: answer,
        id: answerItem?.id ?? nextMessageId(),
        role: 'assistant'
      };
      conversation.value.push(assistantMessage);
      emit('answer-complete', {
        ...detail(),
        answer,
        message: assistantMessage,
        messages: [...conversation.value],
        question
      } satisfies Context7WidgetAnswerCompleteEventDetail);
    }
  } catch (error) {
    showTyping.value = false;
    if (!isAbortError(error)) {
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
    abortController.value = null;
    busy.value = false;
    await scrollToBottom();
    input.value?.focus();
  }
}

function appendToolCall(toolCall: Context7ToolCall): void {
  displayItems.value.push({
    expanded: false,
    hasResult: false,
    id: nextMessageId(),
    kind: 'tool',
    query: typeof toolCall.args.query === 'string' ? toolCall.args.query : 'documentation',
    toolCallId: toolCall.toolCallId
  });
  void scrollToBottom();
}

function updateToolResult(toolResult: Context7ToolResult): void {
  const item = displayItems.value.find(
    (candidate): candidate is ToolDisplayItem =>
      candidate.kind === 'tool' && candidate.toolCallId === toolResult.toolCallId
  );
  if (item) {
    item.hasResult = true;
    item.result = toolResult.result;
  }
  void scrollToBottom();
}

function formatToolResult(result: unknown): string {
  return typeof result === 'string' ? result : JSON.stringify(result, null, 2);
}

async function scrollToBottom(): Promise<void> {
  await nextTick();
  if (messagesElement.value) messagesElement.value.scrollTop = messagesElement.value.scrollHeight;
}

function onBackdropClick(): void {
  if (resolvedCloseOnOutsideClick.value) close();
}

function onDocumentPointerDown(event: Event): void {
  if (!isOpen.value || !resolvedCloseOnOutsideClick.value) return;
  const path = event.composedPath();
  if (root.value && path.includes(root.value)) return;
  if (externalTrigger && path.includes(externalTrigger)) return;
  close();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault();
    close();
    return;
  }
  if (event.key === 'Tab' && isOpen.value && root.value) trapFocus(event, root.value);
}

function bindExternalTrigger(): void {
  unbindExternalTrigger();
  if (typeof resolvedCustomTrigger.value !== 'string') return;
  const selector = normalizeCustomTriggerId(resolvedCustomTrigger.value);
  if (!selector) return;
  externalTrigger = document.querySelector(selector);
  externalTrigger?.addEventListener('click', onExternalTriggerClick);
}

function unbindExternalTrigger(): void {
  externalTrigger?.removeEventListener('click', onExternalTriggerClick);
  externalTrigger = null;
}

function onExternalTriggerClick(event: Event): void {
  event.preventDefault();
  if (event.currentTarget instanceof HTMLElement) activeAnchor.value = event.currentTarget;
  toggle();
}

function bindFloatingListeners(): void {
  if (resolvedPosition.value !== 'anchor') return;
  window.addEventListener('resize', updateAnchorPosition);
  window.addEventListener('scroll', updateAnchorPosition, true);
}

function unbindFloatingListeners(): void {
  window.removeEventListener('resize', updateAnchorPosition);
  window.removeEventListener('scroll', updateAnchorPosition, true);
}

function updateAnchorPosition(): void {
  if (resolvedPosition.value !== 'anchor' || !root.value || !panel.value) return;
  const anchor =
    activeAnchor.value ?? managedTrigger.value ?? (externalTrigger as HTMLElement | null) ?? launcher.value;
  if (!anchor) return;

  const rect = anchor.getBoundingClientRect();
  const panelWidth = panel.value.offsetWidth || 400;
  const panelHeight = panel.value.offsetHeight || 600;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || panelWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || panelHeight;
  const gap = 12;
  const margin = 12;
  let left = rect.right - panelWidth;
  const vertical = resolveAnchorVerticalPosition(rect, panelHeight, viewportHeight, gap, margin);

  left = clamp(left, margin, Math.max(margin, viewportWidth - panelWidth - margin));
  const top = clamp(vertical.top, margin, Math.max(margin, viewportHeight - panelHeight - margin));
  root.value.style.setProperty('--c7-anchor-left', `${left}px`);
  root.value.style.setProperty('--c7-anchor-top', `${top}px`);
  root.value.style.setProperty('--c7-anchor-origin', vertical.origin);
}

function register(): void {
  if (registeredWidgetId && registeredWidgetId !== resolvedWidgetId.value) {
    unregisterVueContext7Widget(registeredWidgetId, exposed);
  }
  registerVueContext7Widget(resolvedWidgetId.value, exposed);
  registeredWidgetId = resolvedWidgetId.value;
}

function normalizeCustomTriggerId(value: string): string | undefined {
  const id = value.trim().replace(/^#/, '');
  return id ? `#${id}` : undefined;
}

const exposed: Context7WidgetExpose = {
  get element() {
    return root.value;
  },
  cancel,
  close,
  isOpen: () => isOpen.value,
  open,
  send,
  toggle
};

watch(resolvedLibrary, (nextLibrary, previousLibrary) => {
  if (nextLibrary !== previousLibrary && conversation.value.length <= 1) resetConversation();
});
watch(resolvedInitialMessage, resetConversation);
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
watch(resolvedWidgetId, register);

onMounted(() => {
  resetConversation();
  bindExternalTrigger();
  document.addEventListener('pointerdown', onDocumentPointerDown, true);
  register();
  emit('ready', detail());
  if (resolvedDefaultOpen.value) open();
});

onBeforeUnmount(() => {
  cancel();
  unbindFloatingListeners();
  unbindExternalTrigger();
  document.removeEventListener('pointerdown', onDocumentPointerDown, true);
  if (registeredWidgetId) unregisterVueContext7Widget(registeredWidgetId, exposed);
});

defineExpose(exposed);

function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
  const focusable = Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => element.offsetParent !== null || element === document.activeElement);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function resolveAnchorVerticalPosition(
  rect: DOMRect,
  panelHeight: number,
  viewportHeight: number,
  gap: number,
  margin: number
): { origin: string; top: number } {
  const above = rect.top - panelHeight - gap;
  const below = rect.bottom + gap;
  const spaceAbove = rect.top - margin - gap;
  const spaceBelow = viewportHeight - rect.bottom - margin - gap;
  const hasSpaceAbove = above >= margin;
  const hasSpaceBelow = below + panelHeight <= viewportHeight - margin;
  return hasSpaceAbove || (!hasSpaceBelow && spaceAbove >= spaceBelow)
    ? { origin: 'bottom right', top: above }
    : { origin: 'top right', top: below };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
</script>

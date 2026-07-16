<template>
  <span ref="host" class="context7-widget-host" v-bind="attrs">
    <button
      v-if="rendersManagedTrigger"
      :id="managedTriggerId"
      class="context7-widget-trigger"
      type="button"
      :aria-expanded="isOpen"
      aria-haspopup="dialog"
      :data-preset="preset || 'default'"
      :data-theme="theme || 'auto'"
    >
      <slot name="trigger" :label="resolvedLauncherLabel" :trigger-id="managedTriggerId">
        {{ resolvedLauncherLabel }}
      </slot>
    </button>
    <slot />
  </span>
</template>

<script setup lang="ts">
import {
  createContext7Widget,
  setContext7WidgetAttributes,
  type Context7WidgetElement,
  type Context7WidgetOptions
} from '@desource/context7-widget';
import {
  compactContext7WidgetOptions,
  context7WidgetEvents,
  type Context7WidgetEventDetail,
  type Context7WidgetEventName
} from '@desource/context7-widget/kit';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, useAttrs, watch, getCurrentInstance } from 'vue';
import type {
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetDomEvent,
  Context7WidgetEmits,
  Context7WidgetErrorEventDetail,
  Context7WidgetExpose,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetProps,
  Context7WidgetQuestionEventDetail,
  Context7WidgetSlots,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from '../types';

defineOptions({
  name: 'Context7Widget',
  inheritAttrs: false
});

const props = defineProps<Context7WidgetProps>();
defineSlots<Context7WidgetSlots>();

const emit = defineEmits<Context7WidgetEmits>();

const attrs = useAttrs();
const host = useTemplateRef('host');
const widget = ref<Context7WidgetElement | null>(null);
const isOpen = ref(false);
/** Generate unique IDs for ARIA attributes; use useId once we stop supporting Vue < 3.5.0 */
const managedTriggerId = `context7-widget-trigger-${getCurrentInstance()?.uid ?? 0}`;
const rendersManagedTrigger = computed(() => props.customTrigger === true);
const resolvedLauncherLabel = computed(() => props.launcherLabel || 'Ask Docs AI');
const customTriggerSelector = computed(() => {
  if (props.customTrigger === true) return `#${managedTriggerId}`;
  if (typeof props.customTrigger === 'string') return normalizeCustomTriggerId(props.customTrigger);
  return undefined;
});

const widgetOptions = computed(
  () =>
    compactContext7WidgetOptions({
      backdrop: props.backdrop,
      closeOnOutsideClick: props.closeOnOutsideClick,
      color: props.color,
      customTrigger: customTriggerSelector.value,
      defaultOpen: props.defaultOpen,
      initialMessage: props.initialMessage,
      launcherLabel: props.launcherLabel,
      launcherVariant: props.launcherVariant,
      library: props.library,
      panelHeight: props.panelHeight,
      panelWidth: props.panelWidth,
      placeholder: props.placeholder,
      position: props.position,
      preset: props.preset,
      showPoweredBy: props.showPoweredBy,
      theme: props.theme,
      title: props.title,
      widgetId: props.widgetId
    }) as Context7WidgetOptions
);

const listeners = context7WidgetEvents.map((eventName) => {
  const listener = (event: Event) => {
    emitWidgetEvent(eventName, (event as Context7WidgetDomEvent).detail);
  };

  return [eventName, listener] as const;
});

function emitWidgetEvent(eventName: Context7WidgetEventName, detail: Context7WidgetEventDetail) {
  switch (eventName) {
    case 'c7:answer':
      emit('answer', detail as Context7WidgetAnswerEventDetail);
      break;
    case 'c7:answer-complete':
      emit('answer-complete', detail as Context7WidgetAnswerCompleteEventDetail);
      break;
    case 'c7:close':
      isOpen.value = false;
      emit('close', detail as Context7WidgetLifecycleEventDetail);
      break;
    case 'c7:error':
      emit('error', detail as Context7WidgetErrorEventDetail);
      break;
    case 'c7:first-token':
      emit('first-token', detail as Context7WidgetAnswerEventDetail);
      break;
    case 'c7:open':
      isOpen.value = true;
      emit('open', detail as Context7WidgetLifecycleEventDetail);
      break;
    case 'c7:question':
      emit('question', detail as Context7WidgetQuestionEventDetail);
      break;
    case 'c7:ready':
      emit('ready', detail as Context7WidgetLifecycleEventDetail);
      break;
    case 'c7:tool-call':
      emit('tool-call', detail as Context7WidgetToolCallEventDetail);
      break;
    case 'c7:tool-result':
      emit('tool-result', detail as Context7WidgetToolResultEventDetail);
      break;
  }
}

function normalizeCustomTriggerId(value: string): string | undefined {
  const id = value.trim().replace(/^#/, '');
  return id ? `#${id}` : undefined;
}

const mount = () => {
  if (!host.value || widget.value) return;

  const element = createContext7Widget(widgetOptions.value);
  for (const [eventName, listener] of listeners) {
    element.addEventListener(eventName, listener);
  }

  widget.value = element;
  host.value.append(element);
};

const unmount = () => {
  if (!widget.value) return;

  for (const [eventName, listener] of listeners) {
    widget.value.removeEventListener(eventName, listener);
  }

  widget.value.remove();
  widget.value = null;
};

watch(
  widgetOptions,
  (nextOptions) => {
    if (widget.value) {
      setContext7WidgetAttributes(widget.value, nextOptions, true);
    }
  },
  { deep: true, flush: 'post' }
);

onMounted(mount);
onBeforeUnmount(unmount);

defineExpose<Context7WidgetExpose>({
  get element() {
    return widget.value;
  },
  cancel: () => widget.value?.cancel(),
  close: () => widget.value?.close(),
  isOpen: () => widget.value?.isOpen() ?? false,
  open: () => widget.value?.open(),
  send: async (message: string) => {
    await widget.value?.send(message);
  },
  toggle: () => widget.value?.toggle()
} satisfies Context7WidgetExpose);
</script>

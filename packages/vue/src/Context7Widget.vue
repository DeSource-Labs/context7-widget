<template>
  <span ref="host" class="context7-widget-host" v-bind="attrs">
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
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, useAttrs, watch } from 'vue';
import { context7WidgetEvents, vueEventNames } from './events';
import { compactWidgetOptions } from './options';
import type { Context7WidgetExpose, Context7WidgetVueEvent } from './component-types';

defineOptions({
  inheritAttrs: false,
  name: 'Context7Widget'
});

const props = defineProps<Context7WidgetOptions>();

const emit = defineEmits([
  'answer',
  'answer-complete',
  'close',
  'error',
  'first-token',
  'open',
  'question',
  'ready',
  'tool-call',
  'tool-result'
]);

const attrs = useAttrs();
const host = useTemplateRef('host');
const widget = ref<Context7WidgetElement | null>(null);

const widgetOptions = computed(
  () =>
    compactWidgetOptions({
      backdrop: props.backdrop,
      closeOnOutsideClick: props.closeOnOutsideClick,
      color: props.color,
      customTrigger: props.customTrigger,
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
    const customEvent = event as Context7WidgetVueEvent;
    emit(vueEventNames[eventName], customEvent.detail, customEvent);
  };

  return [eventName, listener] as const;
});

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
  { deep: true }
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

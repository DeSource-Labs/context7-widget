import {
  defineContext7Widget,
  getContext7Widget,
  mountContext7Widget,
  setContext7WidgetAttributes,
  type Context7WidgetElement,
  type Context7WidgetOptions,
  type Context7WidgetTarget
} from '@desource/context7-widget';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  readonly,
  ref,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef
} from 'vue';
import { compactContext7WidgetOptions } from '@desource/context7-widget/kit';

export interface UseContext7WidgetOptions extends Partial<Context7WidgetOptions> {
  autoMount?: boolean;
  removeOnUnmount?: boolean;
  target?: Context7WidgetTarget;
}

export interface UseContext7WidgetReturn {
  cancel: () => void;
  close: () => void;
  isOpen: Readonly<Ref<boolean>>;
  mount: (overrides?: Partial<Context7WidgetOptions>) => Context7WidgetElement;
  open: () => void;
  send: (message: string) => Promise<void>;
  toggle: () => void;
  unmount: () => void;
  widget: Readonly<ShallowRef<Context7WidgetElement | null>>;
}

export function useContext7Widget(source: MaybeRefOrGetter<UseContext7WidgetOptions> = {}): UseContext7WidgetReturn {
  const widget = shallowRef<Context7WidgetElement | null>(null);
  const isOpen = ref(false);
  const ownsWidget = ref(false);

  const options = computed<UseContext7WidgetOptions>(() => {
    const value = toValue(source);
    return {
      ...compactContext7WidgetOptions(value),
      autoMount: value.autoMount,
      removeOnUnmount: value.removeOnUnmount,
      target: value.target
    };
  });
  const widgetId = computed(() => options.value.widgetId);

  const resolveWidget = () => {
    if (widget.value) return widget.value;
    const resolved = getContext7Widget(widgetId.value);
    return typeof HTMLElement !== 'undefined' && resolved instanceof HTMLElement
      ? (resolved as Context7WidgetElement)
      : null;
  };

  const syncOpenState = () => {
    isOpen.value = resolveWidget()?.isOpen() ?? false;
  };

  const mount = (overrides: Partial<Context7WidgetOptions> = {}) => {
    if (widget.value) return widget.value;

    const nextOptions = compactContext7WidgetOptions({
      ...options.value,
      ...overrides
    }) as Context7WidgetOptions;

    if (!nextOptions.library) {
      throw new Error('useContext7Widget mount requires a library option.');
    }

    widget.value = mountContext7Widget(nextOptions, options.value.target);
    ownsWidget.value = true;
    syncOpenState();
    return widget.value;
  };

  const unmount = () => {
    widget.value?.remove();
    widget.value = null;
    ownsWidget.value = false;
    syncOpenState();
  };

  const open = () => {
    resolveWidget()?.open();
    syncOpenState();
  };

  const close = () => {
    resolveWidget()?.close();
    syncOpenState();
  };

  const toggle = () => {
    resolveWidget()?.toggle();
    syncOpenState();
  };

  const send = async (message: string) => {
    await resolveWidget()?.send(message);
    syncOpenState();
  };

  const cancel = () => {
    resolveWidget()?.cancel();
  };

  onMounted(() => {
    defineContext7Widget();

    if (options.value.autoMount) {
      mount();
    } else {
      widget.value = resolveWidget();
      ownsWidget.value = false;
    }

    syncOpenState();
  });

  watch(
    options,
    (nextOptions) => {
      if (!widget.value) return;
      setContext7WidgetAttributes(widget.value, nextOptions, ownsWidget.value);
    },
    { deep: true }
  );

  onBeforeUnmount(() => {
    if (options.value.removeOnUnmount ?? options.value.autoMount) {
      unmount();
    }
  });

  return {
    cancel,
    close,
    isOpen: readonly(isOpen) as Readonly<Ref<boolean>>,
    mount,
    open,
    send,
    toggle,
    unmount,
    widget: readonly(widget) as Readonly<ShallowRef<Context7WidgetElement | null>>
  };
}

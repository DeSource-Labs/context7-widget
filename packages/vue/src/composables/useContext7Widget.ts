import {
  compactContext7WidgetOptions,
  type Context7WidgetOptions,
  type Context7WidgetTarget
} from '@desource/context7-widget/kit';
import {
  computed,
  createVNode,
  nextTick,
  onBeforeUnmount,
  onMounted,
  readonly,
  ref,
  render,
  shallowRef,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
  type ShallowRef,
  type VNode
} from 'vue';
import Context7Widget from '../components/Context7Widget.vue';
import { getVueContext7Widget } from '../internal/registry';
import type { Context7WidgetExpose } from '../types';

export interface UseContext7WidgetOptions extends Partial<Context7WidgetOptions> {
  autoMount?: boolean;
  removeOnUnmount?: boolean;
  target?: Context7WidgetTarget;
}

export interface UseContext7WidgetReturn {
  cancel: () => void;
  close: () => void;
  isOpen: Readonly<Ref<boolean>>;
  mount: (overrides?: Partial<Context7WidgetOptions>) => HTMLElement;
  open: () => void;
  send: (message: string) => Promise<void>;
  toggle: () => void;
  unmount: () => void;
  widget: Readonly<ShallowRef<HTMLElement | null>>;
}

export function useContext7Widget(source: MaybeRefOrGetter<UseContext7WidgetOptions> = {}): UseContext7WidgetReturn {
  const widget = shallowRef<HTMLElement | null>(null);
  const controller = shallowRef<Context7WidgetExpose | null>(null);
  const isOpen = ref(false);
  const ownsWidget = ref(false);
  let container: HTMLElement | null = null;
  let vnode: VNode | null = null;

  const options = computed<UseContext7WidgetOptions>(() => ({ ...toValue(source) }));
  const widgetId = computed(() => options.value.widgetId ?? 'default');

  function resolveController(): Context7WidgetExpose | null {
    return controller.value ?? getVueContext7Widget(widgetId.value) ?? null;
  }

  function syncState(): void {
    const resolved = resolveController();
    controller.value = resolved;
    widget.value = resolved?.element ?? null;
    isOpen.value = resolved?.isOpen() ?? false;
  }

  function mount(overrides: Partial<Context7WidgetOptions> = {}): HTMLElement {
    if (widget.value && ownsWidget.value) return widget.value;
    const nextOptions = { ...options.value, ...overrides };
    if (!nextOptions.library) {
      throw new Error('useContext7Widget mount requires a library option.');
    }

    container = document.createElement('div');
    container.className = 'context7-widget-programmatic-root';
    resolveTarget(options.value.target ?? document.body).append(container);
    ownsWidget.value = true;
    renderWidget(nextOptions);
    syncState();
    return widget.value as HTMLElement;
  }

  function renderWidget(nextOptions: Partial<Context7WidgetOptions>): void {
    if (!container) return;
    const widgetOptions = compactContext7WidgetOptions(nextOptions);
    vnode = createVNode(Context7Widget, {
      ...widgetOptions,
      onClose: syncState,
      onOpen: syncState,
      onReady: syncState
    });
    render(vnode, container);
    controller.value = (vnode.component?.exposed as Context7WidgetExpose | null) ?? null;
    widget.value = controller.value?.element ?? container.querySelector<HTMLElement>('.context7-widget');
  }

  function unmount(): void {
    if (container) {
      render(null, container);
      container.remove();
    }
    container = null;
    vnode = null;
    controller.value = null;
    widget.value = null;
    ownsWidget.value = false;
    syncState();
  }

  function open(): void {
    resolveController()?.open();
    syncState();
  }

  function close(): void {
    resolveController()?.close();
    syncState();
  }

  function toggle(): void {
    resolveController()?.toggle();
    syncState();
  }

  async function send(message: string): Promise<void> {
    await resolveController()?.send(message);
    syncState();
  }

  function cancel(): void {
    resolveController()?.cancel();
  }

  onMounted(() => {
    if (options.value.autoMount) mount();
    else syncState();
  });

  watch(
    options,
    (nextOptions) => {
      if (ownsWidget.value) {
        renderWidget(nextOptions);
        void nextTick(syncState);
      } else {
        syncState();
      }
    },
    { deep: true }
  );

  onBeforeUnmount(() => {
    if (ownsWidget.value && (options.value.removeOnUnmount ?? options.value.autoMount)) unmount();
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
    widget: readonly(widget) as Readonly<ShallowRef<HTMLElement | null>>
  };
}

function resolveTarget(target: Context7WidgetTarget): Element | DocumentFragment {
  if (typeof target !== 'string') return target;
  const element = document.querySelector(target);
  if (!element) throw new Error(`Context7 widget target was not found: ${target}`);
  return element;
}

import {
  assertBrowser,
  compactContext7WidgetOptions,
  resolveTarget,
  type Context7Message,
  type Context7WidgetTarget
} from '@desource/context7-widget/kit';
import {
  computed,
  createVNode,
  getCurrentInstance,
  inject,
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
import { context7WidgetDefaultsKey } from '../internal/injection';
import { getVueContext7Widget } from '../internal/registry';
import type { Context7WidgetExpose, Context7WidgetProps } from '../types';

export interface UseContext7WidgetOptions extends Partial<Context7WidgetProps> {
  /** Mount a native Vue widget when the owner component is mounted. */
  autoMount?: boolean;
  /** Remove an owned widget with its owner component. Defaults to true. */
  removeOnUnmount?: boolean;
  /** Element, document fragment, or selector that receives a programmatically mounted widget. */
  target?: Context7WidgetTarget;
}

export interface UseContext7WidgetReturn {
  cancel: () => void;
  close: () => void;
  getMessages: () => readonly Context7Message[];
  isBusy: Readonly<Ref<boolean>>;
  isOpen: Readonly<Ref<boolean>>;
  messages: Readonly<ShallowRef<readonly Context7Message[]>>;
  /** Mount or update an owned widget. Overrides persist across reactive source changes. */
  mount: (overrides?: Partial<Context7WidgetProps>) => HTMLElement;
  open: () => void;
  reset: () => void;
  send: (message: string) => Promise<void>;
  toggle: () => void;
  unmount: () => void;
  widget: Readonly<ShallowRef<HTMLElement | null>>;
}

export function useContext7Widget(source: MaybeRefOrGetter<UseContext7WidgetOptions> = {}): UseContext7WidgetReturn {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error('useContext7Widget must be called during a Vue component setup.');
  }

  const appContext = instance.appContext;
  const defaults = inject(context7WidgetDefaultsKey, {});
  const widget = shallowRef<HTMLElement | null>(null);
  const controller = shallowRef<Context7WidgetExpose | null>(null);
  const isBusy = ref(false);
  const isOpen = ref(false);
  const messages = shallowRef<readonly Context7Message[]>([]);
  const mountOverrides = shallowRef<Partial<Context7WidgetProps>>({});
  const ownsWidget = ref(false);
  let container: HTMLElement | null = null;
  let vnode: VNode | null = null;
  let subscribedController: Context7WidgetExpose | null = null;
  let unsubscribe: (() => void) | null = null;

  const options = computed<UseContext7WidgetOptions>(() => ({
    ...defaults,
    ...toValue(source),
    ...mountOverrides.value
  }));
  const widgetId = computed(() => options.value.widgetId ?? 'default');

  function resolveController(): Context7WidgetExpose | null {
    if (ownsWidget.value && controller.value) return controller.value;
    return getVueContext7Widget(widgetId.value) ?? null;
  }

  function syncState(): void {
    const resolved = resolveController();
    if (resolved !== subscribedController) {
      unsubscribe?.();
      subscribedController = resolved;
      unsubscribe =
        resolved?.subscribe((state) => {
          isBusy.value = state.busy;
          isOpen.value = state.open;
          messages.value = state.messages;
          widget.value = resolved.element;
        }) ?? null;
    }
    controller.value = resolved;
    widget.value = resolved?.element ?? null;
    isBusy.value = resolved?.isBusy() ?? false;
    isOpen.value = resolved?.isOpen() ?? false;
    messages.value = resolved?.getMessages() ?? [];
  }

  function mount(overrides: Partial<Context7WidgetProps> = {}): HTMLElement {
    assertBrowser();
    const nextOptions = { ...options.value, ...overrides };
    if (!nextOptions.library) {
      throw new Error('useContext7Widget mount requires a library option.');
    }
    mountOverrides.value = { ...overrides };

    if (!container) {
      container = document.createElement('div');
      container.className = 'context7-widget-programmatic-root';
      resolveTarget(options.value.target ?? document.body).append(container);
      ownsWidget.value = true;
    }
    renderWidget(nextOptions);
    syncState();
    const element = widget.value ?? container.querySelector<HTMLElement>('.context7-widget');
    if (!element) {
      unmount();
      throw new Error('useContext7Widget could not mount the Vue widget.');
    }
    widget.value = element;
    return element;
  }

  function renderWidget(nextOptions: UseContext7WidgetOptions): void {
    if (!container) return;
    const { customTrigger, ...coreOptions } = nextOptions;
    const widgetOptions = compactContext7WidgetOptions(coreOptions);
    vnode = createVNode(Context7Widget, {
      ...widgetOptions,
      customTrigger,
      onClose: syncState,
      onOpen: syncState,
      onReady: syncState
    });
    vnode.appContext = appContext;
    render(vnode, container);
    controller.value = (vnode.component?.exposed as Context7WidgetExpose | null) ?? null;
    widget.value = controller.value?.element ?? container.querySelector<HTMLElement>('.context7-widget');
  }

  function unmount(): void {
    unsubscribe?.();
    unsubscribe = null;
    subscribedController = null;
    if (container) {
      render(null, container);
      container.remove();
    }
    container = null;
    vnode = null;
    controller.value = null;
    widget.value = null;
    ownsWidget.value = false;
    mountOverrides.value = {};
    isBusy.value = false;
    isOpen.value = false;
    messages.value = [];
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
    const pending = resolveController()?.send(message);
    syncState();
    await pending;
    syncState();
  }

  function cancel(): void {
    resolveController()?.cancel();
    syncState();
  }

  function reset(): void {
    resolveController()?.reset();
    syncState();
  }

  function getMessages(): readonly Context7Message[] {
    return resolveController()?.getMessages() ?? [];
  }

  onMounted(() => {
    if (options.value.autoMount && !ownsWidget.value) mount();
    else syncState();
  });

  watch(
    options,
    (nextOptions) => {
      if (ownsWidget.value) {
        if (container) {
          const target = resolveTarget(nextOptions.target ?? document.body);
          if (container.parentNode !== target) target.append(container);
        }
        renderWidget(nextOptions);
        void nextTick(syncState);
      } else {
        syncState();
      }
    },
    { deep: true }
  );

  onBeforeUnmount(() => {
    if (ownsWidget.value && (options.value.removeOnUnmount ?? true)) unmount();
    else {
      unsubscribe?.();
      unsubscribe = null;
      subscribedController = null;
    }
  });

  return {
    cancel,
    close,
    getMessages,
    isBusy: readonly(isBusy) as Readonly<Ref<boolean>>,
    isOpen: readonly(isOpen) as Readonly<Ref<boolean>>,
    messages: readonly(messages) as Readonly<ShallowRef<readonly Context7Message[]>>,
    mount,
    open,
    reset,
    send,
    toggle,
    unmount,
    widget: readonly(widget) as Readonly<ShallowRef<HTMLElement | null>>
  };
}

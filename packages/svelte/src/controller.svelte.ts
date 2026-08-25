import {
  assertBrowser,
  callContext7ListenerSafely,
  resolveTarget,
  type Context7Message,
  type Context7WidgetSendResult
} from '@desource/context7-widget/kit';
import { flushSync, mount as mountSvelte, unmount as unmountSvelte } from 'svelte';
import Context7Widget from './Context7Widget.svelte';
import { getSvelteContext7Widget } from './internal/registry.js';
import type {
  Context7WidgetHandle,
  Context7WidgetProps,
  Context7WidgetState,
  Context7WidgetStateListener,
  Context7WidgetStore,
  CreateContext7WidgetOptions
} from './types.js';

export function createContext7Widget(initialOptions: CreateContext7WidgetOptions = {}): Context7WidgetStore {
  const baseOptions: CreateContext7WidgetOptions = { ...initialOptions };
  let options: CreateContext7WidgetOptions = { ...baseOptions };
  const mountedProps = $state({} as Context7WidgetProps);
  let ownedComponent: Context7WidgetHandle | null = null;
  let container: HTMLElement | null = null;
  let unsubscribe: (() => void) | null = null;
  let subscribedController: Context7WidgetHandle | null = null;
  let element = $state<HTMLElement | null>(null);
  let isBusyState = $state(false);
  let isOpenState = $state(false);
  let messages = $state<readonly Context7Message[]>([]);
  // Imperative subscriptions never participate in template reactivity.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const listeners = new Set<Context7WidgetStateListener>();

  function resolveController(): Context7WidgetHandle | null {
    return ownedComponent ?? getSvelteContext7Widget(options.widgetId ?? 'default') ?? null;
  }

  function mount(overrides: Partial<CreateContext7WidgetOptions> = {}): HTMLElement {
    assertBrowser();
    options = { ...options, ...overrides };
    if (!options.library) throw new Error('createContext7Widget mount requires a library option.');
    const target = resolveTarget(options.target ?? document.body);
    if (!container) {
      container = document.createElement('div');
      container.className = 'context7-widget-programmatic-root';
    }
    if (container.parentNode !== target) target.append(container);
    syncMountedProps();
    if (!ownedComponent) {
      ownedComponent = mountSvelte(Context7Widget, { props: mountedProps, target: container });
    }
    flushSync();
    syncState();
    const current = ownedComponent?.element();
    if (!current) throw new Error('createContext7Widget could not mount the Svelte widget.');
    return current;
  }

  function syncMountedProps(): void {
    const props = { ...options };
    delete props.target;
    Object.assign(mountedProps, props);
  }

  function update(nextOptions: Partial<CreateContext7WidgetOptions>): void {
    options = { ...options, ...nextOptions };
    if (container && options.target) {
      const target = resolveTarget(options.target);
      if (container.parentNode !== target) target.append(container);
    }
    if (ownedComponent) {
      syncMountedProps();
      flushSync();
    }
    syncState();
  }

  function unmount(): void {
    unsubscribe?.();
    unsubscribe = null;
    subscribedController = null;
    if (ownedComponent) void unmountSvelte(ownedComponent);
    ownedComponent = null;
    container?.remove();
    container = null;
    options = { ...baseOptions };
    element = null;
    isBusyState = false;
    isOpenState = false;
    messages = [];
    notify();
  }

  function syncState(): void {
    const controller = resolveController();
    if (controller !== subscribedController) {
      unsubscribe?.();
      subscribedController = controller;
      unsubscribe = controller?.subscribe(syncStateFromSubscription) ?? null;
    }
    element = controller?.element() ?? null;
    isBusyState = controller?.isBusy() ?? false;
    isOpenState = controller?.isOpen() ?? false;
    messages = controller?.getMessages() ?? [];
    notify();
  }

  function syncStateFromSubscription(state: Context7WidgetState): void {
    const controller = resolveController();
    element = controller?.element() ?? null;
    isBusyState = state.busy;
    isOpenState = state.open;
    messages = state.messages;
    notify();
  }

  function notify(): void {
    const state: Context7WidgetState = { busy: isBusyState, messages, open: isOpenState };
    for (const listener of listeners) callContext7ListenerSafely(listener, state);
  }

  function subscribe(listener: Context7WidgetStateListener): () => void {
    listeners.add(listener);
    callContext7ListenerSafely(listener, { busy: isBusyState, messages, open: isOpenState });
    return () => listeners.delete(listener);
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
  async function send(message: string): Promise<Context7WidgetSendResult | undefined> {
    const pending = resolveController()?.send(message);
    syncState();
    const result = await pending;
    syncState();
    return result;
  }
  function cancel(): void {
    resolveController()?.cancel();
    syncState();
  }
  async function retry(): Promise<Context7WidgetSendResult | undefined> {
    const pending = resolveController()?.retry();
    syncState();
    const result = await pending;
    syncState();
    return result;
  }
  function reset(): void {
    resolveController()?.reset();
    syncState();
  }
  function getMessages(): readonly Context7Message[] {
    return resolveController()?.getMessages() ?? [];
  }

  return {
    cancel,
    close,
    get element() {
      return element;
    },
    get isBusyState() {
      return isBusyState;
    },
    get isOpenState() {
      return isOpenState;
    },
    get messages() {
      return messages;
    },
    getMessages,
    isBusy: () => resolveController()?.isBusy() ?? false,
    isOpen: () => resolveController()?.isOpen() ?? false,
    mount,
    open,
    reset,
    retry,
    send,
    subscribe,
    toggle,
    unmount,
    update
  };
}

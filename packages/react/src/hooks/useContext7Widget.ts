import { assertBrowser, resolveTarget, type Context7WidgetTarget } from '@desource/context7-widget/kit';
import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { Context7Widget } from '../components/Context7Widget';
import { getReactContext7Widget } from '../internal/registry';
import type { Context7Message, Context7WidgetHandle, Context7WidgetProps, Context7WidgetSendResult } from '../types';

export interface UseContext7WidgetOptions extends Partial<Context7WidgetProps> {
  /** Mount a native React widget after the owner component commits. */
  autoMount?: boolean;
  /** Remove an owned widget with its owner component. Defaults to true. */
  removeOnUnmount?: boolean;
  /** Element, document fragment, or selector receiving a programmatically mounted widget. */
  target?: Context7WidgetTarget;
}

export interface UseContext7WidgetReturn {
  readonly isBusy: boolean;
  readonly isOpen: boolean;
  readonly messages: readonly Context7Message[];
  readonly widget: HTMLElement | null;
  cancel(): void;
  close(): void;
  getMessages(): readonly Context7Message[];
  mount(overrides?: Partial<Context7WidgetProps>): HTMLElement;
  open(): void;
  reset(): void;
  retry(): Promise<Context7WidgetSendResult | undefined>;
  send(message: string): Promise<Context7WidgetSendResult | undefined>;
  toggle(): void;
  unmount(): void;
}

export function useContext7Widget(options: UseContext7WidgetOptions = {}): UseContext7WidgetReturn {
  const optionsRef = useRef(options);
  const overridesRef = useRef<Partial<Context7WidgetProps>>({});
  const containerRef = useRef<HTMLElement | null>(null);
  const reactRootRef = useRef<Root | null>(null);
  const ownedControllerRef = useRef<Context7WidgetHandle | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const subscribedControllerRef = useRef<Context7WidgetHandle | null>(null);
  const [widget, setWidget] = useState<HTMLElement | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<readonly Context7Message[]>([]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const resolveController = useCallback((): Context7WidgetHandle | null => {
    return ownedControllerRef.current ?? getReactContext7Widget(optionsRef.current.widgetId ?? 'default') ?? null;
  }, []);

  const syncState = useCallback(() => {
    const controller = resolveController();
    if (controller !== subscribedControllerRef.current) {
      unsubscribeRef.current?.();
      subscribedControllerRef.current = controller;
      unsubscribeRef.current =
        controller?.subscribe((state) => {
          setIsBusy((current) => (current === state.busy ? current : state.busy));
          setIsOpen((current) => (current === state.open ? current : state.open));
          setMessages((current) => (areMessagesEqual(current, state.messages) ? current : state.messages));
          setWidget((current) => (current === controller.element ? current : controller.element));
        }) ?? null;
    }
    const element = controller?.element ?? null;
    const busy = controller?.isBusy() ?? false;
    const open = controller?.isOpen() ?? false;
    const nextMessages = controller?.getMessages() ?? [];
    setWidget((current) => (current === element ? current : element));
    setIsBusy((current) => (current === busy ? current : busy));
    setIsOpen((current) => (current === open ? current : open));
    setMessages((current) => (areMessagesEqual(current, nextMessages) ? current : nextMessages));
  }, [resolveController]);

  const renderOwned = useCallback(
    (nextOptions: UseContext7WidgetOptions): void => {
      if (!reactRootRef.current) return;
      const widgetOptions = { ...nextOptions };
      delete widgetOptions.autoMount;
      delete widgetOptions.removeOnUnmount;
      delete widgetOptions.target;
      flushSync(() => {
        reactRootRef.current?.render(
          createElement(Context7Widget, {
            ...widgetOptions,
            library: nextOptions.library as string,
            ref: (controller: Context7WidgetHandle | null) => {
              ownedControllerRef.current = controller;
            }
          })
        );
      });
      syncState();
    },
    [syncState]
  );

  const mount = useCallback(
    (overrides: Partial<Context7WidgetProps> = {}): HTMLElement => {
      assertBrowser();
      const nextOptions = { ...optionsRef.current, ...overrides };
      if (!nextOptions.library) throw new Error('useContext7Widget mount requires a library option.');
      overridesRef.current = overrides;

      if (!containerRef.current) {
        const container = document.createElement('div');
        container.className = 'context7-widget-programmatic-root';
        resolveTarget(nextOptions.target ?? document.body).append(container);
        containerRef.current = container;
        reactRootRef.current = createRoot(container);
      }
      renderOwned(nextOptions);
      const element =
        ownedControllerRef.current?.element ?? containerRef.current.querySelector<HTMLElement>('.context7-widget');
      if (!element) throw new Error('useContext7Widget could not mount the React widget.');
      setWidget(element);
      return element;
    },
    [renderOwned]
  );

  const unmount = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    subscribedControllerRef.current = null;
    if (reactRootRef.current) flushSync(() => reactRootRef.current?.unmount());
    containerRef.current?.remove();
    containerRef.current = null;
    reactRootRef.current = null;
    ownedControllerRef.current = null;
    overridesRef.current = {};
    setWidget(null);
    setIsBusy(false);
    setIsOpen(false);
    setMessages([]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (options.autoMount && !containerRef.current) {
      queueMicrotask(() => {
        if (!cancelled && !containerRef.current) mount();
      });
    } else syncState();
    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      subscribedControllerRef.current = null;
      if (containerRef.current && (optionsRef.current.removeOnUnmount ?? true)) {
        const ownedRoot = reactRootRef.current;
        const ownedContainer = containerRef.current;
        containerRef.current = null;
        reactRootRef.current = null;
        ownedControllerRef.current = null;
        overridesRef.current = {};
        queueMicrotask(() => {
          ownedRoot?.unmount();
          ownedContainer.remove();
        });
      }
    };
  }, [mount, options.autoMount, syncState]);

  useEffect(() => {
    if (!containerRef.current) {
      syncState();
      return;
    }
    const currentOptions = optionsRef.current;
    const target = resolveTarget(currentOptions.target ?? document.body);
    if (containerRef.current.parentNode !== target) target.append(containerRef.current);
    renderOwned({ ...currentOptions, ...overridesRef.current });
  }, [
    options.backdrop,
    options.closeOnOutsideClick,
    options.color,
    options.children,
    options.customTrigger,
    options.defaultOpen,
    options.initialMessage,
    options.labels,
    options.launcherLabel,
    options.launcherVariant,
    options.library,
    options.linkBaseUrl,
    options.open,
    options.onAnswer,
    options.onAnswerComplete,
    options.onCancel,
    options.onClose,
    options.onError,
    options.onFirstToken,
    options.onOpen,
    options.onOpenChange,
    options.onQuestion,
    options.onReady,
    options.onToolCall,
    options.onToolResult,
    options.panelHeight,
    options.panelWidth,
    options.placeholder,
    options.position,
    options.preset,
    options.removeOnUnmount,
    options.rootProps,
    options.target,
    options.theme,
    options.title,
    options.trigger,
    options.widgetId,
    renderOwned,
    syncState
  ]);

  const withController = useCallback(
    <Result>(callback: (controller: Context7WidgetHandle) => Result): Result | undefined => {
      const controller = resolveController();
      if (!controller) return undefined;
      return callback(controller);
    },
    [resolveController]
  );

  return {
    cancel: () => {
      withController((controller) => controller.cancel());
      syncState();
    },
    close: () => {
      withController((controller) => controller.close());
      syncState();
    },
    getMessages: () => withController((controller) => controller.getMessages()) ?? [],
    isBusy,
    isOpen,
    messages,
    mount,
    open: () => {
      withController((controller) => controller.open());
      syncState();
    },
    reset: () => {
      withController((controller) => controller.reset());
      syncState();
    },
    retry: async () => {
      const result = await withController((controller) => controller.retry());
      syncState();
      return result;
    },
    send: async (message) => {
      const result = await withController((controller) => controller.send(message));
      syncState();
      return result;
    },
    toggle: () => {
      withController((controller) => controller.toggle());
      syncState();
    },
    unmount,
    widget
  };
}

function areMessagesEqual(current: readonly Context7Message[], next: readonly Context7Message[]): boolean {
  if (current === next) return true;
  if (current.length !== next.length) return false;
  return current.every((message, index) => message === next[index]);
}

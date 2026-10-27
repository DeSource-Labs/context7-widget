import type { Context7WidgetController, Context7WidgetSendResult } from './types.js';

/** Forward imperative controls while leaving state ownership and rendering to the framework. */
export function createContext7WidgetControls(
  resolveController: () => Context7WidgetController | null,
  syncState: () => void
): Omit<Context7WidgetController, 'isBusy' | 'isOpen'> {
  function invoke(method: 'cancel' | 'close' | 'open' | 'reset' | 'toggle'): void {
    resolveController()?.[method]();
    syncState();
  }

  async function request(
    action: () => Promise<Context7WidgetSendResult | undefined> | undefined
  ): Promise<Context7WidgetSendResult | undefined> {
    const pending = action();
    syncState();
    const result = await pending;
    syncState();
    return result;
  }

  return {
    cancel: () => invoke('cancel'),
    close: () => invoke('close'),
    getMessages: () => resolveController()?.getMessages() ?? [],
    open: () => invoke('open'),
    reset: () => invoke('reset'),
    retry: () => request(() => resolveController()?.retry()),
    send: (message) => request(() => resolveController()?.send(message)),
    toggle: () => invoke('toggle')
  };
}

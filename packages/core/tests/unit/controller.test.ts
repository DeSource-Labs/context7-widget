import { describe, expect, it, vi } from 'vitest';
import { createContext7WidgetControls, type Context7WidgetController } from '@src/kit';

function createController() {
  return {
    cancel: vi.fn(),
    close: vi.fn(),
    getMessages: vi.fn<Context7WidgetController['getMessages']>(() => []),
    isBusy: vi.fn(() => false),
    isOpen: vi.fn(() => false),
    open: vi.fn(),
    reset: vi.fn(),
    retry: vi.fn<Context7WidgetController['retry']>(async () => undefined),
    send: vi.fn<Context7WidgetController['send']>(async () => undefined),
    toggle: vi.fn()
  };
}

describe('framework controller forwarding', () => {
  it.each(['cancel', 'close', 'open', 'reset', 'toggle'] as const)(
    'resolves the current controller and synchronizes after %s',
    (method) => {
      const first = createController();
      const second = createController();
      let current: Context7WidgetController | null = first;
      const syncState = vi.fn();
      const controls = createContext7WidgetControls(() => current, syncState);
      first[method].mockImplementation(function (this: Context7WidgetController) {
        expect(this).toBe(first);
        expect(syncState).not.toHaveBeenCalled();
      });

      controls[method]();
      expect(first[method]).toHaveBeenCalledOnce();
      expect(syncState).toHaveBeenCalledOnce();

      current = second;
      controls[method]();
      expect(second[method]).toHaveBeenCalledOnce();

      current = null;
      controls[method]();
      expect(syncState).toHaveBeenCalledTimes(3);

      current = second;
      const error = new Error('Controller failed');
      second[method].mockImplementation(() => {
        throw error;
      });
      expect(() => controls[method]()).toThrow(error);
      expect(syncState).toHaveBeenCalledTimes(3);
    }
  );

  describe.each(['send', 'retry'] as const)('%s', (method) => {
    const invoke = (controls: ReturnType<typeof createContext7WidgetControls>) =>
      method === 'send' ? controls.send('Question') : controls.retry();

    it('synchronizes immediately and after fulfillment, preserving the result and receiver', async () => {
      const controller = createController();
      const calls: string[] = [];
      const result = { answer: 'Answer', messages: [], question: 'Question', status: 'complete' } as const;
      let finish!: (value: typeof result) => void;
      const pending = new Promise<typeof result>((resolve) => {
        finish = resolve;
      });
      controller[method].mockImplementation(function (this: Context7WidgetController) {
        expect(this).toBe(controller);
        calls.push('request');
        return pending;
      });
      const controls = createContext7WidgetControls(
        () => {
          calls.push('resolve');
          return controller;
        },
        () => {
          calls.push('sync');
        }
      );

      const forwarded = invoke(controls);
      expect(controller[method].mock.calls).toEqual([method === 'send' ? ['Question'] : []]);
      expect(calls).toEqual(['resolve', 'request', 'sync']);
      finish(result);
      await expect(forwarded).resolves.toBe(result);
      expect(calls).toEqual(['resolve', 'request', 'sync', 'sync']);
    });

    it('preserves rejection without synchronizing a second time', async () => {
      const controller = createController();
      const error = new Error('Request failed');
      controller[method].mockRejectedValue(error);
      const syncState = vi.fn();
      const controls = createContext7WidgetControls(() => controller, syncState);

      await expect(invoke(controls)).rejects.toBe(error);
      expect(syncState).toHaveBeenCalledOnce();
    });

    it('converts a synchronous controller error to rejection before synchronization', async () => {
      const controller = createController();
      const error = new Error('Controller failed');
      controller[method].mockImplementation(() => {
        throw error;
      });
      const syncState = vi.fn();
      const controls = createContext7WidgetControls(() => controller, syncState);

      await expect(invoke(controls)).rejects.toBe(error);
      expect(syncState).not.toHaveBeenCalled();
    });

    it('synchronizes twice even when no controller is mounted', async () => {
      const syncState = vi.fn();
      const controls = createContext7WidgetControls(() => null, syncState);

      const pending = invoke(controls);
      expect(syncState).toHaveBeenCalledOnce();
      await expect(pending).resolves.toBeUndefined();
      expect(syncState).toHaveBeenCalledTimes(2);
    });
  });

  it('reads messages without synchronizing and returns a fresh empty fallback', () => {
    const controller = createController();
    const messages = [{ id: 'one', content: 'Question', role: 'user' }] as const;
    controller.getMessages.mockReturnValue(messages);
    let current: Context7WidgetController | null = controller;
    const syncState = vi.fn();
    const controls = createContext7WidgetControls(() => current, syncState);

    expect(controls.getMessages()).toBe(messages);
    current = null;
    expect(controls.getMessages()).toEqual([]);
    expect(controls.getMessages()).not.toBe(controls.getMessages());
    expect(syncState).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from 'vitest';
import {
  getReactContext7Widget,
  registerReactContext7Widget,
  unregisterReactContext7Widget
} from '../../src/internal/registry';
import type { Context7WidgetHandle } from '../../src';

describe('React widget registry', () => {
  it('restores previous duplicate registrations', () => {
    const first = createController();
    const second = createController();
    const unrelated = createController();
    unregisterReactContext7Widget('missing', unrelated);
    registerReactContext7Widget('docs', first);
    registerReactContext7Widget('docs', first);
    registerReactContext7Widget('docs', second);
    expect(getReactContext7Widget('docs')).toBe(second);
    expect(getReactContext7Widget()).toBe(second);
    unregisterReactContext7Widget('docs', unrelated);
    expect(getReactContext7Widget()).toBe(second);
    unregisterReactContext7Widget('docs', second);
    expect(getReactContext7Widget('docs')).toBe(first);
    unregisterReactContext7Widget('docs', first);
    expect(getReactContext7Widget('docs')).toBeUndefined();
    expect(getReactContext7Widget()).toBeUndefined();
  });

  it('prefers an explicit default widget before the first registered fallback', () => {
    const named = createController();
    const defaultWidget = createController();
    registerReactContext7Widget('named', named);
    registerReactContext7Widget('default', defaultWidget);

    expect(getReactContext7Widget()).toBe(defaultWidget);

    unregisterReactContext7Widget('default', defaultWidget);
    expect(getReactContext7Widget()).toBe(named);
    unregisterReactContext7Widget('named', named);
  });
});

function createController(): Context7WidgetHandle {
  return {
    cancel() {},
    close() {},
    element: null,
    getMessages: () => [],
    isBusy: () => false,
    isOpen: () => false,
    open() {},
    reset() {},
    retry: async () => undefined,
    send: async () => undefined,
    subscribe: () => () => undefined,
    toggle() {}
  };
}

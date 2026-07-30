import { describe, expect, it } from 'vitest';
import {
  getVueContext7Widget,
  registerVueContext7Widget,
  unregisterVueContext7Widget
} from '../../src/internal/registry';
import type { Context7WidgetExpose } from '../../src/types';

describe('Vue widget registry', () => {
  it('restores the previous registration when duplicate widget ids unmount out of order', () => {
    const first = createController();
    const second = createController();
    const unrelated = createController();

    registerVueContext7Widget('shared-docs', first);
    registerVueContext7Widget('shared-docs', first);
    registerVueContext7Widget('shared-docs', second);

    expect(getVueContext7Widget('shared-docs')).toBe(second);
    expect(getVueContext7Widget()).toBe(second);

    unregisterVueContext7Widget('shared-docs', unrelated);
    expect(getVueContext7Widget('shared-docs')).toBe(second);

    unregisterVueContext7Widget('shared-docs', second);
    expect(getVueContext7Widget('shared-docs')).toBe(first);

    unregisterVueContext7Widget('shared-docs', first);
    expect(getVueContext7Widget('shared-docs')).toBeUndefined();
    expect(getVueContext7Widget('missing-docs')).toBeUndefined();
  });
});

function createController(): Context7WidgetExpose {
  return {
    cancel() {},
    close() {},
    element: null,
    getMessages: () => [],
    isBusy: () => false,
    isOpen: () => false,
    open() {},
    reset() {},
    send: async () => undefined,
    subscribe: () => () => undefined,
    toggle() {}
  };
}

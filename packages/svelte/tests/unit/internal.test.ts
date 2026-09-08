import { describe, expect, it } from 'vitest';
import {
  getSvelteContext7Widget,
  registerSvelteContext7Widget,
  unregisterSvelteContext7Widget
} from '@src/internal/registry';
import type { Context7WidgetHandle } from '@src/types';

describe('Svelte renderer internals', () => {
  it('stacks duplicate widget ids, ignores duplicate registration, and restores the previous owner', () => {
    const first = {} as Context7WidgetHandle;
    const second = {} as Context7WidgetHandle;
    const unknown = {} as Context7WidgetHandle;

    unregisterSvelteContext7Widget('absent', unknown);
    registerSvelteContext7Widget('stacked', first);
    registerSvelteContext7Widget('stacked', first);
    registerSvelteContext7Widget('stacked', second);
    expect(getSvelteContext7Widget('stacked')).toBe(second);
    expect(getSvelteContext7Widget()).toBe(second);

    unregisterSvelteContext7Widget('stacked', unknown);
    expect(getSvelteContext7Widget('stacked')).toBe(second);
    unregisterSvelteContext7Widget('stacked', second);
    expect(getSvelteContext7Widget('stacked')).toBe(first);
    unregisterSvelteContext7Widget('stacked', first);
    expect(getSvelteContext7Widget('stacked')).toBeUndefined();
  });
});

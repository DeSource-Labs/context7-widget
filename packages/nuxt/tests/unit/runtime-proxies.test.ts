import { describe, expect, it, vi } from 'vitest';

const { component, composable } = vi.hoisted(() => ({
  component: { name: 'Context7Widget' },
  composable: vi.fn()
}));

vi.mock('@desource/context7-widget-vue', () => ({
  Context7Widget: component,
  useContext7Widget: composable
}));

import Context7Widget from '../../src/runtime/component';
import { useContext7Widget } from '../../src/runtime/composable';

describe('module-local runtime proxies', () => {
  it('keep generated host imports inside the Nuxt package', () => {
    expect(Context7Widget).toBe(component);
    expect(useContext7Widget).toBe(composable);
  });
});

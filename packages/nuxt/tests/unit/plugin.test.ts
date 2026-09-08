import { beforeEach, describe, expect, it, vi } from 'vitest';

const { context7WidgetDefaultsKey, runtimeConfig } = vi.hoisted(() => ({
  context7WidgetDefaultsKey: Symbol('context7WidgetDefaults'),
  runtimeConfig: {
    public: {} as Record<string, unknown>
  }
}));

vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: unknown) => plugin,
  useRuntimeConfig: () => runtimeConfig
}));

vi.mock('@desource/context7-widget-vue', () => ({
  context7WidgetDefaultsKey
}));

import plugin from '../../src/runtime/plugin';

describe('runtime defaults plugin', () => {
  beforeEach(() => {
    runtimeConfig.public = {};
  });

  it('provides a snapshot of configured widget defaults to the Vue app', () => {
    const defaults = {
      library: '/vercel/nuxt',
      preset: 'terminal'
    };
    runtimeConfig.public = {
      context7Widget: { defaults }
    };
    const provide = vi.fn();

    plugin.setup!({ vueApp: { provide } } as never);

    expect(provide).toHaveBeenCalledWith(context7WidgetDefaultsKey, defaults);
    expect(provide.mock.calls[0]?.[1]).not.toBe(defaults);

    defaults.library = '/changed/later';
    expect(provide.mock.calls[0]?.[1]).toEqual({
      library: '/vercel/nuxt',
      preset: 'terminal'
    });
  });

  it('provides an empty object when runtime config is absent', () => {
    const provide = vi.fn();

    plugin.setup!({ vueApp: { provide } } as never);

    expect(provide).toHaveBeenCalledWith(context7WidgetDefaultsKey, {});
  });
});

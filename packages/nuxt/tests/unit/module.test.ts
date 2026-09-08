import { beforeEach, describe, expect, it, vi } from 'vitest';

const { addComponentMock, addImportsMock, addPluginMock, createResolverMock } = vi.hoisted(() => ({
  addComponentMock: vi.fn(),
  addImportsMock: vi.fn(),
  addPluginMock: vi.fn(),
  createResolverMock: vi.fn(() => ({
    resolve: (...parts: string[]) => parts.join('/'),
    resolvePath: async (entry: string) => entry
  }))
}));

vi.mock('@nuxt/kit', () => ({
  addComponent: addComponentMock,
  addImports: addImportsMock,
  addPlugin: addPluginMock,
  createResolver: createResolverMock,
  defineNuxtModule: (definition: unknown) => definition
}));

import module, { type ModuleOptions } from '../../src/module';

type HookCallback = (context: { references: Array<{ types?: string }> }) => void;

interface NuxtStub {
  hook: ReturnType<typeof vi.fn>;
  options: {
    css: string[];
    runtimeConfig: {
      public: Record<string, unknown>;
    };
  };
}

const defaultOptions = {
  component: true,
  componentName: 'Context7Widget',
  composable: true,
  css: true,
  defaults: {}
} satisfies Required<ModuleOptions>;

function createNuxtStub(publicRuntimeConfig: Record<string, unknown> = {}) {
  const hooks: Record<string, HookCallback> = {};
  const nuxt: NuxtStub = {
    hook: vi.fn((name: string, callback: HookCallback) => {
      hooks[name] = callback;
    }),
    options: {
      css: [],
      runtimeConfig: {
        public: publicRuntimeConfig
      }
    }
  };

  return { hooks, nuxt };
}

async function setup(options: ModuleOptions, nuxt: NuxtStub): Promise<void> {
  const typedModule = module as unknown as {
    setup: (moduleOptions: ModuleOptions, nuxtInstance: NuxtStub) => Promise<void>;
  };
  await typedModule.setup(options, nuxt);
}

describe('Nuxt module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes Nuxt 3/4 metadata and zero-configuration defaults', () => {
    const typedModule = module as unknown as {
      defaults: Required<ModuleOptions>;
      meta: { compatibility: { nuxt: string }; configKey: string; name: string };
    };

    expect(typedModule.meta).toEqual({
      compatibility: { nuxt: '>=3.17.0 <5.0.0' },
      configKey: 'context7Widget',
      name: '@desource/context7-widget-nuxt'
    });
    expect(typedModule.defaults).toEqual(defaultOptions);
  });

  it('registers module-local component and composable proxies, stylesheet, and package types', async () => {
    const { hooks, nuxt } = createNuxtStub();

    await setup(defaultOptions, nuxt);

    expect(createResolverMock).toHaveBeenCalledTimes(1);
    expect(addComponentMock).toHaveBeenCalledWith({
      filePath: './runtime/component',
      name: 'Context7Widget'
    });
    expect(addImportsMock).toHaveBeenCalledWith({
      from: './runtime/composable',
      name: 'useContext7Widget'
    });
    expect(nuxt.options.css).toEqual(['@desource/context7-widget-vue/styles.css']);
    expect(addPluginMock).toHaveBeenCalledWith('./runtime/plugin');

    const references: Array<{ types?: string }> = [];
    hooks['prepare:types']?.({ references });
    hooks['prepare:types']?.({ references });
    expect(references).toEqual([{ types: '@desource/context7-widget-nuxt' }]);
  });

  it('provides app defaults through runtime config without overriding explicit runtime values', async () => {
    const publicRuntimeConfig = {
      context7Widget: {
        defaults: {
          labels: { send: 'Search' },
          theme: 'dark'
        },
        marker: 'preserved'
      }
    };
    const { nuxt } = createNuxtStub(publicRuntimeConfig);

    await setup(
      {
        ...defaultOptions,
        componentName: 'DocsAssistant',
        defaults: {
          library: '/vercel/nuxt',
          labels: { close: 'Dismiss', send: 'Ask' },
          preset: 'glass',
          theme: 'light'
        }
      },
      nuxt
    );

    expect(addComponentMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'DocsAssistant' }));
    expect(publicRuntimeConfig.context7Widget).toEqual({
      defaults: {
        library: '/vercel/nuxt',
        labels: { close: 'Dismiss', send: 'Search' },
        preset: 'glass',
        theme: 'dark'
      },
      marker: 'preserved'
    });
    expect(addPluginMock).toHaveBeenCalledWith(expect.stringMatching(/runtime\/plugin$/));
  });

  it.each([{}, { preset: 'glass' as const }])(
    'preserves empty runtime placeholders with module defaults %j',
    async (defaults) => {
      const { nuxt } = createNuxtStub({ context7Widget: { defaults: { library: '' }, marker: 'preserved' } });
      await setup({ ...defaultOptions, defaults }, nuxt);

      expect(addPluginMock).toHaveBeenCalledWith('./runtime/plugin');
      expect(nuxt.options.runtimeConfig.public.context7Widget).toEqual({
        defaults: { library: '', ...defaults },
        marker: 'preserved'
      });
    }
  );

  it('respects feature flags, keeps existing CSS unique, and normalizes an empty component name', async () => {
    const first = createNuxtStub();
    first.nuxt.options.css.push('@desource/context7-widget-vue/styles.css');

    await setup({ ...defaultOptions, componentName: '   ' }, first.nuxt);

    expect(first.nuxt.options.css).toEqual(['@desource/context7-widget-vue/styles.css']);
    expect(addComponentMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'Context7Widget' }));

    vi.clearAllMocks();
    const second = createNuxtStub();
    await setup(
      {
        component: false,
        componentName: 'IgnoredWidget',
        composable: false,
        css: false
      },
      second.nuxt
    );

    expect(addComponentMock).not.toHaveBeenCalled();
    expect(addImportsMock).not.toHaveBeenCalled();
    expect(addPluginMock).toHaveBeenCalledWith('./runtime/plugin');
    expect(second.nuxt.options.css).toEqual([]);
  });

  it('accepts runtime defaults when the existing namespace is otherwise malformed', async () => {
    const publicRuntimeConfig: Record<string, unknown> = { context7Widget: 'invalid' };
    const { nuxt } = createNuxtStub(publicRuntimeConfig);

    await setup({ ...defaultOptions, defaults: { library: '/owner/repo' } }, nuxt);

    expect(publicRuntimeConfig.context7Widget).toEqual({
      defaults: { library: '/owner/repo' }
    });
    expect(addPluginMock).toHaveBeenCalledOnce();
  });
});

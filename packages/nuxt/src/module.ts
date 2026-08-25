import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';
import { mergeContext7WidgetOptions } from '@desource/context7-widget/kit';
import type { Context7WidgetProps } from '@desource/context7-widget-vue';

const COMPONENT_NAME = 'Context7Widget';
const MODULE_NAME = '@desource/context7-widget-nuxt';
const RUNTIME_CONFIG_KEY = 'context7Widget';
const STYLE_ENTRY = '@desource/context7-widget-vue/styles.css';

export type Context7WidgetNuxtDefaults = Readonly<Partial<Omit<Context7WidgetProps, 'customTrigger' | 'open'>>>;

export interface ModuleOptions {
  /** Auto-register the native Vue component. Defaults to true. */
  component?: boolean;
  /** Name used for the auto-imported component. Defaults to Context7Widget. */
  componentName?: string;
  /** Auto-import useContext7Widget. Defaults to true. */
  composable?: boolean;
  /** Add the Vue package stylesheet to Nuxt's global CSS. Defaults to true. */
  css?: boolean;
  /** App-wide widget props inherited by components and composable-owned widgets. */
  defaults?: Context7WidgetNuxtDefaults;
}

export interface ModulePublicRuntimeConfig {
  context7Widget?: {
    defaults?: Context7WidgetNuxtDefaults;
    [key: string]: unknown;
  };
}

declare module '@nuxt/schema' {
  interface NuxtConfig {
    context7Widget?: ModuleOptions;
  }

  interface NuxtOptions {
    context7Widget: ModuleOptions;
  }

  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}

const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: MODULE_NAME,
    configKey: RUNTIME_CONFIG_KEY,
    compatibility: {
      nuxt: '>=3.17.0 <5.0.0'
    }
  },
  defaults: {
    component: true,
    componentName: COMPONENT_NAME,
    composable: true,
    css: true,
    defaults: {}
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const componentEntry = resolver.resolve('./runtime/component');
    const composableEntry = resolver.resolve('./runtime/composable');

    nuxt.hook('prepare:types', ({ references }) => {
      if (!references.some((reference) => 'types' in reference && reference.types === MODULE_NAME)) {
        references.push({ types: MODULE_NAME });
      }
    });

    if (options.component) {
      addComponent({
        filePath: componentEntry,
        name: options.componentName?.trim() || COMPONENT_NAME
      });
    }

    if (options.composable) {
      addImports({
        from: composableEntry,
        name: 'useContext7Widget'
      });
    }

    if (options.css) {
      const styleEntry = await resolver.resolvePath(STYLE_ENTRY);
      if (!nuxt.options.css.includes(styleEntry)) nuxt.options.css.unshift(styleEntry);
    }

    const publicRuntimeConfig = nuxt.options.runtimeConfig.public as Record<string, unknown>;
    const configuredRuntime = asObject(publicRuntimeConfig[RUNTIME_CONFIG_KEY]);
    const configuredDefaults = asObject(configuredRuntime.defaults) as Context7WidgetNuxtDefaults;
    const moduleDefaults = options.defaults ?? {};
    const runtimeDefaults = mergeContext7WidgetOptions(moduleDefaults, configuredDefaults);

    if (Object.keys(runtimeDefaults).length > 0) {
      publicRuntimeConfig[RUNTIME_CONFIG_KEY] = {
        ...configuredRuntime,
        defaults: runtimeDefaults
      } satisfies NonNullable<ModulePublicRuntimeConfig['context7Widget']>;
      addPlugin(resolver.resolve('./runtime/plugin'));
    }
  }
});

function asObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export default module;

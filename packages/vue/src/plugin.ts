import type { App, InjectionKey, Plugin } from "vue";
import type { Context7WidgetOptions } from "@desource/context7-widget";
import { defineContext7Widget, mountContext7Widget } from "@desource/context7-widget";
import { Context7Widget } from "./Context7Widget";

export interface Context7WidgetPluginOptions {
  componentName?: string;
  defaultWidget?: Context7WidgetOptions;
}

export const context7WidgetDefaultsKey: InjectionKey<Partial<Context7WidgetOptions>> =
  Symbol("context7WidgetDefaults");

export function createContext7WidgetPlugin(options: Context7WidgetPluginOptions = {}): Plugin {
  return {
    install(app: App) {
      if (typeof customElements !== "undefined") {
        defineContext7Widget();
      }

      app.component(options.componentName || "Context7Widget", Context7Widget);
      app.provide(context7WidgetDefaultsKey, options.defaultWidget ?? {});

      if (options.defaultWidget && typeof document !== "undefined") {
        mountContext7Widget(options.defaultWidget);
      }
    }
  };
}

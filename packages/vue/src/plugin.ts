import type { App, Plugin } from 'vue';
import Context7Widget from './components/Context7Widget.vue';
import { context7WidgetDefaultsKey } from './internal/injection';
import type { Context7WidgetProps } from './types';

export interface Context7WidgetPluginOptions {
  componentName?: string;
  /** Default props inherited by every Context7Widget in this Vue app. */
  defaults?: Readonly<Partial<Context7WidgetProps>>;
}

export { context7WidgetDefaultsKey };

export function createContext7WidgetPlugin(options: Context7WidgetPluginOptions = {}): Plugin {
  const componentName = options.componentName?.trim() || 'Context7Widget';
  const defaults = { ...options.defaults };

  return {
    install(app: App) {
      app.component(componentName, Context7Widget);
      app.provide(context7WidgetDefaultsKey, defaults);
    }
  };
}

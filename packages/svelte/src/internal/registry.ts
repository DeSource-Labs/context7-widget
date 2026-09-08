import { createContext7StackedRegistry } from '@desource/context7-widget/kit';
import type { Context7WidgetHandle } from '../types.js';

const registry = createContext7StackedRegistry<Context7WidgetHandle>();

export function getSvelteContext7Widget(widgetId = 'default'): Context7WidgetHandle | undefined {
  return registry.get(widgetId);
}

export function registerSvelteContext7Widget(widgetId: string, widget: Context7WidgetHandle): void {
  registry.register(widgetId, widget);
}

export function unregisterSvelteContext7Widget(widgetId: string, widget: Context7WidgetHandle): void {
  registry.unregister(widgetId, widget);
}

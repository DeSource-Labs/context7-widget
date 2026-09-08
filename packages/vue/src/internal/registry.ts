import { createContext7StackedRegistry } from '@desource/context7-widget/kit';
import type { Context7WidgetExpose } from '../types';

const registry = createContext7StackedRegistry<Context7WidgetExpose>();

export function getVueContext7Widget(widgetId = 'default'): Context7WidgetExpose | undefined {
  return registry.get(widgetId);
}

export function registerVueContext7Widget(widgetId: string, widget: Context7WidgetExpose): void {
  registry.register(widgetId, widget);
}

export function unregisterVueContext7Widget(widgetId: string, widget: Context7WidgetExpose): void {
  registry.unregister(widgetId, widget);
}

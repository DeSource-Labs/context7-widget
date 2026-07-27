import type { Context7WidgetExpose } from '../types';

const registry = new Map<string, Context7WidgetExpose>();

export function getVueContext7Widget(widgetId = 'default'): Context7WidgetExpose | undefined {
  return registry.get(widgetId) ?? (widgetId === 'default' ? registry.values().next().value : undefined);
}

export function registerVueContext7Widget(widgetId: string, widget: Context7WidgetExpose): void {
  registry.set(widgetId, widget);
}

export function unregisterVueContext7Widget(widgetId: string, widget: Context7WidgetExpose): void {
  if (registry.get(widgetId) === widget) registry.delete(widgetId);
}

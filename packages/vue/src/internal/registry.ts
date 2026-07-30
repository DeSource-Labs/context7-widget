import type { Context7WidgetExpose } from '../types';

const registry = new Map<string, Context7WidgetExpose>();
const registryStacks = new Map<string, Context7WidgetExpose[]>();

export function getVueContext7Widget(widgetId = 'default'): Context7WidgetExpose | undefined {
  return registry.get(widgetId) ?? (widgetId === 'default' ? registry.values().next().value : undefined);
}

export function registerVueContext7Widget(widgetId: string, widget: Context7WidgetExpose): void {
  const registrations = registryStacks.get(widgetId) ?? [];
  if (registrations.includes(widget)) return;
  registrations.push(widget);
  registryStacks.set(widgetId, registrations);
  registry.set(widgetId, widget);
}

export function unregisterVueContext7Widget(widgetId: string, widget: Context7WidgetExpose): void {
  const registrations = registryStacks.get(widgetId);
  const index = registrations?.indexOf(widget) ?? -1;
  if (registrations && index >= 0) registrations.splice(index, 1);

  if (!registrations?.length) {
    registryStacks.delete(widgetId);
    registry.delete(widgetId);
  } else {
    registry.set(widgetId, registrations[registrations.length - 1]);
  }
}

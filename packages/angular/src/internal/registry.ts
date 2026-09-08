import { signal } from '@angular/core';
import { createContext7StackedRegistry } from '@desource/context7-widget/kit';
import type { Context7WidgetHandle } from '../types';

export const context7AngularRegistryVersion = signal(0);
const registry = createContext7StackedRegistry<Context7WidgetHandle>(() => {
  context7AngularRegistryVersion.update((version) => version + 1);
});

export function registerAngularContext7Widget(widgetId: string, widget: Context7WidgetHandle): void {
  registry.register(widgetId, widget);
}

export function unregisterAngularContext7Widget(widgetId: string, widget: Context7WidgetHandle): void {
  registry.unregister(widgetId, widget);
}

export function getAngularContext7Widget(widgetId = 'default'): Context7WidgetHandle | undefined {
  return registry.get(widgetId);
}

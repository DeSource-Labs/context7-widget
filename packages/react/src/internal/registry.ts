import { createContext7StackedRegistry } from '@desource/context7-widget/kit';
import type { Context7WidgetHandle } from '../types';

const registry = createContext7StackedRegistry<Context7WidgetHandle>();

export function registerReactContext7Widget(id: string, controller: Context7WidgetHandle): void {
  registry.register(id, controller);
}

export function unregisterReactContext7Widget(id: string, controller: Context7WidgetHandle): void {
  registry.unregister(id, controller);
}

export function getReactContext7Widget(id = 'default'): Context7WidgetHandle | undefined {
  return registry.get(id);
}

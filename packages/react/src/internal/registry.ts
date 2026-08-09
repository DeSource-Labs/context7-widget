import type { Context7WidgetHandle } from '../types';

const registrations = new Map<string, Context7WidgetHandle[]>();

export function registerReactContext7Widget(id: string, controller: Context7WidgetHandle): void {
  const stack = registrations.get(id) ?? [];
  if (stack[stack.length - 1] !== controller) stack.push(controller);
  registrations.set(id, stack);
}

export function unregisterReactContext7Widget(id: string, controller: Context7WidgetHandle): void {
  const stack = registrations.get(id);
  if (!stack) return;
  const index = stack.lastIndexOf(controller);
  if (index >= 0) stack.splice(index, 1);
  if (stack.length === 0) registrations.delete(id);
}

export function getReactContext7Widget(id = 'default'): Context7WidgetHandle | undefined {
  const stack = registrations.get(id);
  return stack?.[stack.length - 1];
}

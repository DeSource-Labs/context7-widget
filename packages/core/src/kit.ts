import type { Context7WidgetEventName, Context7WidgetOptions } from './types.js';

export const context7WidgetEvents = [
  'c7:ready',
  'c7:open',
  'c7:close',
  'c7:cancel',
  'c7:question',
  'c7:first-token',
  'c7:answer',
  'c7:answer-complete',
  'c7:tool-call',
  'c7:tool-result',
  'c7:error'
] as const satisfies readonly Context7WidgetEventName[];

export const context7WidgetOptionKeys = [
  'backdrop',
  'closeOnOutsideClick',
  'color',
  'customTrigger',
  'defaultOpen',
  'initialMessage',
  'labels',
  'launcherLabel',
  'launcherVariant',
  'library',
  'linkBaseUrl',
  'panelHeight',
  'panelWidth',
  'placeholder',
  'position',
  'preset',
  'theme',
  'title',
  'widgetId'
] as const satisfies readonly (keyof Context7WidgetOptions)[];

export function compactContext7WidgetOptions(options: Partial<Context7WidgetOptions>): Partial<Context7WidgetOptions> {
  const compacted: Partial<Context7WidgetOptions> = {};

  for (const key of context7WidgetOptionKeys) {
    copyContext7WidgetOption(compacted, options, key);
  }

  return compacted;
}

function copyContext7WidgetOption<Key extends keyof Context7WidgetOptions>(
  target: Partial<Context7WidgetOptions>,
  source: Partial<Context7WidgetOptions>,
  key: Key
): void {
  const value = source[key];
  if (value !== undefined && value !== '') target[key] = value;
}

export function isContext7WidgetEventName(value: string): value is Context7WidgetEventName {
  return (context7WidgetEvents as readonly string[]).includes(value);
}

// The framework-author surface is a strict superset of /core. Keeping the shared
// exports here prevents the two public entry points from drifting as core evolves.
export * from './core.js';
export { callContext7ListenerSafely } from './listener.js';
export { CONTEXT7_URL, DESOURCE_LABS_URL, deSourceLabsLogoUrl } from './config.js';
export {
  assertBrowser,
  cancelRenderFrame,
  captureTriggerAccessibility,
  isContext7WidgetTriggerElement,
  querySelectorSafely,
  requestRenderFrame,
  resolveContext7CustomTrigger,
  resolveTarget,
  restoreTriggerAccessibility,
  trapFocus,
  updateAnchorPosition
} from './dom.js';
export type { Context7CustomTriggerResolution } from './dom.js';
export type {
  Context7LauncherVariant,
  Context7Position,
  Context7Theme,
  Context7TriggerA11yState,
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetBaseEventDetail,
  Context7WidgetCancelEventDetail,
  Context7WidgetController,
  Context7WidgetDomEvent,
  Context7WidgetDomEventMap,
  Context7WidgetErrorEventDetail,
  Context7WidgetEventDetail,
  Context7WidgetEventDetailFor,
  Context7WidgetEventMap,
  Context7WidgetEventName,
  Context7WidgetEventPayload,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetInstance,
  Context7WidgetPreset,
  Context7WidgetQuestionEventDetail,
  Context7WidgetTarget,
  Context7WidgetTrigger,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from './types.js';

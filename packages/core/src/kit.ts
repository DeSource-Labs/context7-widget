// Kit entry point @desource/context7-widget/kit
// Designed specifically for other @desource/context7-widget packages:
// - @desource/context7-widget-vue
// - @desource/context7-widget-react
// - @desource/context7-widget-svelte
// - @desource/context7-widget-angular
// Includes only needed types and utility functions for working with Context7 Widget

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
  'launcherLabel',
  'launcherVariant',
  'library',
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

export { normalizeContext7WidgetTrigger, resolveContext7WidgetConfig } from './shared/config.js';
export { CONTEXT7_URL, DESOURCE_LABS_URL, deSourceLabsLogoUrl } from './shared/consts.js';
export { assertBrowser, isContext7WidgetTriggerElement, resolveTarget } from './shared/dom.js';
export { useContext7Session, type Context7Session, type Context7SessionEvent } from './shared/session.js';
export type {
  Context7AnchorLayout,
  Context7AnchorLayoutOptions,
  Context7AnchorRect,
  Context7CustomTriggerResolution
} from './shared/dom.js';
export type {
  Context7ActiveRequest,
  Context7LauncherVariant,
  Context7Message,
  Context7Position,
  Context7Role,
  Context7StreamCallbacks,
  Context7Theme,
  Context7ToolCall,
  Context7ToolResult,
  Context7TriggerA11yState,
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetBaseEventDetail,
  Context7WidgetCancelEventDetail,
  Context7WidgetConfig,
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
  Context7MessageStatus,
  Context7WidgetOptions,
  Context7WidgetPreset,
  Context7WidgetQuestionEventDetail,
  Context7WidgetSendResult,
  Context7WidgetSendStatus,
  Context7WidgetTarget,
  Context7WidgetTrigger,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from './types.js';

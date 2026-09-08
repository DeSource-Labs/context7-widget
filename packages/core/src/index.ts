/** Public API for the drop-in custom element and script-loader use cases. */
export { context7WidgetDefaults, normalizeContext7WidgetTrigger, resolveContext7WidgetConfig } from './config.js';
export type { Context7WidgetConfigInput } from './config.js';
export type { Context7WidgetGlobalEventMap } from './globals.js';
export {
  buildContext7WidgetScriptTag,
  createContext7Widget,
  getContext7Widget,
  getContext7WidgetApi,
  mountContext7Widget,
  setContext7WidgetAttributes,
  toContext7WidgetAttributes
} from './helpers.js';
export { mountContext7WidgetFromScript } from './loader.js';
export { Context7WidgetElement, defineContext7Widget } from './widget-element.js';
export type {
  Context7LauncherVariant,
  Context7Message,
  Context7MessageStatus,
  Context7Position,
  Context7Role,
  Context7Theme,
  Context7ToolCall,
  Context7ToolResult,
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetApi,
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
  Context7WidgetInstance,
  Context7WidgetLabels,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetOptions,
  Context7WidgetPreset,
  Context7WidgetQuestionEventDetail,
  Context7WidgetScriptOptions,
  Context7WidgetSendResult,
  Context7WidgetSendStatus,
  Context7WidgetTarget,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail,
  Context7WidgetTrigger
} from './types.js';

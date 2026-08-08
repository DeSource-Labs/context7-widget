// Root entry point @desource/context7-widget
// Includes all Web Component and script installation approaches of Context7 Widget and all needed types

export {
  context7WidgetDefaults,
  normalizeContext7WidgetTrigger,
  resolveContext7WidgetConfig
} from './shared/config.js';
export type { Context7WidgetGlobalEventMap } from './globals.js';
export {
  buildContext7WidgetScriptTag,
  createContext7Widget,
  getContext7Widget,
  getContext7WidgetApi,
  mountContext7Widget,
  setContext7WidgetAttributes,
  toContext7WidgetAttributes
} from './widget/helpers.js';
export {
  compactContext7WidgetOptions,
  context7WidgetEvents,
  context7WidgetOptionKeys,
  isContext7WidgetEventName
} from './kit.js';
export { mountContext7WidgetFromScript } from './widget/loader.js';
export { resolveContext7AnchorLayout, updateAnchorPosition } from './shared/dom.js';
export { renderMarkdown } from './shared/markdown.js';
export { streamContext7Response, Context7TransportError } from './shared/transport.js';
export { Context7WidgetElement, defineContext7Widget } from './widget/element.js';
export type { Context7AnchorLayout, Context7AnchorLayoutOptions, Context7AnchorRect } from './shared/dom.js';
export type {
  Context7LauncherVariant,
  Context7Message,
  Context7Position,
  Context7Role,
  Context7StreamCallbacks,
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
  Context7WidgetEventPayload,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetInstance,
  Context7MessageStatus,
  Context7WidgetOptions,
  Context7WidgetPreset,
  Context7WidgetQuestionEventDetail,
  Context7WidgetSendResult,
  Context7WidgetSendStatus,
  Context7WidgetScriptOptions,
  Context7WidgetTarget,
  Context7WidgetTrigger,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from './types.js';

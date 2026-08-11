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

export { copyText } from './clipboard.js';
export {
  CONTEXT7_COPY_FEEDBACK_DELAY,
  Context7CopyActionController,
  context7CopyIconHtml,
  createContext7CopyActionController,
  syncContext7CopyButton
} from './copy-action.js';
export type { Context7CopyActionControllerOptions } from './copy-action.js';
export { context7WidgetLabels, resolveContext7WidgetLabels } from './labels.js';
export {
  CONTEXT7_URL,
  DESOURCE_LABS_URL,
  context7WidgetDefaults,
  deSourceLabsLogoUrl,
  normalizeContext7WidgetTrigger,
  resolveContext7WidgetConfig,
  type Context7WidgetConfigInput
} from './config.js';
export {
  assertBrowser,
  cancelRenderFrame,
  captureTriggerAccessibility,
  isContext7WidgetTriggerElement,
  querySelectorSafely,
  requestRenderFrame,
  resolveContext7CustomTrigger,
  resolveContext7AnchorLayout,
  resolveTarget,
  restoreTriggerAccessibility,
  trapFocus,
  updateAnchorPosition
} from './dom.js';
export { Context7ConversationEngine, createContext7ConversationEngine } from './engine.js';
export { escapeHtml, renderMarkdown, resolveContext7MarkdownBaseUrl } from './markdown.js';
export type { Context7MarkdownOptions } from './markdown.js';
export { acquireContext7Modal } from './modal.js';
export {
  Context7ConversationRenderBridge,
  createContext7ConversationRenderBridge,
  formatContext7ToolResult,
  getContext7ToolQuery
} from './renderer.js';
export type { Context7ConversationRenderBridgeOptions } from './renderer.js';
export { buildContext7ErrorHtml, DEFAULT_CONTEXT7_INITIAL_MESSAGE, isAbortError } from './runtime.js';
export { Context7TransportError, streamContext7Response } from './transport.js';
export type {
  Context7AnchorLayout,
  Context7AnchorLayoutOptions,
  Context7AnchorRect,
  Context7CustomTriggerResolution
} from './dom.js';
export type {
  Context7ActiveRequest,
  Context7ConversationEngineOptions,
  Context7ConversationEvent,
  Context7ConversationEventListener,
  Context7ConversationEventName,
  Context7ConversationState,
  Context7ConversationStateListener,
  Context7ConversationTransport,
  Context7LauncherVariant,
  Context7Message,
  Context7Position,
  Context7Role,
  Context7StreamCallbacks,
  Context7Theme,
  Context7ToolCall,
  Context7ToolFrame,
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
  Context7WidgetLabels,
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

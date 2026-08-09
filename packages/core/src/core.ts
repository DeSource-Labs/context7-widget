/** Framework-neutral building blocks for custom Context7 chat experiences. */
export { copyContext7Text } from './clipboard.js';
export { context7WidgetDefaults, normalizeContext7WidgetTrigger, resolveContext7WidgetConfig } from './config.js';
export type { Context7WidgetConfigInput } from './config.js';
export { resolveContext7AnchorLayout } from './dom.js';
export type { Context7AnchorLayout, Context7AnchorLayoutOptions, Context7AnchorRect } from './dom.js';
export { Context7ConversationEngine, createContext7ConversationEngine } from './engine.js';
export { context7WidgetLabels, resolveContext7WidgetLabels } from './labels.js';
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
  Context7ActiveRequest,
  Context7ConversationEngineOptions,
  Context7ConversationEvent,
  Context7ConversationEventListener,
  Context7ConversationEventName,
  Context7ConversationState,
  Context7ConversationStateListener,
  Context7ConversationTransport,
  Context7Message,
  Context7MessageStatus,
  Context7Role,
  Context7StreamCallbacks,
  Context7ToolCall,
  Context7ToolFrame,
  Context7ToolResult,
  Context7WidgetConfig,
  Context7WidgetLabels,
  Context7WidgetOptions,
  Context7WidgetSendResult,
  Context7WidgetSendStatus
} from './types.js';

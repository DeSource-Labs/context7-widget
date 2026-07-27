import type {
  Context7Message,
  Context7ToolCall,
  Context7ToolResult,
  Context7WidgetEventName,
  Context7WidgetOptions
} from './types';

export const context7WidgetEvents = [
  'c7:ready',
  'c7:open',
  'c7:close',
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

export interface Context7WidgetBaseEventDetail {
  /** Configured Context7 library id, for example "/vercel/next.js". */
  library: string;
  /** Widget root element (custom element in core, native root in framework packages). */
  widget: HTMLElement;
  /** Instance id used by the global widget registry. */
  widgetId: string;
}

export interface Context7WidgetLifecycleEventDetail extends Context7WidgetBaseEventDetail {}

export interface Context7WidgetQuestionEventDetail extends Context7WidgetBaseEventDetail {
  /** Submitted user question. */
  question: string;
  /** User message that was just appended to the conversation. */
  message: Context7Message;
  /** Conversation snapshot after the user message was appended. */
  messages: Context7Message[];
}

export interface Context7WidgetAnswerEventDetail extends Context7WidgetBaseEventDetail {
  /** Cumulative assistant answer text received so far. */
  answer: string;
  /** Submitted user question that produced this answer. */
  question: string;
}

export interface Context7WidgetAnswerCompleteEventDetail extends Context7WidgetBaseEventDetail {
  /** Final assistant answer text. */
  answer: string;
  /** Final assistant message appended to the conversation. */
  message: Context7Message;
  /** Conversation snapshot after the assistant answer was appended. */
  messages: Context7Message[];
  /** Submitted user question that produced this answer. */
  question: string;
}

export interface Context7WidgetErrorEventDetail extends Context7WidgetBaseEventDetail {
  /** Error message or error object emitted by the widget transport. */
  error: Error | string;
  /** Submitted user question that produced this error. */
  question: string;
}

export interface Context7WidgetToolCallEventDetail extends Context7WidgetBaseEventDetail {
  /** Submitted user question that caused the backend tool call. */
  question: string;
  /** Tool name, call id, and input args reported by Context7. */
  toolCall: Context7ToolCall;
}

export interface Context7WidgetToolResultEventDetail extends Context7WidgetBaseEventDetail {
  /** Submitted user question that caused the backend tool result. */
  question: string;
  /** Tool call id and output reported by Context7. */
  toolResult: Context7ToolResult;
}

export interface Context7WidgetEventMap {
  'c7:answer': Context7WidgetAnswerEventDetail;
  'c7:answer-complete': Context7WidgetAnswerCompleteEventDetail;
  'c7:close': Context7WidgetLifecycleEventDetail;
  'c7:error': Context7WidgetErrorEventDetail;
  'c7:first-token': Context7WidgetAnswerEventDetail;
  'c7:open': Context7WidgetLifecycleEventDetail;
  'c7:question': Context7WidgetQuestionEventDetail;
  'c7:ready': Context7WidgetLifecycleEventDetail;
  'c7:tool-call': Context7WidgetToolCallEventDetail;
  'c7:tool-result': Context7WidgetToolResultEventDetail;
}

export type Context7WidgetEventDetailFor<EventName extends Context7WidgetEventName> = Context7WidgetEventMap[EventName];

export type Context7WidgetDomEvent<EventName extends Context7WidgetEventName = Context7WidgetEventName> = CustomEvent<
  Context7WidgetEventDetailFor<EventName>
>;

export function compactContext7WidgetOptions(options: Partial<Context7WidgetOptions>): Partial<Context7WidgetOptions> {
  const compacted: Partial<Context7WidgetOptions> = {};

  for (const key of context7WidgetOptionKeys) {
    const value = options[key];
    if (value === undefined || value === '') continue;
    compacted[key] = value as never;
  }

  return compacted;
}

export function isContext7WidgetEventName(value: string): value is Context7WidgetEventName {
  return (context7WidgetEvents as readonly string[]).includes(value);
}

export { CONTEXT7_URL, DESOURCE_LABS_URL, context7LogoSvg, deSourceLabsLogoUrl } from './branding';
export { escapeHtml, renderMarkdown } from './markdown';
export { buildContext7ErrorHtml, DEFAULT_CONTEXT7_INITIAL_MESSAGE, isAbortError } from './runtime';
export { Context7TransportError, streamContext7Response } from './transport';
export type {
  Context7LauncherVariant,
  Context7Message,
  Context7Position,
  Context7Role,
  Context7StreamCallbacks,
  Context7Theme,
  Context7ToolCall,
  Context7ToolResult,
  Context7WidgetConfig,
  Context7WidgetEventDetail,
  Context7WidgetEventName,
  Context7WidgetOptions,
  Context7WidgetPreset,
  Context7WidgetTarget
} from './types';

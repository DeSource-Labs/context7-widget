import type {
  Context7Message,
  Context7ToolCall,
  Context7ToolResult,
  Context7WidgetElement,
  Context7WidgetEventDetail,
  Context7WidgetOptions
} from '@desource/context7-widget';

export interface Context7WidgetProps extends Context7WidgetOptions {}

export interface Context7WidgetBaseEventDetail {
  /** Configured Context7 library id, for example "/vercel/next.js". */
  library: string;
  /** Underlying custom element instance. */
  widget: Context7WidgetElement;
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

export interface Context7WidgetVueEventMap {
  answer: Context7WidgetAnswerEventDetail;
  'answer-complete': Context7WidgetAnswerCompleteEventDetail;
  close: Context7WidgetLifecycleEventDetail;
  error: Context7WidgetErrorEventDetail;
  'first-token': Context7WidgetAnswerEventDetail;
  open: Context7WidgetLifecycleEventDetail;
  question: Context7WidgetQuestionEventDetail;
  ready: Context7WidgetLifecycleEventDetail;
  'tool-call': Context7WidgetToolCallEventDetail;
  'tool-result': Context7WidgetToolResultEventDetail;
}

export type Context7WidgetVueEventName = keyof Context7WidgetVueEventMap;

export type Context7WidgetVueEventDetail = Context7WidgetVueEventMap[Context7WidgetVueEventName];

export type Context7WidgetDomEvent = CustomEvent<Context7WidgetEventDetail>;

export interface Context7WidgetEmits {
  /** Emitted on every streamed answer update. */
  (event: 'answer', detail: Context7WidgetAnswerEventDetail): void;
  /** Emitted when the final assistant answer is available. */
  (event: 'answer-complete', detail: Context7WidgetAnswerCompleteEventDetail): void;
  /** Emitted when the widget panel closes. */
  (event: 'close', detail: Context7WidgetLifecycleEventDetail): void;
  /** Emitted when a Context7 request fails. */
  (event: 'error', detail: Context7WidgetErrorEventDetail): void;
  /** Emitted when the first assistant token arrives. */
  (event: 'first-token', detail: Context7WidgetAnswerEventDetail): void;
  /** Emitted when the widget panel opens. */
  (event: 'open', detail: Context7WidgetLifecycleEventDetail): void;
  /** Emitted after the user submits a question. */
  (event: 'question', detail: Context7WidgetQuestionEventDetail): void;
  /** Emitted when the custom element is mounted and registered. */
  (event: 'ready', detail: Context7WidgetLifecycleEventDetail): void;
  /** Emitted when Context7 reports backend tool input. */
  (event: 'tool-call', detail: Context7WidgetToolCallEventDetail): void;
  /** Emitted when Context7 reports backend tool output. */
  (event: 'tool-result', detail: Context7WidgetToolResultEventDetail): void;
}

export interface Context7WidgetSlots {
  /** Optional content rendered next to the managed custom element host. */
  default: {};
}

export interface Context7WidgetExpose {
  readonly element: Context7WidgetElement | null;
  cancel: () => void;
  close: () => void;
  isOpen: () => boolean;
  open: () => void;
  send: (message: string) => Promise<void>;
  toggle: () => void;
}

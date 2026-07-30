import type {
  Context7ActiveRequest as _Context7ActiveRequest,
  Context7Message,
  Context7Role,
  Context7WidgetController,
  Context7WidgetOptions,
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetErrorEventDetail,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetQuestionEventDetail,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from '@desource/context7-widget/kit';

export type {
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetBaseEventDetail,
  Context7WidgetDomEvent,
  Context7WidgetDomEventMap,
  Context7WidgetErrorEventDetail,
  Context7WidgetEventDetailFor,
  Context7WidgetEventMap,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetQuestionEventDetail,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from '@desource/context7-widget/kit';

export type Context7WidgetCustomTrigger = boolean | string;

export interface Context7WidgetProps extends Omit<Context7WidgetOptions, 'customTrigger'> {
  /**
   * Use a custom trigger instead of the built-in widget launcher.
   * - true renders the Vue package trigger button.
   * - a simple string binds an external trigger id; CSS selector syntax is also supported.
   * - undefined keeps the built-in widget launcher.
   */
  customTrigger?: Context7WidgetCustomTrigger;
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
  /** Emitted when the Vue widget is mounted and registered. */
  (event: 'ready', detail: Context7WidgetLifecycleEventDetail): void;
  /** Emitted when Context7 reports backend tool input. */
  (event: 'tool-call', detail: Context7WidgetToolCallEventDetail): void;
  /** Emitted when Context7 reports backend tool output. */
  (event: 'tool-result', detail: Context7WidgetToolResultEventDetail): void;
}

export interface Context7WidgetSlots {
  /** Content for the Vue-managed trigger button when customTrigger is true. */
  trigger: {
    label: string;
    triggerId: string;
  };
  /** Optional content rendered inside the Vue widget root. */
  default: {};
}

export interface Context7WidgetExpose extends Context7WidgetController {
  /** Root element rendered and owned by Vue. */
  readonly element: HTMLElement | null;
  subscribe: (listener: Context7WidgetStateListener) => () => void;
}

export interface Context7WidgetState {
  readonly busy: boolean;
  readonly messages: readonly Context7Message[];
  readonly open: boolean;
}

export type Context7WidgetStateListener = (state: Context7WidgetState) => void;

type ErrorDisplayItem = {
  html: string;
  id: string;
  kind: 'error';
};

export type MessageDisplayItem = {
  content: string;
  id: string;
  kind: 'message';
  role: Context7Role;
};

export type ToolDisplayItem = {
  contentId: string;
  expanded: boolean;
  hasResult: boolean;
  id: string;
  kind: 'tool';
  query: string;
  result: string;
  toolCallId: string;
};

export type DisplayItem = ErrorDisplayItem | MessageDisplayItem | ToolDisplayItem;

export type Context7ActiveRequest = Omit<_Context7ActiveRequest, 'typing'>;

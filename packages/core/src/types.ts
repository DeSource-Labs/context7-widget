export type Context7Role = 'user' | 'assistant';

export type Context7Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center' | 'anchor';

export type Context7LauncherVariant = 'icon' | 'pill' | 'badge';

export type Context7WidgetPreset = 'default' | 'minimal' | 'glass' | 'neo' | 'terminal' | 'brutalist';

export type Context7Theme = 'auto' | 'light' | 'dark';

export type Context7WidgetEventName =
  | 'c7:ready'
  | 'c7:open'
  | 'c7:close'
  | 'c7:cancel'
  | 'c7:question'
  | 'c7:first-token'
  | 'c7:answer'
  | 'c7:answer-complete'
  | 'c7:tool-call'
  | 'c7:tool-result'
  | 'c7:error';

export interface Context7Message {
  readonly content: string;
  readonly id: string;
  readonly role: Context7Role;
  readonly status?: Context7MessageStatus;
}

export type Context7MessageStatus = 'cancelled' | 'complete';

export type Context7WidgetSendStatus = 'busy' | 'cancelled' | 'complete' | 'empty' | 'error';

export interface Context7WidgetSendResult {
  readonly answer: string;
  readonly error?: Error | string;
  readonly message?: Context7Message;
  readonly messages: readonly Context7Message[];
  readonly question: string;
  readonly status: Context7WidgetSendStatus;
}

export interface Context7ActiveRequest {
  readonly controller: AbortController;
  readonly onCancel?: () => Context7WidgetSendResult;
  renderFrame: number | null;
  readonly typing: HTMLElement;
}

export interface Context7TriggerA11yState {
  readonly ariaControls: string | null;
  readonly ariaExpanded: string | null;
  readonly ariaHasPopup: string | null;
  readonly element: Element;
}

export type Context7WidgetTrigger = Element | string;

export interface Context7WidgetOptions {
  backdrop?: boolean;
  closeOnOutsideClick?: boolean;
  color?: string;
  customTrigger?: Context7WidgetTrigger;
  defaultOpen?: boolean;
  initialMessage?: string;
  launcherLabel?: string;
  launcherVariant?: Context7LauncherVariant;
  library: string;
  panelHeight?: string;
  panelWidth?: string;
  placeholder?: string;
  position?: Context7Position;
  preset?: Context7WidgetPreset;
  theme?: Context7Theme;
  title?: string;
  widgetId?: string;
}

export interface Context7WidgetConfig {
  readonly backdrop: boolean;
  readonly closeOnOutsideClick: boolean;
  readonly color: string;
  readonly customTrigger: string;
  readonly defaultOpen: boolean;
  readonly initialMessage: string;
  readonly launcherLabel: string;
  readonly launcherVariant: Context7LauncherVariant;
  readonly library: string;
  readonly panelHeight: string;
  readonly panelWidth: string;
  readonly placeholder: string;
  readonly position: Context7Position;
  readonly preset: Context7WidgetPreset;
  readonly theme: Context7Theme;
  readonly title: string;
  readonly widgetId: string;
}

export type Context7WidgetTarget = Element | DocumentFragment | string;

export interface Context7WidgetScriptOptions extends Omit<Context7WidgetOptions, 'customTrigger'> {
  async?: boolean;
  customTrigger?: string;
  defer?: boolean;
  id?: string;
  nonce?: string;
  src?: string;
}

export interface Context7ToolCall {
  readonly args: Readonly<Record<string, unknown>>;
  readonly toolCallId: string;
  readonly toolName: string;
}

export interface Context7ToolResult {
  readonly result: unknown;
  readonly toolCallId: string;
}

export interface Context7StreamCallbacks {
  onChunk(delta: string): void;
  onToolCall?(toolCall: Context7ToolCall): void;
  onToolResult?(toolResult: Context7ToolResult): void;
}

/** Framework-neutral imperative controls shared by every widget renderer. */
export interface Context7WidgetController {
  cancel(): void;
  close(): void;
  getMessages(): readonly Context7Message[];
  isBusy(): boolean;
  isOpen(): boolean;
  open(): void;
  reset(): void;
  send(message: string): Promise<Context7WidgetSendResult | undefined>;
  toggle(): void;
}

/** A core custom-element instance with its imperative widget controls. */
export type Context7WidgetInstance = HTMLElement & Context7WidgetController;

export interface Context7WidgetBaseEventDetail {
  /** Configured Context7 library id, for example "/vercel/next.js". */
  readonly library: string;
  /** Widget root element (custom element in core, native root in framework packages). */
  readonly widget: HTMLElement;
  /** Instance id used by the global widget registry. */
  readonly widgetId: string;
}

export type Context7WidgetLifecycleEventDetail = Context7WidgetBaseEventDetail;

export interface Context7WidgetCancelEventDetail extends Context7WidgetBaseEventDetail {
  /** Partial assistant answer preserved when cancellation happened after streamed tokens. */
  readonly answer: string;
  /** Cancelled partial assistant message, if any answer tokens had arrived. */
  readonly message?: Context7Message;
  /** Conversation snapshot after the cancellation state was applied. */
  readonly messages: readonly Context7Message[];
  /** Submitted user question that was cancelled. */
  readonly question: string;
  /** Send lifecycle status for this cancellation. */
  readonly status: 'cancelled';
}

export interface Context7WidgetQuestionEventDetail extends Context7WidgetBaseEventDetail {
  /** User message that was just appended to the conversation. */
  readonly message: Context7Message;
  /** Conversation snapshot after the user message was appended. */
  readonly messages: readonly Context7Message[];
  /** Submitted user question. */
  readonly question: string;
}

export interface Context7WidgetAnswerEventDetail extends Context7WidgetBaseEventDetail {
  /** Cumulative assistant answer text received so far. */
  readonly answer: string;
  /** Submitted user question that produced this answer. */
  readonly question: string;
}

export interface Context7WidgetAnswerCompleteEventDetail extends Context7WidgetBaseEventDetail {
  /** Final assistant answer text. */
  readonly answer: string;
  /** Final assistant message appended to the conversation. */
  readonly message: Context7Message;
  /** Conversation snapshot after the assistant answer was appended. */
  readonly messages: readonly Context7Message[];
  /** Submitted user question that produced this answer. */
  readonly question: string;
}

export interface Context7WidgetErrorEventDetail extends Context7WidgetBaseEventDetail {
  /** Error message or error object emitted by the widget transport. */
  readonly error: Error | string;
  /** Submitted user question that produced this error. */
  readonly question: string;
}

export interface Context7WidgetToolCallEventDetail extends Context7WidgetBaseEventDetail {
  /** Submitted user question that caused the backend tool call. */
  readonly question: string;
  /** Tool name, call id, and input args reported by Context7. */
  readonly toolCall: Context7ToolCall;
}

export interface Context7WidgetToolResultEventDetail extends Context7WidgetBaseEventDetail {
  /** Submitted user question that caused the backend tool result. */
  readonly question: string;
  /** Tool call id and output reported by Context7. */
  readonly toolResult: Context7ToolResult;
}

export interface Context7WidgetEventMap {
  'c7:answer': Context7WidgetAnswerEventDetail;
  'c7:answer-complete': Context7WidgetAnswerCompleteEventDetail;
  'c7:cancel': Context7WidgetCancelEventDetail;
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

export type Context7WidgetEventDetail = Context7WidgetEventMap[Context7WidgetEventName];

export type Context7WidgetEventPayload<EventName extends Context7WidgetEventName> = Omit<
  Context7WidgetEventDetailFor<EventName>,
  keyof Context7WidgetBaseEventDetail
>;

export type Context7WidgetDomEvent<EventName extends Context7WidgetEventName = Context7WidgetEventName> = CustomEvent<
  Context7WidgetEventDetailFor<EventName>
>;

export interface Context7WidgetDomEventMap {
  'c7:answer': Context7WidgetDomEvent<'c7:answer'>;
  'c7:answer-complete': Context7WidgetDomEvent<'c7:answer-complete'>;
  'c7:cancel': Context7WidgetDomEvent<'c7:cancel'>;
  'c7:close': Context7WidgetDomEvent<'c7:close'>;
  'c7:error': Context7WidgetDomEvent<'c7:error'>;
  'c7:first-token': Context7WidgetDomEvent<'c7:first-token'>;
  'c7:open': Context7WidgetDomEvent<'c7:open'>;
  'c7:question': Context7WidgetDomEvent<'c7:question'>;
  'c7:ready': Context7WidgetDomEvent<'c7:ready'>;
  'c7:tool-call': Context7WidgetDomEvent<'c7:tool-call'>;
  'c7:tool-result': Context7WidgetDomEvent<'c7:tool-result'>;
}

export interface Context7WidgetApi {
  readonly instances: ReadonlyMap<string, Context7WidgetInstance>;
  cancel(widgetId?: string): void;
  close(widgetId?: string): void;
  get(widgetId?: string): Context7WidgetInstance | undefined;
  getMessages(widgetId?: string): readonly Context7Message[];
  isBusy(widgetId?: string): boolean;
  isOpen(widgetId?: string): boolean;
  open(widgetId?: string): void;
  reset(widgetId?: string): void;
  send(message: string, widgetId?: string): Promise<Context7WidgetSendResult | undefined>;
  toggle(widgetId?: string): void;
}

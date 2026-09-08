import type {
  Context7Message,
  Context7DisplayItem,
  Context7MessageDisplayItem,
  Context7ToolDisplayItem,
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetCancelEventDetail,
  Context7WidgetController,
  Context7WidgetErrorEventDetail,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetOptions,
  Context7WidgetQuestionEventDetail,
  Context7WidgetTarget,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from '@desource/context7-widget/kit';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

export type Context7SvelteCustomTrigger = boolean | Element | string;

export interface Context7WidgetState {
  readonly busy: boolean;
  readonly messages: readonly Context7Message[];
  readonly open: boolean;
}

export type Context7WidgetStateListener = (state: Context7WidgetState) => void;

export interface Context7WidgetHandle extends Context7WidgetController {
  element(): HTMLElement | null;
  subscribe(listener: Context7WidgetStateListener): () => void;
}

export interface Context7WidgetTriggerSnippetOptions {
  readonly label: string;
  readonly triggerId: string;
}

export interface Context7WidgetCallbacks {
  onAnswer?(detail: Context7WidgetAnswerEventDetail): void;
  onAnswerComplete?(detail: Context7WidgetAnswerCompleteEventDetail): void;
  onCancel?(detail: Context7WidgetCancelEventDetail): void;
  onClose?(detail: Context7WidgetLifecycleEventDetail): void;
  onError?(detail: Context7WidgetErrorEventDetail): void;
  onFirstToken?(detail: Context7WidgetAnswerEventDetail): void;
  onOpen?(detail: Context7WidgetLifecycleEventDetail): void;
  onQuestion?(detail: Context7WidgetQuestionEventDetail): void;
  onReady?(detail: Context7WidgetLifecycleEventDetail): void;
  onToolCall?(detail: Context7WidgetToolCallEventDetail): void;
  onToolResult?(detail: Context7WidgetToolResultEventDetail): void;
}

export interface Context7WidgetProps extends Omit<Context7WidgetOptions, 'customTrigger'>, Context7WidgetCallbacks {
  /** Optional content rendered next to the widget element inside the Svelte root. */
  children?: Snippet;
  /** true renders a Svelte-managed trigger; strings and Elements bind external triggers. */
  customTrigger?: Context7SvelteCustomTrigger;
  /** Bindable open state. Omit it to initialize from defaultOpen. */
  open?: boolean;
  /** Attributes forwarded to the Svelte-owned root. */
  rootProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
  /** Content for the Svelte-managed trigger when customTrigger is true. */
  trigger?: Snippet<[options: Context7WidgetTriggerSnippetOptions]>;
}

export interface CreateContext7WidgetOptions extends Omit<Partial<Context7WidgetProps>, 'customTrigger'> {
  /** Programmatic controllers accept external triggers; use the component for a Svelte-managed trigger. */
  customTrigger?: Element | string;
  /** Target used by mount(). Defaults to document.body. */
  target?: Context7WidgetTarget;
}

export interface Context7WidgetStore extends Context7WidgetController {
  readonly element: HTMLElement | null;
  readonly isBusyState: boolean;
  readonly isOpenState: boolean;
  readonly messages: readonly Context7Message[];
  /** Mount or update an owned widget. Overrides persist until unmount(). */
  mount(overrides?: Partial<CreateContext7WidgetOptions>): HTMLElement;
  subscribe(listener: Context7WidgetStateListener): () => void;
  unmount(): void;
  update(options: Partial<CreateContext7WidgetOptions>): void;
}

export type { Context7Message, Context7WidgetSendResult } from '@desource/context7-widget/kit';

export type MessageDisplayItem = Context7MessageDisplayItem;
export type ToolDisplayItem = Context7ToolDisplayItem;
export type DisplayItem = Context7DisplayItem;

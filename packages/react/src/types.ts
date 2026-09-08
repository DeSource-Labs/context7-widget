import type {
  Context7Message,
  Context7DisplayItem,
  Context7MessageDisplayItem,
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetCancelEventDetail,
  Context7WidgetController,
  Context7WidgetErrorEventDetail,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetOptions,
  Context7WidgetQuestionEventDetail,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from '@desource/context7-widget/kit';
import type { HTMLAttributes, ReactNode, RefObject } from 'react';

export type Context7ReactCustomTrigger = boolean | Element | RefObject<Element | null> | string;

export interface Context7WidgetState {
  readonly busy: boolean;
  readonly messages: readonly Context7Message[];
  readonly open: boolean;
}

export type Context7WidgetStateListener = (state: Context7WidgetState) => void;

export interface Context7WidgetHandle extends Context7WidgetController {
  readonly element: HTMLElement | null;
  subscribe(listener: Context7WidgetStateListener): () => void;
}

export interface Context7WidgetProps extends Omit<Context7WidgetOptions, 'customTrigger'> {
  children?: ReactNode;
  customTrigger?: Context7ReactCustomTrigger;
  /** Controlled open state. Omit to use defaultOpen and internal state. */
  open?: boolean;
  onOpenChange?(open: boolean): void;
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
  rootProps?: Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'defaultOpen'>;
  trigger?: ReactNode | ((options: { readonly label: string; readonly triggerId: string }) => ReactNode);
}

export type MessageDisplayItem = Context7MessageDisplayItem;
export type DisplayItem = Context7DisplayItem;

export type { Context7Message, Context7WidgetSendResult } from '@desource/context7-widget/kit';

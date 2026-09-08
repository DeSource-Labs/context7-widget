import type { ElementRef } from '@angular/core';
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

export type Context7AngularCustomTrigger = boolean | Element | ElementRef<Element> | string;

export interface Context7WidgetAngularOptions extends Omit<Context7WidgetOptions, 'customTrigger'> {
  customTrigger?: Context7AngularCustomTrigger;
  /** Controlled open state. Omit it to let the component own visibility. */
  open?: boolean;
}

export type Context7WidgetAngularDefaults = Readonly<Partial<Omit<Context7WidgetAngularOptions, 'open'>>>;

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

export interface Context7WidgetAngularEventMap {
  answer: Context7WidgetAnswerEventDetail;
  answerComplete: Context7WidgetAnswerCompleteEventDetail;
  cancelled: Context7WidgetCancelEventDetail;
  closed: Context7WidgetLifecycleEventDetail;
  error: Context7WidgetErrorEventDetail;
  firstToken: Context7WidgetAnswerEventDetail;
  openChange: boolean;
  opened: Context7WidgetLifecycleEventDetail;
  question: Context7WidgetQuestionEventDetail;
  ready: Context7WidgetLifecycleEventDetail;
  toolCall: Context7WidgetToolCallEventDetail;
  toolResult: Context7WidgetToolResultEventDetail;
}

export type Context7WidgetAngularEventName = keyof Context7WidgetAngularEventMap;

export interface Context7WidgetMountOptions extends Partial<Context7WidgetAngularOptions> {
  library: string;
  target?: Element | DocumentFragment | string;
}

export type MessageDisplayItem = Context7MessageDisplayItem;
export type DisplayItem = Context7DisplayItem;

export type { Context7Message, Context7WidgetSendResult } from '@desource/context7-widget/kit';

import type { Component } from 'svelte';
import Context7WidgetComponent from './Context7Widget.svelte';
import type { Context7WidgetHandle, Context7WidgetProps } from './types.js';

export const Context7Widget = Context7WidgetComponent as Component<Context7WidgetProps, Context7WidgetHandle, 'open'>;
export { createContext7Widget } from './controller.svelte.js';
export type {
  Context7SvelteCustomTrigger,
  Context7WidgetCallbacks,
  Context7WidgetHandle,
  Context7WidgetProps,
  Context7WidgetState,
  Context7WidgetStateListener,
  Context7WidgetStore,
  Context7WidgetTriggerSnippetOptions,
  CreateContext7WidgetOptions
} from './types.js';
export type {
  Context7LauncherVariant,
  Context7Message,
  Context7MessageStatus,
  Context7Position,
  Context7Role,
  Context7Theme,
  Context7ToolCall,
  Context7ToolResult,
  Context7WidgetAnswerCompleteEventDetail,
  Context7WidgetAnswerEventDetail,
  Context7WidgetBaseEventDetail,
  Context7WidgetCancelEventDetail,
  Context7WidgetController,
  Context7WidgetErrorEventDetail,
  Context7WidgetEventDetail,
  Context7WidgetEventDetailFor,
  Context7WidgetEventName,
  Context7WidgetLabels,
  Context7WidgetLifecycleEventDetail,
  Context7WidgetOptions,
  Context7WidgetPreset,
  Context7WidgetQuestionEventDetail,
  Context7WidgetSendResult,
  Context7WidgetSendStatus,
  Context7WidgetTarget,
  Context7WidgetToolCallEventDetail,
  Context7WidgetToolResultEventDetail
} from '@desource/context7-widget/kit';

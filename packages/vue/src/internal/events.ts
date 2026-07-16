import { context7WidgetEvents, type Context7WidgetEventName } from '@desource/context7-widget/kit';
import type { Context7WidgetVueEventName } from '../types';

export { context7WidgetEvents };

export const vueEventNames = {
  'c7:answer': 'answer',
  'c7:answer-complete': 'answer-complete',
  'c7:close': 'close',
  'c7:error': 'error',
  'c7:first-token': 'first-token',
  'c7:open': 'open',
  'c7:question': 'question',
  'c7:ready': 'ready',
  'c7:tool-call': 'tool-call',
  'c7:tool-result': 'tool-result'
} as const satisfies Record<Context7WidgetEventName, Context7WidgetVueEventName>;

import type { Context7WidgetElement, Context7WidgetEventDetail } from '@desource/context7-widget';

export type Context7WidgetVueEvent = CustomEvent<Context7WidgetEventDetail>;

export interface Context7WidgetExpose {
  readonly element: Context7WidgetElement | null;
  cancel: () => void;
  close: () => void;
  isOpen: () => boolean;
  open: () => void;
  send: (message: string) => Promise<void>;
  toggle: () => void;
}

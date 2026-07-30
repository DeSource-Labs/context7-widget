import type { Context7WidgetApi, Context7WidgetDomEventMap } from './types.js';

/** DOM event map installed when the core custom-element entry is imported. */
export interface Context7WidgetGlobalEventMap extends Context7WidgetDomEventMap {}

declare global {
  interface DocumentEventMap extends Context7WidgetGlobalEventMap {}

  interface HTMLElementEventMap extends Context7WidgetGlobalEventMap {}

  interface Window {
    Context7Widget?: Context7WidgetApi;
  }
}

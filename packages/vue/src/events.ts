import type { Context7WidgetEventName } from "@desource/context7-widget";

export const context7WidgetEvents = [
  "c7:ready",
  "c7:open",
  "c7:close",
  "c7:question",
  "c7:first-token",
  "c7:answer",
  "c7:answer-complete",
  "c7:tool-call",
  "c7:tool-result",
  "c7:error"
] as const satisfies readonly Context7WidgetEventName[];

export const vueEventNames = {
  "c7:answer": "answer",
  "c7:answer-complete": "answer-complete",
  "c7:close": "close",
  "c7:error": "error",
  "c7:first-token": "first-token",
  "c7:open": "open",
  "c7:question": "question",
  "c7:ready": "ready",
  "c7:tool-call": "tool-call",
  "c7:tool-result": "tool-result"
} as const satisfies Record<Context7WidgetEventName, string>;

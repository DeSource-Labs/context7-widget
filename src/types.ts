export type Context7Role = "user" | "assistant";

export type Context7Position =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

export type Context7Theme = "auto" | "light" | "dark";

export interface Context7Message {
  id: string;
  role: Context7Role;
  content: string;
}

export interface Context7WidgetConfig {
  apiUrl: string;
  color: string;
  customTrigger: string;
  hideDefaultButton: boolean;
  initialMessage: string;
  library: string;
  placeholder: string;
  position: Context7Position;
  theme: Context7Theme;
  title: string;
  widgetId: string;
}

export interface Context7ToolCall {
  args: Record<string, unknown>;
  toolCallId: string;
  toolName: string;
}

export interface Context7ToolResult {
  result: unknown;
  toolCallId: string;
}

export interface Context7StreamCallbacks {
  onChunk(delta: string): void;
  onToolCall?(toolCall: Context7ToolCall): void;
  onToolResult?(toolResult: Context7ToolResult): void;
}

export interface Context7WidgetEventDetail {
  answer?: string;
  error?: Error | string;
  library: string;
  message?: Context7Message;
  messages?: Context7Message[];
  question?: string;
  toolCall?: Context7ToolCall;
  toolResult?: Context7ToolResult;
  widget: HTMLElement;
  widgetId: string;
}

export interface Context7WidgetApi {
  instances: Map<string, HTMLElement>;
  close(widgetId?: string): void;
  get(widgetId?: string): HTMLElement | undefined;
  isOpen(widgetId?: string): boolean;
  open(widgetId?: string): void;
  send(message: string, widgetId?: string): Promise<void>;
  toggle(widgetId?: string): void;
}

declare global {
  interface Window {
    Context7Widget?: Context7WidgetApi;
  }
}

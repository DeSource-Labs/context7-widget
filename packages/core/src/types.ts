export type Context7Role = "user" | "assistant";

export type Context7Position =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left"
  | "center"
  | "modal"
  | "anchor";

export type Context7AnchorPlacement =
  | "bottom-end"
  | "bottom-start"
  | "top-end"
  | "top-start"
  | "right"
  | "left";

export type Context7LauncherVariant = "icon" | "pill" | "badge";

export type Context7WidgetPreset =
  | "default"
  | "minimal"
  | "glass"
  | "neo"
  | "terminal"
  | "brutalist";

export type Context7Theme = "auto" | "light" | "dark";

export type Context7WidgetEventName =
  | "c7:ready"
  | "c7:open"
  | "c7:close"
  | "c7:question"
  | "c7:first-token"
  | "c7:answer"
  | "c7:answer-complete"
  | "c7:tool-call"
  | "c7:tool-result"
  | "c7:error";

export interface Context7Message {
  id: string;
  role: Context7Role;
  content: string;
}

export interface Context7WidgetOptions {
  anchorPlacement?: Context7AnchorPlacement;
  apiUrl?: string;
  backdrop?: boolean;
  closeOnOutsideClick?: boolean;
  color?: string;
  customTrigger?: string;
  defaultOpen?: boolean;
  hideDefaultButton?: boolean;
  initialMessage?: string;
  launcherLabel?: string;
  launcherVariant?: Context7LauncherVariant;
  library: string;
  panelHeight?: string;
  panelWidth?: string;
  placeholder?: string;
  position?: Context7Position;
  preset?: Context7WidgetPreset;
  showPoweredBy?: boolean;
  theme?: Context7Theme;
  title?: string;
  widgetId?: string;
}

export interface Context7WidgetConfig {
  anchorPlacement: Context7AnchorPlacement;
  apiUrl: string;
  backdrop: boolean;
  closeOnOutsideClick: boolean;
  color: string;
  customTrigger: string;
  defaultOpen: boolean;
  hideDefaultButton: boolean;
  initialMessage: string;
  launcherLabel: string;
  launcherVariant: Context7LauncherVariant;
  library: string;
  panelHeight: string;
  panelWidth: string;
  placeholder: string;
  position: Context7Position;
  preset: Context7WidgetPreset;
  showPoweredBy: boolean;
  theme: Context7Theme;
  title: string;
  widgetId: string;
}

export type Context7WidgetTarget = Element | DocumentFragment | string;

export interface Context7WidgetScriptOptions extends Context7WidgetOptions {
  async?: boolean;
  defer?: boolean;
  id?: string;
  nonce?: string;
  src?: string;
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

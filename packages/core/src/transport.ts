import type {
  Context7Message,
  Context7StreamCallbacks,
  Context7ToolCall,
  Context7ToolResult,
  Context7WidgetConfig
} from "./types";

const CONTEXT7_CHAT_ENDPOINT = "https://context7.com/api/v2/widget/chat";

export class Context7TransportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Context7TransportError";
  }
}

export async function streamContext7Response(
  config: Pick<Context7WidgetConfig, "library">,
  messages: Context7Message[],
  callbacks: Context7StreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const response = await postChatRequest(config, messages, signal);
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Context7TransportError("No response stream was returned.");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      consumeStreamLine(line, callbacks);
    }
  }

  if (buffer.trim()) {
    consumeStreamLine(buffer, callbacks);
  }
}

async function postChatRequest(
  config: Pick<Context7WidgetConfig, "library">,
  messages: Context7Message[],
  signal?: AbortSignal
): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(CONTEXT7_CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        libraryName: config.library,
        messages: messages.map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          parts: [{ type: "text", text: message.content }]
        }))
      }),
      signal
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw new Context7TransportError("Unable to connect to the Context7 chat service.");
  }

  if (!response.ok) {
    throw new Context7TransportError(await resolveErrorMessage(response));
  }

  return response;
}

function consumeStreamLine(line: string, callbacks: Context7StreamCallbacks): void {
  const trimmed = line.trim();
  if (!trimmed || trimmed === "data: [DONE]") return;

  if (trimmed.startsWith("data:")) {
    consumeJsonFrame(trimmed.slice(5).trim(), callbacks);
    return;
  }

  const separator = trimmed.indexOf(":");
  if (separator === -1) return;

  const frameType = trimmed.slice(0, separator);
  const payload = trimmed.slice(separator + 1);

  if (frameType === "0") {
    try {
      const parsed = JSON.parse(payload);
      if (typeof parsed === "string") callbacks.onChunk(parsed);
      if (typeof parsed?.content === "string") callbacks.onChunk(parsed.content);
      if (typeof parsed?.delta === "string") callbacks.onChunk(parsed.delta);
    } catch {
      // Ignore malformed compatibility frames.
    }
  }
}

function consumeJsonFrame(payload: string, callbacks: Context7StreamCallbacks): void {
  try {
    const parsed = JSON.parse(payload);
    if (parsed.type === "text-delta" && typeof parsed.delta === "string") {
      callbacks.onChunk(parsed.delta);
      return;
    }

    if (parsed.type === "tool-input-available") {
      callbacks.onToolCall?.(toToolCall(parsed));
      return;
    }

    if (parsed.type === "tool-output-available") {
      callbacks.onToolResult?.(toToolResult(parsed));
    }
  } catch {
    // Streaming transports can send keep-alive lines; unknown lines are ignored.
  }
}

function toToolCall(value: Record<string, unknown>): Context7ToolCall {
  return {
    args: isRecord(value.input) ? value.input : {},
    toolCallId: String(value.toolCallId ?? ""),
    toolName: String(value.toolName ?? "tool")
  };
}

function toToolResult(value: Record<string, unknown>): Context7ToolResult {
  return {
    result: value.output,
    toolCallId: String(value.toolCallId ?? "")
  };
}

async function resolveErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body.message === "Widget is not enabled") {
      return "The chat widget is not enabled for this library.";
    }
    if (body.message === "Origin not allowed") {
      return "This domain is not authorized to use the chat widget.";
    }
    if (body.message) return body.message;
  } catch {
    // Fall back to HTTP status below.
  }

  return `Context7 chat request failed with HTTP ${response.status}.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

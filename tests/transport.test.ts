import { afterEach, describe, expect, it, vi } from "vitest";
import { streamContext7Response } from "../src/transport";
import type { Context7Message } from "../src/types";

const messages: Context7Message[] = [
  { id: "1", role: "user", content: "How do I install it?" }
];

describe("streamContext7Response", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses Context7 SSE frames", async () => {
    const chunks: string[] = [];
    const toolCalls: string[] = [];
    const toolResults: unknown[] = [];

    vi.stubGlobal("fetch", vi.fn(async () => new Response(stream([
      'data: {"type":"text-delta","delta":"Hello "}\n',
      'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{"query":"install"}}\n',
      'data: {"type":"tool-output-available","toolCallId":"tool-1","output":{"ok":true}}\n',
      'data: {"type":"text-delta","delta":"world"}\n'
    ]))));

    await streamContext7Response(
      { apiUrl: "https://context7.com", library: "/vercel/next.js" },
      messages,
      {
        onChunk: (delta) => chunks.push(delta),
        onToolCall: (toolCall) => toolCalls.push(toolCall.toolCallId),
        onToolResult: (toolResult) => toolResults.push(toolResult.result)
      }
    );

    expect(chunks.join("")).toBe("Hello world");
    expect(toolCalls).toEqual(["tool-1"]);
    expect(toolResults).toEqual([{ ok: true }]);
  });

  it("maps known widget errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ message: "Origin not allowed" }), { status: 403 }))
    );

    await expect(
      streamContext7Response(
        { apiUrl: "https://context7.com", library: "/vercel/next.js" },
        messages,
        { onChunk: () => undefined }
      )
    ).rejects.toThrow("This domain is not authorized");
  });
});

function stream(values: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const value of values) {
        controller.enqueue(encoder.encode(value));
      }
      controller.close();
    }
  });
}

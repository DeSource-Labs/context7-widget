import { afterEach, describe, expect, it, vi } from 'vitest';
import { Context7TransportError, streamContext7Response } from '../../src/transport';
import type { Context7Message } from '../../src/types';
import { createSseStream } from '@common/tests/unit/stream';

const messages: Context7Message[] = [{ id: '1', role: 'user', content: 'How do I install it?' }];

describe('streamContext7Response', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses Context7 SSE frames', async () => {
    const chunks: string[] = [];
    const toolCalls: string[] = [];
    const toolResults: unknown[] = [];

    const fetchMock = vi.fn(
      async () =>
        new Response(
          createSseStream([
            'data: {"type":"text-delta","delta":"Hello "}\n',
            'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{"query":"install"}}\n',
            'data: {"type":"tool-output-available","toolCallId":"tool-1","output":{"ok":true}}\n',
            'data: {"type":"text-delta","delta":"world"}\n'
          ])
        )
    );
    vi.stubGlobal('fetch', fetchMock);

    await streamContext7Response({ library: '/vercel/next.js' }, messages, {
      onChunk: (delta) => chunks.push(delta),
      onToolCall: (toolCall) => toolCalls.push(toolCall.toolCallId),
      onToolResult: (toolResult) => toolResults.push(toolResult.result)
    });

    expect(chunks.join('')).toBe('Hello world');
    expect(toolCalls).toEqual(['tool-1']);
    expect(toolResults).toEqual([{ ok: true }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://context7.com/api/v2/widget/chat',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('sends the documented request payload and forwards cancellation signals', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn(async () => new Response(createSseStream(['data: [DONE]\n'])));
    vi.stubGlobal('fetch', fetchMock);

    await streamContext7Response(
      { library: '/vercel/next.js' },
      messages,
      { onChunk: () => undefined },
      controller.signal
    );

    expect(fetchMock).toHaveBeenCalledWith('https://context7.com/api/v2/widget/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        libraryName: '/vercel/next.js',
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'How do I install it?',
            parts: [{ type: 'text', text: 'How do I install it?' }]
          }
        ]
      }),
      signal: controller.signal
    });
  });

  it('maps known widget errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Origin not allowed' }), { status: 403 }))
    );

    await expect(
      streamContext7Response({ library: '/vercel/next.js' }, messages, { onChunk: () => undefined })
    ).rejects.toThrow('This domain is not authorized');
  });

  it('parses compatibility stream frames and trailing buffers', async () => {
    const chunks: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(createSseStream(['0:"Compat "\n', '0:{"content":"content "}\n', '0:{"delta":"delta"}']))
      )
    );

    await streamContext7Response({ library: '/vercel/next.js' }, messages, {
      onChunk: (delta) => chunks.push(delta)
    });

    expect(chunks.join('')).toBe('Compat content delta');
  });

  it('does not duplicate compatibility objects that contain both content and delta', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['0:{"content":"preferred","delta":"duplicate"}\n'])))
    );
    const chunks: string[] = [];

    await streamContext7Response({ library: '/vercel/next.js' }, messages, {
      onChunk: (chunk) => chunks.push(chunk)
    });

    expect(chunks).toEqual(['preferred']);
  });

  it('ignores malformed and unknown stream frames', async () => {
    const chunks: string[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              '\n',
              'ping\n',
              'data: [DONE]\n',
              'data: []\n',
              'data: {"type":"unknown"}\n',
              'data: not-json\n',
              'event: ping\n',
              '0:not-json\n',
              'data: {"type":"text-delta","delta":"ok"}\n'
            ])
          )
      )
    );

    await streamContext7Response({ library: '/vercel/next.js' }, messages, {
      onChunk: (delta) => chunks.push(delta)
    });

    expect(chunks).toEqual(['ok']);
  });

  it('normalizes incomplete tool frames without exposing malformed inputs', async () => {
    const toolCalls: unknown[] = [];
    const toolResults: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              'data: {"type":"tool-input-available","input":[]}\n',
              'data: {"type":"tool-output-available","output":"No matches"}\n'
            ])
          )
      )
    );

    await streamContext7Response({ library: '/vercel/next.js' }, messages, {
      onChunk: () => undefined,
      onToolCall: (toolCall) => toolCalls.push(toolCall),
      onToolResult: (toolResult) => toolResults.push(toolResult)
    });

    expect(toolCalls).toEqual([{ args: {}, toolCallId: '', toolName: 'tool' }]);
    expect(toolResults).toEqual([{ result: 'No matches', toolCallId: '' }]);
  });

  it('reports disabled widgets and generic HTTP failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Widget is not enabled' }), { status: 404 }))
    );

    await expect(
      streamContext7Response({ library: '/vercel/next.js' }, messages, { onChunk: () => undefined })
    ).rejects.toThrow('The chat widget is not enabled');

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not json', { status: 500 }))
    );

    await expect(
      streamContext7Response({ library: '/vercel/next.js' }, messages, { onChunk: () => undefined })
    ).rejects.toThrow('Context7 chat request failed with HTTP 500.');
  });

  it('preserves an actionable error message returned by the service', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ message: 'Library was not found' }), { status: 404 }))
    );

    await expect(
      streamContext7Response({ library: '/missing/repo' }, messages, { onChunk: () => undefined })
    ).rejects.toThrow('Library was not found');
  });

  it('throws a transport error for network failures and missing streams', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );

    await expect(
      streamContext7Response({ library: '/vercel/next.js' }, messages, { onChunk: () => undefined })
    ).rejects.toBeInstanceOf(Context7TransportError);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null))
    );

    await expect(
      streamContext7Response({ library: '/vercel/next.js' }, messages, { onChunk: () => undefined })
    ).rejects.toThrow('No response stream was returned.');
  });

  it('preserves abort errors from fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('Aborted', 'AbortError');
      })
    );

    await expect(
      streamContext7Response({ library: '/vercel/next.js' }, messages, { onChunk: () => undefined })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('releases the stream reader when reading the response fails', async () => {
    const releaseLock = vi.fn();
    const reader = {
      read: vi.fn(async () => {
        throw new Error('Stream failed');
      }),
      releaseLock
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ body: { getReader: () => reader }, ok: true }) as unknown as Response)
    );

    await expect(
      streamContext7Response({ library: '/vercel/next.js' }, messages, { onChunk: () => undefined })
    ).rejects.toThrow('Stream failed');
    expect(releaseLock).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createContext7ConversationRenderBridge, formatContext7ToolResult, getContext7ToolQuery } from '../../src/core';
import type { Context7ConversationEvent } from '../../src/core';

describe('conversation renderer bridge', () => {
  it('routes every event and ignores stale answer frames', () => {
    const callbacks = {
      clearAnswer: vi.fn(),
      discardAnswer: vi.fn(),
      emit: vi.fn(),
      flushAnswer: vi.fn(),
      onAnswer: vi.fn(),
      onError: vi.fn(),
      onQuestion: vi.fn(() => ({ id: 'render' })),
      onToolCall: vi.fn(),
      onToolResult: vi.fn()
    };
    const bridge = createContext7ConversationRenderBridge(callbacks);
    const request = requestWithId(1);

    bridge.clearActiveAnswer();
    bridge.discardActiveAnswer();
    bridge.handleEvent(event('c7:question', request));
    bridge.handleEvent(event('c7:first-token', request));
    bridge.handleEvent(event('c7:answer', requestWithId(2)));
    bridge.handleEvent(event('c7:answer', request));
    bridge.handleEvent(event('c7:tool-call', request));
    bridge.handleEvent(event('c7:tool-result', request));
    bridge.handleEvent(event('c7:answer-complete', request));
    bridge.handleEvent(event('c7:cancel', request));

    expect(callbacks.onAnswer).toHaveBeenCalledOnce();
    expect(callbacks.onToolCall).toHaveBeenCalledWith(expect.anything(), { id: 'render' });
    expect(callbacks.onToolResult).toHaveBeenCalledOnce();
    expect(callbacks.flushAnswer).toHaveBeenCalledOnce();
    expect(callbacks.clearAnswer).toHaveBeenCalledOnce();
    expect(callbacks.emit).toHaveBeenCalledTimes(8);
  });

  it('discards active rendering on errors and handles questions without requests or render state', () => {
    const callbacks = {
      clearAnswer: vi.fn(),
      discardAnswer: vi.fn(),
      emit: vi.fn(),
      flushAnswer: vi.fn(),
      onAnswer: vi.fn(),
      onError: vi.fn(),
      onQuestion: vi.fn().mockReturnValueOnce(null).mockReturnValueOnce({ id: 'active' }),
      onToolCall: vi.fn(),
      onToolResult: vi.fn()
    };
    const bridge = createContext7ConversationRenderBridge(callbacks);
    bridge.handleEvent(event('c7:question', null));
    bridge.handleEvent(event('c7:question', requestWithId(1)));
    bridge.handleEvent(event('c7:error', requestWithId(1)));

    expect(callbacks.discardAnswer).toHaveBeenCalledWith({ id: 'active' });
    expect(callbacks.onError).toHaveBeenCalledOnce();
  });

  it('formats tool fallbacks for string, structured, null, and missing queries', () => {
    expect(formatContext7ToolResult('plain')).toBe('plain');
    expect(formatContext7ToolResult({ matches: 2 })).toContain('"matches": 2');
    expect(formatContext7ToolResult(undefined)).toBe('');
    expect(getContext7ToolQuery({ args: { query: 'setup' } })).toBe('setup');
    expect(getContext7ToolQuery({ args: {} })).toBe('documentation');
  });
});

function requestWithId(id: number) {
  const controller = new AbortController();
  return { controller, id, question: 'Question', signal: controller.signal };
}

function event(type: Context7ConversationEvent['type'], request: ReturnType<typeof requestWithId> | null) {
  return { detail: {}, request, type } as Context7ConversationEvent;
}

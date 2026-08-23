import { describe, expect, it, vi } from 'vitest';
import { createContext7ConversationEngine } from '../../src/kit';
import type {
  Context7Message,
  Context7StreamCallbacks,
  Context7WidgetConfig,
  Context7WidgetSendResult
} from '../../src/kit';

type TestTransport = (
  config: Pick<Context7WidgetConfig, 'library'>,
  messages: readonly Context7Message[],
  callbacks: Context7StreamCallbacks,
  signal?: AbortSignal
) => Promise<void>;

describe('core conversation engine', () => {
  it('owns request events, state snapshots, tool frames, and completed history', async () => {
    const events: string[] = [];
    const states: {
      readonly busy: boolean;
      readonly partialAnswer: string;
      readonly toolFrames: readonly unknown[];
    }[] = [];
    const transport = vi.fn<TestTransport>(async (_config, _messages, callbacks) => {
      callbacks.onToolCall?.({ args: { query: 'setup' }, toolCallId: 'tool-1', toolName: 'search' });
      callbacks.onToolResult?.({ result: { snippet: 'Install it.' }, toolCallId: 'tool-1' });
      callbacks.onChunk('Shared answer');
    });
    const engine = createContext7ConversationEngine({
      nextMessageId: createIdFactory(),
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport
    });
    engine.subscribe((state) => states.push(state));
    engine.subscribeEvents((event) => events.push(event.type));

    const result = await engine.send('  How do I install it?  ');

    expect(result).toMatchObject({
      answer: 'Shared answer',
      question: 'How do I install it?',
      status: 'complete'
    });
    expect(result.message).toMatchObject({ content: 'Shared answer', role: 'assistant' });
    expect(engine.getMessages().map((message) => message.content)).toEqual(['How do I install it?', 'Shared answer']);
    expect(events).toEqual([
      'c7:question',
      'c7:tool-call',
      'c7:tool-result',
      'c7:first-token',
      'c7:answer',
      'c7:answer-complete'
    ]);
    expect(states.some((state) => state.partialAnswer === 'Shared answer')).toBe(true);
    const finalState = states[states.length - 1];
    expect(finalState).toMatchObject({ busy: false, partialAnswer: '' });
    expect(finalState?.toolFrames).toHaveLength(1);
  });

  it('allows renderers to skip transient snapshots while preserving default subscription semantics', async () => {
    const everySnapshot: string[] = [];
    const committedSnapshots: string[] = [];
    const engine = createContext7ConversationEngine({
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: async (_config, _messages, callbacks) => {
        callbacks.onToolCall?.({ args: { query: 'performance' }, toolCallId: 'tool-1', toolName: 'search' });
        callbacks.onToolResult?.({ result: 'Found', toolCallId: 'tool-1' });
        callbacks.onChunk('Efficient answer');
      }
    });
    engine.subscribe((state) => everySnapshot.push(`${state.busy}:${state.partialAnswer}:${state.toolFrames.length}`));
    engine.subscribe(
      (state) => committedSnapshots.push(`${state.busy}:${state.partialAnswer}:${state.toolFrames.length}`),
      { includeTransient: false }
    );
    everySnapshot.length = 0;
    committedSnapshots.length = 0;

    await engine.send('Avoid transient renderer work');

    expect(everySnapshot).toHaveLength(6);
    expect(everySnapshot).toContain('true:Efficient answer:1');
    expect(committedSnapshots).toHaveLength(3);
    expect(committedSnapshots.every((snapshot) => !snapshot.includes(':Efficient answer:'))).toBe(true);
    expect(committedSnapshots[committedSnapshots.length - 1]).toBe('false::1');
  });

  it('commits cancelled partial answers and resolves the pending send consistently', async () => {
    let callbacks: Context7StreamCallbacks | undefined;
    let signal: AbortSignal | undefined;
    const events: string[] = [];
    const transport = vi.fn<TestTransport>(
      async (_config, _messages, streamCallbacks, abortSignal) =>
        await new Promise<void>((_resolve, reject) => {
          callbacks = streamCallbacks;
          signal = abortSignal;
          signal?.addEventListener('abort', () => reject(new DOMException('The request was aborted.', 'AbortError')), {
            once: true
          });
        })
    );
    const engine = createContext7ConversationEngine({
      nextMessageId: createIdFactory(),
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport
    });
    engine.subscribeEvents((event) => events.push(event.type));

    const pending = engine.send('Stop after the first token');
    await vi.waitFor(() => expect(callbacks).toBeDefined());
    callbacks?.onChunk('Partial answer');

    const cancelResult = engine.cancel();
    const sendResult = await pending;

    expect(signal?.aborted).toBe(true);
    expect(cancelResult).toEqual(sendResult);
    expect(sendResult).toMatchObject({
      answer: 'Partial answer',
      question: 'Stop after the first token',
      status: 'cancelled'
    });
    expect(sendResult.message).toMatchObject({
      content: 'Partial answer',
      role: 'assistant',
      status: 'cancelled'
    });
    expect(engine.getMessages().map((message) => message.content)).toEqual([
      'Stop after the first token',
      'Partial answer'
    ]);
    expect(events).toContain('c7:cancel');
  });

  it('limits transport history without trimming public conversation messages', async () => {
    const transportMessages: Context7Message[][] = [];
    const engine = createContext7ConversationEngine({
      historyLimit: 3,
      nextMessageId: createIdFactory(),
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: async (_config, messages, callbacks) => {
        transportMessages.push([...messages]);
        const lastMessage = messages[messages.length - 1];
        callbacks.onChunk(`Answer for ${lastMessage?.content ?? 'unknown'}`);
      }
    });

    await engine.send('First');
    await engine.send('Second');
    await engine.send('Third');

    expect(engine.getMessages().map((message) => message.content)).toEqual([
      'First',
      'Answer for First',
      'Second',
      'Answer for Second',
      'Third',
      'Answer for Third'
    ]);
    const finalTransportMessages = transportMessages[transportMessages.length - 1];
    expect(finalTransportMessages?.map((message) => message.content)).toEqual(['Second', 'Answer for Second', 'Third']);
  });

  it('emits renderer-ready error payloads for missing transport config', async () => {
    const events: { readonly detail: Record<string, unknown>; readonly type: string }[] = [];
    const engine = createContext7ConversationEngine({
      missingLibraryMessage: 'Missing library.',
      resolveConfig: () => ({ library: '' })
    });
    engine.subscribeEvents((event) => events.push(event));

    const result = await engine.send('Where are the docs?');

    expect(result satisfies Context7WidgetSendResult).toMatchObject({
      error: 'Missing library.',
      question: 'Where are the docs?',
      status: 'error'
    });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      detail: { error: 'Missing library.', question: 'Where are the docs?' },
      type: 'c7:error'
    });
    expect(engine.getMessages()).toEqual([]);
  });

  it('retries the last failed question without duplicating its user message', async () => {
    const events: { readonly detail: Record<string, unknown>; readonly type: string }[] = [];
    const transportMessages: Context7Message[][] = [];
    const transport = vi
      .fn<TestTransport>()
      .mockImplementationOnce(async (_config, messages) => {
        transportMessages.push([...messages]);
        throw new Error('Temporary outage');
      })
      .mockImplementationOnce(async (_config, messages, callbacks) => {
        transportMessages.push([...messages]);
        callbacks.onChunk('Recovered answer');
      });
    const engine = createContext7ConversationEngine({
      nextMessageId: createIdFactory(),
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport
    });
    engine.subscribeEvents((event) => events.push(event));

    await expect(engine.send('Retry me')).resolves.toMatchObject({
      error: 'Temporary outage',
      status: 'error'
    });
    await expect(engine.retry()).resolves.toMatchObject({
      answer: 'Recovered answer',
      status: 'complete'
    });

    expect(transportMessages.map((messages) => messages.map((message) => message.content))).toEqual([
      ['Retry me'],
      ['Retry me']
    ]);
    expect(engine.getMessages().map((message) => message.content)).toEqual(['Retry me', 'Recovered answer']);
    expect(events.filter((event) => event.type === 'c7:question')).toEqual([
      expect.objectContaining({ detail: expect.objectContaining({ question: 'Retry me' }) }),
      expect.objectContaining({ detail: expect.objectContaining({ question: 'Retry me', retry: true }) })
    ]);
  });

  it('retries a missing-library failure after the integration supplies a library', async () => {
    let library = '';
    const transport = vi.fn<TestTransport>(async (_config, _messages, callbacks) => {
      callbacks.onChunk('Recovered after configuration');
    });
    const engine = createContext7ConversationEngine({
      nextMessageId: createIdFactory(),
      resolveConfig: () => ({ library }),
      transport
    });
    engine.reset([{ content: 'Configuration required', id: 'intro', role: 'assistant' }]);

    await expect(engine.send('Configure me')).resolves.toMatchObject({ status: 'error' });
    expect(engine.getMessages()).toHaveLength(1);

    library = '/desource-labs/context7-widget';
    await expect(engine.retry()).resolves.toMatchObject({
      answer: 'Recovered after configuration',
      status: 'complete'
    });
    expect(engine.getMessages().map((message) => message.content)).toEqual([
      'Configuration required',
      'Configure me',
      'Recovered after configuration'
    ]);
    expect(transport).toHaveBeenCalledOnce();
  });

  it('ignores retry when no request has failed and forgets failures after reset', async () => {
    const transport = vi.fn<TestTransport>().mockRejectedValueOnce(new Error('Fails once'));
    const engine = createContext7ConversationEngine({
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport
    });

    await expect(engine.retry()).resolves.toMatchObject({ status: 'empty' });
    await engine.send('Fails once');
    engine.reset();
    await expect(engine.retry()).resolves.toMatchObject({ status: 'empty' });
    expect(transport).toHaveBeenCalledOnce();
  });

  it('ignores stale stream and tool callbacks after reset', async () => {
    let callbacks: Context7StreamCallbacks | undefined;
    let finish: (() => void) | undefined;
    const engine = createContext7ConversationEngine({
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: async (_config, _messages, nextCallbacks) => {
        callbacks = nextCallbacks;
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
      }
    });

    const pending = engine.send('Reset this request');
    await vi.waitFor(() => expect(callbacks).toBeDefined());
    engine.reset();
    callbacks?.onChunk('late');
    callbacks?.onToolCall?.({ args: {}, toolCallId: 'late', toolName: 'search' });
    callbacks?.onToolResult?.({ result: 'late', toolCallId: 'late' });
    finish?.();

    await expect(pending).resolves.toMatchObject({ status: 'cancelled' });
    expect(engine.getMessages()).toEqual([]);
    expect(engine.getState().toolFrames).toEqual([]);
  });

  it('normalizes history limits and completes requests without answer chunks', async () => {
    const emptyHistory = vi.fn<TestTransport>(async (_config, messages) => {
      expect(messages).toEqual([]);
    });
    const zeroHistoryEngine = createContext7ConversationEngine({
      historyLimit: -4.8,
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: emptyHistory
    });
    await expect(zeroHistoryEngine.send('No history')).resolves.toMatchObject({
      answer: '',
      status: 'complete'
    });

    const unlimitedHistory = vi.fn<TestTransport>(async (_config, messages) => {
      expect(messages.map((message) => message.content)).toEqual(['Keep history']);
    });
    const unlimitedEngine = createContext7ConversationEngine({
      historyLimit: Number.NaN,
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: unlimitedHistory
    });
    await unlimitedEngine.send('Keep history');
  });

  it('normalizes non-Error transport failures', async () => {
    const engine = createContext7ConversationEngine({
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: async () => {
        throw 'offline';
      }
    });

    await expect(engine.send('Fail generically')).resolves.toMatchObject({
      error: 'Something went wrong.',
      status: 'error'
    });
  });

  it('falls back to the default missing-library error when a resolver returns an empty message', async () => {
    const engine = createContext7ConversationEngine({
      missingLibraryMessage: () => '',
      resolveConfig: () => ({ library: '' })
    });

    await expect(engine.send('Where are the docs?')).resolves.toMatchObject({
      error: 'Missing library prop.',
      question: 'Where are the docs?',
      status: 'error'
    });
  });

  it('normalizes a transport-originated abort into a settled cancelled result', async () => {
    const engine = createContext7ConversationEngine({
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: async (_config, _messages, callbacks) => {
        callbacks.onChunk('Uncommitted partial answer');
        throw new DOMException('The transport stopped.', 'AbortError');
      }
    });

    await expect(engine.send('Stop gracefully')).resolves.toMatchObject({
      answer: 'Uncommitted partial answer',
      question: 'Stop gracefully',
      status: 'cancelled'
    });
    expect(engine.isBusy()).toBe(false);
    expect(engine.getMessages()).toEqual([expect.objectContaining({ content: 'Stop gracefully', role: 'user' })]);
  });

  it('stops state and event delivery after consumers unsubscribe', async () => {
    const states = vi.fn();
    const events = vi.fn();
    const engine = createContext7ConversationEngine({
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: async (_config, _messages, callbacks) => callbacks.onChunk('Complete')
    });
    const unsubscribeState = engine.subscribe(states);
    const unsubscribeEvents = engine.subscribeEvents(events);
    expect(states).toHaveBeenCalledOnce();

    unsubscribeState();
    unsubscribeEvents();
    await engine.send('No more notifications');

    expect(states).toHaveBeenCalledOnce();
    expect(events).not.toHaveBeenCalled();
  });

  it('isolates throwing consumers without corrupting requests or skipping healthy listeners', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const states: boolean[] = [];
    const events: string[] = [];
    const engine = createContext7ConversationEngine({
      resolveConfig: () => ({ library: '/desource-labs/context7-widget' }),
      transport: async (_config, _messages, callbacks) => callbacks.onChunk('Still completes')
    });

    engine.subscribe(() => {
      throw new Error('state listener failed');
    });
    engine.subscribe((state) => states.push(state.busy));
    engine.subscribeEvents(() => {
      throw new Error('event listener failed');
    });
    engine.subscribeEvents((event) => events.push(event.type));

    await expect(engine.send('Keep streaming')).resolves.toMatchObject({
      answer: 'Still completes',
      status: 'complete'
    });

    expect(states).toContain(true);
    expect(states[states.length - 1]).toBe(false);
    expect(events).toEqual(['c7:question', 'c7:first-token', 'c7:answer', 'c7:answer-complete']);
    expect(reportError).toHaveBeenCalled();
  });
});

function createIdFactory(): () => string {
  let id = 0;
  return () => {
    id += 1;
    return `c7m-${id}`;
  };
}

import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSseStream } from './stream';

export interface Context7WidgetContractMessage {
  readonly content: string;
  readonly id: string;
  readonly role: 'assistant' | 'user';
  readonly status?: 'cancelled' | 'complete';
}

export interface Context7WidgetContractSendResult {
  readonly answer: string;
  readonly error?: Error | string;
  readonly message?: Context7WidgetContractMessage;
  readonly messages: readonly Context7WidgetContractMessage[];
  readonly question: string;
  readonly status: 'busy' | 'cancelled' | 'complete' | 'empty' | 'error';
}

export interface Context7WidgetContractController {
  cancel(): void;
  close(): void;
  getMessages(): readonly Context7WidgetContractMessage[];
  isBusy(): boolean;
  isOpen(): boolean;
  open(): void;
  reset(): void;
  retry(): Promise<Context7WidgetContractSendResult | undefined>;
  send(message: string): Promise<Context7WidgetContractSendResult | undefined>;
  toggle(): void;
}

export interface Context7WidgetContractProps {
  customTrigger?: string;
  initialMessage?: string;
  labels?: Partial<{
    branding: string;
    close: string;
    context7Attribution: string;
    copied: string;
    copyAnswer: string;
    copyCode: string;
    deSourceLabsAttribution: string;
    enhancedBy: string;
    input: string;
    libraryFallback: string;
    missingLibrary: string;
    poweredBy: string;
    send: string;
  }>;
  library: string;
  position?: 'bottom-right' | 'center';
}

export interface Context7WidgetContractHarness {
  readonly controller: Context7WidgetContractController;
  /** The light DOM or shadow root containing the rendered widget UI. */
  readonly view: ParentNode;
  /** Flush framework rendering scheduled by the preceding operation. */
  flush(): Promise<void>;
  /** Run a native UI interaction inside the framework's test transaction. */
  interact?(action: () => unknown): Promise<void> | void;
  /** Remove the widget and all listeners owned by the adapter. */
  unmount(): Promise<void> | void;
}

export interface Context7WidgetContractAdapter {
  mount(
    props: Readonly<Context7WidgetContractProps>
  ): Context7WidgetContractHarness | Promise<Context7WidgetContractHarness>;
  readonly suiteName: string;
}

/**
 * Runs rendering-independent behavior against a framework widget adapter.
 *
 * The adapter remains responsible for translating props, exposing its native
 * controller, selecting light DOM versus shadow DOM, and flushing its renderer.
 */
export function testContext7WidgetContract(adapter: Context7WidgetContractAdapter): void {
  describe(`${adapter.suiteName} shared widget contract`, () => {
    const mounted = new Set<Context7WidgetContractHarness>();

    const mount = async (props: Partial<Context7WidgetContractProps> = {}): Promise<Context7WidgetContractHarness> => {
      const harness = await adapter.mount({
        library: '/desource-labs/context7-widget',
        ...props
      });
      mounted.add(harness);
      await harness.flush();
      return harness;
    };

    const unmount = async (harness: Context7WidgetContractHarness): Promise<void> => {
      if (!mounted.delete(harness)) return;
      await harness.unmount();
    };

    afterEach(async () => {
      for (const harness of [...mounted].reverse()) {
        await unmount(harness);
      }
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
      vi.useRealTimers();
      document.body.replaceChildren();
    });

    it('renders assistant Markdown without treating user or assistant input as trusted HTML', async () => {
      const question = '**user text** <img src=x onerror=alert(1)>';
      const answer = '**assistant text** <script>alert(1)</script>';
      stubSseResponse([jsonFrame({ delta: answer, type: 'text-delta' }), doneFrame()]);
      const harness = await mount();
      const { controller, flush, view } = harness;

      await interact(harness, () => controller.send(question));
      await flush();

      const userMessage = lastRequired(view.querySelectorAll<HTMLElement>('.c7-message--user'));
      const assistantMessage = lastRequired(view.querySelectorAll<HTMLElement>('.c7-message--assistant'));

      expect(userMessage.textContent).toBe(question);
      expect(userMessage.querySelector('strong')).toBeNull();
      expect(userMessage.querySelector('img')).toBeNull();
      expect(assistantMessage.querySelector('strong')?.textContent).toBe('assistant text');
      expect(assistantMessage.querySelector('script')).toBeNull();
      expect(assistantMessage.textContent).toContain('<script>alert(1)</script>');
    });

    it('ignores empty questions and suppresses replacement sends while a request is busy', async () => {
      let requestSignal: AbortSignal | undefined;
      const fetchMock = vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            requestSignal = init?.signal ?? undefined;
            requestSignal?.addEventListener(
              'abort',
              () => reject(new DOMException('The request was aborted.', 'AbortError')),
              { once: true }
            );
          })
      );
      vi.stubGlobal('fetch', fetchMock);
      const harness = await mount();
      const { controller } = harness;

      await interact(harness, () => controller.send('   '));
      expect(fetchMock).not.toHaveBeenCalled();
      expect(controller.getMessages()).toEqual([]);

      let pending!: ReturnType<typeof controller.send>;
      await interact(harness, () => {
        pending = controller.send('First question');
      });
      expect(controller.isBusy()).toBe(true);
      await expect(interact(harness, () => controller.send('Second question'))).resolves.toMatchObject({
        status: 'busy'
      });

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(controller.getMessages().map((message) => message.content)).toEqual(['First question']);

      await interact(harness, async () => {
        controller.cancel();
        await pending;
      });

      expect(requestSignal?.aborted).toBe(true);
      expect(controller.isBusy()).toBe(false);
    });

    it('preserves visible partial answers in public state when cancelled', async () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      const encoder = new TextEncoder();
      let stream: ReadableStreamDefaultController<Uint8Array> | undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async (_input: RequestInfo | URL, init?: RequestInit) =>
            new Response(
              new ReadableStream<Uint8Array>({
                start(controller) {
                  stream = controller;
                  init?.signal?.addEventListener(
                    'abort',
                    () => controller.error(new DOMException('The request was aborted.', 'AbortError')),
                    { once: true }
                  );
                  controller.enqueue(encoder.encode(jsonFrame({ delta: 'Partial answer', type: 'text-delta' })));
                }
              })
            )
        )
      );
      const harness = await mount();
      const { controller, flush, view } = harness;

      let pending!: ReturnType<typeof controller.send>;
      await interact(harness, () => {
        pending = controller.send('Stop after the first token');
      });
      await expect
        .poll(async () => {
          await interact(harness, () => vi.advanceTimersToNextFrame());
          await flush();
          return view.textContent;
        })
        .toContain('Partial answer');

      const result = await interact(harness, async () => {
        controller.cancel();
        return await pending;
      });
      await flush();

      expect(stream).toBeDefined();
      expect(result).toMatchObject({
        answer: 'Partial answer',
        question: 'Stop after the first token',
        status: 'cancelled'
      });
      expect(result?.message).toMatchObject({
        content: 'Partial answer',
        role: 'assistant',
        status: 'cancelled'
      });
      expect(controller.getMessages().map((message) => message.content)).toEqual([
        'Stop after the first token',
        'Partial answer'
      ]);
      expect(controller.getMessages()[1]?.status).toBe('cancelled');
      expect(view.textContent).toContain('Partial answer');
    });

    it('discards uncommitted partial answers when a transport error follows streamed tokens', async () => {
      vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
      const encoder = new TextEncoder();
      let stream: ReadableStreamDefaultController<Uint8Array> | undefined;
      vi.stubGlobal(
        'fetch',
        vi.fn(
          async () =>
            new Response(
              new ReadableStream<Uint8Array>({
                start(controller) {
                  stream = controller;
                  controller.enqueue(encoder.encode(jsonFrame({ delta: 'Uncommitted partial', type: 'text-delta' })));
                }
              })
            )
        )
      );
      const harness = await mount();
      const { controller, flush, view } = harness;

      let pending!: ReturnType<typeof controller.send>;
      await interact(harness, () => {
        pending = controller.send('Break after a token');
      });
      await expect
        .poll(async () => {
          await interact(harness, () => vi.advanceTimersToNextFrame());
          await flush();
          return view.textContent;
        })
        .toContain('Uncommitted partial');

      const result = await interact(harness, async () => {
        stream?.error(new Error('Transport <img src=x onerror=alert(1)> broke'));
        return await pending;
      });
      await flush();

      expect(result).toMatchObject({
        answer: 'Uncommitted partial',
        error: 'Transport <img src=x onerror=alert(1)> broke',
        question: 'Break after a token',
        status: 'error'
      });
      expect(controller.getMessages().map((message) => message.content)).toEqual(['Break after a token']);
      expect(view.textContent).not.toContain('Uncommitted partial');
      expect(view.textContent).toContain('Transport <img src=x onerror=alert(1)> broke');
      expect(view.querySelector('.c7-message--error img')).toBeNull();
    });

    it('retries a failed request without duplicating the user message', async () => {
      const fetchMock = vi
        .fn()
        .mockRejectedValueOnce(new Error('Temporary outage'))
        .mockResolvedValueOnce(
          new Response(createSseStream([jsonFrame({ delta: 'Recovered answer', type: 'text-delta' }), doneFrame()]))
        );
      vi.stubGlobal('fetch', fetchMock);
      const harness = await mount();
      const { controller, flush, view } = harness;

      await expect(interact(harness, () => controller.send('Retry this question'))).resolves.toMatchObject({
        error: 'Unable to connect to the Context7 chat service.',
        status: 'error'
      });
      await flush();

      const retryButton = required<HTMLButtonElement>(view, '.c7-retry');
      expect(retryButton.textContent).toContain('Retry');
      await interact(harness, () => retryButton.click());
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
      await vi.waitFor(async () => {
        await flush();
        expect(view.textContent).toContain('Recovered answer');
      });

      expect(view.querySelectorAll('.c7-message--user')).toHaveLength(1);
      expect(controller.getMessages().map((message) => message.content)).toEqual([
        'Retry this question',
        'Recovered answer'
      ]);
    });

    it('supports multiline input and moves focus to Stop while streaming', async () => {
      let rejectRequest: ((reason: DOMException) => void) | undefined;
      const fetchMock = vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            rejectRequest = reject;
            init?.signal?.addEventListener(
              'abort',
              () => reject(new DOMException('The request was aborted.', 'AbortError')),
              { once: true }
            );
          })
      );
      vi.stubGlobal('fetch', fetchMock);
      const harness = await mount();
      const { controller, flush, view } = harness;
      controller.open();
      await flush();
      const input = required<HTMLTextAreaElement>(view, '.c7-input');
      input.value = 'const value = 1;\nExplain this code';
      await interact(harness, () => input.dispatchEvent(new Event('input', { bubbles: true })));

      await interact(harness, () =>
        input.dispatchEvent(
          new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', shiftKey: true })
        )
      );
      expect(fetchMock).not.toHaveBeenCalled();

      input.focus();
      await interact(harness, () =>
        input.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }))
      );
      await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
      await flush();

      const stop = required<HTMLButtonElement>(view, '.c7-send');
      expect(stop.textContent).toContain('Stop');
      const activeElement = view instanceof ShadowRoot ? view.activeElement : document.activeElement;
      expect(activeElement).toBe(stop);
      expect(input.readOnly).toBe(true);

      await interact(harness, () => {
        controller.cancel();
        rejectRequest?.(new DOMException('The request was aborted.', 'AbortError'));
      });
      await vi.waitFor(() => expect(controller.isBusy()).toBe(false));
      expect(input.readOnly).toBe(false);
    });

    it('copies only explicit answer/code actions and suppresses repeats until feedback resets', async () => {
      vi.useFakeTimers();
      const answer = 'Use this:\n\n```ts\nconst ready = true;\n```';
      const writeText = vi.fn(async () => undefined);
      vi.stubGlobal('navigator', { clipboard: { writeText } });
      stubSseResponse([jsonFrame({ delta: answer, type: 'text-delta' }), doneFrame()]);
      const harness = await mount();
      const { controller, flush, view } = harness;

      await interact(harness, () => controller.send('Show code'));
      await flush();

      const assistantMessages = view.querySelectorAll<HTMLElement>('.c7-message--assistant');
      const answerMessage = lastRequired(assistantMessages);
      const answerCopy = (): HTMLButtonElement => required(answerMessage, '.c7-copy-answer');
      const codeCopy = (): HTMLButtonElement => required(answerMessage, '[data-c7-copy-code]');

      await interact(harness, () => answerMessage.click());
      await interact(harness, () => required<HTMLElement>(answerMessage, 'p').click());
      expect(writeText).not.toHaveBeenCalled();

      await interact(harness, () => required<SVGElement>(answerCopy(), '.c7-copy-icon--copy').dispatchEvent(click()));
      await flush();
      await interact(harness, () => answerCopy().click());
      await flush();
      expect(writeText).toHaveBeenCalledOnce();

      await interact(harness, () => required<SVGElement>(codeCopy(), '.c7-copy-icon--copy').dispatchEvent(click()));
      await flush();
      await interact(harness, () => codeCopy().click());
      await flush();
      expect(writeText).toHaveBeenCalledTimes(2);

      expect(writeText).toHaveBeenNthCalledWith(1, answer);
      expect(writeText).toHaveBeenNthCalledWith(2, 'const ready = true;');
      for (const button of [answerCopy(), codeCopy()]) {
        expect(button.dataset.c7Copied).toBe('');
        expect(button.getAttribute('aria-disabled')).toBe('true');
        expect(button.getAttribute('aria-label')).toBe('Copied');
        expect(required(button, '.c7-copy-status').getAttribute('aria-live')).toBe('polite');
        expect(required(button, '.c7-copy-status').textContent).toBe('Copied');
      }

      await interact(harness, () => vi.advanceTimersByTime(1599));
      await flush();
      expect(answerCopy().dataset.c7Copied).toBe('');
      await interact(harness, () => vi.advanceTimersByTime(1));
      await flush();
      expect(answerCopy().dataset.c7Copied).toBeUndefined();
      expect(answerCopy().getAttribute('aria-label')).toBe('Copy answer');
      expect(codeCopy().dataset.c7Copied).toBeUndefined();
      expect(codeCopy().getAttribute('aria-label')).toBe('Copy code');
    });

    it('localizes controls and isolates centered dialogs from the host page', async () => {
      const outside = document.createElement('button');
      outside.textContent = 'Host action';
      document.body.append(outside);
      const harness = await mount({
        initialMessage: 'Ask about {library}',
        labels: {
          branding: 'Propulsé par Context7, amélioré par DeSource Labs',
          close: 'Fermer',
          context7Attribution: 'Propulsé par Context7',
          copyAnswer: 'Copier la réponse',
          copyCode: 'Copier le code',
          deSourceLabsAttribution: 'Amélioré par DeSource Labs',
          enhancedBy: 'Amélioré par',
          input: 'Question de documentation',
          libraryFallback: 'cette bibliothèque',
          missingLibrary: 'Configuration de bibliothèque manquante.',
          poweredBy: 'Propulsé par <script>',
          send: 'Envoyer'
        },
        library: '',
        position: 'center'
      });
      const { controller, flush, view } = harness;

      expect(required(view, '.c7-close').getAttribute('aria-label')).toBe('Fermer');
      expect(required(view, '.c7-input').getAttribute('aria-label')).toBe('Question de documentation');
      expect(required(view, '.c7-send').textContent).toContain('Envoyer');
      expect(required(view, '.c7-copy-answer').getAttribute('aria-label')).toBe('Copier la réponse');
      expect(required(view, '.c7-message--assistant').textContent).toContain('cette bibliothèque');

      const branding = required(view, '.c7-branding');
      const context7Attribution = required<HTMLAnchorElement>(branding, 'a[href="https://context7.com"]');
      const deSourceLabsAttribution = required<HTMLAnchorElement>(branding, 'a[href="https://desourcelabs.com"]');
      expect(branding.getAttribute('aria-label')).toBe('Propulsé par Context7, amélioré par DeSource Labs');
      expect(context7Attribution.getAttribute('aria-label')).toBe('Propulsé par Context7');
      expect(context7Attribution.querySelector('.c7-brand-prefix')?.textContent).toBe('Propulsé par <script>');
      expect(branding.querySelector('script')).toBeNull();
      expect(deSourceLabsAttribution.getAttribute('aria-label')).toBe('Amélioré par DeSource Labs');
      expect(deSourceLabsAttribution.querySelector('.c7-brand-prefix')?.textContent).toBe('Amélioré par');

      const missingLibrary = await interact(harness, () => controller.send('Question sans bibliothèque'));
      await flush();
      expect(missingLibrary?.error).toBe('Configuration de bibliothèque manquante.');
      const errorMessage = required(view, '.c7-message--error');
      expect(errorMessage.textContent).toContain('Configuration de bibliothèque manquante.');
      expect(errorMessage.querySelector<HTMLAnchorElement>('a')?.href).toBe('https://context7.com/admin?tab=chat');

      controller.open();
      await flush();
      expect(outside.inert).toBe(true);
      expect(document.body.style.overflow).toBe('hidden');

      controller.close();
      await flush();
      expect(outside.inert).toBeFalsy();
      expect(document.body.style.overflow).toBe('');
    });

    it('keeps controller operations idempotent and reset restores the initial conversation', async () => {
      stubSseResponse([jsonFrame({ delta: 'Tracked answer', type: 'text-delta' }), doneFrame()]);
      const harness = await mount({ initialMessage: 'Shared contract intro' });
      const { controller, flush, view } = harness;

      controller.cancel();
      controller.close();
      controller.open();
      controller.open();
      expect(controller.isOpen()).toBe(true);

      controller.close();
      controller.close();
      expect(controller.isOpen()).toBe(false);

      controller.toggle();
      expect(controller.isOpen()).toBe(true);
      controller.toggle();
      expect(controller.isOpen()).toBe(false);

      await interact(harness, () => controller.send('Track this question'));
      expect(controller.getMessages().map((message) => message.content)).toEqual([
        'Track this question',
        'Tracked answer'
      ]);

      controller.reset();
      controller.cancel();
      await flush();

      expect(controller.isBusy()).toBe(false);
      expect(controller.getMessages()).toEqual([]);
      expect(view.querySelector('.c7-message--user')).toBeNull();
      expect(lastRequired(view.querySelectorAll<HTMLElement>('.c7-message--assistant')).textContent).toContain(
        'Shared contract intro'
      );
    });

    it('uses readable fallbacks for incomplete tool calls and structured tool results', async () => {
      stubSseResponse([
        jsonFrame({ output: 'orphaned', toolCallId: 'unknown', type: 'tool-output-available' }),
        jsonFrame({
          input: { query: 'empty' },
          toolCallId: 'empty-result',
          toolName: 'search',
          type: 'tool-input-available'
        }),
        jsonFrame({ output: '', toolCallId: 'empty-result', type: 'tool-output-available' }),
        jsonFrame({
          input: { section: 'api' },
          toolCallId: 'search-1',
          toolName: 'search',
          type: 'tool-input-available'
        }),
        jsonFrame({
          output: { matches: 2, source: 'Context7' },
          toolCallId: 'search-1',
          type: 'tool-output-available'
        }),
        jsonFrame({
          input: { query: '<img src=x onerror=alert(1)>' },
          toolCallId: 'string-result',
          toolName: 'search',
          type: 'tool-input-available'
        }),
        jsonFrame({
          output: 'Plain <result>',
          toolCallId: 'string-result',
          type: 'tool-output-available'
        }),
        doneFrame()
      ]);
      const harness = await mount();
      const { controller, flush, view } = harness;

      await interact(harness, () => controller.send('Find the API'));
      await flush();

      expect(view.querySelectorAll('.c7-tool-call')).toHaveLength(3);
      expect(view.querySelector('.c7-tool-call img')).toBeNull();
      const toolHeaders = [...view.querySelectorAll<HTMLElement>('.c7-tool-header')].map(
        (header) => header.textContent ?? ''
      );
      expect(toolHeaders.some((header) => header.includes('Searching: documentation'))).toBe(true);
      expect(required(view, '.c7-tool-content pre').textContent).toContain('"matches": 2');
      expect(required(view, '.c7-tool-content pre').textContent).toContain('"source": "Context7"');
      expect(view.querySelectorAll('.c7-tool-result')).toHaveLength(2);
      expect(view.textContent).not.toContain('orphaned');
      expect(view.textContent).toContain('<img src=x onerror=alert(1)>');
      expect(view.textContent).toContain('Plain <result>');

      const toggle = required<HTMLButtonElement>(view, '.c7-tool-toggle');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      await interact(harness, () => toggle.click());
      await flush();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    });

    it('isolates cancelled requests from late stream frames and cleanup', async () => {
      let staleStream: ReadableStreamDefaultController<Uint8Array> | undefined;
      const encoder = new TextEncoder();
      const fetchMock = vi
        .fn()
        .mockImplementationOnce(
          async () =>
            new Response(
              new ReadableStream<Uint8Array>({
                start(controller) {
                  staleStream = controller;
                }
              })
            )
        )
        .mockImplementationOnce(
          async () => new Response(createSseStream([jsonFrame({ delta: 'Fresh answer', type: 'text-delta' })]))
        );
      vi.stubGlobal('fetch', fetchMock);
      const harness = await mount();
      const { controller, flush, view } = harness;

      await interact(harness, async () => {
        const staleRequest = controller.send('Old question');
        controller.cancel();
        const freshRequest = controller.send('New question');

        expect(controller.isBusy()).toBe(true);
        await freshRequest;
        staleStream?.enqueue(encoder.encode(jsonFrame({ delta: 'Stale answer', type: 'text-delta' })));
        staleStream?.close();
        await staleRequest;
      });
      await flush();

      expect(controller.isBusy()).toBe(false);
      expect(view.textContent).toContain('Fresh answer');
      expect(view.textContent).not.toContain('Stale answer');
      expect(controller.getMessages().map((message) => message.content)).toEqual([
        'Old question',
        'New question',
        'Fresh answer'
      ]);
    });

    it('renders streamed text on an animation frame before the response completes', async () => {
      const encoder = new TextEncoder();
      let finishStream: (() => void) | undefined;
      const reader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: encoder.encode(jsonFrame({ delta: 'Progressive answer', type: 'text-delta' }))
          })
          .mockImplementationOnce(
            async () =>
              await new Promise<ReadableStreamReadResult<Uint8Array>>((resolve) => {
                finishStream = () => resolve({ done: true, value: undefined });
              })
          ),
        releaseLock: vi.fn()
      };
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({ body: { getReader: () => reader }, ok: true }) as unknown as Response)
      );
      const frames: FrameRequestCallback[] = [];
      vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      });
      const harness = await mount();
      const { controller, flush, view } = harness;

      let pending!: ReturnType<typeof controller.send>;
      await interact(harness, () => {
        pending = controller.send('Stream the answer');
      });
      await vi.waitFor(async () => {
        await interact(harness, () => {
          for (const frame of frames.splice(0)) frame(performance.now());
        });
        expect(view.textContent).toContain('Progressive answer');
      });
      await flush();

      expect(controller.isBusy()).toBe(true);

      await interact(harness, async () => {
        if (!finishStream) throw new Error('Expected the stream reader to request its final frame.');
        finishStream();
        await pending;
      });
      expect(reader.releaseLock).toHaveBeenCalledOnce();
      expect(controller.isBusy()).toBe(false);
    });

    it('restores an external trigger and removes its listener when unmounted', async () => {
      const trigger = document.createElement('button');
      trigger.id = 'shared-contract-trigger';
      trigger.setAttribute('aria-controls', 'legacy-controls');
      trigger.setAttribute('aria-expanded', 'mixed');
      trigger.setAttribute('aria-haspopup', 'menu');
      document.body.append(trigger);

      const harness = await mount({ customTrigger: '#shared-contract-trigger' });
      const panel = required<HTMLElement>(harness.view, '[role="dialog"]');

      expect(trigger.getAttribute('aria-controls')).toBe(panel.id);
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');

      const boundClick = new MouseEvent('click', { bubbles: true, cancelable: true });
      expect(await interact(harness, () => trigger.dispatchEvent(boundClick))).toBe(false);
      await harness.flush();
      expect(harness.controller.isOpen()).toBe(true);

      await unmount(harness);

      expect(trigger.getAttribute('aria-controls')).toBe('legacy-controls');
      expect(trigger.getAttribute('aria-expanded')).toBe('mixed');
      expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
      const unboundClick = new MouseEvent('click', { bubbles: true, cancelable: true });
      expect(trigger.dispatchEvent(unboundClick)).toBe(true);
    });
  });
}

async function interact<Result>(
  harness: Context7WidgetContractHarness,
  action: () => Result
): Promise<Awaited<Result>> {
  if (!harness.interact) return await action();
  let result!: Awaited<Result>;
  await harness.interact(async () => {
    result = await action();
  });
  return result;
}

function stubSseResponse(frames: string[]): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(createSseStream(frames)))
  );
}

function jsonFrame(value: Readonly<Record<string, unknown>>): string {
  return `data: ${JSON.stringify(value)}\n`;
}

function doneFrame(): string {
  return 'data: [DONE]\n';
}

function click(): MouseEvent {
  return new MouseEvent('click', { bubbles: true, cancelable: true });
}

function required<ElementType extends Element = HTMLElement>(view: ParentNode, selector: string): ElementType {
  const element = view.querySelector<ElementType>(selector);
  if (!element) throw new Error(`Expected "${selector}" to match an element.`);
  return element;
}

function lastRequired<ElementType extends Element>(elements: NodeListOf<ElementType>): ElementType {
  const element = elements.item(elements.length - 1);
  if (!element) throw new Error('Expected at least one matching element.');
  return element;
}

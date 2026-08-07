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
  send(message: string): Promise<Context7WidgetContractSendResult | undefined>;
  toggle(): void;
}

export interface Context7WidgetContractProps {
  customTrigger?: string;
  initialMessage?: string;
  library: string;
}

export interface Context7WidgetContractHarness {
  readonly controller: Context7WidgetContractController;
  /** The light DOM or shadow root containing the rendered widget UI. */
  readonly view: ParentNode;
  /** Flush framework rendering scheduled by the preceding operation. */
  flush(): Promise<void>;
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
      document.body.replaceChildren();
    });

    it('renders assistant Markdown without treating user or assistant input as trusted HTML', async () => {
      const question = '**user text** <img src=x onerror=alert(1)>';
      const answer = '**assistant text** <script>alert(1)</script>';
      stubSseResponse([jsonFrame({ delta: answer, type: 'text-delta' }), doneFrame()]);
      const { controller, flush, view } = await mount();

      await controller.send(question);
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
      const { controller } = await mount();

      await controller.send('   ');
      expect(fetchMock).not.toHaveBeenCalled();
      expect(controller.getMessages()).toEqual([]);

      const pending = controller.send('First question');
      expect(controller.isBusy()).toBe(true);
      await expect(controller.send('Second question')).resolves.toMatchObject({ status: 'busy' });

      expect(fetchMock).toHaveBeenCalledOnce();
      expect(controller.getMessages().map((message) => message.content)).toEqual(['First question']);

      controller.cancel();
      await pending;

      expect(requestSignal?.aborted).toBe(true);
      expect(controller.isBusy()).toBe(false);
    });

    it('preserves visible partial answers in public state when cancelled', async () => {
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
      const { controller, flush, view } = await mount();

      const pending = controller.send('Stop after the first token');
      await vi.waitFor(async () => {
        await flush();
        expect(view.textContent).toContain('Partial answer');
      });

      controller.cancel();
      const result = await pending;
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

    it('keeps controller operations idempotent and reset restores the initial conversation', async () => {
      stubSseResponse([jsonFrame({ delta: 'Tracked answer', type: 'text-delta' }), doneFrame()]);
      const { controller, flush, view } = await mount({ initialMessage: 'Shared contract intro' });

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

      await controller.send('Track this question');
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
        doneFrame()
      ]);
      const { controller, flush, view } = await mount();

      await controller.send('Find the API');
      await flush();

      expect(view.querySelectorAll('.c7-tool-call')).toHaveLength(1);
      expect(required(view, '.c7-tool-header').textContent).toContain('Searching: documentation');
      expect(required(view, '.c7-tool-content pre').textContent).toContain('"matches": 2');
      expect(required(view, '.c7-tool-content pre').textContent).toContain('"source": "Context7"');

      const toggle = required<HTMLButtonElement>(view, '.c7-tool-toggle');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      toggle.click();
      await flush();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
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
      const { controller, flush, view } = await mount();

      const pending = controller.send('Stream the answer');
      await vi.waitFor(() => {
        for (const frame of frames.splice(0)) frame(performance.now());
        expect(view.textContent).toContain('Progressive answer');
      });
      await flush();

      expect(controller.isBusy()).toBe(true);

      if (!finishStream) throw new Error('Expected the stream reader to request its final frame.');
      finishStream();
      await pending;
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
      expect(trigger.dispatchEvent(boundClick)).toBe(false);
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

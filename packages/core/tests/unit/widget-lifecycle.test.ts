import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineContext7Widget } from '@src/index';
import { createSseStream } from '@common/tests/unit/stream';
import { expectAlwaysVisibleBranding } from '@common/tests/unit/widget-contract';

describe('Context7WidgetElement lifecycle behavior', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('opens from defaultOpen and applies text/display options with required branding', () => {
    defineContext7Widget();

    const widget = document.createElement('context7-widget');
    widget.setAttribute('default-open', 'true');
    widget.setAttribute('initial-message', 'Ask about **{library}**');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    widget.setAttribute('placeholder', 'Search docs');
    widget.setAttribute('dialog-title', 'Product docs');
    document.body.append(widget);

    expect(widget.hasAttribute('open')).toBe(true);
    expect(widget.shadowRoot?.querySelector('[part~="title"]')?.textContent).toBe('Product docs');
    expect(widget.shadowRoot?.querySelector<HTMLTextAreaElement>('[part~="input"]')?.placeholder).toBe('Search docs');
    expect(widget.shadowRoot?.textContent).toContain('/desource-labs/context7-widget');
    expectAlwaysVisibleBranding(widget.shadowRoot as ShadowRoot);
  });

  it('treats unknown present boolean attribute values as enabled', () => {
    defineContext7Widget();

    const widget = document.createElement('context7-widget');
    widget.setAttribute('default-open', 'enabled');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    document.body.append(widget);

    expect(widget.hasAttribute('open')).toBe(true);
  });

  it('keeps the panel open when outside click closing is disabled', () => {
    defineContext7Widget();

    const widget = document.createElement('context7-widget');
    widget.setAttribute('close-on-outside-click', 'false');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    document.body.append(widget);

    (widget as HTMLElement & { open: () => void }).open();
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true }));

    expect(widget.hasAttribute('open')).toBe(true);
  });

  it('does not treat its panel or external trigger as an outside click', () => {
    defineContext7Widget();

    const trigger = document.createElement('button');
    trigger.id = 'outside-click-trigger';
    const widget = document.createElement('context7-widget');
    widget.setAttribute('custom-trigger', '#outside-click-trigger');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    document.body.append(trigger, widget);

    trigger.click();
    trigger.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true }));
    expect(widget.hasAttribute('open')).toBe(true);

    widget.shadowRoot
      ?.querySelector<HTMLElement>('.c7-panel')
      ?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true }));
    expect(widget.hasAttribute('open')).toBe(true);
  });

  it('routes global API calls by widgetId and unregisters removed widgets', async () => {
    defineContext7Widget();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Docs"}\n'])))
    );

    const first = document.createElement('context7-widget');
    first.setAttribute('library', '/first/repo');
    first.setAttribute('widget-id', 'first');
    const second = document.createElement('context7-widget');
    second.setAttribute('library', '/second/repo');
    second.setAttribute('widget-id', 'second');
    document.body.append(first, second);

    window.Context7Widget?.open('second');

    expect(first.hasAttribute('open')).toBe(false);
    expect(second.hasAttribute('open')).toBe(true);

    await window.Context7Widget?.send('Question', 'first');
    expect(first.shadowRoot?.textContent).toContain('Docs');

    first.remove();
    expect(window.Context7Widget?.get('first')).toBeUndefined();
    expect(window.Context7Widget?.get('second')).toBe(second);
  });

  it('restores the previous connected instance when duplicate widget ids are removed', () => {
    defineContext7Widget();

    const first = document.createElement('context7-widget');
    first.setAttribute('library', '/first/repo');
    const second = document.createElement('context7-widget');
    second.setAttribute('library', '/second/repo');
    document.body.append(first, second);

    expect(window.Context7Widget?.get()).toBe(second);
    second.remove();
    expect(window.Context7Widget?.get()).toBe(first);
  });

  it('emits cancel and commits a visible partial answer as cancelled', async () => {
    defineContext7Widget();

    const encoder = new TextEncoder();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url, init?: RequestInit) =>
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                init?.signal?.addEventListener(
                  'abort',
                  () => controller.error(new DOMException('Aborted', 'AbortError')),
                  { once: true }
                );
                controller.enqueue(encoder.encode('data: {"type":"text-delta","delta":"Partial core answer"}\n'));
              }
            })
          )
      )
    );

    const widget = document.createElement('context7-widget') as HTMLElement & {
      cancel: () => void;
      getMessages: () => readonly { content: string; status?: string }[];
      send: (question: string) => Promise<{ status?: string } | undefined>;
    };
    const cancel = vi.fn();
    widget.setAttribute('library', '/desource-labs/context7-widget');
    widget.addEventListener('c7:cancel', (event) => cancel((event as CustomEvent).detail));
    document.body.append(widget);

    const pending = widget.send('Stop after a token');
    await vi.waitFor(() => expect(widget.shadowRoot?.textContent).toContain('Partial core answer'));
    widget.cancel();
    const result = await pending;

    expect(result?.status).toBe('cancelled');
    expect(cancel).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: 'Partial core answer',
        message: expect.objectContaining({ status: 'cancelled' }),
        question: 'Stop after a token'
      })
    );
    expect(widget.getMessages().map((message) => message.content)).toEqual([
      'Stop after a token',
      'Partial core answer'
    ]);
    expect(widget.getMessages()[1]?.status).toBe('cancelled');
  });

  it('turns the send control into an accessible stop action while streaming', async () => {
    defineContext7Widget();

    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            signal = init?.signal ?? undefined;
            signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          })
      )
    );

    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    document.body.append(widget);
    const input = widget.shadowRoot?.querySelector<HTMLTextAreaElement>('[data-c7-input]');
    const form = widget.shadowRoot?.querySelector<HTMLFormElement>('[data-c7-form]');
    const submit = widget.shadowRoot?.querySelector<HTMLButtonElement>('[data-c7-send]');
    input!.value = 'Stop this response';

    form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(submit?.textContent?.trim()).toBe('Stop');
    expect(submit?.getAttribute('aria-label')).toBe('Stop response');

    form?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(signal?.aborted).toBe(true);
    expect(submit?.textContent?.trim()).toBe('Send');
  });

  it('binds static shadow DOM handlers once across reconnections', async () => {
    defineContext7Widget();
    const fetchMock = vi.fn(
      async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Reconnected"}\n']))
    );
    vi.stubGlobal('fetch', fetchMock);

    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    document.body.append(widget);
    widget.remove();
    document.body.append(widget);

    const input = widget.shadowRoot?.querySelector<HTMLTextAreaElement>('[data-c7-input]');
    input!.value = 'One request';
    widget.shadowRoot
      ?.querySelector<HTMLFormElement>('[data-c7-form]')
      ?.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await waitForShadowText(widget, 'Reconnected');

    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('registers only connected instances and restores external trigger accessibility', () => {
    defineContext7Widget();

    const trigger = document.createElement('button');
    trigger.id = 'docs-trigger';
    trigger.setAttribute('aria-expanded', 'mixed');
    const widget = document.createElement('context7-widget') as HTMLElement & { open: () => void };
    widget.setAttribute('custom-trigger', '#docs-trigger');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    widget.setAttribute('widget-id', 'detached');

    expect(window.Context7Widget?.get('detached')).toBeUndefined();
    document.body.append(trigger, widget);
    expect(trigger.getAttribute('aria-controls')).toMatch(/^context7-widget-panel-/);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    widget.open();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    widget.remove();
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    expect(trigger.getAttribute('aria-expanded')).toBe('mixed');
    expect(window.Context7Widget?.get('detached')).toBeUndefined();
  });

  it('submits the composer input and supports close controls', async () => {
    defineContext7Widget();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Form answer"}\n'])))
    );

    const widget = document.createElement('context7-widget') as HTMLElement & {
      open: () => void;
    };
    widget.setAttribute('library', '/desource-labs/context7-widget');
    document.body.append(widget);

    const input = widget.shadowRoot?.querySelector<HTMLTextAreaElement>('[data-c7-input]');
    const form = widget.shadowRoot?.querySelector<HTMLFormElement>('[data-c7-form]');
    input!.value = 'Use the form';
    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await waitForShadowText(widget, 'Form answer');

    expect(widget.hasAttribute('open')).toBe(true);

    widget.shadowRoot?.querySelector<HTMLButtonElement>('[data-c7-close]')?.click();
    expect(widget.hasAttribute('open')).toBe(false);

    widget.open();
    widget.shadowRoot?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Escape' }));
    expect(widget.hasAttribute('open')).toBe(false);
  });

  it('renders a useful error when sending without a library', async () => {
    defineContext7Widget();

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const widget = document.createElement('context7-widget') as HTMLElement & {
      send: (question: string) => Promise<unknown>;
    };
    document.body.append(widget);

    await widget.send('Can you help?');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(widget.shadowRoot?.textContent).toContain('Missing library configuration.');
  });
});

async function waitForShadowText(element: Element, text: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (element.shadowRoot?.textContent?.includes(text)) return;
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }

  throw new Error(`Timed out waiting for shadow text: ${text}`);
}

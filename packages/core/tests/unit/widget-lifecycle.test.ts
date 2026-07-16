import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineContext7Widget } from '../../src';
import { createSseStream } from '../../../../common/tests/unit/stream';

describe('Context7WidgetElement lifecycle behavior', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('opens from defaultOpen and applies text/display options', () => {
    defineContext7Widget();

    const widget = document.createElement('context7-widget');
    widget.setAttribute('default-open', 'true');
    widget.setAttribute('initial-message', 'Ask about **{library}**');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    widget.setAttribute('placeholder', 'Search docs');
    widget.setAttribute('show-powered-by', 'false');
    widget.setAttribute('title', 'Product docs');
    document.body.append(widget);

    expect(widget.hasAttribute('open')).toBe(true);
    expect(widget.shadowRoot?.querySelector('[part~="title"]')?.textContent).toBe('Product docs');
    expect(widget.shadowRoot?.querySelector<HTMLInputElement>('[part~="input"]')?.placeholder).toBe('Search docs');
    expect(widget.shadowRoot?.textContent).toContain('/desource-labs/context7-widget');
    expect(widget.shadowRoot?.querySelector<HTMLElement>('[part~="footer"]')?.hidden).toBe(true);
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

  it('cancels an in-flight request without appending an error', async () => {
    defineContext7Widget();

    let abortSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            abortSignal = init?.signal ?? undefined;
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          })
      )
    );

    const widget = document.createElement('context7-widget') as HTMLElement & {
      cancel: () => void;
      send: (question: string) => Promise<void>;
    };
    widget.setAttribute('library', '/desource-labs/context7-widget');
    document.body.append(widget);

    const pending = widget.send('Please stop');
    widget.cancel();
    await expect(pending).resolves.toBeUndefined();

    expect(abortSignal?.aborted).toBe(true);
    expect(widget.shadowRoot?.textContent).not.toContain('Aborted');
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

    const input = widget.shadowRoot?.querySelector<HTMLInputElement>('[data-c7-input]');
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
      send: (question: string) => Promise<void>;
    };
    document.body.append(widget);

    await widget.send('Can you help?');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(widget.shadowRoot?.textContent).toContain('Missing data-library attribute.');
  });

  it('renders and toggles tool results from streamed responses', async () => {
    defineContext7Widget();

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{}}\n',
              'data: {"type":"tool-output-available","toolCallId":"tool-1","output":{"snippet":"Install with npm."}}\n',
              'data: [DONE]\n'
            ])
          )
      )
    );

    const widget = document.createElement('context7-widget') as HTMLElement & {
      send: (question: string) => Promise<void>;
    };
    widget.setAttribute('library', '/desource-labs/context7-widget');
    document.body.append(widget);

    await widget.send('Find install docs');

    expect(widget.shadowRoot?.textContent).toContain('Searching: documentation');

    const toggle = widget.shadowRoot?.querySelector<HTMLButtonElement>('.c7-tool-toggle');
    const content = widget.shadowRoot?.querySelector<HTMLElement>('.c7-tool-content');
    expect(content?.hidden).toBe(true);

    toggle?.click();
    expect(toggle?.getAttribute('aria-expanded')).toBe('true');
    expect(content?.hidden).toBe(false);
    expect(content?.textContent).toContain('Install with npm.');

    toggle?.click();
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(content?.hidden).toBe(true);
  });
});

async function waitForShadowText(element: Element, text: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (element.shadowRoot?.textContent?.includes(text)) return;
    await new Promise((resolve) => window.setTimeout(resolve, 0));
  }

  throw new Error(`Timed out waiting for shadow text: ${text}`);
}

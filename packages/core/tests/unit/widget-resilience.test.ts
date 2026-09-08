import { afterEach, describe, expect, it, vi } from 'vitest';
import { Context7WidgetElement, defineContext7Widget } from '@src/index';
import { createSseStream } from '@common/tests/unit/stream';

describe('Context7WidgetElement resilience', () => {
  afterEach(() => {
    document.body.replaceChildren();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps nested backdrop clicks open and tolerates externally removed open state', () => {
    defineContext7Widget();
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('library', '/owner/repo');
    widget.setAttribute('position', 'center');
    document.body.append(widget);
    widget.open();

    const backdrop = widget.shadowRoot?.querySelector<HTMLElement>('[data-c7-backdrop]');
    const decoration = document.createElement('span');
    backdrop?.append(decoration);
    decoration.click();
    expect(widget.isOpen()).toBe(true);

    widget.removeAttribute('open');
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(widget.isOpen()).toBe(false);
  });

  it('ignores widget-originated scroll layout work and coalesces stale anchor frames', () => {
    vi.useFakeTimers();
    defineContext7Widget();
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('library', '/owner/repo');
    widget.setAttribute('position', 'anchor');
    document.body.append(widget);
    widget.open();

    widget.shadowRoot
      ?.querySelector('[data-c7-messages]')
      ?.dispatchEvent(new Event('scroll', { bubbles: true, composed: true }));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));
    widget.removeAttribute('open');

    vi.advanceTimersByTime(16);
    expect(widget.isOpen()).toBe(false);
  });

  it('ignores non-element copy targets and buttons without registered values', () => {
    defineContext7Widget();
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('library', '/owner/repo');
    document.body.append(widget);
    const messages = widget.shadowRoot?.querySelector<HTMLElement>('[data-c7-messages]');
    if (!messages) throw new Error('Expected the widget messages element.');

    const text = document.createTextNode('plain text');
    messages.append(text);
    text.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    const code = document.createElement('button');
    code.setAttribute('data-c7-copy-code', '');
    const answer = document.createElement('button');
    answer.setAttribute('data-c7-copy-answer', '');
    messages.append(code, answer);
    code.click();
    answer.click();

    expect(code.hasAttribute('data-c7-copied')).toBe(false);
    expect(answer.hasAttribute('data-c7-copied')).toBe(false);
  });

  it('exposes selector triggers and safely rebinds a connected closed widget', () => {
    defineContext7Widget();
    const first = document.createElement('button');
    first.id = 'first-trigger';
    const second = document.createElement('button');
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('custom-trigger', '#first-trigger');
    widget.setAttribute('library', '/owner/repo');
    document.body.append(first, second, widget);

    expect(widget.customTrigger).toBe('#first-trigger');
    widget.customTrigger = second;
    expect(widget.customTrigger).toBe(second);
    expect(widget.isOpen()).toBe(false);
    expect(second.getAttribute('aria-haspopup')).toBe('dialog');
  });

  it('does not focus the composer when retry is requested during an active response', async () => {
    defineContext7Widget();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
              once: true
            });
          })
      )
    );
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('library', '/owner/repo');
    document.body.append(widget);

    const pending = widget.send('Keep working');
    await vi.waitFor(() => expect(widget.isBusy()).toBe(true));
    await expect(widget.retry()).resolves.toMatchObject({ status: 'empty' });
    expect(widget.isBusy()).toBe(true);

    widget.cancel();
    await expect(pending).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('keeps tool-result disclosure labels synchronized in both directions', async () => {
    defineContext7Widget();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{"query":"setup"}}\n',
              'data: {"type":"tool-output-available","toolCallId":"tool-1","output":"Install the package"}\n',
              'data: {"type":"text-delta","delta":"Done"}\n'
            ])
          )
      )
    );
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('library', '/owner/repo');
    document.body.append(widget);

    await widget.send('How?');
    const toggle = widget.shadowRoot?.querySelector<HTMLButtonElement>('.c7-tool-toggle');
    if (!toggle) throw new Error('Expected the tool result toggle.');

    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toContain('Hide results');
    toggle.click();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.textContent).toContain('View results');

    toggle.querySelector('span')?.remove();
    expect(() => toggle.click()).not.toThrow();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('leaves duplicate answer actions intact and avoids redundant state mutations', () => {
    defineContext7Widget();
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('backdrop', 'true');
    widget.setAttribute('library', '/owner/repo');
    document.body.append(widget);

    expect(widget.hasAttribute('backdrop-active')).toBe(true);
    widget.setAttribute('dialog-title', 'Updated title');
    expect(widget.hasAttribute('backdrop-active')).toBe(true);

    const intro = widget.shadowRoot?.querySelector<HTMLElement>('.c7-message--assistant');
    if (!intro) throw new Error('Expected the initial assistant message.');
    const internal = widget as unknown as {
      addAnswerActions: (message: HTMLElement, answer: string) => void;
    };
    const originalAction = intro.querySelector('[data-c7-copy-answer]');
    internal.addAnswerActions(intro, 'Duplicate action');
    expect(intro.querySelectorAll('[data-c7-copy-answer]')).toHaveLength(1);
    expect(intro.querySelector('[data-c7-copy-answer]')).toBe(originalAction);
  });

  it('ignores irrelevant trigger mutations and supports repeated disconnected cleanup', async () => {
    defineContext7Widget();
    const trigger = document.createElement('button');
    trigger.id = 'stable-trigger';
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('custom-trigger', '#stable-trigger');
    widget.setAttribute('library', '/owner/repo');
    document.body.append(trigger, widget);

    document.body.append(document.createElement('div'));
    await Promise.resolve();
    expect(widget.hasAttribute('custom-trigger-active')).toBe(true);

    widget.remove();
    expect(() => widget.disconnectedCallback()).not.toThrow();
  });

  it('can be imported and defined safely without browser element registries', async () => {
    vi.resetModules();
    vi.stubGlobal('HTMLElement', undefined);
    vi.stubGlobal('customElements', undefined);

    try {
      const serverModule = await import('../../src/widget-element');
      expect(serverModule.Context7WidgetElement).toBeTypeOf('function');
      expect(() => serverModule.defineContext7Widget()).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

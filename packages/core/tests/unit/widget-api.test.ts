import { afterEach, describe, expect, it, vi } from 'vitest';
import { Context7WidgetElement, defineContext7Widget } from '../../src';
import { createSseStream } from '@common/tests/unit/stream';

describe('Context7WidgetElement public API', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('exposes safe controller operations with and without a registered widget', () => {
    defineContext7Widget();
    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    widget.setAttribute('widget-id', 'docs');
    document.body.append(widget);

    const api = window.Context7Widget;
    expect(api?.get('docs')).toBe(widget);
    expect(api?.getMessages('docs')).toEqual([]);
    expect(api?.isBusy('docs')).toBe(false);
    expect(api?.isOpen('docs')).toBe(false);

    api?.open('docs');
    expect(api?.isOpen('docs')).toBe(true);
    api?.toggle('docs');
    expect(api?.isOpen('docs')).toBe(false);
    api?.toggle('docs');
    api?.close('docs');
    expect(api?.isOpen('docs')).toBe(false);

    api?.reset('docs');
    api?.cancel('docs');
    widget.remove();

    expect(api?.get('docs')).toBeUndefined();
    expect(api?.getMessages('docs')).toEqual([]);
    expect(api?.isBusy('docs')).toBe(false);
    expect(api?.isOpen('docs')).toBe(false);
    expect(() => {
      api?.open('docs');
      api?.close('docs');
      api?.toggle('docs');
      api?.reset('docs');
      api?.cancel('docs');
    }).not.toThrow();
  });

  it('moves a connected widget registration when its widget id changes', () => {
    defineContext7Widget();
    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/desource-labs/context7-widget');
    widget.setAttribute('widget-id', 'old-id');
    document.body.append(widget);

    widget.setAttribute('widget-id', 'new-id');

    expect(window.Context7Widget?.get('old-id')).toBeUndefined();
    expect(window.Context7Widget?.get('new-id')).toBe(widget);
  });

  it('resets the conversation when its library or initial message changes', async () => {
    defineContext7Widget();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Old answer"}\n'])))
    );
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('initial-message', 'Welcome to {library}');
    widget.setAttribute('library', '/owner/old');
    document.body.append(widget);

    await widget.send('Old question');
    expect(widget.getMessages()).toHaveLength(2);

    widget.setAttribute('library', '/owner/new');
    expect(widget.getMessages()).toEqual([]);
    expect(widget.shadowRoot?.textContent).toContain('Welcome to /owner/new');
    expect(widget.shadowRoot?.textContent).not.toContain('Old answer');

    widget.setAttribute('initial-message', 'A fresh conversation');
    expect(widget.getMessages()).toEqual([]);
    expect(widget.shadowRoot?.textContent).toContain('A fresh conversation');
  });

  it('emits actionable transport errors and restores the composer state', async () => {
    defineContext7Widget();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      })
    );
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('library', '/owner/repo');
    document.body.append(widget);
    const errors: unknown[] = [];
    widget.addEventListener('c7:error', (event) => errors.push((event as CustomEvent).detail));

    await widget.send('How do I install this?');

    const input = widget.shadowRoot?.querySelector<HTMLInputElement>('[data-c7-input]');
    const send = widget.shadowRoot?.querySelector<HTMLButtonElement>('[data-c7-send]');
    expect(widget.isBusy()).toBe(false);
    expect(input?.disabled).toBe(false);
    expect(send?.textContent?.trim()).toBe('Send');
    expect(widget.shadowRoot?.textContent).toContain('Unable to connect to the Context7 chat service.');
    expect(widget.shadowRoot?.querySelector<HTMLAnchorElement>('[role="alert"] a')?.href).toBe(
      'https://context7.com/owner/repo/admin?tab=chat'
    );
    expect(errors).toEqual([
      expect.objectContaining({
        error: 'Unable to connect to the Context7 chat service.',
        question: 'How do I install this?',
        widget
      })
    ]);
  });
});

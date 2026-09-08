import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineContext7Widget, setContext7WidgetAttributes } from '@src/index';
import type { Context7WidgetOptions } from '@src/index';
import { createContext7CopyActionController } from '@src/copy-action';
import { trapFocus, updateAnchorPosition } from '@src/dom';
import { acquireContext7Modal } from '@src/modal';
import { streamContext7Response } from '@src/transport';
import type { Context7Message } from '@src/types';
import { setDocumentClientSize, setElementRect, setViewportSize } from '@common/tests/unit/dom';
import { createSseStream } from '@common/tests/unit/stream';

const messages: Context7Message[] = [{ content: 'Question', id: 'message-1', role: 'user' }];

describe('core boundary behavior', () => {
  afterEach(() => {
    document.body.replaceChildren();
    document.body.removeAttribute('style');
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps renewed copy feedback when a stale timer fires', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => undefined);
    const onChange = vi.fn();
    const actions = createContext7CopyActionController<string>({
      copy: async () => true,
      delay: 100,
      onChange
    });

    await expect(actions.copy('answer', 'first')).resolves.toBe(true);
    actions.reset(false);
    vi.advanceTimersByTime(50);
    await expect(actions.copy('answer', 'renewed')).resolves.toBe(true);

    vi.advanceTimersByTime(50);
    expect(actions.isCopied('answer')).toBe(true);
    expect(onChange).not.toHaveBeenCalledWith('answer', false);

    vi.advanceTimersByTime(50);
    expect(actions.isCopied('answer')).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith('answer', false);
  });

  it('uses panel dimensions as a final anchor viewport fallback', () => {
    const anchor = document.createElement('button');
    const panel = document.createElement('section');
    const root = document.createElement('div');
    document.body.append(anchor, panel, root);
    setElementRect(anchor, { bottom: 80, height: 40, left: 40, right: 100, top: 40, width: 60 });
    setViewportSize(0, 0);
    setDocumentClientSize(0, 0);
    vi.stubGlobal('visualViewport', undefined);

    updateAnchorPosition('anchor', anchor, panel, root.style);

    expect(root.style.getPropertyValue('--c7-anchor-max-width')).toBe('376px');
    expect(root.style.getPropertyValue('--c7-anchor-max-height')).toBe('496px');
  });

  it('traps focus in light DOM and leaves non-boundary tab presses alone', () => {
    const panel = document.createElement('section');
    const first = document.createElement('button');
    const middle = document.createElement('button');
    const last = document.createElement('button');
    panel.append(first, middle, last);
    document.body.append(panel);
    makeVisible(first, middle, last);

    last.focus();
    const wrap = new KeyboardEvent('keydown', { cancelable: true, key: 'Tab' });
    trapFocus(wrap, panel);
    expect(wrap.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    middle.focus();
    const untouched = new KeyboardEvent('keydown', { cancelable: true, key: 'Tab' });
    trapFocus(untouched, panel);
    expect(untouched.defaultPrevented).toBe(false);
    expect(document.activeElement).toBe(middle);
  });

  it('ignores unsupported trigger values and clears explicit empty triggers', () => {
    defineContext7Widget();
    const plainElement = document.createElement('div');
    setContext7WidgetAttributes(plainElement, { labels: { close: 'Dismiss' } });
    setContext7WidgetAttributes(plainElement, {
      customTrigger: 42
    } as unknown as Partial<Context7WidgetOptions>);
    expect(plainElement.hasAttribute('custom-trigger')).toBe(false);

    const widget = document.createElement('context7-widget');
    setContext7WidgetAttributes(widget, { customTrigger: '#docs' });
    expect(widget.getAttribute('custom-trigger')).toBe('#docs');
    setContext7WidgetAttributes(widget, { customTrigger: '' });
    expect(widget.hasAttribute('custom-trigger')).toBe(false);
  });

  it('acquires and releases modal state for a detached container', () => {
    const widget = document.createElement('div');

    const release = acquireContext7Modal(widget);
    expect(document.body.style.overflow).toBe('hidden');

    release();
    expect(document.body.style.overflow).toBe('');
  });

  it('ignores compatibility objects without text and handles valid error bodies without messages', async () => {
    const chunks: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['0:{"metadata":true}\n'])))
    );

    await streamContext7Response({ library: '/owner/repo' }, messages, {
      onChunk: (chunk) => chunks.push(chunk)
    });
    expect(chunks).toEqual([]);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 418 }))
    );
    await expect(
      streamContext7Response({ library: '/owner/repo' }, messages, { onChunk: () => undefined })
    ).rejects.toThrow('Context7 chat request failed with HTTP 418.');
  });
});

function makeVisible(...elements: HTMLElement[]): void {
  for (const element of elements) {
    Object.defineProperty(element, 'offsetParent', {
      configurable: true,
      value: element.parentElement
    });
  }
}

import { setElementRect, setElementSize } from '@common/tests/unit/dom';
import { createSseStream } from '@common/tests/unit/stream';
import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { flushSync, tick } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Context7Widget from '@src/Context7Widget.svelte';
import { createContext7Widget } from '@src/controller.svelte';

describe('native Svelte widget behavior', () => {
  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('submits the native form, respects composition keys, traps focus, and supports modal dismissal', async () => {
    const onClose = vi.fn();
    const onQuestion = vi.fn();
    const fetchMock = vi.fn(
      async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Form response"}\n']))
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = render(Context7Widget, {
      closeOnOutsideClick: true,
      customTrigger: true,
      launcherLabel: 'Ask the docs',
      library: '/owner/repo',
      onClose,
      onQuestion,
      position: 'center'
    });
    flushSync();

    const trigger = result.getByRole('button', { name: 'Ask the docs' });
    const widget = required(result.container.querySelector<HTMLElement>('.context7-widget'), 'widget');
    trigger.focus();
    await fireEvent.click(trigger);
    await tick();
    expect(widget.hasAttribute('open')).toBe(true);

    const input = required(result.container.querySelector<HTMLTextAreaElement>('.c7-input'), 'input');
    Object.defineProperty(input, 'scrollHeight', { configurable: true, value: 120 });
    input.value = '  How do Svelte forms work?  ';
    await fireEvent.input(input);
    expect(input.style.height).toBe('84px');

    const composingEnter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      isComposing: true,
      key: 'Enter'
    });
    input.dispatchEvent(composingEnter);
    const shiftedEnter = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      shiftKey: true
    });
    input.dispatchEvent(shiftedEnter);
    expect(fetchMock).not.toHaveBeenCalled();

    const form = required(result.container.querySelector<HTMLFormElement>('.c7-composer'), 'form');
    const submit = new SubmitEvent('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(submit);
    expect(submit.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(result.container.textContent).toContain('Form response'));
    expect(onQuestion).toHaveBeenCalledWith(expect.objectContaining({ question: 'How do Svelte forms work?' }));
    expect(input.value).toBe('');

    const panel = required(result.container.querySelector<HTMLElement>('.c7-panel'), 'panel');
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    for (const element of focusable) {
      Object.defineProperty(element, 'offsetParent', { configurable: true, value: panel });
    }
    const first = required(focusable[0], 'first focusable control');
    const last = required(focusable.at(-1), 'last focusable control');
    last.focus();
    const tab = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' });
    last.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    await fireEvent.click(required(result.container.querySelector('.c7-backdrop'), 'backdrop'));
    expect(widget.hasAttribute('open')).toBe(false);
    expect(onClose).toHaveBeenCalledOnce();

    trigger.focus();
    await fireEvent.click(trigger);
    const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' });
    widget.dispatchEvent(escape);
    flushSync();
    expect(escape.defaultPrevented).toBe(true);
    expect(widget.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('observes valid late selectors, ignores invalid selectors, and restores a removed trigger', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    const constructors = vi.fn();
    let mutation: MutationCallback | undefined;
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: MutationCallback) {
          constructors();
          mutation = callback;
        }

        observe = observe;
        disconnect = disconnect;
      }
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const invalid = render(Context7Widget, { customTrigger: '[', library: '/owner/repo' });
    flushSync();
    expect(warn).toHaveBeenCalledWith('[Context7 Widget] Invalid custom trigger selector: [');
    expect(constructors).not.toHaveBeenCalled();
    expect(invalid.container.querySelector('.c7-launcher')).not.toBeNull();
    invalid.unmount();

    const late = render(Context7Widget, { customTrigger: '.late-svelte-trigger', library: '/owner/repo' });
    flushSync();
    const widget = required(late.container.querySelector<HTMLElement>('.context7-widget'), 'widget');
    expect(widget.hasAttribute('custom-trigger-active')).toBe(false);
    expect(late.container.querySelector('.c7-launcher')).not.toBeNull();
    expect(observe).toHaveBeenCalledWith(document.documentElement, { childList: true, subtree: true });

    const external = document.createElement('button');
    external.className = 'late-svelte-trigger';
    external.setAttribute('aria-expanded', 'mixed');
    external.setAttribute('aria-haspopup', 'menu');
    document.body.append(external);
    mutation?.([], {} as MutationObserver);
    await tick();
    flushSync();

    expect(widget.hasAttribute('custom-trigger-active')).toBe(true);
    expect(late.container.querySelector('.c7-launcher')).toBeNull();
    expect(external.getAttribute('aria-controls')).toBe(late.container.querySelector('dialog')?.id);
    expect(external.getAttribute('aria-expanded')).toBe('false');
    expect(external.getAttribute('aria-haspopup')).toBe('dialog');

    await fireEvent.click(external);
    expect(widget.hasAttribute('open')).toBe(true);
    expect(external.getAttribute('aria-expanded')).toBe('true');

    external.remove();
    mutation?.([], {} as MutationObserver);
    await tick();
    flushSync();
    expect(widget.hasAttribute('custom-trigger-active')).toBe(false);
    expect(late.container.querySelector('.c7-launcher')).not.toBeNull();
    expect(external.getAttribute('aria-expanded')).toBe('mixed');
    expect(external.getAttribute('aria-haspopup')).toBe('menu');
    expect(external.hasAttribute('aria-controls')).toBe(false);
    expect(disconnect).toHaveBeenCalled();
  });

  it('binds Element triggers and excludes the trigger and widget from outside-click dismissal', async () => {
    const external = document.createElement('button');
    external.setAttribute('aria-controls', 'authored-panel');
    external.setAttribute('aria-expanded', 'mixed');
    external.setAttribute('aria-haspopup', 'menu');
    document.body.append(external);

    const result = render(Context7Widget, {
      closeOnOutsideClick: true,
      customTrigger: external,
      library: '/owner/repo'
    });
    flushSync();
    const widget = required(result.container.querySelector<HTMLElement>('.context7-widget'), 'widget');
    expect(external.getAttribute('aria-haspopup')).toBe('dialog');

    await fireEvent.click(external);
    expect(widget.hasAttribute('open')).toBe(true);
    external.dispatchEvent(pointerDown());
    widget.dispatchEvent(pointerDown());
    expect(widget.hasAttribute('open')).toBe(true);

    document.body.dispatchEvent(pointerDown());
    flushSync();
    expect(widget.hasAttribute('open')).toBe(false);

    await result.rerender({ closeOnOutsideClick: true, customTrigger: undefined, library: '/owner/repo' });
    flushSync();
    expect(external.getAttribute('aria-controls')).toBe('authored-panel');
    expect(external.getAttribute('aria-expanded')).toBe('mixed');
    expect(external.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('reacts to default-open, layout options, and widget registry identity changes', async () => {
    const result = render(Context7Widget, {
      closeOnOutsideClick: false,
      defaultOpen: false,
      library: '/owner/repo',
      position: 'center',
      widgetId: 'first-widget'
    });
    flushSync();
    const widget = required(result.container.querySelector<HTMLElement>('.context7-widget'), 'widget');
    const launcher = required(result.container.querySelector<HTMLElement>('.c7-launcher'), 'launcher');
    const panel = required(result.container.querySelector<HTMLElement>('.c7-panel'), 'panel');
    setElementSize(panel, 360, 240);
    setElementRect(launcher, { bottom: 160, height: 40, left: 100, right: 220, top: 120, width: 120 });
    expect(widget.hasAttribute('open')).toBe(false);

    await result.rerender({
      closeOnOutsideClick: true,
      defaultOpen: true,
      library: '/owner/repo',
      position: 'anchor',
      widgetId: 'second-widget'
    });
    await tick();
    flushSync();
    expect(widget.hasAttribute('open')).toBe(true);
    expect(widget.getAttribute('position')).toBe('anchor');
    expect(widget.getAttribute('widget-id')).toBe('second-widget');
    expect(widget.style.getPropertyValue('--c7-anchor-left')).toMatch(/px$/);
    expect(widget.style.getPropertyValue('--c7-anchor-top')).toMatch(/px$/);

    const oldController = createContext7Widget({ widgetId: 'first-widget' });
    const currentController = createContext7Widget({ widgetId: 'second-widget' });
    currentController.close();
    flushSync();
    expect(widget.hasAttribute('open')).toBe(false);
    oldController.open();
    flushSync();
    expect(widget.hasAttribute('open')).toBe(false);
    currentController.open();
    flushSync();
    expect(widget.hasAttribute('open')).toBe(true);

    document.body.dispatchEvent(pointerDown());
    flushSync();
    expect(widget.hasAttribute('open')).toBe(false);
  });

  it('observes anchored geometry, coalesces layout frames, and cancels stale closed work', async () => {
    let nextFrame = 0;
    const frames = new Map<number, FrameRequestCallback>();
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    });
    const cancelFrame = vi.fn((id: number) => frames.delete(id));
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);

    const observe = vi.fn();
    const disconnect = vi.fn();
    let resize: ResizeObserverCallback | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resize = callback;
        }

        observe = observe;
        disconnect = disconnect;
      }
    );
    const viewport = Object.assign(new EventTarget(), {
      height: 500,
      offsetLeft: 0,
      offsetTop: 0,
      width: 800
    });
    vi.stubGlobal('visualViewport', viewport);

    const result = render(Context7Widget, { library: '/owner/repo', position: 'anchor' });
    flushSync();
    const widget = required(result.container.querySelector<HTMLElement>('.context7-widget'), 'widget');
    const panel = required(result.container.querySelector<HTMLElement>('.c7-panel'), 'panel');
    const launcher = required(result.container.querySelector<HTMLElement>('.c7-launcher'), 'launcher');
    setElementSize(panel, 400, 300);
    setElementRect(launcher, { bottom: 460, height: 40, left: 450, right: 550, top: 420, width: 100 });

    await tick();
    runFrames(frames);
    result.component.open();
    await tick();
    flushSync();
    expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('108px');
    expect(observe).toHaveBeenCalledWith(launcher);
    expect(observe).toHaveBeenCalledWith(panel);

    runFrames(frames);
    requestFrame.mockClear();
    cancelFrame.mockClear();
    widget.dispatchEvent(new Event('scroll', { bubbles: true, composed: true }));
    expect(requestFrame).not.toHaveBeenCalled();

    setElementRect(launcher, { bottom: 160, height: 40, left: 450, right: 550, top: 120, width: 100 });
    resize?.([], {} as ResizeObserver);
    viewport.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(requestFrame).toHaveBeenCalledOnce();
    const [scheduledId, scheduledFrame] = required([...frames.entries()][0], 'scheduled layout frame');

    result.component.close();
    expect(cancelFrame).toHaveBeenCalledWith(scheduledId);
    scheduledFrame(performance.now());
    expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('108px');
    expect(disconnect).toHaveBeenCalled();
  });

  it('keeps streaming scroll sticky only while the reader remains near the bottom', async () => {
    let nextFrame = 0;
    const frames = new Map<number, FrameRequestCallback>();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = ++nextFrame;
      frames.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));

    const deferred = createDeferredSseStream();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(deferred.stream))
    );
    const result = render(Context7Widget, { defaultOpen: true, library: '/owner/repo' });
    flushSync();
    const messages = required(result.container.querySelector<HTMLElement>('.c7-messages'), 'messages');
    let scrollHeight = 600;
    let scrollTop = 400;
    const scrollWrites: number[] = [];
    Object.defineProperties(messages, {
      clientHeight: { configurable: true, get: () => 200 },
      scrollHeight: { configurable: true, get: () => scrollHeight },
      scrollTop: {
        configurable: true,
        get: () => scrollTop,
        set(value: number) {
          scrollTop = value;
          scrollWrites.push(value);
        }
      }
    });

    await tick();
    runFrames(frames);
    scrollWrites.length = 0;
    scrollTop = 100;
    messages.dispatchEvent(new Event('scroll', { bubbles: true }));

    const pending = result.component.send('Keep my reading position');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    deferred.push('data: {"type":"text-delta","delta":"First"}\n\n');
    await vi.waitFor(() => expect(frames.size).toBeGreaterThan(0));
    runFrames(frames);
    await tick();
    runFrames(frames);
    expect(scrollTop).toBe(100);
    expect(scrollWrites).toHaveLength(0);

    scrollTop = scrollHeight - 200;
    messages.dispatchEvent(new Event('scroll', { bubbles: true }));
    await tick();
    runFrames(frames);
    expect(scrollTop).toBe(600);
    scrollWrites.length = 0;

    scrollHeight = 800;
    deferred.push('data: {"type":"text-delta","delta":" second"}\n\n');
    await vi.waitFor(() => expect(frames.size).toBeGreaterThan(0));
    runFrames(frames);
    await tick();
    runFrames(frames);
    expect(scrollTop).toBe(800);
    expect(scrollWrites).toContain(800);

    deferred.close();
    await pending;
  });

  it('keeps disabled dismissal inert, forwards root keys, delegates safely, and lets the form stop work', async () => {
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            requestSignal = init?.signal ?? undefined;
            requestSignal?.addEventListener(
              'abort',
              () => reject(new DOMException('The request was aborted.', 'AbortError')),
              { once: true }
            );
          })
      )
    );
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const onkeydown = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = render(Context7Widget, {
      closeOnOutsideClick: false,
      customTrigger: '   ',
      library: '/owner/repo',
      rootProps: { onkeydown }
    });
    flushSync();

    expect(warn).not.toHaveBeenCalled();
    const widget = required(result.container.querySelector<HTMLElement>('.context7-widget'), 'widget');
    await fireEvent.click(required(result.container.querySelector('.c7-launcher'), 'launcher'));
    expect(widget.hasAttribute('open')).toBe(true);
    await fireEvent.click(required(result.container.querySelector('.c7-backdrop'), 'backdrop'));
    expect(widget.hasAttribute('open')).toBe(true);

    widget.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    expect(onkeydown).toHaveBeenCalledOnce();

    const messages = required(result.container.querySelector<HTMLElement>('.c7-messages'), 'messages');
    const text = document.createTextNode('plain text');
    const detachedCodeAction = document.createElement('button');
    detachedCodeAction.dataset.c7CopyCode = '';
    messages.append(text, detachedCodeAction);
    text.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    detachedCodeAction.click();
    await Promise.resolve();
    expect(writeText).not.toHaveBeenCalled();

    const input = required(result.container.querySelector<HTMLTextAreaElement>('.c7-input'), 'input');
    input.value = 'Stop this request';
    await fireEvent.input(input);
    const form = required(result.container.querySelector<HTMLFormElement>('.c7-composer'), 'form');
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(result.component.isBusy()).toBe(true));
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    await vi.waitFor(() => expect(result.component.isBusy()).toBe(false));
    expect(requestSignal?.aborted).toBe(true);

    result.component.close();
    document.body.dispatchEvent(pointerDown());
    expect(result.component.isOpen()).toBe(false);
  });

  it('warns once for a disconnected Element trigger and binds it after connection', async () => {
    let mutation: MutationCallback | undefined;
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: MutationCallback) {
          mutation = callback;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      }
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const external = document.createElement('button');
    const result = render(Context7Widget, { customTrigger: external, library: '/owner/repo' });
    flushSync();

    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith(
      '[Context7 Widget] Custom trigger element is not connected. Keeping the built-in launcher visible.'
    );
    mutation?.([], {} as MutationObserver);
    mutation?.([], {} as MutationObserver);
    expect(warn).toHaveBeenCalledOnce();

    document.body.append(external);
    mutation?.([], {} as MutationObserver);
    await tick();
    flushSync();
    expect(result.container.querySelector('.context7-widget')?.hasAttribute('custom-trigger-active')).toBe(true);
  });

  it('rebinds open layout listeners when position and dismissal change independently', async () => {
    const result = render(Context7Widget, {
      closeOnOutsideClick: false,
      defaultOpen: true,
      library: '/owner/repo',
      position: 'center'
    });
    flushSync();
    const widget = required(result.container.querySelector<HTMLElement>('.context7-widget'), 'widget');
    expect(widget.hasAttribute('open')).toBe(true);

    await result.rerender({
      closeOnOutsideClick: false,
      defaultOpen: true,
      library: '/owner/repo',
      position: 'anchor'
    });
    await tick();
    flushSync();
    expect(widget.style.getPropertyValue('--c7-anchor-top')).toMatch(/px$/);

    await result.rerender({
      closeOnOutsideClick: true,
      defaultOpen: true,
      library: '/owner/repo',
      position: 'anchor'
    });
    flushSync();
    document.body.dispatchEvent(pointerDown());
    expect(result.component.isOpen()).toBe(false);
  });

  it('renders the configured error fallback when transport supplies an empty message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                controller.error(new Error(''));
              }
            })
          )
      )
    );
    const result = render(Context7Widget, {
      labels: { errorFallback: 'Documentation is unavailable.' },
      library: '/owner/repo'
    });
    flushSync();

    await result.component.send('Handle an empty failure');
    flushSync();
    expect(result.container.querySelector('[role="alert"]')?.textContent).toContain('Documentation is unavailable.');
  });

  it('invalidates a queued scroll frame when reset schedules its replacement', async () => {
    const frames: FrameRequestCallback[] = [];
    const cancelFrame = vi.fn();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    const result = render(Context7Widget, { library: '/owner/repo' });
    flushSync();
    const messages = required(result.container.querySelector<HTMLElement>('.c7-messages'), 'messages');
    const writes: number[] = [];
    Object.defineProperties(messages, {
      clientHeight: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 600 },
      scrollTop: {
        configurable: true,
        get: () => writes.at(-1) ?? 400,
        set(value: number) {
          writes.push(value);
        }
      }
    });

    await tick();
    expect(frames).toHaveLength(1);
    result.component.reset();
    await tick();
    expect(cancelFrame).toHaveBeenCalledWith(1);
    expect(frames).toHaveLength(2);

    frames[0]?.(performance.now());
    expect(writes).toEqual([]);
    frames[1]?.(performance.now());
    expect(writes).toEqual([600]);
  });
});

function required<T>(value: T | null | undefined, name: string): T {
  if (value == null) throw new Error(`Expected ${name}.`);
  return value;
}

function pointerDown(): MouseEvent {
  return new MouseEvent('pointerdown', { bubbles: true, cancelable: true, composed: true });
}

function runFrames(frames: Map<number, FrameRequestCallback>): void {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(performance.now());
}

function createDeferredSseStream(): {
  close(): void;
  push(value: string): void;
  stream: ReadableStream<Uint8Array>;
} {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
    }
  });

  return {
    close: () => controller?.close(),
    push: (value) => controller?.enqueue(encoder.encode(value)),
    stream
  };
}

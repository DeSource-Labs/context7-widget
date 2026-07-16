import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineContext7Widget } from '../src';

describe('Context7WidgetElement', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('registers a global API and sends questions', async () => {
    defineContext7Widget();

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(stream(['data: {"type":"text-delta","delta":"Use the app router."}\n'])))
    );

    const questions: string[] = [];
    document.addEventListener('c7:question', (event) => {
      questions.push((event as CustomEvent).detail.question);
    });

    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/vercel/next.js');
    document.body.append(widget);

    await window.Context7Widget?.send('How do layouts work?');

    expect(questions).toEqual(['How do layouts work?']);
    expect(window.Context7Widget?.isOpen()).toBe(true);
    expect(widget.shadowRoot?.textContent).toContain('Use the app router.');
  });

  it('supports custom trigger clicks', () => {
    defineContext7Widget();

    const trigger = document.createElement('button');
    trigger.id = 'ask';
    document.body.append(trigger);

    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/vercel/next.js');
    widget.setAttribute('custom-trigger', '#ask');
    document.body.append(widget);

    trigger.click();

    expect(widget.hasAttribute('open')).toBe(true);
  });

  it('closes when clicking outside by default', () => {
    defineContext7Widget();

    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/vercel/next.js');
    document.body.append(widget);

    (widget as HTMLElement & { open: () => void }).open();
    document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, composed: true }));

    expect(widget.hasAttribute('open')).toBe(false);
  });

  it('supports center backdrop and preset attributes', () => {
    defineContext7Widget();

    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/vercel/next.js');
    widget.setAttribute('position', 'center');
    widget.setAttribute('preset', 'glass');
    document.body.append(widget);

    (widget as HTMLElement & { open: () => void }).open();

    expect(widget.getAttribute('position')).toBe('center');
    expect(widget.getAttribute('preset')).toBe('glass');
    expect(widget.hasAttribute('backdrop-active')).toBe(true);

    widget.shadowRoot?.querySelector<HTMLElement>('[data-c7-backdrop]')?.click();

    expect(widget.hasAttribute('open')).toBe(false);
  });

  it('lets presets own the accent color when no color is provided', () => {
    defineContext7Widget();

    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/vercel/next.js');
    widget.setAttribute('preset', 'neo');
    document.body.append(widget);

    expect(widget.style.getPropertyValue('--c7-accent')).toBe('');

    widget.setAttribute('color', '#123456');
    expect(widget.style.getPropertyValue('--c7-accent')).toBe('#123456');

    widget.removeAttribute('color');
    expect(widget.style.getPropertyValue('--c7-accent')).toBe('');
  });

  it('positions anchor widgets above the opener when there is enough room', () => {
    defineContext7Widget();
    setViewportHeight(900);

    const widget = document.createElement('context7-widget');
    widget.setAttribute('library', '/vercel/next.js');
    widget.setAttribute('position', 'anchor');
    document.body.append(widget);

    const panel = widget.shadowRoot?.querySelector<HTMLElement>('.c7-panel');
    const launcher = widget.shadowRoot?.querySelector<HTMLElement>('[data-c7-launcher]');
    setElementSize(panel, 400, 300);
    setElementRect(launcher, { bottom: 840, height: 56, left: 700, right: 840, top: 784, width: 140 });

    launcher?.click();

    expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('472px');
    expect(widget.style.getPropertyValue('--c7-anchor-origin')).toBe('bottom right');
  });

  it('positions anchor widgets below the opener when there is not enough room above', () => {
    defineContext7Widget();
    setViewportHeight(900);

    const trigger = document.createElement('button');
    trigger.id = 'ask';
    document.body.append(trigger);

    const widget = document.createElement('context7-widget');
    widget.setAttribute('custom-trigger', '#ask');
    widget.setAttribute('library', '/vercel/next.js');
    widget.setAttribute('position', 'anchor');
    document.body.append(widget);

    const panel = widget.shadowRoot?.querySelector<HTMLElement>('.c7-panel');
    setElementSize(panel, 400, 300);
    setElementRect(trigger, { bottom: 88, height: 48, left: 80, right: 220, top: 40, width: 140 });

    trigger.click();

    expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('100px');
    expect(widget.style.getPropertyValue('--c7-anchor-origin')).toBe('top right');
  });
});

function stream(values: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const value of values) {
        controller.enqueue(encoder.encode(value));
      }
      controller.close();
    }
  });
}

function setViewportHeight(height: number): void {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height
  });
}

function setElementSize(element: HTMLElement | null | undefined, width: number, height: number): void {
  if (!element) throw new Error('Expected element to exist.');
  Object.defineProperty(element, 'offsetHeight', {
    configurable: true,
    value: height
  });
  Object.defineProperty(element, 'offsetWidth', {
    configurable: true,
    value: width
  });
}

function setElementRect(
  element: HTMLElement | null | undefined,
  rect: Pick<DOMRect, 'bottom' | 'height' | 'left' | 'right' | 'top' | 'width'>
): void {
  if (!element) throw new Error('Expected element to exist.');
  element.getBoundingClientRect = () =>
    ({
      ...rect,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect
    }) as DOMRect;
}

import {
  EnvironmentInjector,
  PLATFORM_ID,
  createEnvironmentInjector,
  provideZonelessChangeDetection
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context7WidgetService } from '@src/context7-widget.service';
import {
  getAngularContext7Widget,
  registerAngularContext7Widget,
  unregisterAngularContext7Widget
} from '@src/internal/registry';
import type { Context7WidgetHandle, Context7WidgetStateListener } from '@src/types';

describe('Context7WidgetService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response('data: {"type":"text-delta","delta":"Answer"}\ndata: [DONE]\n', {
            headers: { 'content-type': 'text/event-stream' }
          })
      )
    );
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('mounts, updates, relocates, controls, and unmounts an owned widget', async () => {
    const service = TestBed.inject(Context7WidgetService);
    const firstTarget = document.createElement('div');
    const secondTarget = document.createDocumentFragment();
    document.body.append(firstTarget);

    const widget = service.mount({
      library: '/owner/repo',
      target: firstTarget,
      theme: 'dark',
      widgetId: 'docs'
    });
    await nextTask();
    expect(firstTarget.querySelector('context7-widget')).toBe(widget.element);
    expect(service.widgetId()).toBe('docs');
    expect(service.widget()).toBe(widget.element);
    expect(service.isOpen()).toBe(false);
    expect(service.isBusy()).toBe(false);

    service.open();
    await nextTask();
    expect(service.isOpen()).toBe(true);
    service.toggle();
    service.close();
    service.reset();
    expect(service.getMessages()).toEqual([]);

    const result = await service.send('Question');
    expect(result?.status).toBe('complete');
    expect(service.messages()).toHaveLength(2);
    expect((await service.retry())?.status).toBe('empty');
    service.cancel();

    const updated = service.mount({
      library: '/owner/repo',
      preset: 'terminal',
      target: secondTarget,
      widgetId: 'docs'
    });
    expect(updated).toBe(widget);
    expect(secondTarget.querySelector('context7-widget')).toBe(widget.element);
    expect(widget.element?.getAttribute('preset')).toBe('terminal');

    expect(service.mount({ library: '/owner/repo', target: secondTarget, widgetId: 'docs' })).toBe(widget);
    service.mount({ library: '/owner/repo', widgetId: 'docs' });
    expect(document.body.querySelector('context7-widget')).toBe(widget.element);

    service.unmount('docs');
    await nextTask();
    expect(service.get('docs')).toBeUndefined();
    expect(service.widget()).toBeNull();
    service.unmount('docs');
  });

  it('requires a library and keeps template-owned widgets intact', async () => {
    const service = TestBed.inject(Context7WidgetService);
    expect(() => service.mount({ library: '   ' })).toThrow('requires a library option');
    expect(() => service.mount({ library: '/owner/repo', target: '#missing-target' })).toThrow(
      'Context7 widget target was not found: #missing-target'
    );
    const selectorTarget = document.createElement('div');
    selectorTarget.id = 'service-target';
    document.body.append(selectorTarget);
    const selectorWidget = service.mount({
      library: '/owner/repo',
      target: '#service-target',
      widgetId: 'selector'
    });
    expect(selectorTarget.querySelector('context7-widget')).toBe(selectorWidget.element);
    service.unmount('selector');
    expect(service.get()).toBeUndefined();
    expect(service.getMessages()).toEqual([]);
    expect(await service.send('Question')).toBeUndefined();
    expect(await service.retry()).toBeUndefined();
    service.open();
    service.close();
    service.toggle();
    service.cancel();
    service.reset();
  });

  it('cleans up every owned widget when a cancellation callback unmounts another during teardown', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            options.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
              once: true
            });
          })
      )
    );
    const injector = createEnvironmentInjector([Context7WidgetService], TestBed.inject(EnvironmentInjector));

    try {
      const service = injector.get(Context7WidgetService);
      const ids = ['first', 'second', 'third'];
      const widgets = ids.map((widgetId) => service.mount({ library: '/owner/repo', widgetId }));
      const elements = widgets.map((widget) => widget.element);
      const first = widgets[0]!;
      const cancelled = vi.fn(() => service.unmount('second'));
      first.cancelled.subscribe(cancelled);
      const pending = first.send('Question');

      injector.destroy();

      await expect(pending).resolves.toMatchObject({ status: 'cancelled' });
      expect(cancelled).toHaveBeenCalledOnce();
      for (const id of ids) expect(getAngularContext7Widget(id)).toBeUndefined();
      for (const element of elements) expect(element?.isConnected).toBe(false);
    } finally {
      if (!injector.destroyed) injector.destroy();
    }
  });

  it('rejects programmatic mounting on the server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: 'server' }]
    });
    const service = TestBed.inject(Context7WidgetService);
    expect(() => service.mount({ library: '/owner/repo' })).toThrow('only available in a browser');
  });

  it('selects registered widgets and restores duplicate-id stacks', async () => {
    const service = TestBed.inject(Context7WidgetService);
    const first = createHandle('first');
    const second = createHandle('second');
    registerAngularContext7Widget('docs', first.handle);
    registerAngularContext7Widget('docs', first.handle);
    registerAngularContext7Widget('docs', second.handle);
    service.select(' docs ');
    await nextTask();

    expect(service.get()).toBe(second.handle);
    service.open();
    expect(second.open).toHaveBeenCalledOnce();

    unregisterAngularContext7Widget('docs', second.handle);
    await nextTask();
    expect(service.get()).toBe(first.handle);
    unregisterAngularContext7Widget('docs', first.handle);
    expect(getAngularContext7Widget('docs')).toBeUndefined();
  });

  it('uses the first widget as the default fallback', async () => {
    const service = TestBed.inject(Context7WidgetService);
    const widget = createHandle('fallback');
    registerAngularContext7Widget('other', widget.handle);
    service.select();
    await nextTask();
    expect(service.get()).toBe(widget.handle);
    unregisterAngularContext7Widget('other', widget.handle);
  });
});

function createHandle(name: string) {
  const element = document.createElement('div');
  element.dataset['name'] = name;
  const open = vi.fn();
  const listeners = new Set<Context7WidgetStateListener>();
  const handle: Context7WidgetHandle = {
    element,
    cancel: vi.fn(),
    close: vi.fn(),
    getMessages: () => [],
    isBusy: () => false,
    isOpen: () => false,
    open,
    reset: vi.fn(),
    retry: vi.fn(async () => undefined),
    send: vi.fn(async () => undefined),
    subscribe(listener) {
      listeners.add(listener);
      listener({ busy: false, messages: [], open: false });
      return () => listeners.delete(listener);
    },
    toggle: vi.fn()
  };
  return { handle, open };
}

async function nextTask(): Promise<void> {
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
}

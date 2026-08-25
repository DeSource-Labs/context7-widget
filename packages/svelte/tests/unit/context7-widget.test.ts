import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';
import Context7Widget from '../../src/Context7Widget.svelte';
import { createContext7Widget } from '../../src/controller.svelte.js';
import WidgetHarness from '../fixtures/WidgetHarness.svelte';

describe('@desource/context7-widget-svelte', () => {
  afterEach(() => {
    cleanup();
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('mounts native Svelte UI and forwards options and lifecycle callbacks', () => {
    const onReady = vi.fn();
    const result = render(Context7Widget, {
      library: '/desource-labs/context7-widget',
      closeOnOutsideClick: false,
      onReady,
      position: 'center',
      preset: 'terminal',
      rootProps: {
        class: 'host-widget',
        'data-host': 'svelte',
        style: '--host-token: ready'
      },
      theme: 'dark',
      title: 'Docs assistant'
    });
    flushSync();

    const widget = result.container.querySelector<HTMLElement>('.context7-widget');
    expect(widget?.tagName).toBe('DIV');
    expect(widget?.getAttribute('library')).toBe('/desource-labs/context7-widget');
    expect(widget?.getAttribute('close-on-outside-click')).toBe('false');
    expect(widget?.getAttribute('position')).toBe('center');
    expect(widget?.getAttribute('preset')).toBe('terminal');
    expect(widget?.getAttribute('theme')).toBe('dark');
    expect(widget?.classList.contains('host-widget')).toBe(true);
    expect(widget?.dataset.host).toBe('svelte');
    expect(widget?.style.getPropertyValue('--host-token')).toBe('ready');
    expect(widget?.querySelector('[part~="title"]')?.textContent).toBe('Docs assistant');
    expect(onReady).toHaveBeenCalledWith(expect.objectContaining({ widget, widgetId: 'default' }));
    expect(result.component.element()).toBe(widget);
  });

  it('supports managed and external triggers with synchronized accessibility', async () => {
    const external = document.createElement('button');
    external.id = 'external-docs';
    document.body.append(external);
    const managed = render(Context7Widget, {
      customTrigger: true,
      launcherLabel: 'Ask docs',
      library: '/owner/repo',
      position: 'anchor'
    });
    flushSync();

    const trigger = managed.getByRole('button', { name: 'Ask docs' });
    const widget = managed.container.querySelector<HTMLElement>('.context7-widget')!;
    expect(trigger.classList.contains('context7-widget-trigger')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(trigger);
    expect(widget.hasAttribute('open')).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    managed.unmount();
    const externalResult = render(Context7Widget, { customTrigger: 'external-docs', library: '/owner/repo' });
    flushSync();
    const externalWidget = externalResult.container.querySelector<HTMLElement>('.context7-widget')!;
    await fireEvent.click(external);
    expect(externalWidget.hasAttribute('open')).toBe(true);
    externalResult.unmount();
    expect(external.hasAttribute('aria-expanded')).toBe(false);

    const fallback = render(Context7Widget, { customTrigger: true, library: '/owner/repo' });
    expect(fallback.getByRole('button', { name: 'Ask Docs AI' }).textContent).toBe('Ask Docs AI');
  });

  it('exposes controls, bindable open state, state subscriptions, and safe callbacks', async () => {
    const reported: unknown[] = [];
    vi.stubGlobal('reportError', (error: unknown) => reported.push(error));
    const onOpen = vi.fn(() => {
      throw new Error('consumer failure');
    });
    const result = render(Context7Widget, { library: '/owner/repo', onOpen });
    flushSync();
    const listener = vi.fn();
    const unsubscribe = result.component.subscribe(listener);

    result.component.open();
    expect(result.component.isOpen()).toBe(true);
    expect(onOpen).toHaveBeenCalledOnce();
    expect(reported).toHaveLength(1);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ open: true }));
    result.component.toggle();
    expect(result.component.isOpen()).toBe(false);
    result.component.open();
    result.component.close();
    result.component.reset();
    result.component.cancel();
    expect(result.component.isBusy()).toBe(false);
    expect(result.component.getMessages()).toEqual([]);
    await expect(result.component.send('')).resolves.toMatchObject({ status: 'empty' });
    await expect(result.component.retry()).resolves.toMatchObject({ status: 'empty' });
    unsubscribe();
  });

  it('updates mounted attributes without replacing widget identity', async () => {
    const result = render(Context7Widget, { library: '/first', theme: 'light' });
    flushSync();
    const first = result.container.querySelector<HTMLElement>('.context7-widget')!;
    await result.rerender({ library: '/second', theme: 'dark', panelWidth: '500px' });
    flushSync();
    const second = result.container.querySelector<HTMLElement>('.context7-widget')!;
    expect(second).toBe(first);
    expect(second.getAttribute('library')).toBe('/second');
    expect(second.getAttribute('theme')).toBe('dark');
    expect(second.getAttribute('panel-width')).toBe('500px');
  });

  it('renders Svelte snippets and drives controlled open state in both directions', () => {
    const result = render(WidgetHarness);
    flushSync();
    const widget = result.container.querySelector<HTMLElement>('.context7-widget')!;
    const trigger = result.getByRole('button', { name: 'Ask Docs AI' });

    expect(widget.hasAttribute('open')).toBe(true);
    expect(result.getByTestId('custom-trigger').textContent).toBe('Ask Docs AI');
    expect(result.getByTestId('custom-trigger').getAttribute('data-trigger-id')).toBe(trigger.id);
    expect(result.getByTestId('child-content').textContent).toBe('Child content');

    result.component.setOpen(false);
    flushSync();
    expect(widget.hasAttribute('open')).toBe(false);
    result.component.setOpen(true);
    flushSync();
    expect(widget.hasAttribute('open')).toBe(true);

    const forcedClosed = render(Context7Widget, {
      defaultOpen: true,
      library: '/owner/repo',
      open: false
    });
    flushSync();
    expect(forcedClosed.container.querySelector('.context7-widget')?.hasAttribute('open')).toBe(false);
  });

  it('mounts, updates, controls, and removes an owned reactive controller widget', async () => {
    const target = document.createElement('section');
    document.body.append(target);
    const state = createContext7Widget({ library: '/owner/repo', target });
    const listener = vi.fn();
    const unsubscribe = state.subscribe(listener);

    const first = state.mount({ defaultOpen: true, theme: 'light' });
    expect(first.parentElement?.parentElement).toBe(target);
    expect(state.element).toBe(first);
    expect(state.isBusyState).toBe(false);
    expect(state.isOpenState).toBe(true);
    expect(state.messages).toEqual([]);
    state.update({ color: '#123456', theme: 'dark' });
    expect(first.getAttribute('color')).toBe('#123456');
    expect(first.getAttribute('theme')).toBe('dark');
    state.close();
    state.open();
    state.toggle();
    state.reset();
    state.cancel();
    expect(state.isBusy()).toBe(false);
    expect(state.getMessages()).toEqual([]);
    await expect(state.send('')).resolves.toMatchObject({ status: 'empty' });
    await expect(state.retry()).resolves.toMatchObject({ status: 'empty' });
    expect(state.mount()).toBe(first);
    expect(listener).toHaveBeenCalled();

    unsubscribe();
    state.unmount();
    expect(state.element).toBeNull();
    expect(first.isConnected).toBe(false);
  });

  it('uses body by default, moves an owned widget, and handles an absent registry target', async () => {
    const owned = createContext7Widget({ library: '/owner/repo', widgetId: 'owned-only' });
    const widget = owned.mount();
    expect(widget.parentElement?.parentElement).toBe(document.body);
    owned.update({ color: '#abcdef' });
    expect(widget.getAttribute('color')).toBe('#abcdef');

    const nextTarget = document.createElement('aside');
    document.body.append(nextTarget);
    owned.update({ target: nextTarget });
    expect(widget.parentElement?.parentElement).toBe(nextTarget);
    owned.update({ target: nextTarget });
    owned.unmount();

    const missing = createContext7Widget({ widgetId: 'missing-widget' });
    const listener = vi.fn();
    missing.subscribe(listener);
    missing.update({ theme: 'dark' });
    missing.open();
    missing.close();
    missing.toggle();
    missing.cancel();
    missing.reset();
    expect(missing.isOpen()).toBe(false);
    expect(missing.isBusy()).toBe(false);
    expect(missing.getMessages()).toEqual([]);
    await expect(missing.send('Question')).resolves.toBeUndefined();
    await expect(missing.retry()).resolves.toBeUndefined();
    missing.unmount();
    missing.unmount();
    expect(listener).toHaveBeenCalled();
  });

  it('rejects programmatic mounting without a library and can control a registered component', async () => {
    const state = createContext7Widget();
    expect(() => state.mount()).toThrow('createContext7Widget mount requires a library option.');

    const target = document.createElement('div');
    document.body.append(target);
    const app = mount(Context7Widget, { props: { library: '/owner/repo', widgetId: 'shared' }, target });
    flushSync();
    const linked = createContext7Widget({ widgetId: 'shared' });
    linked.open();
    expect(linked.isOpen()).toBe(true);
    linked.close();
    linked.update({ widgetId: 'shared' });
    expect(linked.isOpen()).toBe(false);
    await unmount(app);
    linked.open();
    expect(linked.element).toBeNull();
  });

  it('keeps exported controls safe after component unmount', async () => {
    const result = render(Context7Widget, { library: '/owner/repo' });
    const component = result.component;
    result.unmount();

    component.open();
    component.close();
    component.toggle();
    component.cancel();
    component.reset();
    expect(component.element()).toBeNull();
    expect(component.isOpen()).toBe(false);
    expect(component.isBusy()).toBe(false);
    expect(component.getMessages()).toEqual([]);
    await expect(component.send('Question')).resolves.toBeUndefined();
    await expect(component.retry()).resolves.toBeUndefined();
  });
});

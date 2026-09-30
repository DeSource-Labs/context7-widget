import { act, StrictMode, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Context7Widget } from '@src/index';

const types = ['keydown', 'keyup', 'keypress'] as const;
const roots: Root[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) act(() => root.unmount());
  document.body.replaceChildren();
});

function mount(element: React.ReactNode) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  act(() => root.render(element));
  return { container, root };
}

function key(type: string, keyValue = '/', init: KeyboardEventInit = {}) {
  return new KeyboardEvent(type, { bubbles: true, cancelable: true, charCode: 47, key: keyValue, ...init });
}

describe('React native keyboard boundary', () => {
  it('blocks native and React ancestor listeners while preserving root callbacks and consumer children', async () => {
    const onRootKey = vi.fn();
    const onReactParent = vi.fn();
    const onNativeParent = vi.fn();
    const { container } = mount(
      <div data-parent onKeyDown={onReactParent} onKeyUp={onReactParent} onKeyPress={onReactParent}>
        <Context7Widget
          defaultOpen
          library="/owner/repo"
          rootProps={{ onKeyDown: onRootKey, onKeyUp: onRootKey, onKeyPress: onRootKey }}
        >
          <button data-child>Host content</button>
        </Context7Widget>
      </div>
    );
    const parent = container.querySelector<HTMLElement>('[data-parent]')!;
    for (const type of types) parent.addEventListener(type, onNativeParent);

    for (const type of types) {
      await act(async () => {
        container.querySelector('textarea')!.dispatchEvent(key(type));
      });
    }
    expect(onRootKey).toHaveBeenCalledTimes(3);
    expect(onNativeParent).not.toHaveBeenCalled();
    expect(onReactParent).not.toHaveBeenCalled();

    for (const selector of ['[data-child]', '.c7-launcher']) {
      for (const type of types) {
        await act(async () => {
          container.querySelector(selector)!.dispatchEvent(key(type));
        });
      }
    }
    expect(onRootKey).toHaveBeenCalledTimes(9);
    expect(onNativeParent).toHaveBeenCalledTimes(6);
    expect(onReactParent).toHaveBeenCalledTimes(6);
  });

  it('closes on Escape without first firing a native parent shortcut', async () => {
    const onNativeParent = vi.fn();
    const onClose = vi.fn();
    const onKeyDown = vi.fn();
    const { container } = mount(
      <div data-parent>
        <Context7Widget defaultOpen library="/owner/repo" onClose={onClose} rootProps={{ onKeyDown }} />
      </div>
    );
    container.querySelector('[data-parent]')!.addEventListener('keydown', onNativeParent);
    const event = key('keydown', 'Escape');
    await act(async () => {
      container.querySelector('textarea')!.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(onNativeParent).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalledOnce();
    expect(container.querySelector('.context7-widget')!.hasAttribute('open')).toBe(false);
  });

  it('preserves normalized React event fields and cancellation after native target handlers run', async () => {
    const order: string[] = [];
    let captured: ReactKeyboardEvent<HTMLDivElement> | undefined;
    let delivered: ReactKeyboardEvent<HTMLDivElement> | undefined;
    let widget: HTMLElement;
    let input: HTMLTextAreaElement;
    const native = key('keydown', 'Del', { ctrlKey: true });
    const { container } = mount(
      <Context7Widget
        defaultOpen
        library="/owner/repo"
        rootProps={{
          onKeyDownCapture(event) {
            order.push('capture');
            captured = event;
            expect(event.defaultPrevented).toBe(false);
          },
          onKeyDown(event) {
            order.push('bubble');
            delivered = event;
            expect(event).not.toBe(captured);
            expect(event.nativeEvent).toBe(native);
            expect(event.target).toBe(input);
            expect(event.currentTarget).toBe(widget);
            expect(event.eventPhase).toBe(Event.BUBBLING_PHASE);
            expect(event.key).toBe('Delete');
            expect(event.getModifierState('Control')).toBe(true);
            expect(event.defaultPrevented).toBe(true);
            expect(event.isDefaultPrevented()).toBe(true);
            expect(event.isPropagationStopped()).toBe(true);
            event.persist();
          }
        }}
      />
    );
    widget = container.querySelector<HTMLElement>('.context7-widget')!;
    input = container.querySelector('textarea')!;
    input.addEventListener('keydown', (event) => {
      order.push('target');
      event.preventDefault();
    });
    await act(async () => {
      input.dispatchEvent(native);
    });
    expect(order).toEqual(['capture', 'target', 'bubble']);
    expect(delivered?.currentTarget).toBeNull();
    expect(captured?.currentTarget).toBeNull();
    expect(captured?.isPropagationStopped()).toBe(false);
    expect(captured?.defaultPrevented).toBe(false);
  });

  it.each(['preventDefault', 'stopPropagation'] as const)('honors consumer capture %s', async (method) => {
    const onRootKey = vi.fn();
    const onTargetKey = vi.fn();
    const { container } = mount(
      <Context7Widget
        defaultOpen
        library="/owner/repo"
        rootProps={{
          onKeyDown: onRootKey,
          onKeyDownCapture: (event) => event[method]()
        }}
      />
    );
    const input = container.querySelector('textarea')!;
    input.addEventListener('keydown', onTargetKey);
    const native = key('keydown');
    await act(async () => {
      input.dispatchEvent(native);
    });
    expect(onRootKey).toHaveBeenCalledTimes(method === 'preventDefault' ? 1 : 0);
    expect(onTargetKey).toHaveBeenCalledTimes(method === 'preventDefault' ? 1 : 0);
    expect(native.defaultPrevented).toBe(method === 'preventDefault');
  });

  it('lets a consumer bubble callback cancel the native default', async () => {
    const { container } = mount(
      <Context7Widget
        defaultOpen
        library="/owner/repo"
        rootProps={{
          onKeyUp(event) {
            event.preventDefault();
            expect(event.isDefaultPrevented()).toBe(true);
          }
        }}
      />
    );
    const native = key('keyup');
    await act(async () => {
      container.querySelector('textarea')!.dispatchEvent(native);
    });
    expect(native.defaultPrevented).toBe(true);
  });

  it('isolates non-printable keypress events without inventing a React callback', async () => {
    const onRootKey = vi.fn();
    const onNativeParent = vi.fn();
    const { container } = mount(
      <div data-parent>
        <Context7Widget defaultOpen library="/owner/repo" rootProps={{ onKeyPress: onRootKey }} />
      </div>
    );
    container.querySelector('[data-parent]')!.addEventListener('keypress', onNativeParent);
    await act(async () => {
      container.querySelector('textarea')!.dispatchEvent(key('keypress', 'Shift', { charCode: 0 }));
    });
    expect(onRootKey).not.toHaveBeenCalled();
    expect(onNativeParent).not.toHaveBeenCalled();
  });

  it('uses committed callbacks once in StrictMode and removes native listeners on unmount', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const renderWidget = (handler: typeof first) => (
      <StrictMode>
        <Context7Widget
          defaultOpen
          library="/owner/repo"
          rootProps={{
            onKeyDown: handler,
            onKeyUp: handler,
            onKeyPress: handler
          }}
        />
      </StrictMode>
    );
    const { container, root } = mount(renderWidget(first));
    const widget = container.querySelector<HTMLElement>('.context7-widget')!;
    const input = container.querySelector('textarea')!;
    await act(async () => {
      input.dispatchEvent(key('keydown'));
    });
    expect(first).toHaveBeenCalledOnce();
    act(() => root.render(renderWidget(second)));
    for (const type of types)
      await act(async () => {
        input.dispatchEvent(key(type));
      });
    expect(first).toHaveBeenCalledOnce();
    expect(second).toHaveBeenCalledTimes(3);

    act(() => root.unmount());
    roots.splice(roots.indexOf(root), 1);
    container.append(widget);
    const onNativeParent = vi.fn();
    for (const type of types) container.addEventListener(type, onNativeParent);
    for (const type of types) input.dispatchEvent(key(type));
    expect(onNativeParent).toHaveBeenCalledTimes(3);
    expect(second).toHaveBeenCalledTimes(3);
  });
});

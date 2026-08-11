import { createSseStream } from '@common/tests/unit/stream';
import { setElementRect, setElementSize } from '@common/tests/unit/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Context7Widget, useContext7Widget, type Context7WidgetHandle } from '../../src';

const roots: Root[] = [];

describe('@desource/context7-widget-react', () => {
  afterEach(() => {
    for (const root of roots.splice(0).reverse()) act(() => root.unmount());
    document.body.replaceChildren();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('supports controlled open state and typed lifecycle callbacks', async () => {
    const updates = vi.fn();
    const opened = vi.fn();
    const ready = vi.fn();

    function ControlledWidget() {
      const [open, setOpen] = useState(false);
      return (
        <Context7Widget
          library="/desource-labs/context7-widget"
          open={open}
          onOpen={opened}
          onOpenChange={(value) => {
            updates(value);
            setOpen(value);
          }}
          onReady={ready}
        />
      );
    }

    const container = mount(<ControlledWidget />);
    await act(async () => container.querySelector<HTMLButtonElement>('.c7-launcher')?.click());
    expect(updates).toHaveBeenCalledWith(true);
    expect(container.querySelector('.context7-widget')?.hasAttribute('open')).toBe(true);
    expect(opened).toHaveBeenCalledOnce();
    expect(ready).toHaveBeenCalledOnce();

    await act(async () => container.querySelector<HTMLButtonElement>('.c7-close')?.click());
    expect(updates).toHaveBeenLastCalledWith(false);
    expect(container.querySelector('.context7-widget')?.hasAttribute('open')).toBe(false);
  });

  it('reflects complete configuration, localized text, root props, and managed trigger defaults', async () => {
    const onKeyDown = vi.fn();
    const container = mount(
      <Context7Widget
        backdrop
        closeOnOutsideClick={false}
        color="#123456"
        customTrigger
        defaultOpen
        labels={{ close: 'Dismiss docs', send: 'Ask now' }}
        launcherLabel="Ask React docs"
        library=""
        linkBaseUrl="https://docs.example.com/"
        panelHeight="520px"
        panelWidth="480px"
        rootProps={{ className: 'product-widget', onKeyDown }}
      >
        <span data-testid="child">Child</span>
      </Context7Widget>
    );
    await flush();

    const widget = container.querySelector<HTMLElement>('.context7-widget')!;
    const trigger = container.querySelector<HTMLButtonElement>('.context7-widget-trigger')!;
    expect(widget.classList.contains('product-widget')).toBe(true);
    expect(widget.hasAttribute('open')).toBe(true);
    expect(widget.getAttribute('backdrop-active')).toBe('');
    expect(widget.getAttribute('close-on-outside-click')).toBe('false');
    expect(widget.getAttribute('panel-height')).toBe('520px');
    expect(widget.getAttribute('panel-width')).toBe('480px');
    expect(widget.style.getPropertyValue('--c7-accent')).toBe('#123456');
    expect(trigger.textContent).toContain('Ask React docs');
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
    expect(container.querySelector('.c7-close')?.getAttribute('aria-label')).toBe('Dismiss docs');
    expect(container.querySelector('.c7-send')?.textContent).toBe('Ask now');
    expect(container.textContent).toContain('this library');

    await act(async () => container.querySelector<HTMLElement>('.c7-backdrop')?.click());
    expect(widget.hasAttribute('open')).toBe(true);
    await act(async () => widget.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Control' })));
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it('exposes native controller events, managed triggers, and tool results', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{"query":"React"}}\n',
              'data: {"type":"tool-output-available","toolCallId":"tool-1","output":{"matches":1}}\n',
              'data: {"type":"text-delta","delta":"React answer"}\n',
              'data: [DONE]\n'
            ])
          )
      )
    );
    const question = vi.fn();
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    const container = mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
        customTrigger
        library="/desource-labs/context7-widget"
        onQuestion={question}
        trigger={({ label }) => <span data-testid="managed-trigger">{label}</span>}
      />
    );

    expect(container.querySelector('[data-testid="managed-trigger"]')?.textContent).toBe('Ask Docs AI');
    const controller = required(controllerRef.current, 'Expected a React widget controller.');
    await controller.send('How does React work?');
    await flush();
    expect(container.textContent).toContain('React answer');
    expect(container.textContent).toContain('Searching: React');
    expect(question).toHaveBeenCalledWith(expect.objectContaining({ question: 'How does React work?' }));
    expect(controller.getMessages().map((message) => message.content)).toEqual([
      'How does React work?',
      'React answer'
    ]);

    container.querySelector<HTMLButtonElement>('.c7-tool-toggle')?.click();
    await flush();
    expect(container.querySelector('.c7-tool-content')?.textContent).toContain('"matches": 1');
  });

  it('submits the native composer and closes through the backdrop', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Submitted"}\n'])))
    );
    const container = mount(<Context7Widget library="/desource-labs/context7-widget" position="center" />);
    const input = container.querySelector<HTMLTextAreaElement>('.c7-input')!;
    input.value = 'Submit with the form';
    await act(async () => input.dispatchEvent(new Event('input', { bubbles: true })));
    await act(async () => container.querySelector<HTMLButtonElement>('.c7-send')?.click());
    await vi.waitFor(() => expect(container.textContent).toContain('Submitted'));

    expect(container.querySelector('.context7-widget')?.hasAttribute('open')).toBe(true);
    await act(async () => container.querySelector<HTMLElement>('.c7-backdrop')?.click());
    expect(container.querySelector('.context7-widget')?.hasAttribute('open')).toBe(false);
  });

  it('programmatically mounts and controls a widget through the hook', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Hook answer"}\n'])))
    );
    const controlsRef: { current: ReturnType<typeof useContext7Widget> | null } = { current: null };

    function Harness() {
      controlsRef.current = useContext7Widget({ library: '/desource-labs/context7-widget' });
      return null;
    }

    mount(<Harness />);
    await flush();
    const controls = required(controlsRef.current, 'Expected hook controls.');
    const widget = controls.mount();
    expect(widget.classList.contains('context7-widget')).toBe(true);
    controls.open();
    expect(controls.getMessages()).toEqual([]);
    await controls.send('Use the hook');
    await flush();
    expect(document.body.textContent).toContain('Hook answer');
    expect(controls.getMessages().map((message) => message.content)).toEqual(['Use the hook', 'Hook answer']);

    controls.unmount();
    expect(document.querySelector('.context7-widget-programmatic-root')).toBeNull();
  });

  it('binds a ref-based external trigger and restores authored aria attributes', async () => {
    function ExternalTriggerWidget() {
      const trigger = useRef<HTMLButtonElement>(null);
      return (
        <>
          <button ref={trigger} aria-expanded={false} aria-haspopup="menu">
            External
          </button>
          <Context7Widget customTrigger={trigger} library="/desource-labs/context7-widget" />
        </>
      );
    }

    const container = mount(<ExternalTriggerWidget />);
    await flush();
    const trigger = container.querySelector<HTMLButtonElement>('button');
    expect(trigger?.getAttribute('aria-haspopup')).toBe('dialog');
    await act(async () => trigger?.click());
    expect(container.querySelector('.context7-widget')?.hasAttribute('open')).toBe(true);
  });

  it('binds late selector triggers and ignores inside pointer events', async () => {
    const container = mount(
      <Context7Widget customTrigger="late-react-trigger" library="/desource-labs/context7-widget" />
    );
    const widget = container.querySelector<HTMLElement>('.context7-widget')!;
    expect(container.querySelector('.c7-launcher')).not.toBeNull();

    const trigger = document.createElement('button');
    trigger.id = 'late-react-trigger';
    await act(async () => {
      document.body.append(trigger);
      await new Promise<void>((resolve) => queueMicrotask(resolve));
    });
    await vi.waitFor(() => expect(widget.hasAttribute('custom-trigger-active')).toBe(true));
    expect(container.querySelector('.c7-launcher')).toBeNull();

    await act(async () => trigger.click());
    expect(widget.hasAttribute('open')).toBe(true);
    await act(async () => {
      trigger.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
      widget.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    });
    expect(widget.hasAttribute('open')).toBe(true);

    await act(async () =>
      document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }))
    );
    expect(widget.hasAttribute('open')).toBe(false);
  });

  it('tracks anchored layout and accessible keyboard dismissal', async () => {
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
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    const container = mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
        library="/desource-labs/context7-widget"
        position="anchor"
      />
    );
    const panel = container.querySelector<HTMLElement>('.c7-panel');
    const launcher = container.querySelector<HTMLElement>('.c7-launcher');
    setElementSize(panel, 400, 300);
    setElementRect(launcher, { bottom: 460, height: 40, left: 450, right: 550, top: 420, width: 100 });

    const controller = required(controllerRef.current, 'Expected a React widget controller.');
    await act(async () => controller.open());
    const widget = container.querySelector<HTMLElement>('.context7-widget');
    expect(widget?.style.getPropertyValue('--c7-anchor-top')).toBe('108px');
    expect(observe).toHaveBeenCalledWith(launcher);
    expect(observe).toHaveBeenCalledWith(panel);

    setElementRect(launcher, { bottom: 160, height: 40, left: 450, right: 550, top: 120, width: 100 });
    viewport.dispatchEvent(new Event('scroll'));
    resize?.([], {} as ResizeObserver);
    window.dispatchEvent(new Event('resize'));
    await vi.waitFor(() => expect(widget?.style.getPropertyValue('--c7-anchor-top')).toBe('172px'));

    await act(async () =>
      widget?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' }))
    );
    expect(controller.isOpen()).toBe(false);
    expect(disconnect).toHaveBeenCalled();
  });

  it('updates owned hook widgets and exposes every controller operation', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('Temporary outage'))
      .mockResolvedValueOnce(new Response(createSseStream(['data: {"type":"text-delta","delta":"Retried answer"}\n'])));
    vi.stubGlobal('fetch', fetchMock);
    const controlsRef: { current: ReturnType<typeof useContext7Widget> | null } = { current: null };
    let setPreset: ((value: 'default' | 'glass') => void) | null = null;

    function Harness() {
      const [preset, updatePreset] = useState<'default' | 'glass'>('default');
      setPreset = updatePreset;
      controlsRef.current = useContext7Widget({
        library: '/desource-labs/context7-widget',
        preset
      });
      return null;
    }

    mount(<Harness />);
    const controls = required(controlsRef.current, 'Expected hook controls.');
    await act(async () => {
      controls.mount();
      controls.open();
      controls.toggle();
      controls.close();
      controls.reset();
      controls.cancel();
    });
    await act(async () => {
      await controls.send('Retry through the hook');
      await controls.retry();
    });
    await flush();
    expect(document.body.textContent).toContain('Retried answer');

    await act(async () => setPreset?.('glass'));
    expect(controlsRef.current?.widget?.getAttribute('preset')).toBe('glass');
    await act(async () => controls.unmount());
  });

  it('relocates auto-mounted hook widgets and cleans their nested React root with the owner', async () => {
    const firstTarget = document.createElement('div');
    const secondTarget = document.createElement('div');
    document.body.append(firstTarget, secondTarget);
    let setTarget: ((target: HTMLDivElement) => void) | null = null;
    let setVisible: ((visible: boolean) => void) | null = null;

    function OwnedWidget({ target }: { target: HTMLElement }) {
      useContext7Widget({
        autoMount: true,
        library: '/desource-labs/context7-widget',
        target,
        widgetId: 'auto-react-docs'
      });
      return null;
    }

    function Owner() {
      const [target, updateTarget] = useState(firstTarget);
      const [visible, updateVisible] = useState(true);
      setTarget = updateTarget;
      setVisible = updateVisible;
      return visible ? <OwnedWidget target={target} /> : null;
    }

    mount(<Owner />);
    await flush();
    expect(firstTarget.querySelector('.context7-widget')).not.toBeNull();

    await act(async () => setTarget?.(secondTarget));
    expect(firstTarget.querySelector('.context7-widget')).toBeNull();
    expect(secondTarget.querySelector('.context7-widget')).not.toBeNull();

    await act(async () => setVisible?.(false));
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(secondTarget.querySelector('.context7-widget-programmatic-root')).toBeNull();
  });

  it('returns safe empty state when a hook has no registered or owned widget', async () => {
    const controlsRef: { current: ReturnType<typeof useContext7Widget> | null } = { current: null };
    function Harness() {
      controlsRef.current = useContext7Widget({ widgetId: 'missing' });
      return null;
    }
    mount(<Harness />);
    const controls = required(controlsRef.current, 'Expected hook controls.');
    controls.cancel();
    controls.close();
    controls.open();
    controls.reset();
    controls.toggle();
    expect(controls.getMessages()).toEqual([]);
    await expect(controls.send('No widget')).resolves.toBeUndefined();
    await expect(controls.retry()).resolves.toBeUndefined();
    controls.unmount();
    expect(() => controls.mount()).toThrow('useContext7Widget mount requires a library option.');
  });
});

function mount(node: React.ReactNode): HTMLElement {
  const container = document.createElement('div');
  const root = createRoot(container);
  roots.push(root);
  document.body.append(container);
  act(() => root.render(node));
  return container;
}

async function flush(): Promise<void> {
  await act(async () => {
    await new Promise<void>((resolve) => queueMicrotask(resolve));
  });
}

function required<Value>(value: Value | null, message: string): Value {
  if (!value) throw new Error(message);
  return value;
}

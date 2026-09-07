import { createSseStream } from '@common/tests/unit/stream';
import { setElementRect, setElementSize } from '@common/tests/unit/dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Context7Widget, useContext7Widget, type Context7WidgetHandle } from '../../src';

const { engineSubscribeOptionsSpy, renderMarkdownSpy } = vi.hoisted(() => ({
  engineSubscribeOptionsSpy: vi.fn(),
  renderMarkdownSpy: vi.fn()
}));

vi.mock('@desource/context7-widget/kit', async (importOriginal) => {
  const original = await importOriginal<typeof import('@desource/context7-widget/kit')>();
  return {
    ...original,
    createContext7ConversationEngine(...args: Parameters<typeof original.createContext7ConversationEngine>) {
      const engine = original.createContext7ConversationEngine(...args);
      const subscribe = engine.subscribe.bind(engine);
      engine.subscribe = (listener, options) => {
        engineSubscribeOptionsSpy(options);
        return subscribe(listener, options);
      };
      return engine;
    },
    renderMarkdown(...args: Parameters<typeof original.renderMarkdown>) {
      renderMarkdownSpy(...args);
      return original.renderMarkdown(...args);
    }
  };
});

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
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    const container = mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
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
    expect(trigger.getAttribute('aria-label')).toBe('Ask React docs');
    expect(container.querySelector('[data-testid="child"]')).not.toBeNull();
    expect(container.querySelector('.c7-close')?.getAttribute('aria-label')).toBe('Dismiss docs');
    expect(container.querySelector('.c7-send')?.textContent).toBe('Ask now');
    expect(container.textContent).toContain('this library');

    await act(async () => controllerRef.current?.reset());
    expect(container.textContent).toContain('this library');

    await act(async () => container.querySelector<HTMLElement>('.c7-backdrop')?.click());
    expect(widget.hasAttribute('open')).toBe(true);
    await act(async () => widget.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Control' })));
    expect(onKeyDown).toHaveBeenCalledOnce();
  });

  it('memoizes completed Markdown until a rendering input changes', async () => {
    let setCopyCode: ((value: string) => void) | null = null;
    let setLibrary: ((value: string) => void) | null = null;
    let setLinkBaseUrl: ((value: string) => void) | null = null;
    let setTitle: ((value: string) => void) | null = null;

    function MarkdownHarness() {
      const [copyCode, updateCopyCode] = useState('Copy code');
      const [library, updateLibrary] = useState('/owner/first');
      const [linkBaseUrl, updateLinkBaseUrl] = useState('');
      const [title, updateTitle] = useState('First title');
      setCopyCode = updateCopyCode;
      setLibrary = updateLibrary;
      setLinkBaseUrl = updateLinkBaseUrl;
      setTitle = updateTitle;
      return (
        <Context7Widget
          initialMessage="Read [the guide](guide)"
          labels={{ copyCode }}
          library={library}
          linkBaseUrl={linkBaseUrl}
          title={title}
        />
      );
    }

    const container = mount(<MarkdownHarness />);
    await flush();
    expect(renderMarkdownSpy).toHaveBeenCalled();

    renderMarkdownSpy.mockClear();
    const input = container.querySelector<HTMLTextAreaElement>('.c7-input')!;
    input.value = 'Unrelated local state';
    await act(async () => input.dispatchEvent(new Event('input', { bubbles: true })));
    await act(async () => setTitle?.('Second title'));
    expect(renderMarkdownSpy).not.toHaveBeenCalled();

    await act(async () => setLinkBaseUrl?.('https://docs.example.com/reference/'));
    expect(renderMarkdownSpy).toHaveBeenCalledWith(
      'Read [the guide](guide)',
      expect.objectContaining({ baseUrl: 'https://docs.example.com/reference/' })
    );

    renderMarkdownSpy.mockClear();
    await act(async () => setCopyCode?.('Duplicate code'));
    expect(renderMarkdownSpy).toHaveBeenCalledWith(
      'Read [the guide](guide)',
      expect.objectContaining({ copyCodeLabel: 'Duplicate code' })
    );

    renderMarkdownSpy.mockClear();
    await act(async () => setLibrary?.('/owner/second'));
    expect(renderMarkdownSpy).toHaveBeenCalled();
  });

  it('ignores non-element events delegated through the Markdown copy surface', async () => {
    const container = mount(<Context7Widget library="/owner/repo" />);
    const messages = container.querySelector<HTMLElement>('.c7-messages')!;
    const text = document.createTextNode('Unrelated message text');
    const detachedCopyAction = document.createElement('button');
    detachedCopyAction.setAttribute('data-c7-copy-code', '');
    messages.append(text, detachedCopyAction);

    await act(async () =>
      text.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, composed: true }))
    );
    await act(async () => detachedCopyAction.click());
    expect(messages.textContent).toContain('Unrelated message text');
    expect(detachedCopyAction.hasAttribute('data-c7-copied')).toBe(false);
  });

  it('observes only valid configured external triggers', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    const construct = vi.fn();
    vi.stubGlobal(
      'MutationObserver',
      class {
        constructor(callback: MutationCallback) {
          construct(callback);
        }
        observe = observe;
        disconnect = disconnect;
      }
    );

    mount(<Context7Widget library="/owner/default" />);
    mount(<Context7Widget customTrigger library="/owner/managed" />);
    mount(<Context7Widget customTrigger="[" library="/owner/invalid" />);
    await flush();
    expect(construct).not.toHaveBeenCalled();

    mount(<Context7Widget customTrigger="#late-valid-trigger" library="/owner/external" />);
    await flush();
    expect(construct).toHaveBeenCalledOnce();
    expect(observe).toHaveBeenCalledWith(document.documentElement, { childList: true, subtree: true });

    const directTrigger = document.createElement('button');
    document.body.append(directTrigger);
    mount(<Context7Widget customTrigger={directTrigger} library="/owner/direct" />);
    await flush();
    expect(construct).toHaveBeenCalledTimes(2);
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
    await act(async () => controller.send('How does React work?'));
    await flush();
    expect(container.textContent).toContain('React answer');
    expect(container.textContent).toContain('Searching: React');
    expect(question).toHaveBeenCalledWith(expect.objectContaining({ question: 'How does React work?' }));
    expect(controller.getMessages().map((message) => message.content)).toEqual([
      'How does React work?',
      'React answer'
    ]);

    await act(async () => container.querySelector<HTMLButtonElement>('.c7-tool-toggle')?.click());
    await flush();
    expect(container.querySelector('.c7-tool-content')?.textContent).toContain('"matches": 1');
  });

  it('does not publish unchanged committed state or reparse Markdown for stream chunks', async () => {
    const deferred = createDeferredSseStream();
    engineSubscribeOptionsSpy.mockClear();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(deferred.stream))
    );
    const answer = vi.fn();
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
        library="/desource-labs/context7-widget"
        onAnswer={answer}
      />
    );
    await flush();
    expect(engineSubscribeOptionsSpy).toHaveBeenCalledWith({ includeTransient: false });
    renderMarkdownSpy.mockClear();

    const controller = required(controllerRef.current, 'Expected a React widget controller.');
    const stateListener = vi.fn();
    const unsubscribe = controller.subscribe(stateListener);
    let pending!: Promise<unknown>;
    await act(async () => {
      pending = controller.send('Stream efficiently');
      await Promise.resolve();
    });
    const meaningfulCalls = stateListener.mock.calls.length;

    await act(async () => {
      deferred.push('data: {"type":"text-delta","delta":"First"}\n');
      await vi.waitFor(() => expect(answer).toHaveBeenCalledTimes(1));
    });
    expect(stateListener).toHaveBeenCalledTimes(meaningfulCalls);
    expect(renderMarkdownSpy).not.toHaveBeenCalled();

    await act(async () => {
      deferred.push('data: {"type":"text-delta","delta":" second"}\n');
      await vi.waitFor(() => expect(answer).toHaveBeenCalledTimes(2));
    });
    expect(stateListener).toHaveBeenCalledTimes(meaningfulCalls);
    expect(renderMarkdownSpy).not.toHaveBeenCalled();

    await act(async () => {
      deferred.close();
      await pending;
    });
    expect(renderMarkdownSpy).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('isolates throwing state subscribers so later subscribers still run', async () => {
    const failure = new Error('Consumer state listener failed');
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
        library="/owner/repo"
      />
    );
    const controller = required(controllerRef.current, 'Expected a React widget controller.');
    const unsubscribeThrowing = controller.subscribe(() => {
      throw failure;
    });
    const healthyListener = vi.fn();
    const unsubscribeHealthy = controller.subscribe(healthyListener);
    reportError.mockClear();
    healthyListener.mockClear();

    await act(async () => controller.open());

    expect(reportError).toHaveBeenCalledWith(failure);
    expect(healthyListener).toHaveBeenCalledWith(expect.objectContaining({ open: true }));
    unsubscribeThrowing();
    unsubscribeHealthy();
  });

  it('submits the native composer and closes through the backdrop', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Submitted"}\n'])))
    );
    const container = mount(<Context7Widget library="/desource-labs/context7-widget" position="center" />);
    const input = container.querySelector<HTMLTextAreaElement>('.c7-input')!;
    Object.defineProperty(input, 'scrollHeight', { configurable: true, value: 120 });
    await act(async () => {
      setNativeTextareaValue(input, 'Submit with the form');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(input.style.height).toBe('84px');
    await act(async () => container.querySelector<HTMLButtonElement>('.c7-send')?.click());
    await vi.waitFor(() => expect(container.textContent).toContain('Submitted'));

    expect(container.querySelector('.context7-widget')?.hasAttribute('open')).toBe(true);
    await act(async () => container.querySelector<HTMLElement>('.c7-backdrop')?.click());
    expect(container.querySelector('.context7-widget')?.hasAttribute('open')).toBe(false);
  });

  it('handles composition, keyboard submission, cancellation, and modal focus wrapping', async () => {
    const deferred = createDeferredSseStream();
    const fetchMock = vi.fn(async () => new Response(deferred.stream));
    vi.stubGlobal('fetch', fetchMock);
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    const container = mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
        defaultOpen
        library="/owner/repo"
        position="center"
      />
    );
    const controller = required(controllerRef.current, 'Expected a React widget controller.');
    const input = container.querySelector<HTMLTextAreaElement>('.c7-input')!;
    await act(async () => {
      setNativeTextareaValue(input, 'Keep the composer accessible');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, isComposing: true, key: 'Enter' })
      )
    );
    await act(async () =>
      input.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter', shiftKey: true })
      )
    );
    expect(fetchMock).not.toHaveBeenCalled();

    const submitEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' });
    await act(async () => {
      input.dispatchEvent(submitEvent);
      await Promise.resolve();
    });
    expect(submitEvent.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(controller.isBusy()).toBe(true));

    await act(async () => container.querySelector<HTMLButtonElement>('.c7-send')?.click());
    await vi.waitFor(() => expect(controller.isBusy()).toBe(false));
    await act(async () => {
      for (const callback of frames.splice(0)) callback(performance.now());
    });

    const panel = container.querySelector<HTMLElement>('.c7-panel')!;
    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    for (const element of focusable) {
      Object.defineProperty(element, 'offsetParent', { configurable: true, value: panel });
    }
    const first = required(focusable[0] ?? null, 'Expected a first focusable panel control.');
    const last = required(focusable[focusable.length - 1] ?? null, 'Expected a last focusable panel control.');
    last.focus();
    const tabEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' });
    await act(async () => last.dispatchEvent(tabEvent));
    expect(tabEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
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
    let widget!: HTMLElement;
    await act(async () => {
      widget = controls.mount({ defaultOpen: true });
    });
    expect(widget.classList.contains('context7-widget')).toBe(true);
    expect(controlsRef.current?.isOpen).toBe(true);
    let remountedWidget!: HTMLElement;
    await act(async () => {
      remountedWidget = controls.mount({ preset: 'neo' });
    });
    expect(remountedWidget).toBe(widget);
    expect(remountedWidget.getAttribute('preset')).toBe('neo');
    await act(async () => controls.open());
    expect(controls.getMessages()).toEqual([]);
    await act(async () => controls.send('Use the hook'));
    await flush();
    expect(document.body.textContent).toContain('Hook answer');
    expect(controls.getMessages().map((message) => message.content)).toEqual(['Use the hook', 'Hook answer']);

    await act(async () => controls.unmount());
    expect(document.querySelector('.context7-widget-programmatic-root')).toBeNull();
  });

  it('keeps hook state reactive without replacing unchanged streaming snapshots', async () => {
    const deferred = createDeferredSseStream();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(deferred.stream))
    );
    const controlsRef: { current: ReturnType<typeof useContext7Widget> | null } = { current: null };

    function Harness() {
      controlsRef.current = useContext7Widget({ library: '/owner/repo' });
      return null;
    }

    mount(<Harness />);
    const controls = required(controlsRef.current, 'Expected hook controls.');
    await act(async () => controls.mount());
    let pending!: Promise<unknown>;
    await act(async () => {
      pending = controls.send('Stream through the hook');
      await Promise.resolve();
    });
    await vi.waitFor(() => {
      expect(controlsRef.current?.isBusy).toBe(true);
      expect(controlsRef.current?.messages.map((message) => message.content)).toEqual(['Stream through the hook']);
    });

    await act(async () => controlsRef.current?.close());
    expect(controlsRef.current?.isBusy).toBe(true);
    expect(controlsRef.current?.messages.map((message) => message.content)).toEqual(['Stream through the hook']);

    await act(async () => {
      deferred.push('data: {"type":"text-delta","delta":"Hook stream answer"}\n');
      deferred.close();
      await pending;
    });
    await vi.waitFor(() => {
      expect(controlsRef.current?.isBusy).toBe(false);
      expect(controlsRef.current?.messages.map((message) => message.content)).toEqual([
        'Stream through the hook',
        'Hook stream answer'
      ]);
    });
    await act(async () => controls.unmount());
  });

  it('reactively updates every React-owned hook prop category', async () => {
    const firstOpen = vi.fn();
    const secondOpen = vi.fn();
    const controlsRef: { current: ReturnType<typeof useContext7Widget> | null } = { current: null };
    let setVersion: ((value: 1 | 2) => void) | null = null;

    function Harness() {
      const [version, updateVersion] = useState<1 | 2>(1);
      setVersion = updateVersion;
      controlsRef.current = useContext7Widget({
        children: <span data-testid="hook-child">Child {version}</span>,
        customTrigger: true,
        labels: { close: `Close ${version}` },
        launcherLabel: `Ask docs ${version}`,
        library: `/owner/version-${version}`,
        onOpen: version === 1 ? firstOpen : secondOpen,
        rootProps: { className: `hook-root-${version}`, title: `Root ${version}` },
        trigger: ({ label }) => <span data-testid="hook-trigger">{label}</span>
      });
      return null;
    }

    mount(<Harness />);
    const initialControls = required(controlsRef.current, 'Expected hook controls.');
    await act(async () => initialControls.mount());
    expect(document.querySelector('[data-testid="hook-child"]')?.textContent).toBe('Child 1');
    expect(document.querySelector('[data-testid="hook-trigger"]')?.textContent).toBe('Ask docs 1');

    await act(async () => setVersion?.(2));
    const widget = controlsRef.current?.widget;
    expect(widget?.getAttribute('library')).toBe('/owner/version-2');
    expect(widget?.classList.contains('hook-root-2')).toBe(true);
    expect(widget?.getAttribute('title')).toBe('Root 2');
    expect(document.querySelector('[data-testid="hook-child"]')?.textContent).toBe('Child 2');
    expect(document.querySelector('[data-testid="hook-trigger"]')?.textContent).toBe('Ask docs 2');
    expect(document.querySelector('.c7-close')?.getAttribute('aria-label')).toBe('Close 2');

    await act(async () => controlsRef.current?.open());
    expect(firstOpen).not.toHaveBeenCalled();
    expect(secondOpen).toHaveBeenCalledOnce();
    await act(async () => controlsRef.current?.unmount());
  });

  it('reactively switches registered hook targets and uses the first-widget fallback', async () => {
    const controlsRef: { current: ReturnType<typeof useContext7Widget> | null } = { current: null };
    let setWidgetId: ((value: string | undefined) => void) | null = null;

    function Harness() {
      const [widgetId, updateWidgetId] = useState<string | undefined>();
      setWidgetId = updateWidgetId;
      controlsRef.current = useContext7Widget({ widgetId });
      return null;
    }

    const container = mount(
      <>
        <Context7Widget library="/owner/first" widgetId="first" />
        <Context7Widget library="/owner/second" widgetId="second" />
        <Harness />
      </>
    );
    await flush();
    const widgets = container.querySelectorAll<HTMLElement>('.context7-widget');
    expect(controlsRef.current?.widget).toBe(widgets[0]);

    await act(async () => setWidgetId?.('second'));
    expect(controlsRef.current?.widget).toBe(widgets[1]);

    await act(async () => setWidgetId?.('missing'));
    expect(controlsRef.current?.widget).toBeNull();
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

  it('releases a removed external trigger and does not restore focus to the disconnected element', async () => {
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
    const trigger = document.createElement('button');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'menu');
    trigger.textContent = 'External docs';
    document.body.append(trigger);
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    const container = mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
        customTrigger={trigger}
        library="/owner/repo"
      />
    );
    const controller = required(controllerRef.current, 'Expected a React widget controller.');
    trigger.focus();
    await act(async () => trigger.click());
    expect(controller.isOpen()).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');

    await act(async () => mutation?.([], {} as MutationObserver));
    expect(container.querySelector('.c7-launcher')).toBeNull();

    await act(async () => {
      trigger.remove();
      mutation?.([], {} as MutationObserver);
      await Promise.resolve();
    });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.hasAttribute('aria-controls')).toBe(false);
    expect(container.querySelector('.c7-launcher')).not.toBeNull();

    await act(async () => controller.close());
    expect(controller.isOpen()).toBe(false);
    expect(trigger.isConnected).toBe(false);
  });

  it('observes an initially empty trigger ref and binds it when the element appears', async () => {
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
    const triggerRef: { current: HTMLButtonElement | null } = { current: null };
    const container = mount(<Context7Widget customTrigger={triggerRef} library="/owner/repo" />);
    await flush();
    expect(container.querySelector('.c7-launcher')).not.toBeNull();

    const trigger = document.createElement('button');
    trigger.textContent = 'Late ref trigger';
    triggerRef.current = trigger;
    await act(async () => {
      document.body.append(trigger);
      mutation?.([], {} as MutationObserver);
      await Promise.resolve();
    });
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(container.querySelector('.c7-launcher')).toBeNull();

    await act(async () => trigger.click());
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

  it('coalesces anchored layout frames and ignores widget scrolling and stale closed frames', async () => {
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
    vi.stubGlobal('ResizeObserver', undefined);
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    const container = mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
        library="/owner/repo"
        position="anchor"
      />
    );
    const panel = container.querySelector<HTMLElement>('.c7-panel');
    const launcher = container.querySelector<HTMLElement>('.c7-launcher');
    const widget = container.querySelector<HTMLElement>('.context7-widget')!;
    setElementSize(panel, 400, 300);
    setElementRect(launcher, { bottom: 160, height: 40, left: 100, right: 200, top: 120, width: 100 });

    const controller = required(controllerRef.current, 'Expected a React widget controller.');
    await act(async () => controller.open());
    await act(async () => {
      const openingFrames = [...frames.values()];
      frames.clear();
      for (const callback of openingFrames) callback(performance.now());
    });
    const initialTop = widget.style.getPropertyValue('--c7-anchor-top');
    requestFrame.mockClear();
    cancelFrame.mockClear();

    await act(async () => widget.dispatchEvent(new Event('scroll', { bubbles: true, composed: true })));
    expect(requestFrame).not.toHaveBeenCalled();

    setElementRect(launcher, { bottom: 260, height: 40, left: 100, right: 200, top: 220, width: 100 });
    await act(async () => {
      window.dispatchEvent(new Event('resize'));
      window.dispatchEvent(new Event('resize'));
    });
    expect(requestFrame).toHaveBeenCalledOnce();
    const [scheduledId, scheduledFrame] = required(
      [...frames.entries()][0] ?? null,
      'Expected a scheduled anchored layout frame.'
    );

    await act(async () => controller.close());
    expect(cancelFrame).toHaveBeenCalledWith(scheduledId);
    await act(async () => scheduledFrame(performance.now()));
    expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe(initialTop);
  });

  it('sticks to the message bottom only while the reader remains nearby', async () => {
    let frame = 0;
    const requestFrame = vi.fn(() => ++frame);
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          createSseStream([
            'data: {"type":"tool-input-available","toolCallId":"tool-away","toolName":"search","input":{"query":"Away"}}\n'
          ])
        )
      )
      .mockResolvedValueOnce(
        new Response(
          createSseStream([
            'data: {"type":"tool-input-available","toolCallId":"tool-bottom","toolName":"search","input":{"query":"Bottom"}}\n'
          ])
        )
      );
    vi.stubGlobal('fetch', fetchMock);
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    const container = mount(
      <Context7Widget
        ref={(value) => {
          controllerRef.current = value;
        }}
        library="/owner/repo"
      />
    );
    const controller = required(controllerRef.current, 'Expected a React widget controller.');
    await act(async () => controller.open());
    requestFrame.mockClear();

    const messages = container.querySelector<HTMLElement>('.c7-messages')!;
    let scrollHeight = 1_000;
    Object.defineProperty(messages, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(messages, 'scrollHeight', { configurable: true, get: () => scrollHeight });
    messages.scrollTop = 300;
    await act(async () => messages.dispatchEvent(new Event('scroll', { bubbles: true })));

    await act(async () => controller.send('Stay where I am'));
    expect(messages.scrollTop).toBe(300);
    expect(requestFrame).toHaveBeenCalledTimes(1);

    await act(async () => controller.reset());
    expect(messages.scrollTop).toBe(1_000);

    messages.scrollTop = 300;
    await act(async () => messages.dispatchEvent(new Event('scroll', { bubbles: true })));
    messages.scrollTop = 800;
    await act(async () => messages.dispatchEvent(new Event('scroll', { bubbles: true })));
    scrollHeight = 1_200;
    await act(async () => controller.send('Follow the bottom again'));
    expect(messages.scrollTop).toBe(1_200);
    expect(requestFrame).toHaveBeenCalledTimes(2);
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

  it('cancels a queued auto-mount when the hook owner unmounts first', async () => {
    const ownerContainer = document.createElement('div');
    const widgetTarget = document.createElement('div');
    document.body.append(ownerContainer, widgetTarget);
    const ownerRoot = createRoot(ownerContainer);

    function PendingAutoMount() {
      useContext7Widget({ autoMount: true, library: '/owner/repo', target: widgetTarget });
      return null;
    }

    act(() => ownerRoot.render(<PendingAutoMount />));
    act(() => ownerRoot.unmount());
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(widgetTarget.querySelector('.context7-widget-programmatic-root')).toBeNull();
  });

  it('returns safe empty state when a hook has no registered or owned widget', async () => {
    const controlsRef: { current: ReturnType<typeof useContext7Widget> | null } = { current: null };
    function Harness() {
      controlsRef.current = useContext7Widget({ widgetId: 'missing' });
      return null;
    }
    mount(<Harness />);
    const controls = required(controlsRef.current, 'Expected hook controls.');
    await act(async () => {
      controls.cancel();
      controls.close();
      controls.open();
      controls.reset();
      controls.toggle();
    });
    expect(controls.getMessages()).toEqual([]);
    await act(async () => {
      await expect(controls.send('No widget')).resolves.toBeUndefined();
      await expect(controls.retry()).resolves.toBeUndefined();
      controls.unmount();
    });
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

function setNativeTextareaValue(input: HTMLTextAreaElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set;
  if (!setter) throw new Error('Expected the native textarea value setter.');
  setter.call(input, value);
}

function createDeferredSseStream(): {
  readonly close: () => void;
  readonly push: (value: string) => void;
  readonly stream: ReadableStream<Uint8Array>;
} {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(value) {
      controller = value;
    }
  });
  return {
    close: () => controller.close(),
    push: (value) => controller.enqueue(encoder.encode(value)),
    stream
  };
}

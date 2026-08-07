import { createApp, defineComponent, h, nextTick, ref, type App } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Context7Widget, createContext7WidgetPlugin, useContext7Widget, type Context7WidgetExpose } from '../../src';
import { setDocumentClientSize, setElementRect, setElementSize, setViewportSize } from '@common/tests/unit/dom';
import { createSseStream } from '@common/tests/unit/stream';
import { expectAlwaysVisibleBranding } from '@common/tests/unit/widget-contract';

const mountedApps: App[] = [];

describe('@desource/context7-widget-vue', () => {
  afterEach(() => {
    for (const app of mountedApps.splice(0).reverse()) app.unmount();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders a native Vue widget and emits ready', async () => {
    const ready = vi.fn();
    const root = mount(() =>
      h(Context7Widget, {
        closeOnOutsideClick: false,
        library: '/desource-labs/context7-widget',
        onReady: ready,
        position: 'center',
        preset: 'terminal',
        theme: 'dark',
        title: 'Docs assistant'
      })
    );

    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget');
    expect(root.querySelector('context7-widget')).toBeNull();
    expect(widget?.getAttribute('library')).toBe('/desource-labs/context7-widget');
    expect(widget?.getAttribute('close-on-outside-click')).toBe('false');
    expect(widget?.getAttribute('position')).toBe('center');
    expect(widget?.getAttribute('preset')).toBe('terminal');
    expect(widget?.getAttribute('theme')).toBe('dark');
    expect(widget?.querySelector('[part~="title"]')?.textContent).toBe('Docs assistant');
    expect(ready).toHaveBeenCalledWith(
      expect.objectContaining({
        library: '/desource-labs/context7-widget',
        widget,
        widgetId: 'default'
      })
    );
  });

  it('always renders compact linked Context7 and DeSource Labs branding', async () => {
    const root = mount(() => h(Context7Widget, { library: '/desource-labs/context7-widget' }));
    await nextTick();
    expectAlwaysVisibleBranding(root.querySelector('.context7-widget') as HTMLElement);
  });

  it('supports built-in, managed, slotted, and external triggers', async () => {
    const mode = ref<'built-in' | 'external' | 'managed'>('built-in');
    const root = document.createElement('div');
    const external = document.createElement('button');
    external.id = 'docs-help';
    document.body.append(external, root);

    const app = createApp({
      render: () =>
        h(
          Context7Widget,
          {
            customTrigger: mode.value === 'managed' ? true : mode.value === 'external' ? 'docs-help' : undefined,
            launcherLabel: 'Ask docs',
            library: '/desource-labs/context7-widget',
            position: 'anchor'
          },
          {
            trigger: ({ label, triggerId }: { label: string; triggerId: string }) =>
              h('span', { 'data-testid': 'slot-trigger', 'data-trigger-id': triggerId }, label)
          }
        )
    });
    mountedApps.push(app);
    app.mount(root);

    await nextTick();
    const launcher = root.querySelector<HTMLButtonElement>('.c7-launcher')!;
    launcher.click();
    await nextTick();
    expect(root.querySelector('.context7-widget')?.hasAttribute('open')).toBe(true);
    launcher.click();
    await nextTick();
    expect(root.querySelector('.context7-widget')?.hasAttribute('open')).toBe(false);

    mode.value = 'managed';
    await nextTick();
    const trigger = root.querySelector<HTMLButtonElement>('.context7-widget-trigger');
    expect(trigger?.querySelector('[data-testid="slot-trigger"]')?.textContent).toBe('Ask docs');
    trigger?.click();
    await nextTick();
    expect(root.querySelector('.context7-widget')?.hasAttribute('open')).toBe(true);
    trigger?.click();
    await nextTick();
    expect(root.querySelector('.context7-widget')?.hasAttribute('open')).toBe(false);

    mode.value = 'external';
    await nextTick();
    expect(root.querySelector('.context7-widget-trigger')).toBeNull();
    expect(root.querySelector('.context7-widget')?.getAttribute('custom-trigger')).toBe('#docs-help');
    external.click();
    await nextTick();
    expect(root.querySelector('.context7-widget')?.hasAttribute('open')).toBe(true);
  });

  it('supports the managed trigger fallback and accessible keyboard and backdrop dismissal', async () => {
    const close = vi.fn();
    const root = mount(() =>
      h(Context7Widget, {
        closeOnOutsideClick: true,
        customTrigger: true,
        launcherLabel: 'Ask the docs',
        library: '/desource-labs/context7-widget',
        onClose: close,
        position: 'center'
      })
    );
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    const trigger = root.querySelector<HTMLButtonElement>('.context7-widget-trigger')!;
    expect(trigger.textContent?.trim()).toBe('Ask the docs');

    trigger.focus();
    trigger.click();
    await nextTick();
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(true);
    expect(document.activeElement).toBe(root.querySelector('.c7-input'));

    const tab = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Tab' });
    widget.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);

    const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' });
    widget.dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(false);
    expect(document.activeElement).toBe(trigger);

    trigger.click();
    await nextTick();
    root.querySelector<HTMLDivElement>('.c7-backdrop')!.click();
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(false);

    trigger.click();
    await nextTick();
    root.querySelector<HTMLButtonElement>('.c7-close')!.click();
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(false);
    expect(close).toHaveBeenCalledTimes(3);
  });

  it('submits a v-model draft through the Vue form', async () => {
    const question = vi.fn();
    const fetch = vi.fn(
      async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Form response"}\n']))
    );
    vi.stubGlobal('fetch', fetch);
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        onQuestion: question
      })
    );
    await nextTick();

    const input = root.querySelector<HTMLInputElement>('.c7-input')!;
    input.value = '  How do Vue forms work?  ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    root
      .querySelector<HTMLFormElement>('.c7-composer')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await vi.waitFor(() => expect(root.textContent).toContain('Form response'));
    expect(fetch).toHaveBeenCalledOnce();
    expect(question).toHaveBeenCalledWith(expect.objectContaining({ question: 'How do Vue forms work?' }));
    expect(input.value).toBe('');
  });

  it('reacts to live modal behavior changes while open', async () => {
    const defaultOpen = ref(false);
    const closeOnOutsideClick = ref(false);
    const position = ref<'anchor' | 'center'>('center');
    const root = mount(() =>
      h(Context7Widget, {
        closeOnOutsideClick: closeOnOutsideClick.value,
        defaultOpen: defaultOpen.value,
        library: '/desource-labs/context7-widget',
        position: position.value
      })
    );
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    expect(widget.hasAttribute('open')).toBe(false);

    defaultOpen.value = true;
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(true);

    position.value = 'anchor';
    await nextTick();
    expect(widget.style.getPropertyValue('--c7-anchor-left')).toMatch(/px$/);
    expect(widget.style.getPropertyValue('--c7-anchor-top')).toMatch(/px$/);

    closeOnOutsideClick.value = true;
    await nextTick();
    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(false);
  });

  it('tracks visual viewport and observed element changes while anchored', async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let resizeCallback: ResizeObserverCallback | undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }

        observe = observe;
        disconnect = disconnect;
      }
    );
    const visualViewport = Object.assign(new EventTarget(), {
      height: 400,
      offsetLeft: 50,
      offsetTop: 100,
      width: 600
    });
    vi.stubGlobal('visualViewport', visualViewport);
    const root = mount(() =>
      h(Context7Widget, {
        customTrigger: true,
        library: '/desource-labs/context7-widget',
        position: 'anchor'
      })
    );
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    const panel = root.querySelector<HTMLElement>('.c7-panel');
    const trigger = root.querySelector<HTMLElement>('.context7-widget-trigger');
    setElementSize(panel, 400, 300);
    setElementRect(trigger, { bottom: 460, height: 40, left: 450, right: 550, top: 420, width: 100 });

    trigger?.click();
    await nextTick();
    expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('112px');
    expect(widget.style.getPropertyValue('--c7-anchor-max-height')).toBe('296px');
    expect(observe).toHaveBeenCalledWith(trigger);
    expect(observe).toHaveBeenCalledWith(panel);

    setElementRect(trigger, { bottom: 160, height: 40, left: 450, right: 550, top: 120, width: 100 });
    visualViewport.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('172px'));

    setElementRect(trigger, { bottom: 460, height: 40, left: 450, right: 550, top: 420, width: 100 });
    resizeCallback?.([], {} as ResizeObserver);
    await vi.waitFor(() => expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('112px'));

    root.querySelector<HTMLButtonElement>('.c7-close')?.click();
    await nextTick();
    expect(disconnect).toHaveBeenCalledOnce();
  });

  it('falls back to document dimensions for zero viewport dimensions while anchored', async () => {
    setViewportSize(0, 0);
    setDocumentClientSize(900, 700);
    vi.stubGlobal(
      'visualViewport',
      Object.assign(new EventTarget(), {
        height: 0,
        offsetLeft: 0,
        offsetTop: 0,
        width: 0
      })
    );
    const root = mount(() =>
      h(Context7Widget, {
        customTrigger: true,
        library: '/desource-labs/context7-widget',
        position: 'anchor'
      })
    );
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    const panel = root.querySelector<HTMLElement>('.c7-panel');
    const trigger = root.querySelector<HTMLElement>('.context7-widget-trigger');
    setElementSize(panel, 400, 300);
    setElementRect(trigger, { bottom: 640, height: 56, left: 700, right: 840, top: 584, width: 140 });

    trigger?.click();
    await nextTick();

    expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('272px');
    expect(widget.style.getPropertyValue('--c7-anchor-max-height')).toBe('560px');
    expect(widget.style.getPropertyValue('--c7-anchor-max-width')).toBe('876px');
  });

  it('streams through the shared kit and emits typed Vue events', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{"query":"setup"}}\n',
              'data: {"type":"tool-output-available","toolCallId":"tool-1","output":{"snippet":"Install it."}}\n',
              'data: {"type":"text-delta","delta":"Use the Vue component."}\n',
              'data: [DONE]\n'
            ])
          )
      )
    );

    const handlers = {
      answer: vi.fn(),
      answerComplete: vi.fn(),
      firstToken: vi.fn(),
      question: vi.fn(),
      toolCall: vi.fn(),
      toolResult: vi.fn()
    };
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        onAnswer: handlers.answer,
        onAnswerComplete: handlers.answerComplete,
        onFirstToken: handlers.firstToken,
        onQuestion: handlers.question,
        onToolCall: handlers.toolCall,
        onToolResult: handlers.toolResult,
        ref: widgetRef
      })
    );

    await nextTick();
    await widgetRef.value?.send('How do I install it?');

    expect(root.textContent).toContain('Use the Vue component.');
    expect(root.textContent).toContain('Searching: setup');
    expect(handlers.question).toHaveBeenCalledWith(expect.objectContaining({ question: 'How do I install it?' }));
    expect(handlers.firstToken).toHaveBeenCalledOnce();
    expect(handlers.answer).toHaveBeenCalledWith(expect.objectContaining({ answer: 'Use the Vue component.' }));
    expect(handlers.answerComplete).toHaveBeenCalledOnce();
    expect(handlers.toolCall).toHaveBeenCalledOnce();
    expect(handlers.toolResult).toHaveBeenCalledOnce();

    const toggle = root.querySelector<HTMLButtonElement>('.c7-tool-toggle');
    toggle?.click();
    await nextTick();
    expect(root.querySelector('.c7-tool-content')?.textContent).toContain('Install it.');
  });

  it('exposes native imperative widget methods through component refs', async () => {
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        ref: widgetRef,
        widgetId: 'ref-docs'
      })
    );
    await nextTick();

    widgetRef.value?.open();
    expect(widgetRef.value?.isOpen()).toBe(true);
    await nextTick();
    expect(root.querySelector('.context7-widget')?.hasAttribute('open')).toBe(true);

    widgetRef.value?.toggle();
    expect(widgetRef.value?.isOpen()).toBe(false);
  });

  it('handles missing configuration, invalid triggers, outside clicks, and transport failures accessibly', async () => {
    const error = vi.fn();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        customTrigger: '[',
        defaultOpen: true,
        library: '',
        onError: error,
        ref: widgetRef
      })
    );
    await nextTick();

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid custom trigger selector'));
    expect(widgetRef.value?.isOpen()).toBe(true);

    await widgetRef.value?.send('Where are the docs?');
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ error: 'Missing library prop.' }));
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Missing library prop.');

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(widgetRef.value?.isOpen()).toBe(false);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ message: 'Widget is not enabled' }, { status: 403 }))
    );
    const configuredRef = ref<Context7WidgetExpose | null>(null);
    const configuredRoot = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        onError: error,
        ref: configuredRef
      })
    );
    await nextTick();
    await configuredRef.value?.send('Will this fail?');

    expect(configuredRoot.querySelector('[role="alert"]')?.textContent).toContain(
      'The chat widget is not enabled for this library.'
    );
  });

  it('programmatically mounts and controls the native Vue component', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Hello"}\n'])))
    );
    const root = document.createElement('div');
    document.body.append(root);

    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget({
            autoMount: true,
            library: '/desource-labs/context7-widget',
            target: root,
            widgetId: 'docs'
          })
        };
      },
      render: () => h('div')
    });
    const hostRoot = document.createElement('div');
    document.body.append(hostRoot);
    const hostApp = createApp(Host);
    mountedApps.push(hostApp);
    const vm = hostApp.mount(hostRoot) as unknown as {
      controller: ReturnType<typeof useContext7Widget>;
    };

    await nextTick();
    await vm.controller.send('What is this?');

    expect(vm.controller.isOpen.value).toBe(true);
    expect(root.querySelector('context7-widget')).toBeNull();
    expect(root.querySelector('.context7-widget')?.textContent).toContain('Hello');
  });

  it('updates a composable-owned Vue widget from reactive options', async () => {
    const preset = ref<'glass' | 'terminal'>('glass');
    const firstTarget = document.createElement('div');
    const secondTarget = document.createElement('div');
    const target = ref<HTMLElement>(firstTarget);
    const hostRoot = document.createElement('div');
    document.body.append(firstTarget, secondTarget, hostRoot);

    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget(() => ({
            autoMount: true,
            library: '/desource-labs/context7-widget',
            preset: preset.value,
            target: target.value,
            widgetId: 'reactive-docs'
          }))
        };
      },
      render: () => h('div')
    });
    const hostApp = createApp(Host);
    mountedApps.push(hostApp);
    hostApp.mount(hostRoot);

    await nextTick();
    expect(firstTarget.querySelector('.context7-widget')?.getAttribute('preset')).toBe('glass');
    preset.value = 'terminal';
    await nextTick();
    expect(firstTarget.querySelector('.context7-widget')?.getAttribute('preset')).toBe('terminal');

    target.value = secondTarget;
    await nextTick();
    expect(firstTarget.querySelector('.context7-widget')).toBeNull();
    expect(secondTarget.querySelector('.context7-widget')?.getAttribute('preset')).toBe('terminal');
  });

  it('controls a declaratively rendered widget through the composable registry', async () => {
    let signal: AbortSignal | undefined;
    const widgetId = ref('declarative-docs');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            signal = init?.signal ?? undefined;
            signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          })
      )
    );
    const hostRoot = document.createElement('div');
    document.body.append(hostRoot);
    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget(() => ({ widgetId: widgetId.value }))
        };
      },
      render() {
        return h(Context7Widget, {
          library: '/desource-labs/context7-widget',
          widgetId: widgetId.value
        });
      }
    });
    const hostApp = createApp(Host);
    mountedApps.push(hostApp);
    const vm = hostApp.mount(hostRoot) as unknown as {
      controller: ReturnType<typeof useContext7Widget>;
    };
    await nextTick();

    expect(vm.controller.widget.value).toBe(hostRoot.querySelector('.context7-widget'));
    vm.controller.open();
    expect(vm.controller.isOpen.value).toBe(true);
    vm.controller.close();
    expect(vm.controller.isOpen.value).toBe(false);
    vm.controller.toggle();
    expect(vm.controller.isOpen.value).toBe(true);

    widgetId.value = 'renamed-docs';
    await nextTick();
    vm.controller.close();
    expect(vm.controller.widget.value).toBe(hostRoot.querySelector('.context7-widget'));
    expect(vm.controller.isOpen.value).toBe(false);

    const pending = vm.controller.send('Cancel this request');
    expect(vm.controller.isBusy.value).toBe(true);
    vm.controller.cancel();
    await pending;
    expect(signal?.aborted).toBe(true);
    expect(vm.controller.isBusy.value).toBe(false);
    expect(vm.controller.getMessages()).toHaveLength(1);

    vm.controller.reset();
    expect(vm.controller.messages.value).toEqual([]);
  });

  it('keeps an owned widget mounted when removeOnUnmount is false until explicitly removed', async () => {
    const target = document.createElement('div');
    const hostRoot = document.createElement('div');
    document.body.append(target, hostRoot);
    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget({
            autoMount: true,
            library: '/desource-labs/context7-widget',
            removeOnUnmount: false,
            target
          })
        };
      },
      render: () => h('div')
    });
    const hostApp = createApp(Host);
    mountedApps.push(hostApp);
    const vm = hostApp.mount(hostRoot) as unknown as {
      controller: ReturnType<typeof useContext7Widget>;
    };
    await nextTick();

    expect(target.querySelector('.context7-widget')).toBeTruthy();
    hostApp.unmount();
    mountedApps.splice(mountedApps.indexOf(hostApp), 1);
    expect(target.querySelector('.context7-widget')).toBeTruthy();

    vm.controller.unmount();
    expect(target.querySelector('.context7-widget')).toBeNull();
    expect(vm.controller.widget.value).toBeNull();
  });

  it('inherits plugin defaults in composable-owned widgets', async () => {
    const target = document.createElement('div');
    const hostRoot = document.createElement('div');
    document.body.append(target, hostRoot);

    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget({
            autoMount: true,
            target
          })
        };
      },
      render: () => h('div')
    });
    const hostApp = createApp(Host);
    mountedApps.push(hostApp);
    hostApp.use(
      createContext7WidgetPlugin({
        defaults: {
          library: '/plugin/defaults',
          preset: 'terminal',
          widgetId: 'plugin-docs'
        }
      })
    );
    hostApp.mount(hostRoot);

    await nextTick();

    const widget = target.querySelector('.context7-widget');
    expect(widget?.getAttribute('library')).toBe('/plugin/defaults');
    expect(widget?.getAttribute('preset')).toBe('terminal');
    expect(widget?.getAttribute('widget-id')).toBe('plugin-docs');
  });

  it('throws a useful composable error when mounting without a library', async () => {
    let controller: ReturnType<typeof useContext7Widget> | undefined;
    const root = mount(() =>
      h(
        defineComponent({
          setup() {
            controller = useContext7Widget();
          },
          render: () => h('div')
        })
      )
    );
    await nextTick();
    expect(root).toBeTruthy();
    expect(() => controller?.mount()).toThrow('useContext7Widget mount requires a library option.');
  });

  it('throws a focused error when the composable is called outside component setup', () => {
    expect(() => useContext7Widget()).toThrow('useContext7Widget must be called during a Vue component setup.');
  });

  it('isolates replacement requests from stale frames after cancellation', async () => {
    let staleStream: ReadableStreamDefaultController<Uint8Array> | undefined;
    const encoder = new TextEncoder();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementationOnce(
          async () =>
            new Response(
              new ReadableStream<Uint8Array>({
                start(controller) {
                  staleStream = controller;
                }
              })
            )
        )
        .mockImplementationOnce(
          async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Fresh Vue answer"}\n']))
        )
    );

    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    const staleRequest = widgetRef.value!.send('Old question');
    widgetRef.value!.cancel();
    const freshRequest = widgetRef.value!.send('New question');
    await freshRequest;
    staleStream?.enqueue(encoder.encode('data: {"type":"text-delta","delta":"Stale Vue answer"}\n'));
    staleStream?.close();
    await staleRequest;

    expect(root.textContent).toContain('Fresh Vue answer');
    expect(root.textContent).not.toContain('Stale Vue answer');
    expect(widgetRef.value?.getMessages().map((message) => message.content)).toEqual([
      'Old question',
      'New question',
      'Fresh Vue answer'
    ]);
  });

  it('offers a visible stop action and reports reactive composable state', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            signal = init?.signal ?? undefined;
            signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          })
      )
    );

    const target = document.createElement('div');
    const hostRoot = document.createElement('div');
    document.body.append(target, hostRoot);
    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget({
            autoMount: true,
            library: '/desource-labs/context7-widget',
            target
          })
        };
      },
      render: () => h('div')
    });
    const hostApp = createApp(Host);
    mountedApps.push(hostApp);
    const vm = hostApp.mount(hostRoot) as unknown as {
      controller: ReturnType<typeof useContext7Widget>;
    };
    await nextTick();

    const pending = vm.controller.send('Stop this');
    expect(vm.controller.isBusy.value).toBe(true);
    await nextTick();
    const stop = target.querySelector<HTMLButtonElement>('.c7-send');
    expect(stop?.textContent?.trim()).toBe('Stop');
    stop?.click();
    await pending;

    expect(signal?.aborted).toBe(true);
    expect(vm.controller.isBusy.value).toBe(false);
    expect(stop?.textContent?.trim()).toBe('Send');
  });

  it('persists composable mount overrides, updates them, and exposes conversation controls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Tracked answer"}\n'])))
    );
    const sourcePreset = ref<'glass' | 'minimal'>('glass');
    const target = document.createElement('div');
    const hostRoot = document.createElement('div');
    document.body.append(target, hostRoot);
    const Host = defineComponent({
      setup() {
        const controller = useContext7Widget(() => ({
          library: '/desource-labs/context7-widget',
          preset: sourcePreset.value,
          target
        }));
        return { controller };
      },
      render: () => h('div')
    });
    const hostApp = createApp(Host);
    mountedApps.push(hostApp);
    const vm = hostApp.mount(hostRoot) as unknown as {
      controller: ReturnType<typeof useContext7Widget>;
    };
    await nextTick();

    const firstElement = vm.controller.mount({ preset: 'terminal' });
    expect(firstElement.getAttribute('preset')).toBe('terminal');
    sourcePreset.value = 'minimal';
    await nextTick();
    expect(firstElement.getAttribute('preset')).toBe('terminal');

    expect(vm.controller.mount({ preset: 'neo' })).toBe(firstElement);
    await nextTick();
    expect(firstElement.getAttribute('preset')).toBe('neo');
    await vm.controller.send('Track this');
    expect(vm.controller.messages.value.map((message) => message.content)).toEqual(['Track this', 'Tracked answer']);

    vm.controller.reset();
    expect(vm.controller.messages.value).toEqual([]);
    expect(vm.controller.getMessages()).toEqual([]);
  });

  it('supports CSS selectors for external triggers and restores their ARIA attributes', async () => {
    const customTrigger = ref<string | undefined>('.docs-trigger');
    const external = document.createElement('button');
    external.className = 'docs-trigger';
    external.setAttribute('aria-expanded', 'mixed');
    document.body.append(external);
    const root = mount(() =>
      h(Context7Widget, {
        customTrigger: customTrigger.value,
        library: '/desource-labs/context7-widget'
      })
    );
    await nextTick();

    const panel = root.querySelector<HTMLElement>('[role="dialog"]');
    expect(external.getAttribute('aria-controls')).toBe(panel?.id);
    expect(external.getAttribute('aria-expanded')).toBe('false');
    external.click();
    await nextTick();
    expect(external.getAttribute('aria-expanded')).toBe('true');

    customTrigger.value = undefined;
    await nextTick();
    expect(external.hasAttribute('aria-controls')).toBe(false);
    expect(external.getAttribute('aria-expanded')).toBe('mixed');
  });
});

function mount(renderWidget: () => ReturnType<typeof h>): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  const app = createApp({ render: renderWidget });
  mountedApps.push(app);
  app.mount(root);
  return root;
}

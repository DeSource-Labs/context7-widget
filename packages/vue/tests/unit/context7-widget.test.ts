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
    expect(trigger?.getAttribute('aria-label')).toBe('Ask docs');
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

  it('supports an idiomatic controlled open state through v-model:open', async () => {
    const controlledOpen = ref(true);
    const updates = vi.fn((value: boolean) => {
      controlledOpen.value = value;
    });
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        open: controlledOpen.value,
        'onUpdate:open': updates
      })
    );
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    expect(widget.hasAttribute('open')).toBe(true);

    root.querySelector<HTMLButtonElement>('.c7-close')?.click();
    await nextTick();
    expect(updates).toHaveBeenLastCalledWith(false);
    expect(widget.hasAttribute('open')).toBe(false);

    root.querySelector<HTMLButtonElement>('.c7-launcher')?.click();
    await nextTick();
    expect(updates).toHaveBeenLastCalledWith(true);
    expect(widget.hasAttribute('open')).toBe(true);
  });

  it('keeps inactive option changes inert while controlled closed and can relinquish control', async () => {
    const controlledOpen = ref<boolean | undefined>(false);
    const defaultOpen = ref(true);
    const closeOnOutsideClick = ref(false);
    const position = ref<'anchor' | 'center'>('center');
    const root = mount(() =>
      h(Context7Widget, {
        closeOnOutsideClick: closeOnOutsideClick.value,
        defaultOpen: defaultOpen.value,
        library: '/desource-labs/context7-widget',
        open: controlledOpen.value,
        position: position.value
      })
    );
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    expect(widget.hasAttribute('open')).toBe(false);

    defaultOpen.value = false;
    position.value = 'anchor';
    closeOnOutsideClick.value = true;
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(false);
    expect(widget.style.getPropertyValue('--c7-anchor-top')).toBe('');

    controlledOpen.value = undefined;
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(false);

    root.querySelector<HTMLButtonElement>('.c7-launcher')!.click();
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(true);
  });

  it('does not restore detached focus or run deferred input focus after an immediate close', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    widgetRef.value!.open();
    opener.remove();
    widgetRef.value!.close();
    await nextTick();

    expect(widgetRef.value!.isOpen()).toBe(false);
    expect(document.activeElement).not.toBe(root.querySelector('.c7-input'));
  });

  it('keeps a centered backdrop inert when outside-click dismissal is disabled', async () => {
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        closeOnOutsideClick: false,
        defaultOpen: true,
        library: '/desource-labs/context7-widget',
        position: 'center',
        ref: widgetRef
      })
    );
    await nextTick();

    root.querySelector<HTMLDivElement>('.c7-backdrop')!.click();
    await nextTick();

    expect(widgetRef.value!.isOpen()).toBe(true);
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

    const input = root.querySelector<HTMLTextAreaElement>('.c7-input')!;
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

    widget.dispatchEvent(new Event('scroll', { bubbles: true, composed: true }));
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('resize'));

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

  it('ignores orphan and empty tool results without rendering empty result controls', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              'data: {"type":"tool-output-available","toolCallId":"missing","output":"orphan"}\n',
              'data: {"type":"tool-input-available","toolCallId":"empty","toolName":"search","input":{}}\n',
              'data: {"type":"tool-output-available","toolCallId":"empty","output":""}\n',
              'data: [DONE]\n'
            ])
          )
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

    await widgetRef.value?.send('Search without results');

    expect(root.querySelectorAll('.c7-tool-call')).toHaveLength(1);
    expect(root.querySelector('.c7-tool-toggle')).toBeNull();
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
    expect(error).toHaveBeenCalledWith(expect.objectContaining({ error: 'Missing library configuration.' }));
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Missing library configuration.');

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

  it('renders the configured fallback when a transport error has no message', async () => {
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
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        labels: { errorFallback: 'The documentation service is unavailable.' },
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    const result = await widgetRef.value!.send('Handle an empty error');

    expect(result?.error).toBe('');
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('The documentation service is unavailable.');
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

  it('keeps composable controls safe before mounting and defaults owned mounts to the body', async () => {
    const hostRoot = document.createElement('div');
    document.body.append(hostRoot);
    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget({
            library: '/desource-labs/context7-widget',
            widgetId: 'manual-docs'
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

    vm.controller.open();
    vm.controller.close();
    vm.controller.toggle();
    vm.controller.cancel();
    vm.controller.reset();
    expect(vm.controller.getMessages()).toEqual([]);
    await expect(vm.controller.send('No widget yet')).resolves.toBeUndefined();
    await expect(vm.controller.retry()).resolves.toBeUndefined();
    vm.controller.unmount();

    const element = vm.controller.mount();
    expect(element.parentElement?.parentElement).toBe(document.body);
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

  it('honors and persists an initial composable mount target override', async () => {
    const preset = ref<'glass' | 'terminal'>('glass');
    const sourceTarget = document.createElement('div');
    const overrideTarget = document.createElement('div');
    const hostRoot = document.createElement('div');
    document.body.append(sourceTarget, overrideTarget, hostRoot);

    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget(() => ({
            library: '/desource-labs/context7-widget',
            preset: preset.value,
            target: sourceTarget
          }))
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

    const element = vm.controller.mount({ target: overrideTarget });

    expect(sourceTarget.querySelector('.context7-widget')).toBeNull();
    expect(overrideTarget.querySelector('.context7-widget')).toBe(element);

    preset.value = 'terminal';
    await nextTick();
    expect(overrideTarget.querySelector('.context7-widget')).toBe(element);
    expect(element.getAttribute('preset')).toBe('terminal');
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

  it('emits cancel and commits a visible partial answer as cancelled', async () => {
    const encoder = new TextEncoder();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url, init?: RequestInit) =>
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                init?.signal?.addEventListener(
                  'abort',
                  () => controller.error(new DOMException('Aborted', 'AbortError')),
                  { once: true }
                );
                controller.enqueue(encoder.encode('data: {"type":"text-delta","delta":"Partial Vue answer"}\n'));
              }
            })
          )
      )
    );

    const cancel = vi.fn();
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        onCancel: cancel,
        ref: widgetRef
      })
    );
    await nextTick();

    const pending = widgetRef.value!.send('Stop after a token');
    await vi.waitFor(async () => {
      await nextTick();
      expect(root.textContent).toContain('Partial Vue answer');
    });
    widgetRef.value!.cancel();
    const result = await pending;
    await nextTick();

    expect(result?.status).toBe('cancelled');
    expect(cancel).toHaveBeenCalledWith(
      expect.objectContaining({
        answer: 'Partial Vue answer',
        message: expect.objectContaining({ status: 'cancelled' }),
        question: 'Stop after a token'
      })
    );
    expect(widgetRef.value?.getMessages().map((message) => message.content)).toEqual([
      'Stop after a token',
      'Partial Vue answer'
    ]);
    expect(widgetRef.value?.getMessages()[1]?.status).toBe('cancelled');
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

  it('keeps a replacement request busy when an aborted retry finishes later', async () => {
    const activeSignals: AbortSignal[] = [];
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ message: 'Retry this request' }, { status: 500 }))
      .mockImplementation(
        async (_url, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            const signal = init?.signal;
            if (signal) activeSignals.push(signal);
            signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
          })
      );
    vi.stubGlobal('fetch', fetch);
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    await widgetRef.value!.send('Fail first');
    const retryPending = widgetRef.value!.retry();
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    widgetRef.value!.cancel();
    const replacementPending = widgetRef.value!.send('Replacement request');
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    const retryResult = await retryPending;

    expect(retryResult?.status).toBe('cancelled');
    expect(widgetRef.value!.isBusy()).toBe(true);
    expect(activeSignals[0]?.aborted).toBe(true);

    widgetRef.value!.cancel();
    await replacementPending;
    expect(activeSignals[1]?.aborted).toBe(true);
  });

  it('safely ignores a queued input resize when the widget unmounts during send', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            signal = init?.signal ?? undefined;
            signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
              once: true
            });
          })
      )
    );
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = document.createElement('div');
    document.body.append(root);
    const app = createApp({
      render: () =>
        h(Context7Widget, {
          library: '/desource-labs/context7-widget',
          ref: widgetRef
        })
    });
    mountedApps.push(app);
    app.mount(root);
    await nextTick();

    const pending = widgetRef.value!.send('Unmount immediately');
    app.unmount();
    mountedApps.splice(mountedApps.indexOf(app), 1);

    await pending;
    expect(signal?.aborted).toBe(true);
    expect(root.childElementCount).toBe(0);
  });

  it('publishes public state only for meaningful changes while an answer streams', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              'data: {"type":"text-delta","delta":"One "}\n',
              'data: {"type":"text-delta","delta":"two "}\n',
              'data: {"type":"text-delta","delta":"three "}\n',
              'data: {"type":"text-delta","delta":"four"}\n',
              'data: [DONE]\n'
            ])
          )
      )
    );
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        defaultOpen: true,
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    const listener = vi.fn();
    const unsubscribe = widgetRef.value!.subscribe(listener);
    listener.mockClear();

    await widgetRef.value!.send('Stream this answer');

    expect(root.textContent).toContain('One two three four');
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener.mock.calls.map(([state]) => [state.busy, state.messages.length])).toEqual([
      [true, 1],
      [true, 2],
      [false, 2]
    ]);
    unsubscribe();
  });

  it('isolates throwing public state subscribers without skipping healthy listeners', async () => {
    const reportError = vi.fn();
    vi.stubGlobal('reportError', reportError);
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    const listenerError = new Error('consumer failed');
    const unsubscribeThrowing = widgetRef.value!.subscribe(() => {
      throw listenerError;
    });
    const healthyListener = vi.fn();
    const unsubscribeHealthy = widgetRef.value!.subscribe(healthyListener);
    healthyListener.mockClear();

    widgetRef.value!.open();

    expect(healthyListener).toHaveBeenCalledWith(expect.objectContaining({ open: true }));
    expect(reportError).toHaveBeenCalledWith(listenerError);
    unsubscribeThrowing();
    unsubscribeHealthy();
  });

  it('keeps streaming autoscroll sticky only while the reader remains near the bottom', async () => {
    const encoder = new TextEncoder();
    let stream: ReadableStreamDefaultController<Uint8Array> | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            new ReadableStream<Uint8Array>({
              start(controller) {
                stream = controller;
              }
            })
          )
      )
    );
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        defaultOpen: true,
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    const messages = root.querySelector<HTMLElement>('.c7-messages')!;
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

    const pending = widgetRef.value!.send('Keep the reader in place');
    scrollHeight = 700;
    stream?.enqueue(encoder.encode('data: {"type":"text-delta","delta":"First"}\n'));
    await vi.waitFor(() => expect(root.textContent).toContain('First'));
    await vi.waitFor(() => expect(scrollWrites.length).toBeGreaterThan(0));

    scrollTop = 100;
    messages.dispatchEvent(new Event('scroll'));
    const writesWhileReading = scrollWrites.length;
    scrollHeight = 800;
    stream?.enqueue(encoder.encode('data: {"type":"text-delta","delta":" second"}\n'));
    await vi.waitFor(() => expect(root.textContent).toContain('First second'));
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(scrollTop).toBe(100);
    expect(scrollWrites).toHaveLength(writesWhileReading);

    scrollTop = scrollHeight - 200;
    messages.dispatchEvent(new Event('scroll'));
    await vi.waitFor(() => expect(scrollTop).toBe(scrollHeight));

    scrollHeight = 900;
    stream?.enqueue(encoder.encode('data: {"type":"text-delta","delta":" third"}\n'));
    await vi.waitFor(() => expect(root.textContent).toContain('First second third'));
    await vi.waitFor(() => expect(scrollTop).toBe(900));

    stream?.close();
    await pending;
  });

  it('coalesces rapid message scroll requests into one viewport write', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([
              'data: {"type":"tool-input-available","toolCallId":"tool-1","toolName":"search","input":{}}\n',
              'data: {"type":"tool-input-available","toolCallId":"tool-2","toolName":"search","input":{}}\n',
              'data: {"type":"tool-input-available","toolCallId":"tool-3","toolName":"search","input":{}}\n',
              'data: [DONE]\n'
            ])
          )
      )
    );
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        defaultOpen: true,
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    const messages = root.querySelector<HTMLElement>('.c7-messages')!;
    const scrollWrites: number[] = [];
    Object.defineProperties(messages, {
      clientHeight: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 600 },
      scrollTop: {
        configurable: true,
        get: () => scrollWrites.at(-1) ?? 400,
        set(value: number) {
          scrollWrites.push(value);
        }
      }
    });

    await widgetRef.value!.send('Search three times');
    await vi.waitFor(() => expect(root.querySelectorAll('.c7-tool-call')).toHaveLength(3));
    await vi.waitFor(() => expect(scrollWrites).toHaveLength(1));
    await new Promise((resolve) => setTimeout(resolve, 25));
    expect(scrollWrites).toHaveLength(1);
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

  it('treats a whitespace-only external trigger as absent without warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const root = mount(() =>
      h(Context7Widget, {
        customTrigger: '   ',
        library: '/desource-labs/context7-widget'
      })
    );
    await nextTick();

    expect(root.querySelector('.c7-launcher')).not.toBeNull();
    expect(root.querySelector('.context7-widget-trigger')).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });

  it('invalidates stale scheduled scroll work across consecutive resets', async () => {
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        initialMessage: 'Welcome once',
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 25));

    widgetRef.value!.reset();
    widgetRef.value!.reset();
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(root.querySelectorAll('.c7-message--assistant')).toHaveLength(1);
    expect(root.querySelector('.c7-message--assistant')?.textContent).toContain('Welcome once');
  });

  it('ignores a render frame delivered after reset cancelled its scroll request', async () => {
    const frames: FrameRequestCallback[] = [];
    const cancelFrame = vi.fn();
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      })
    );
    vi.stubGlobal('cancelAnimationFrame', cancelFrame);
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();

    const messages = root.querySelector<HTMLElement>('.c7-messages')!;
    const scrollWrites: number[] = [];
    Object.defineProperties(messages, {
      clientHeight: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 600 },
      scrollTop: {
        configurable: true,
        get: () => scrollWrites.at(-1) ?? 400,
        set(value: number) {
          scrollWrites.push(value);
        }
      }
    });
    expect(frames).toHaveLength(1);

    widgetRef.value!.reset();
    await nextTick();
    expect(cancelFrame).toHaveBeenCalledWith(1);
    expect(frames).toHaveLength(2);

    frames[0]!(0);
    expect(scrollWrites).toEqual([]);
    frames[1]!(0);
    expect(scrollWrites).toEqual([600]);
  });

  it('does not execute a queued bottom snap after the reader moves away', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async (_url, init?: RequestInit) =>
          await new Promise<Response>((_resolve, reject) => {
            signal = init?.signal ?? undefined;
            signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), {
              once: true
            });
          })
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
    await new Promise((resolve) => setTimeout(resolve, 25));

    const messages = root.querySelector<HTMLElement>('.c7-messages')!;
    const scrollWrites: number[] = [];
    let scrollTop = 100;
    Object.defineProperties(messages, {
      clientHeight: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 800 },
      scrollTop: {
        configurable: true,
        get: () => scrollTop,
        set(value: number) {
          scrollTop = value;
          scrollWrites.push(value);
        }
      }
    });

    const pending = widgetRef.value!.send('Do not snap me back');
    messages.dispatchEvent(new Event('scroll'));
    await nextTick();
    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(scrollTop).toBe(100);
    expect(scrollWrites).toEqual([]);

    widgetRef.value!.cancel();
    await pending;
    expect(signal?.aborted).toBe(true);
  });

  it('delegates explicit code copies and ignores non-element or detached-code clicks', async () => {
    const markdown = ['```ts', 'const one = 1;', '```', '', '```js', 'const two = 2;', '```'].join('\n');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            createSseStream([`data: ${JSON.stringify({ delta: markdown, type: 'text-delta' })}\n`, 'data: [DONE]\n'])
          )
      )
    );
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });
    const widgetRef = ref<Context7WidgetExpose | null>(null);
    const root = mount(() =>
      h(Context7Widget, {
        library: '/desource-labs/context7-widget',
        ref: widgetRef
      })
    );
    await nextTick();
    await widgetRef.value!.send('Show two snippets');

    const buttons = [...root.querySelectorAll<HTMLButtonElement>('[data-c7-copy-code]')];
    expect(buttons).toHaveLength(2);

    const feedbackText = document.createTextNode('feedback');
    buttons[0]!.querySelector('.c7-copy-status')!.append(feedbackText);
    feedbackText.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
    expect(writeText).not.toHaveBeenCalled();

    buttons[0]!.querySelector('path')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('const one = 1;'));

    buttons[1]!.closest('.c7-code-block')!.querySelector('code')!.remove();
    buttons[1]!.click();
    await Promise.resolve();
    expect(writeText).toHaveBeenCalledOnce();
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

  it('does not treat clicks inside the widget or its external trigger as outside clicks', async () => {
    const external = document.createElement('button');
    external.id = 'contained-trigger';
    document.body.append(external);
    const root = mount(() =>
      h(Context7Widget, {
        customTrigger: external,
        library: '/desource-labs/context7-widget'
      })
    );
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    external.click();
    await nextTick();
    external.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    widget.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    expect(widget.hasAttribute('open')).toBe(true);

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(false);
  });

  it('keeps the launcher rendered until an external selector trigger binds', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const root = mount(() =>
      h(Context7Widget, {
        customTrigger: '.late-docs-trigger',
        library: '/desource-labs/context7-widget'
      })
    );
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    expect(widget.hasAttribute('custom-trigger-active')).toBe(false);
    expect(root.querySelector('.c7-launcher')).not.toBeNull();
    expect(warn).toHaveBeenCalledWith(
      '[Context7 Widget] Custom trigger selector was not found: .late-docs-trigger. Keeping the built-in launcher visible.'
    );

    root.querySelector<HTMLButtonElement>('.c7-launcher')?.click();
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(true);

    const external = document.createElement('button');
    external.className = 'late-docs-trigger';
    document.body.append(external);

    await vi.waitFor(() => expect(widget.hasAttribute('custom-trigger-active')).toBe(true));
    await vi.waitFor(() => expect(root.querySelector('.c7-launcher')).toBeNull());

    external.click();
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(false);

    external.remove();
    await vi.waitFor(() => expect(widget.hasAttribute('custom-trigger-active')).toBe(false));
    await vi.waitFor(() => expect(root.querySelector('.c7-launcher')).not.toBeNull());
  });

  it('supports Element refs for external triggers', async () => {
    const externalTrigger = ref<Element | null>(null);
    const root = document.createElement('div');
    const app = createApp({
      render: () =>
        h('div', [
          h('button', { ref: externalTrigger }, 'Ask docs'),
          h(Context7Widget, {
            customTrigger: externalTrigger,
            library: '/desource-labs/context7-widget'
          })
        ])
    });
    mountedApps.push(app);
    document.body.append(root);
    app.mount(root);
    await nextTick();
    await nextTick();

    const widget = root.querySelector<HTMLElement>('.context7-widget')!;
    expect(widget.hasAttribute('custom-trigger-active')).toBe(true);
    expect(root.querySelector('.c7-launcher')).toBeNull();

    (externalTrigger.value as HTMLElement | null)?.click();
    await nextTick();
    expect(widget.hasAttribute('open')).toBe(true);
  });

  it('warns once for disconnected Element triggers and binds a later connected value', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const customTrigger = ref<Element | null>(document.createElement('button'));
    const root = mount(() =>
      h(Context7Widget, {
        customTrigger,
        library: '/desource-labs/context7-widget'
      })
    );
    await nextTick();

    const replacement = document.createElement('button');
    customTrigger.value = replacement;
    await nextTick();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      '[Context7 Widget] Custom trigger element is not connected. Keeping the built-in launcher visible.'
    );

    document.body.append(replacement);
    await vi.waitFor(() =>
      expect(root.querySelector('.context7-widget')?.hasAttribute('custom-trigger-active')).toBe(true)
    );
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

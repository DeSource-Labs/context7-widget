import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Context7Widget, useContext7Widget, type Context7WidgetExpose } from '../../src';
import { createSseStream } from '../../../../common/tests/unit/stream';

describe('@desource/context7-widget-vue', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('renders a configured widget element and emits ready', async () => {
    const ready = vi.fn();
    const root = document.createElement('div');
    document.body.append(root);

    createApp({
      render: () =>
        h(Context7Widget, {
          color: '#111827',
          closeOnOutsideClick: false,
          library: '/desource-labs/context7-widget',
          onReady: ready,
          position: 'center',
          preset: 'terminal',
          theme: 'dark',
          title: 'Docs assistant'
        })
    }).mount(root);

    await nextTick();

    const widget = root.querySelector('context7-widget');
    expect(widget?.getAttribute('library')).toBe('/desource-labs/context7-widget');
    expect(widget?.getAttribute('close-on-outside-click')).toBe('false');
    expect(widget?.getAttribute('position')).toBe('center');
    expect(widget?.getAttribute('preset')).toBe('terminal');
    expect(widget?.getAttribute('theme')).toBe('dark');
    expect(widget?.getAttribute('title')).toBe('Docs assistant');
    expect(ready).toHaveBeenCalledOnce();
    expect(ready.mock.calls[0]).toHaveLength(1);
    expect(ready.mock.calls[0]?.[0]).toMatchObject({
      library: '/desource-labs/context7-widget',
      widgetId: 'default'
    });
  });

  it('keeps the built-in launcher mode when customTrigger is not provided', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    createApp({
      render: () =>
        h(
          Context7Widget,
          {
            library: '/desource-labs/context7-widget'
          },
          {
            default: () => h('span', { 'data-testid': 'near-widget' }, 'Nearby content')
          }
        )
    }).mount(root);

    await nextTick();

    const widget = root.querySelector('context7-widget');
    expect(root.querySelector('.context7-widget-trigger')).toBeNull();
    expect(root.querySelector('[data-testid="near-widget"]')?.textContent).toBe('Nearby content');
    expect(widget?.hasAttribute('custom-trigger')).toBe(false);
  });

  it('removes the custom element when the component unmounts', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const app = createApp({
      render: () =>
        h(Context7Widget, {
          customTrigger: true,
          library: '/desource-labs/context7-widget'
        })
    });

    app.mount(root);
    await nextTick();
    expect(root.querySelector('context7-widget')).toBeTruthy();

    app.unmount();
    await nextTick();

    expect(root.querySelector('context7-widget')).toBeNull();
  });

  it('forwards core widget events as typed Vue emits', async () => {
    const handlers = {
      answer: vi.fn(),
      answerComplete: vi.fn(),
      close: vi.fn(),
      error: vi.fn(),
      firstToken: vi.fn(),
      open: vi.fn(),
      question: vi.fn(),
      toolCall: vi.fn(),
      toolResult: vi.fn()
    };
    const root = document.createElement('div');
    document.body.append(root);

    createApp({
      render: () =>
        h(Context7Widget, {
          library: '/desource-labs/context7-widget',
          onAnswer: handlers.answer,
          onAnswerComplete: handlers.answerComplete,
          onClose: handlers.close,
          onError: handlers.error,
          onFirstToken: handlers.firstToken,
          onOpen: handlers.open,
          onQuestion: handlers.question,
          onToolCall: handlers.toolCall,
          onToolResult: handlers.toolResult
        })
    }).mount(root);

    await nextTick();

    const widget = root.querySelector('context7-widget')!;
    const baseDetail = {
      library: '/desource-labs/context7-widget',
      widget,
      widgetId: 'default'
    };

    dispatchWidgetEvent(widget, 'c7:open', baseDetail);
    dispatchWidgetEvent(widget, 'c7:question', { ...baseDetail, message: {}, messages: [], question: 'Q' });
    dispatchWidgetEvent(widget, 'c7:first-token', { ...baseDetail, answer: 'A', question: 'Q' });
    dispatchWidgetEvent(widget, 'c7:answer', { ...baseDetail, answer: 'Answer', question: 'Q' });
    dispatchWidgetEvent(widget, 'c7:tool-call', {
      ...baseDetail,
      question: 'Q',
      toolCall: { args: {}, name: 'search', toolCallId: 'tool-1' }
    });
    dispatchWidgetEvent(widget, 'c7:tool-result', {
      ...baseDetail,
      question: 'Q',
      toolResult: { result: { ok: true }, toolCallId: 'tool-1' }
    });
    dispatchWidgetEvent(widget, 'c7:answer-complete', {
      ...baseDetail,
      answer: 'Answer',
      message: {},
      messages: [],
      question: 'Q'
    });
    dispatchWidgetEvent(widget, 'c7:error', { ...baseDetail, error: 'Boom', question: 'Q' });
    dispatchWidgetEvent(widget, 'c7:close', baseDetail);

    expect(handlers.open).toHaveBeenCalledWith(baseDetail);
    expect(handlers.question.mock.calls[0]?.[0]).toMatchObject({ question: 'Q' });
    expect(handlers.firstToken.mock.calls[0]?.[0]).toMatchObject({ answer: 'A' });
    expect(handlers.answer.mock.calls[0]?.[0]).toMatchObject({ answer: 'Answer' });
    expect(handlers.toolCall.mock.calls[0]?.[0]).toMatchObject({ toolCall: { toolCallId: 'tool-1' } });
    expect(handlers.toolResult.mock.calls[0]?.[0]).toMatchObject({ toolResult: { toolCallId: 'tool-1' } });
    expect(handlers.answerComplete.mock.calls[0]?.[0]).toMatchObject({ answer: 'Answer' });
    expect(handlers.error.mock.calls[0]?.[0]).toMatchObject({ error: 'Boom' });
    expect(handlers.close).toHaveBeenCalledWith(baseDetail);
  });

  it('renders and wires a managed trigger when customTrigger is true', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    createApp({
      render: () =>
        h(Context7Widget, {
          customTrigger: true,
          launcherLabel: 'Ask docs',
          library: '/desource-labs/context7-widget',
          position: 'anchor',
          preset: 'glass'
        })
    }).mount(root);

    await nextTick();

    const trigger = root.querySelector<HTMLButtonElement>('.context7-widget-trigger');
    const widget = root.querySelector('context7-widget');

    expect(trigger?.textContent?.trim()).toBe('Ask docs');
    expect(trigger?.id).toMatch(/^context7-widget-trigger-/);
    expect(trigger?.getAttribute('data-preset')).toBe('glass');
    expect(widget?.getAttribute('custom-trigger')).toBe(`#${trigger?.id}`);

    trigger?.click();

    expect(widget?.hasAttribute('open')).toBe(true);
  });

  it('normalizes custom trigger ids when customTrigger is a string', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    createApp({
      render: () =>
        h(Context7Widget, {
          customTrigger: 'docs-help',
          library: '/desource-labs/context7-widget'
        })
    }).mount(root);

    await nextTick();

    expect(root.querySelector('.context7-widget-trigger')).toBeNull();
    expect(root.querySelector('context7-widget')?.getAttribute('custom-trigger')).toBe('#docs-help');
  });

  it('keeps custom trigger strings with an existing hash normalized', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    createApp({
      render: () =>
        h(Context7Widget, {
          customTrigger: '#docs-help',
          library: '/desource-labs/context7-widget'
        })
    }).mount(root);

    await nextTick();

    expect(root.querySelector('context7-widget')?.getAttribute('custom-trigger')).toBe('#docs-help');
  });

  it('renders a managed trigger slot with trigger metadata', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    createApp({
      render: () =>
        h(
          Context7Widget,
          {
            customTrigger: true,
            launcherLabel: 'Ask docs',
            library: '/desource-labs/context7-widget'
          },
          {
            trigger: ({ label, triggerId }: { label: string; triggerId: string }) =>
              h('span', { 'data-testid': 'slot-trigger', 'data-trigger-id': triggerId }, label)
          }
        )
    }).mount(root);

    await nextTick();

    const slot = root.querySelector<HTMLElement>('[data-testid="slot-trigger"]');
    const trigger = root.querySelector<HTMLButtonElement>('.context7-widget-trigger');

    expect(slot?.textContent).toBe('Ask docs');
    expect(slot?.dataset.triggerId).toBe(trigger?.id);
  });

  it('exposes imperative widget methods through refs', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const component = defineComponent({
      setup() {
        const widgetRef = ref<Context7WidgetExpose | null>(null);
        return { widgetRef };
      },
      render() {
        return h(Context7Widget, {
          ref: 'widgetRef',
          library: '/desource-labs/context7-widget',
          widgetId: 'ref-docs'
        });
      }
    });

    const vm = createApp(component).mount(root) as unknown as {
      widgetRef: Context7WidgetExpose | null;
    };

    await nextTick();

    vm.widgetRef?.open();
    expect(vm.widgetRef?.isOpen()).toBe(true);

    vm.widgetRef?.toggle();
    expect(vm.widgetRef?.isOpen()).toBe(false);

    vm.widgetRef?.open();
    vm.widgetRef?.close();
    expect(vm.widgetRef?.isOpen()).toBe(false);
  });

  it('mounts and controls a widget from the composable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(createSseStream(['data: {"type":"text-delta","delta":"Hello"}\n'])))
    );

    const root = document.createElement('div');
    document.body.append(root);

    const component = defineComponent({
      setup() {
        const controller = useContext7Widget({
          autoMount: true,
          library: '/desource-labs/context7-widget',
          widgetId: 'docs'
        });

        return { controller };
      },
      render: () => h('div')
    });

    const app = createApp(component);
    const vm = app.mount(root) as unknown as {
      controller: ReturnType<typeof useContext7Widget>;
    };

    await nextTick();
    await vm.controller.send('What is this?');

    expect(vm.controller.isOpen.value).toBe(true);
    expect(document.body.querySelector('context7-widget')?.shadowRoot?.textContent).toContain('Hello');
  });

  it('updates composable-owned widget attributes from reactive options', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const component = defineComponent({
      setup() {
        const preset = ref<'glass' | 'terminal'>('glass');
        const controller = useContext7Widget(() => ({
          autoMount: true,
          library: '/desource-labs/context7-widget',
          preset: preset.value,
          widgetId: 'reactive-docs'
        }));

        return { controller, preset };
      },
      render: () => h('div')
    });

    const vm = createApp(component).mount(root) as unknown as {
      controller: ReturnType<typeof useContext7Widget>;
      preset: 'glass' | 'terminal';
    };

    await nextTick();
    expect(vm.controller.widget.value?.getAttribute('preset')).toBe('glass');

    vm.preset = 'terminal';
    await nextTick();

    expect(vm.controller.widget.value?.getAttribute('preset')).toBe('terminal');
  });

  it('throws a useful composable error when mounting without a library', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const errors: unknown[] = [];

    const component = defineComponent({
      setup() {
        const controller = useContext7Widget();
        return { controller };
      },
      render: () => h('div')
    });

    const app = createApp(component);
    app.config.errorHandler = (error) => errors.push(error);
    const vm = app.mount(root) as unknown as {
      controller: ReturnType<typeof useContext7Widget>;
    };

    await nextTick();

    expect(() => vm.controller.mount()).toThrow('useContext7Widget mount requires a library option.');
  });

  it('reuses an existing widget by id when autoMount is disabled', async () => {
    const existing = document.createElement('context7-widget');
    existing.setAttribute('library', '/desource-labs/context7-widget');
    existing.setAttribute('widget-id', 'existing-docs');
    document.body.append(existing);

    const root = document.createElement('div');
    document.body.append(root);

    const component = defineComponent({
      setup() {
        const color = ref('');
        const controller = useContext7Widget(() => ({
          color: color.value,
          widgetId: 'existing-docs'
        }));

        return { color, controller };
      },
      render: () => h('div')
    });

    const vm = createApp(component).mount(root) as unknown as {
      color: string;
      controller: ReturnType<typeof useContext7Widget>;
    };

    await nextTick();

    vm.controller.open();
    expect(vm.controller.widget.value).toBe(existing);
    expect(vm.controller.isOpen.value).toBe(true);

    vm.color = '#22c55e';
    await nextTick();

    expect(existing.getAttribute('color')).toBe('#22c55e');

    vm.controller.close();
    expect(vm.controller.isOpen.value).toBe(false);
  });

  it('can keep an auto-mounted composable widget after component unmount', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const component = defineComponent({
      setup() {
        const controller = useContext7Widget({
          autoMount: true,
          library: '/desource-labs/context7-widget',
          removeOnUnmount: false,
          widgetId: 'persisted-docs'
        });

        return { controller };
      },
      render: () => h('div')
    });

    const app = createApp(component);
    app.mount(root);
    await nextTick();

    const widget = document.body.querySelector('context7-widget[widget-id="persisted-docs"]');
    expect(widget).toBeTruthy();

    app.unmount();
    await nextTick();

    expect(document.body.querySelector('context7-widget[widget-id="persisted-docs"]')).toBe(widget);
    widget?.remove();
  });
});

function dispatchWidgetEvent(element: Element, name: string, detail: Record<string, unknown>): void {
  element.dispatchEvent(
    new CustomEvent(name, {
      detail
    })
  );
}

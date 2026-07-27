import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Context7Widget, useContext7Widget, type Context7WidgetExpose } from '../../src';
import { createSseStream } from '../../../../common/tests/unit/stream';
import { expectAlwaysVisibleBranding } from '../../../../common/tests/unit/widget-contract';

describe('@desource/context7-widget-vue', () => {
  afterEach(() => {
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

    createApp({
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
    }).mount(root);

    await nextTick();
    expect(root.querySelector('.c7-launcher')).toBeTruthy();

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
    const vm = createApp(Host).mount(hostRoot) as unknown as {
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
    const root = document.createElement('div');
    const hostRoot = document.createElement('div');
    document.body.append(root, hostRoot);

    const Host = defineComponent({
      setup() {
        return {
          controller: useContext7Widget(() => ({
            autoMount: true,
            library: '/desource-labs/context7-widget',
            preset: preset.value,
            target: root,
            widgetId: 'reactive-docs'
          }))
        };
      },
      render: () => h('div')
    });
    createApp(Host).mount(hostRoot);

    await nextTick();
    expect(root.querySelector('.context7-widget')?.getAttribute('preset')).toBe('glass');
    preset.value = 'terminal';
    await nextTick();
    expect(root.querySelector('.context7-widget')?.getAttribute('preset')).toBe('terminal');
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
});

function mount(renderWidget: () => ReturnType<typeof h>): HTMLElement {
  const root = document.createElement('div');
  document.body.append(root);
  createApp({ render: renderWidget }).mount(root);
  return root;
}

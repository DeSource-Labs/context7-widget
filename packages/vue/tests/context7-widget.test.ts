import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Context7Widget, useContext7Widget } from '../src';

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
  });

  it('mounts and controls a widget from the composable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(stream(['data: {"type":"text-delta","delta":"Hello"}\n'])))
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

import { createApp, defineComponent, h, inject, nextTick, resolveComponent } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { context7WidgetDefaultsKey, createContext7WidgetPlugin } from '../../src/plugin';

describe('createContext7WidgetPlugin', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('registers a configurable component name and provides defaults', async () => {
    const root = document.createElement('div');
    document.body.append(root);

    const Child = defineComponent({
      setup() {
        return { defaults: inject(context7WidgetDefaultsKey) };
      },
      render() {
        return h('span', { id: 'defaults' }, this.defaults?.library);
      }
    });

    const Root = defineComponent({
      render: () => {
        const CustomContext7Widget = resolveComponent('CustomContext7Widget');

        return h('div', [
          h(CustomContext7Widget, {
            library: '/desource-labs/context7-widget',
            widgetId: 'component'
          }),
          h(Child)
        ]);
      }
    });

    const app = createApp(Root);

    app.use(
      createContext7WidgetPlugin({
        componentName: 'CustomContext7Widget',
        defaultWidget: { library: '/default/docs', widgetId: 'default-docs' }
      })
    );
    app.mount(root);
    await nextTick();

    expect(root.querySelector('#defaults')?.textContent).toBe('/default/docs');
    expect(root.querySelector('context7-widget[widget-id="component"]')).toBeTruthy();
    expect(document.body.querySelector('context7-widget[widget-id="default-docs"]')).toBeTruthy();
  });
});

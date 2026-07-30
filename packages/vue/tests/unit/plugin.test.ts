import { createApp, defineComponent, h, inject, nextTick, resolveComponent, type App } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { context7WidgetDefaultsKey, createContext7WidgetPlugin } from '../../src/plugin';

const mountedApps: App[] = [];

describe('createContext7WidgetPlugin', () => {
  afterEach(() => {
    for (const app of mountedApps.splice(0).reverse()) app.unmount();
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
    mountedApps.push(app);

    app.use(
      createContext7WidgetPlugin({
        componentName: 'CustomContext7Widget',
        defaults: { library: '/default/docs', widgetId: 'default-docs' }
      })
    );
    app.mount(root);
    await nextTick();

    expect(root.querySelector('#defaults')?.textContent).toBe('/default/docs');
    const widget = root.querySelector('.context7-widget[widget-id="component"]');
    expect(widget).toBeTruthy();
    expect(widget?.getAttribute('library')).toBe('/desource-labs/context7-widget');
    expect(document.body.querySelector('.context7-widget[widget-id="default-docs"]')).toBeNull();
  });

  it('supports the default component name without auto-mounting another widget', async () => {
    const root = document.createElement('div');
    document.body.append(root);
    const Root = defineComponent({
      render: () => h(resolveComponent('Context7Widget'), { library: '/explicit/repo' })
    });
    const app = createApp(Root);
    mountedApps.push(app);
    app.use(createContext7WidgetPlugin());
    app.mount(root);
    await nextTick();

    expect(root.querySelector('.context7-widget')?.getAttribute('library')).toBe('/explicit/repo');
    expect(root.querySelector('.context7-widget')?.getAttribute('preset')).toBe('default');
    expect(document.querySelectorAll('.context7-widget')).toHaveLength(1);
  });
});

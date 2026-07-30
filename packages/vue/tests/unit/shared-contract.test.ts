import { createApp, h, nextTick, ref } from 'vue';
import { Context7Widget, type Context7WidgetExpose } from '../../src';
import { testContext7WidgetContract, type Context7WidgetContractAdapter } from '@common/tests/unit/context7-widget';

const adapter: Context7WidgetContractAdapter = {
  suiteName: 'Vue component',
  async mount(props) {
    const container = document.createElement('div');
    const widget = ref<Context7WidgetExpose | null>(null);
    const app = createApp({
      render: () =>
        h(Context7Widget, {
          customTrigger: props.customTrigger,
          initialMessage: props.initialMessage,
          library: props.library,
          ref: widget
        })
    });
    document.body.append(container);
    app.mount(container);
    await nextTick();

    if (!widget.value) throw new Error('Expected Vue to expose the widget controller.');

    return {
      controller: widget.value,
      flush: async () => {
        await nextTick();
      },
      unmount: () => {
        app.unmount();
        container.remove();
      },
      view: container
    };
  }
};

testContext7WidgetContract(adapter);

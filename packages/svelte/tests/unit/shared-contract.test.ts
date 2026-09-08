import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { testContext7WidgetContract, type Context7WidgetContractAdapter } from '@common/tests/unit/context7-widget';
import Context7Widget from '@src/Context7Widget.svelte';

const adapter: Context7WidgetContractAdapter = {
  suiteName: 'Svelte component',
  async mount(props) {
    const result = render(Context7Widget, { props });
    flushSync();
    const element = result.container.querySelector<HTMLElement>('.context7-widget');
    if (!element) throw new Error('Expected native Svelte widget root.');

    return {
      controller: result.component,
      flush: async () => flushSync(),
      unmount: result.unmount,
      view: element
    };
  }
};

testContext7WidgetContract(adapter);

import { Context7WidgetElement, defineContext7Widget } from '../../src';
import { testContext7WidgetContract, type Context7WidgetContractAdapter } from '@common/tests/unit/context7-widget';

const adapter: Context7WidgetContractAdapter = {
  suiteName: 'core custom element',
  mount(props) {
    defineContext7Widget();
    const widget = document.createElement('context7-widget') as Context7WidgetElement;
    widget.setAttribute('library', props.library);
    if (props.customTrigger !== undefined) widget.setAttribute('custom-trigger', props.customTrigger);
    if (props.initialMessage !== undefined) widget.setAttribute('initial-message', props.initialMessage);
    document.body.append(widget);

    const view = widget.shadowRoot;
    if (!view) throw new Error('Expected the core widget to create a shadow root.');

    return {
      controller: widget,
      flush: async () => undefined,
      unmount: () => widget.remove(),
      view
    };
  }
};

testContext7WidgetContract(adapter);

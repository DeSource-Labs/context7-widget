import { testContext7WidgetContract, type Context7WidgetContractAdapter } from '@common/tests/unit/context7-widget';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Context7Widget, type Context7WidgetHandle } from '../../src';

const adapter: Context7WidgetContractAdapter = {
  suiteName: 'React component',
  async mount(props) {
    const container = document.createElement('div');
    const root = createRoot(container);
    const controllerRef: { current: Context7WidgetHandle | null } = { current: null };
    document.body.append(container);
    await act(async () => {
      root.render(
        <Context7Widget
          ref={(value) => {
            controllerRef.current = value;
          }}
          customTrigger={props.customTrigger}
          initialMessage={props.initialMessage}
          labels={props.labels}
          library={props.library}
          position={props.position}
        />
      );
    });
    if (!controllerRef.current) throw new Error('Expected React to expose the widget controller.');

    const nativeController = controllerRef.current;
    const controllerProxy: Context7WidgetHandle = {
      cancel() {
        act(() => nativeController.cancel());
      },
      close() {
        act(() => nativeController.close());
      },
      get element() {
        return nativeController.element;
      },
      getMessages: () => nativeController.getMessages(),
      isBusy: () => nativeController.isBusy(),
      isOpen: () => nativeController.isOpen(),
      open() {
        act(() => nativeController.open());
      },
      reset() {
        act(() => nativeController.reset());
      },
      retry: async () => {
        let pending!: ReturnType<Context7WidgetHandle['retry']>;
        act(() => {
          pending = nativeController.retry();
        });
        const result = await pending;
        await act(async () => undefined);
        return result;
      },
      send: async (message) => {
        let pending!: ReturnType<Context7WidgetHandle['send']>;
        act(() => {
          pending = nativeController.send(message);
        });
        const result = await pending;
        await act(async () => undefined);
        return result;
      },
      subscribe: (listener) => nativeController.subscribe(listener),
      toggle() {
        act(() => nativeController.toggle());
      }
    };

    return {
      controller: controllerProxy,
      flush: async () => {
        await act(async () => {
          await Promise.resolve();
        });
      },
      interact: async (action) => {
        await act(async () => {
          action();
          await Promise.resolve();
          await Promise.resolve();
          await Promise.resolve();
        });
      },
      unmount: () => {
        act(() => root.unmount());
        container.remove();
      },
      view: container
    };
  }
};

testContext7WidgetContract(adapter);

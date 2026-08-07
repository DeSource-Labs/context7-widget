import {
  createContext7Widget,
  getContext7Widget,
  type Context7WidgetInstance,
  type Context7WidgetSendResult
} from '../../src/index.js';

declare function expectType<Type>(value: Type): void;

const widget: Context7WidgetInstance | undefined = getContext7Widget('docs');
widget?.cancel();
expectType<Promise<Context7WidgetSendResult | undefined> | undefined>(widget?.send('How do I configure the widget?'));

createContext7Widget({
  customTrigger: document.createElement('button'),
  library: '/desource-labs/context7-widget'
});

document.addEventListener('c7:question', (event) => {
  expectType<string>(event.detail.question);
  expectType<string>(event.detail.message.id);
});

document.addEventListener('c7:cancel', (event) => {
  expectType<'cancelled' | 'complete' | undefined>(event.detail.message?.status);
  expectType<readonly string[]>(event.detail.messages.map((message) => message.content));
});

document.addEventListener('c7:ready', (event) => {
  expectType<string>(event.detail.library);

  // @ts-expect-error Lifecycle events intentionally have no question payload.
  expectType<string>(event.detail.question);
});

import { getContext7Widget, type Context7WidgetInstance } from '../../src/index.js';

const widget: Context7WidgetInstance | undefined = getContext7Widget('docs');
widget?.cancel();
void widget?.send('How do I configure the widget?');

document.addEventListener('c7:question', (event) => {
  const question: string = event.detail.question;
  const messageId: string = event.detail.message.id;
  void question;
  void messageId;
});

document.addEventListener('c7:ready', (event) => {
  const library: string = event.detail.library;
  void library;

  // @ts-expect-error Lifecycle events intentionally have no question payload.
  void event.detail.question;
});

import type { Context7WidgetProps, Context7WidgetQuestionEventDetail, UseContext7WidgetReturn } from '../../src';
import { useContext7Widget } from '../../src';

const props = {
  library: '/desource-labs/context7-widget',
  position: 'center',
  preset: 'glass',
  customTrigger: true
} satisfies Context7WidgetProps;

const controller: UseContext7WidgetReturn = useContext7Widget(props);
const open: boolean = controller.isOpen.value;
const messages: readonly string[] = controller.messages.value.map((message) => message.content);
void open;
void messages;

function onQuestion(detail: Context7WidgetQuestionEventDetail): void {
  const question: string = detail.question;
  const widget: HTMLElement = detail.widget;
  void question;
  void widget;
}
void onQuestion;

const invalidProps = {
  library: '/desource-labs/context7-widget',
  // @ts-expect-error Unsupported positions must fail at compile time.
  position: 'side'
} satisfies Context7WidgetProps;
void invalidProps;

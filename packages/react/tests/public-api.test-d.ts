import type {
  Context7WidgetHandle,
  Context7WidgetLabels,
  Context7WidgetProps,
  Context7WidgetQuestionEventDetail,
  Context7WidgetSendResult,
  UseContext7WidgetReturn
} from '../src';

declare function expectType<Type>(value: Type): void;

expectType<Partial<Context7WidgetLabels>>({ poweredBy: 'Propulsé par' });

function onQuestion(detail: Context7WidgetQuestionEventDetail): void {
  expectType<string>(detail.question);
  expectType<HTMLElement>(detail.widget);
}
expectType<(detail: Context7WidgetQuestionEventDetail) => void>(onQuestion);

const props = {
  customTrigger: true,
  library: '/desource-labs/context7-widget',
  onOpenChange: (_open: boolean) => undefined,
  open: true,
  position: 'center'
} satisfies Context7WidgetProps;
expectType<string>(props.library);

declare const handle: Context7WidgetHandle;
expectType<Promise<Context7WidgetSendResult | undefined>>(handle.retry());

declare const hook: UseContext7WidgetReturn;
expectType<boolean>(hook.isOpen);
expectType<Promise<Context7WidgetSendResult | undefined>>(hook.send('Question'));

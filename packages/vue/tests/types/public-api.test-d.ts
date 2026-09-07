import type {
  Context7WidgetCancelEventDetail,
  Context7WidgetLabels,
  Context7WidgetProps,
  Context7WidgetQuestionEventDetail,
  Context7WidgetSendResult,
  UseContext7WidgetReturn
} from '../../src';
import { useContext7Widget } from '../../src';
import { ref } from 'vue';

declare function expectType<Type>(value: Type): void;

expectType<Partial<Context7WidgetLabels>>({ poweredBy: 'Propulsé par' });
expectType<Context7WidgetProps>({ preset: 'glass' });

const props = {
  library: '/desource-labs/context7-widget',
  position: 'center',
  preset: 'glass',
  customTrigger: true
} satisfies Context7WidgetProps;

const controller: UseContext7WidgetReturn = useContext7Widget(props);
expectType<boolean>(controller.isOpen.value);
expectType<readonly string[]>(controller.messages.value.map((message) => message.content));
expectType<Promise<Context7WidgetSendResult | undefined>>(controller.send('How do refs work?'));
expectType<Promise<Context7WidgetSendResult | undefined>>(controller.retry());

const trigger = ref<HTMLElement | null>(null);
expectType<Context7WidgetProps>({
  customTrigger: trigger,
  library: '/desource-labs/context7-widget',
  open: true
});

function onQuestion(detail: Context7WidgetQuestionEventDetail): void {
  expectType<string>(detail.question);
  expectType<HTMLElement>(detail.widget);
}
expectType<(detail: Context7WidgetQuestionEventDetail) => void>(onQuestion);

function onCancel(detail: Context7WidgetCancelEventDetail): void {
  expectType<string>(detail.answer);
  expectType<'cancelled' | 'complete' | undefined>(detail.message?.status);
}
expectType<(detail: Context7WidgetCancelEventDetail) => void>(onCancel);

expectType<Context7WidgetProps>({
  library: '/desource-labs/context7-widget',
  // @ts-expect-error Unsupported positions must fail at compile time.
  position: 'side'
});

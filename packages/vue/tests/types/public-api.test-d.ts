import type { Context7WidgetProps, Context7WidgetQuestionEventDetail, UseContext7WidgetReturn } from '../../src';
import { useContext7Widget } from '../../src';
import { ref } from 'vue';

declare function expectType<Type>(value: Type): void;

const props = {
  library: '/desource-labs/context7-widget',
  position: 'center',
  preset: 'glass',
  customTrigger: true
} satisfies Context7WidgetProps;

const controller: UseContext7WidgetReturn = useContext7Widget(props);
expectType<boolean>(controller.isOpen.value);
expectType<readonly string[]>(controller.messages.value.map((message) => message.content));

const trigger = ref<HTMLElement | null>(null);
expectType<Context7WidgetProps>({
  customTrigger: trigger,
  library: '/desource-labs/context7-widget'
});

function onQuestion(detail: Context7WidgetQuestionEventDetail): void {
  expectType<string>(detail.question);
  expectType<HTMLElement>(detail.widget);
}
expectType<(detail: Context7WidgetQuestionEventDetail) => void>(onQuestion);

expectType<Context7WidgetProps>({
  library: '/desource-labs/context7-widget',
  // @ts-expect-error Unsupported positions must fail at compile time.
  position: 'side'
});

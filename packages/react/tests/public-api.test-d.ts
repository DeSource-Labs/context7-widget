import type {
  Context7WidgetHandle,
  Context7WidgetLabels,
  Context7WidgetProps,
  Context7WidgetQuestionEventDetail,
  Context7WidgetSendResult,
  UseContext7WidgetReturn
} from '../src';
import { Context7Widget as ComponentEntryWidget } from '@src/component';
import type { Context7WidgetProps as ComponentEntryProps } from '@src/component';
import { useContext7Widget as HookEntryHook } from '@src/hook';
import type { UseContext7WidgetOptions as HookEntryOptions } from '@src/hook';

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
expectType<typeof import('../src').Context7Widget>(ComponentEntryWidget);
expectType<Context7WidgetProps>({ library: '/owner/repo' } satisfies ComponentEntryProps);
expectType<typeof import('../src').useContext7Widget>(HookEntryHook);
expectType<HookEntryOptions>({ autoMount: true, library: '/owner/repo' });

declare const handle: Context7WidgetHandle;
expectType<Promise<Context7WidgetSendResult | undefined>>(handle.retry());

declare const hook: UseContext7WidgetReturn;
expectType<boolean>(hook.isOpen);
expectType<Promise<Context7WidgetSendResult | undefined>>(hook.send('Question'));

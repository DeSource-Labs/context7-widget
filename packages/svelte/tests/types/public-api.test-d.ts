import type { ComponentProps } from 'svelte';
import {
  Context7Widget,
  createContext7Widget,
  type Context7WidgetHandle,
  type Context7WidgetLabels,
  type Context7WidgetProps,
  type Context7WidgetQuestionEventDetail,
  type Context7WidgetSendResult,
  type Context7WidgetStore
} from '@src/index';

declare function expectType<Type>(value: Type): void;

expectType<Partial<Context7WidgetLabels>>({ poweredBy: 'Propulsé par' });
expectType<ComponentProps<typeof Context7Widget>>({
  customTrigger: true,
  library: '/owner/repo',
  onQuestion: (detail) => expectType<string>(detail.question),
  open: true,
  position: 'center'
} satisfies Context7WidgetProps);

function onQuestion(detail: Context7WidgetQuestionEventDetail): void {
  expectType<string>(detail.question);
  expectType<HTMLElement>(detail.widget);
}
expectType<(detail: Context7WidgetQuestionEventDetail) => void>(onQuestion);

const controller = createContext7Widget({ library: '/owner/repo' });
expectType<Context7WidgetStore>(controller);
expectType<HTMLElement>(controller.mount());
expectType<Promise<Context7WidgetSendResult | undefined>>(controller.retry());
expectType<Promise<Context7WidgetSendResult | undefined>>(controller.send('How do I install it?'));
expectType<readonly Context7WidgetSendResult['messages'][number][]>(controller.messages);
expectType<HTMLElement | null>(controller.element);

declare const handle: Context7WidgetHandle;
expectType<HTMLElement | null>(handle.element());
expectType<() => void>(handle.subscribe(() => undefined));

// @ts-expect-error managed triggers require the declarative Svelte component
createContext7Widget({ customTrigger: true, library: '/owner/repo' });
// @ts-expect-error presets are a closed public union
createContext7Widget({ library: '/owner/repo', preset: 'unknown' });

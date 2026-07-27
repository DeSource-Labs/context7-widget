import type { InjectionKey } from 'vue';
import type { Context7WidgetOptions } from '@desource/context7-widget/kit';

export const context7WidgetDefaultsKey: InjectionKey<Partial<Context7WidgetOptions>> = Symbol('context7WidgetDefaults');

import type { Context7WidgetOptions } from '@desource/context7-widget';

const optionKeys = [
  'backdrop',
  'closeOnOutsideClick',
  'color',
  'customTrigger',
  'defaultOpen',
  'initialMessage',
  'launcherLabel',
  'launcherVariant',
  'library',
  'panelHeight',
  'panelWidth',
  'placeholder',
  'position',
  'preset',
  'showPoweredBy',
  'theme',
  'title',
  'widgetId'
] as const satisfies Array<keyof Context7WidgetOptions>;

export function compactWidgetOptions(options: Partial<Context7WidgetOptions>): Partial<Context7WidgetOptions> {
  const compacted: Partial<Context7WidgetOptions> = {};

  for (const key of optionKeys) {
    const value = options[key];
    if (value === undefined || value === '') continue;
    compacted[key] = value as never;
  }

  return compacted;
}

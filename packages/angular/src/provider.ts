import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import type { Context7WidgetAngularDefaults } from './types';

export const CONTEXT7_WIDGET_DEFAULTS = new InjectionToken<Context7WidgetAngularDefaults>('CONTEXT7_WIDGET_DEFAULTS', {
  factory: () => ({})
});

/** Provides application-wide defaults without mounting a widget. */
export function provideContext7Widget(defaults: Context7WidgetAngularDefaults = {}): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: CONTEXT7_WIDGET_DEFAULTS, useValue: { ...defaults } }]);
}

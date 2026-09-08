import { describe, expect, it } from 'vitest';
import {
  CONTEXT7_WIDGET_DEFAULTS,
  Context7Widget,
  Context7WidgetService,
  Context7WidgetTrigger,
  provideContext7Widget
} from '@src/public-api';

describe('public entry', () => {
  it('exports the Angular runtime surface', () => {
    expect(Context7Widget).toBeTypeOf('function');
    expect(Context7WidgetService).toBeTypeOf('function');
    expect(Context7WidgetTrigger).toBeTypeOf('function');
    expect(CONTEXT7_WIDGET_DEFAULTS).toBeDefined();
    expect(provideContext7Widget({ theme: 'dark' })).toBeDefined();
  });
});

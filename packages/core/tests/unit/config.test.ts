import { describe, expect, it } from 'vitest';
import { context7WidgetDefaults, normalizeContext7WidgetTrigger, resolveContext7WidgetConfig } from '../../src/kit';

describe('widget config', () => {
  it('provides immutable documented defaults', () => {
    expect(Object.isFrozen(context7WidgetDefaults)).toBe(true);
    expect(context7WidgetDefaults).toMatchObject({
      closeOnOutsideClick: true,
      launcherVariant: 'icon',
      position: 'bottom-right',
      preset: 'default',
      theme: 'auto',
      widgetId: 'default'
    });
  });

  it('normalizes untyped JavaScript input and derives centered backdrops', () => {
    expect(
      resolveContext7WidgetConfig({
        backdrop: 'yes',
        closeOnOutsideClick: 0,
        launcherVariant: 'large',
        library: '  /vercel/next.js  ',
        position: 'center',
        preset: 'unknown',
        theme: 'system',
        widgetId: '  docs  '
      })
    ).toMatchObject({
      backdrop: true,
      closeOnOutsideClick: true,
      launcherVariant: 'icon',
      library: '/vercel/next.js',
      position: 'center',
      preset: 'default',
      theme: 'auto',
      widgetId: 'docs'
    });
  });

  it('respects an explicit false backdrop and preserves meaningful message whitespace', () => {
    const initialMessage = '  First line\n\n    indented code  ';
    const config = resolveContext7WidgetConfig({
      backdrop: false,
      initialMessage,
      library: '/owner/repo',
      position: 'center'
    });

    expect(config.backdrop).toBe(false);
    expect(config.initialMessage).toBe(initialMessage);
  });

  it('accepts simple trigger ids and preserves full CSS selectors', () => {
    expect(normalizeContext7WidgetTrigger('docs-help')).toBe('#docs-help');
    expect(normalizeContext7WidgetTrigger('.navigation [data-docs]')).toBe('.navigation [data-docs]');
    expect(normalizeContext7WidgetTrigger('  ')).toBe('');
  });
});

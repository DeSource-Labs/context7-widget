import { describe, expect, it } from 'vitest';
import { compactContext7WidgetOptions, context7WidgetEvents, isContext7WidgetEventName } from '../src/kit';

describe('core kit', () => {
  it('exports canonical widget event names', () => {
    expect(context7WidgetEvents).toEqual([
      'c7:ready',
      'c7:open',
      'c7:close',
      'c7:question',
      'c7:first-token',
      'c7:answer',
      'c7:answer-complete',
      'c7:tool-call',
      'c7:tool-result',
      'c7:error'
    ]);
    expect(isContext7WidgetEventName('c7:question')).toBe(true);
    expect(isContext7WidgetEventName('question')).toBe(false);
  });

  it('compacts widget options for framework wrappers', () => {
    expect(
      compactContext7WidgetOptions({
        color: '',
        customTrigger: '#docs-chat',
        library: '/desource-labs/context7-widget',
        panelHeight: undefined,
        theme: 'dark'
      })
    ).toEqual({
      customTrigger: '#docs-chat',
      library: '/desource-labs/context7-widget',
      theme: 'dark'
    });
  });
});

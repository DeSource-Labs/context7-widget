import { describe, expect, it } from 'vitest';
import * as core from '../../src/core';
import * as kit from '../../src/kit';

describe('core kit', () => {
  it('exports canonical widget event names', () => {
    expect(kit.context7WidgetEvents).toEqual([
      'c7:ready',
      'c7:open',
      'c7:close',
      'c7:cancel',
      'c7:question',
      'c7:first-token',
      'c7:answer',
      'c7:answer-complete',
      'c7:tool-call',
      'c7:tool-result',
      'c7:error'
    ]);
    expect(kit.isContext7WidgetEventName('c7:question')).toBe(true);
    expect(kit.isContext7WidgetEventName('question')).toBe(false);
  });

  it('compacts widget options for framework wrappers', () => {
    expect(
      kit.compactContext7WidgetOptions({
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

  it('keeps the framework kit as a strict superset of the core entry point', () => {
    for (const [name, value] of Object.entries(core)) {
      expect(kit).toHaveProperty(name, value);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import * as core from '@src/core';
import * as kit from '@src/kit';

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

  it('merges option layers without dropping partial localization defaults', () => {
    expect(
      kit.mergeContext7WidgetOptions(
        {
          labels: { close: 'Dismiss', send: 'Ask' },
          library: '/default/library',
          preset: 'minimal'
        },
        {
          labels: { send: 'Search' },
          library: '',
          theme: 'dark'
        }
      )
    ).toEqual({
      labels: { close: 'Dismiss', send: 'Search' },
      library: '/default/library',
      preset: 'minimal',
      theme: 'dark'
    });
  });

  it('keeps duplicate-id registries ordered without duplicate handles', () => {
    let changes = 0;
    const registry = kit.createContext7StackedRegistry<object>(() => {
      changes += 1;
    });
    const first = {};
    const second = {};

    registry.register('docs', first);
    registry.register('docs', second);
    registry.register('docs', first);
    expect(registry.get('docs')).toBe(second);
    expect(registry.get()).toBe(second);
    expect(changes).toBe(2);

    registry.unregister('docs', second);
    expect(registry.get('docs')).toBe(first);
    registry.unregister('docs', second);
    registry.unregister('docs', first);
    expect(registry.get('docs')).toBeUndefined();
    expect(changes).toBe(4);
  });

  it('caches completed Markdown until content or rendering inputs change', () => {
    const renderer = vi.fn(
      (markdown: string, options: kit.Context7MarkdownOptions = {}) =>
        `${markdown}|${options.baseUrl ?? ''}|${options.copyCodeLabel ?? ''}` as kit.Context7RenderedMarkdown
    );
    const renderCompletedMarkdown = kit.createContext7CompletedMarkdownRenderer(renderer);
    const item: kit.Context7MessageDisplayItem = {
      content: '[Guide](./guide)',
      id: 'answer-1',
      kind: 'message',
      role: 'assistant'
    };
    const options = { baseUrl: 'https://context7.com/owner/first/', copyCodeLabel: 'Copy code' };

    const first = renderCompletedMarkdown(item, options);
    expect(renderCompletedMarkdown(item, { ...options })).toBe(first);
    expect(renderer).toHaveBeenCalledOnce();

    renderCompletedMarkdown(item, { ...options, baseUrl: 'https://context7.com/owner/second/' });
    renderCompletedMarkdown(item, options);
    renderCompletedMarkdown(item, { ...options, copyCodeLabel: 'Copy snippet' });
    item.content = '**Updated answer**';
    renderCompletedMarkdown(item, options);
    renderCompletedMarkdown({ ...item, id: 'answer-2' }, {});

    expect(renderer).toHaveBeenCalledTimes(6);
  });

  it('keeps the framework kit as a strict superset of the core entry point', () => {
    for (const [name, value] of Object.entries(core)) {
      expect(kit).toHaveProperty(name, value);
    }
  });
});

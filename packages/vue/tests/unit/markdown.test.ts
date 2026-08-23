import type { Context7MarkdownOptions, Context7RenderedMarkdown } from '@desource/context7-widget/kit';
import { describe, expect, it, vi } from 'vitest';
import { createCompletedMarkdownRenderer } from '../../src/internal/markdown';
import type { MessageDisplayItem } from '../../src/types';

describe('completed Markdown cache', () => {
  it('reuses completed HTML until content or a rendering input changes', () => {
    const renderer = vi.fn(
      (markdown: string, options: Context7MarkdownOptions = {}) =>
        `${markdown}|${options.baseUrl ?? ''}|${options.copyCodeLabel ?? ''}` as Context7RenderedMarkdown
    );
    const renderCompletedMarkdown = createCompletedMarkdownRenderer(renderer);
    const item: MessageDisplayItem = {
      content: '[Guide](./guide)\n\n```ts\nconst ready = true;\n```',
      id: 'answer-1',
      kind: 'message',
      role: 'assistant'
    };
    const options = { baseUrl: 'https://context7.com/owner/first/', copyCodeLabel: 'Copy code' };

    const first = renderCompletedMarkdown(item, options);

    expect(renderCompletedMarkdown(item, { ...options })).toBe(first);
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
});

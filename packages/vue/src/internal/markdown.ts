import {
  renderMarkdown,
  type Context7MarkdownOptions,
  type Context7RenderedMarkdown
} from '@desource/context7-widget/kit';
import type { MessageDisplayItem } from '../types';

type MarkdownRenderer = (markdown: string, options?: Context7MarkdownOptions) => Context7RenderedMarkdown;

type CompletedMarkdownCacheEntry = readonly [string, string, string, Context7RenderedMarkdown];

/** Cache completed answers by message and every option that changes their rendered HTML. */
export function createCompletedMarkdownRenderer(renderer: MarkdownRenderer = renderMarkdown) {
  const cache = new WeakMap<MessageDisplayItem, CompletedMarkdownCacheEntry>();

  return (item: MessageDisplayItem, options: Context7MarkdownOptions): Context7RenderedMarkdown => {
    const baseUrl = options.baseUrl ?? '';
    const copyCodeLabel = options.copyCodeLabel ?? '';
    const cached = cache.get(item);

    if (cached?.[0] === item.content && cached[1] === baseUrl && cached[2] === copyCodeLabel) {
      return cached[3];
    }

    const html = renderer(item.content, options);
    cache.set(item, [item.content, baseUrl, copyCodeLabel, html]);
    return html;
  };
}

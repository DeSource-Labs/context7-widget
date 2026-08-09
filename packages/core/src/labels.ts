import type { Context7WidgetLabels } from './types.js';

export const context7WidgetLabels = /* @__PURE__ */ Object.freeze({
  branding: 'Powered by Context7, Enhanced by DeSource Labs',
  close: 'Close chat',
  conversation: 'Documentation chat conversation',
  context7Attribution: 'Powered by Context7',
  copied: 'Copied',
  copyAnswer: 'Copy answer',
  copyCode: 'Copy code',
  deSourceLabsAttribution: 'Enhanced by DeSource Labs',
  enhancedBy: 'Enhanced by',
  errorFallback: 'Something went wrong.',
  errorOwnerPrefix: 'If you are the library owner, check your',
  errorSettings: 'widget settings',
  errorOwnerSuffix: 'on Context7.',
  hideResults: 'Hide results',
  input: 'Ask a documentation question',
  libraryFallback: 'this library',
  missingLibrary: 'Missing library configuration.',
  poweredBy: 'Powered by',
  responding: 'Context7 is responding',
  retry: 'Retry',
  searching: 'Searching',
  searchResults: 'Documentation search results',
  send: 'Send',
  sendQuestion: 'Send question',
  stop: 'Stop',
  stopResponse: 'Stop response',
  viewResults: 'View results'
} as const satisfies Context7WidgetLabels);

/** Merge a partial localization dictionary with the built-in English labels. */
export function resolveContext7WidgetLabels(value: unknown): Context7WidgetLabels {
  if (!value || typeof value !== 'object') return context7WidgetLabels;
  const input = value as Readonly<Record<string, unknown>>;
  const labels = { ...context7WidgetLabels } as Record<keyof Context7WidgetLabels, string>;

  for (const key of Object.keys(context7WidgetLabels) as (keyof Context7WidgetLabels)[]) {
    const candidate = input[key];
    if (typeof candidate === 'string' && candidate.trim()) labels[key] = candidate;
  }

  return Object.freeze(labels);
}

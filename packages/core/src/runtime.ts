import { escapeHtml, trimLibraryPath } from './markdown.js';
import { context7WidgetLabels } from './labels.js';
import type { Context7WidgetLabels } from './types.js';

declare const context7RenderedErrorHtml: unique symbol;

/** HTML produced by the escaping Context7 error renderer. */
export type Context7RenderedErrorHtml = string & {
  readonly [context7RenderedErrorHtml]: true;
};

export const DEFAULT_CONTEXT7_INITIAL_MESSAGE =
  "Hello! I'm here to help you with documentation for **{library}**.\n\nAsk me about features, code examples, setup, configuration, API details, or best practices.";

export function buildContext7ErrorHtml(
  message: string,
  library: string,
  labels: Pick<
    Context7WidgetLabels,
    'errorFallback' | 'errorOwnerPrefix' | 'errorOwnerSuffix' | 'errorSettings'
  > = context7WidgetLabels
): Context7RenderedErrorHtml {
  const safeMessage = escapeHtml(message || labels.errorFallback);
  const libraryPath = trimLibraryPath(library);
  const adminPath = libraryPath ? `/${libraryPath}/admin` : '/admin';
  const adminUrl = escapeHtml(encodeURI(`https://context7.com${adminPath}?tab=chat`));

  return `${safeMessage}<br><br>${escapeHtml(labels.errorOwnerPrefix)} <a href="${adminUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(labels.errorSettings)}</a> ${escapeHtml(labels.errorOwnerSuffix)}` as Context7RenderedErrorHtml;
}

export function isAbortError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { readonly name?: unknown }).name === 'AbortError'
  );
}

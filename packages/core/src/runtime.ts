import { escapeHtml } from './markdown.js';

export const DEFAULT_CONTEXT7_INITIAL_MESSAGE =
  "Hello! I'm here to help you with documentation for **{library}**.\n\nAsk me about features, code examples, setup, configuration, API details, or best practices.";

export function buildContext7ErrorHtml(message: string, library: string): string {
  const safeMessage = escapeHtml(message || 'Something went wrong.');
  const normalizedLibrary = library.startsWith('/') ? library : `/${library}`;
  const adminUrl = escapeHtml(encodeURI(`https://context7.com${normalizedLibrary}/admin?tab=chat`));

  return `${safeMessage}<br><br>If you are the library owner, check your <a href="${adminUrl}" target="_blank" rel="noopener noreferrer">widget settings</a> on Context7.`;
}

export function isAbortError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return error.name === 'AbortError';
  }

  return (
    error !== null &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { readonly name?: unknown }).name === 'AbortError'
  );
}

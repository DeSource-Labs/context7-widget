import { describe, expect, it, vi } from 'vitest';
import { buildContext7ErrorHtml, isAbortError } from '../../src/kit';

describe('runtime helpers', () => {
  it('builds an escaped, library-specific owner recovery link', () => {
    const html = buildContext7ErrorHtml('<strong>Request failed</strong>', 'owner/repo with spaces');

    expect(html).toContain('&lt;strong&gt;Request failed&lt;/strong&gt;');
    expect(html).toContain('https://context7.com/owner/repo%20with%20spaces/admin?tab=chat');
    expect(html).toContain('target="_blank" rel="noopener noreferrer"');
  });

  it('provides a useful fallback message without duplicating a leading slash', () => {
    const html = buildContext7ErrorHtml('', '/owner/repo');

    expect(html).toContain('Something went wrong.');
    expect(html).toContain('https://context7.com/owner/repo/admin?tab=chat');
    expect(html).not.toContain('context7.com//owner');
  });

  it('recognizes native and structurally compatible abort errors', () => {
    expect(isAbortError(new DOMException('Stopped', 'AbortError'))).toBe(true);
    expect(isAbortError(new DOMException('Failed', 'NetworkError'))).toBe(false);
    expect(isAbortError({ name: 'AbortError' })).toBe(true);
    expect(isAbortError({ name: 'TypeError' })).toBe(false);
    expect(isAbortError(null)).toBe(false);
  });

  it('recognizes abort errors in runtimes without DOMException', () => {
    vi.stubGlobal('DOMException', undefined);

    expect(isAbortError({ name: 'AbortError' })).toBe(true);
  });
});

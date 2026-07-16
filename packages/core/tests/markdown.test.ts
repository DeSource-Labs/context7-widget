import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../src/markdown';

describe('renderMarkdown', () => {
  it('escapes raw HTML', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).toContain('&lt;script&gt;');
  });

  it('renders simple markdown blocks', () => {
    const html = renderMarkdown('**Setup**\n\n- Install\n- Configure `middleware`');

    expect(html).toContain('<strong>Setup</strong>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<code>middleware</code>');
  });

  it('drops non-http links', () => {
    const html = renderMarkdown('[bad](javascript:alert(1)) [good](https://example.com)');

    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="https://example.com"');
  });
});

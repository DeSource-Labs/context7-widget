import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/markdown';

describe('renderMarkdown', () => {
  it('escapes raw HTML', () => {
    expect(renderMarkdown('<script>alert(1)</script>')).toContain('&lt;script&gt;');
  });

  it('renders simple markdown blocks', () => {
    const html = renderMarkdown('## **Setup**\n\n- Install\n- Configure `middleware`');

    expect(html).toContain('<h4>');
    expect(html).toContain('<strong>Setup</strong>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<code>middleware</code>');
  });

  it('drops non-http links', () => {
    const html = renderMarkdown('[bad](javascript:alert(1)) [good](https://example.com)');

    expect(html).not.toContain('javascript:');
    expect(html).toContain('href="https://example.com"');
  });

  it('renders non-absolute link targets as plain, safely formatted labels', () => {
    const html = renderMarkdown('[**Guide**](./guide)');

    expect(html).toBe('<p><strong>Guide</strong></p>');
    expect(html).not.toContain('<a ');
  });

  it('renders ordered lists and fenced code blocks', () => {
    const html = renderMarkdown('1. Install\n2. Configure\n\n```ts\nconst token = "<secret>";\n```');

    expect(html).toContain('<ol>');
    expect(html).toContain('<li>Install</li>');
    expect(html).toContain('part="code-block"');
    expect(html).toContain('const token = &quot;&lt;secret&gt;&quot;');
  });

  it('closes an unfinished code fence at end of input', () => {
    const html = renderMarkdown('```bash\npnpm add @desource/context7-widget');

    expect(html).toContain('<pre part="code-block">');
    expect(html).toContain('pnpm add @desource/context7-widget');
  });

  it('keeps markdown characters inside inline code literal', () => {
    expect(renderMarkdown('Use `**literal**` and **bold**.')).toContain(
      '<code>**literal**</code> and <strong>bold</strong>'
    );
  });

  it('supports formatted link labels and URL parentheses without allowing unsafe protocols', () => {
    const html = renderMarkdown(
      '[**API**](https://example.com/reference_(v2)) [unsafe](data:text/html,<script>alert(1)</script>)'
    );

    expect(html).toContain('<strong>API</strong>');
    expect(html).toContain('href="https://example.com/reference_(v2)"');
    expect(html).not.toContain('data:text/html');
    expect(html).not.toContain('<script>');
  });
});

import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/markdown';

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
});

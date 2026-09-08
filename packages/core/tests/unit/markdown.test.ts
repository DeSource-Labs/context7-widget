import { describe, expect, it } from 'vitest';
import { renderMarkdown, resolveContext7MarkdownBaseUrl } from '@src/markdown';

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

  it('resolves relative documentation links when a safe base URL is provided', () => {
    const html = renderMarkdown('[Guide](../guide) [unsafe](javascript:alert(1))', {
      baseUrl: 'https://docs.example.com/reference/api/'
    });

    expect(html).toContain('href="https://docs.example.com/reference/guide"');
    expect(html).not.toContain('javascript:');
  });

  it('renders ordered lists and fenced code blocks', () => {
    const html = renderMarkdown('1. Install\n2. Configure\n\n```ts\nconst token = "<secret>";\n```');

    expect(html).toContain('<ol>');
    expect(html).toContain('<li>Install</li>');
    expect(html).toContain('part="code-block"');
    expect(html).toContain('class="language-typescript"');
    expect(html).toContain('c7-token--keyword">const</span>');
    expect(html).toContain('c7-token--string">&quot;&lt;secret&gt;&quot;</span>');
    expect(html).toContain('data-c7-copy-code');
  });

  it('closes an unfinished code fence at end of input', () => {
    const html = renderMarkdown('```bash\nnpm install @desource/context7-widget');

    expect(html).toContain('<pre part="code-block">');
    expect(html).toContain('npm install @desource/context7-widget');
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

  it('renders nested lists, task items, blockquotes, tables, and custom code labels', () => {
    const html = renderMarkdown(
      [
        '> **Note**',
        '> Read this first.',
        '',
        '- Parent',
        '  - Child',
        '- [x] Complete',
        '',
        '| Name | Status |',
        '| :--- | ---: |',
        '| API | Ready |',
        '',
        '```json',
        '{"ready": true}',
        '```'
      ].join('\n'),
      { copyCodeLabel: 'Copy snippet' }
    );

    expect(html).toContain('<blockquote><p><strong>Note</strong> Read this first.</p></blockquote>');
    expect(html).toContain('<li>Parent<ul><li>Child</li></ul></li>');
    expect(html).toContain('class="c7-task"');
    expect(html).toContain('type="checkbox" checked');
    expect(html).toContain('<table>');
    expect(html).toContain('text-align:left');
    expect(html).toContain('text-align:right');
    expect(html).toContain('aria-label="Copy snippet"');
    expect(html).toContain('c7-token--property');
  });

  it('treats invalid language metadata and code contents as untrusted text', () => {
    const html = renderMarkdown('```"><img src=x>\n<script>alert(1)</script>\n```');

    expect(html).not.toContain('<img');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('renders structural and inline variants without requiring a full Markdown dependency', () => {
    const html = renderMarkdown(
      [
        '# Heading',
        '',
        '---',
        '',
        'Text with __strong__, _emphasis_, *also emphasis*, and ~~removed~~.',
        '',
        '1) First',
        '\t- Nested with tab',
        '2) Second',
        '- [ ] Pending'
      ].join('\n')
    );

    expect(html).toContain('<h3>Heading</h3>');
    expect(html).toContain('<hr>');
    expect(html).toContain('<strong>strong</strong>');
    expect(html).toContain('<em>emphasis</em>');
    expect(html).toContain('<del>removed</del>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<ul><li>Nested with tab</li></ul>');
    expect(html).toContain('type="checkbox"');
    expect(html).not.toContain('type="checkbox" checked');
  });

  it('covers table alignment, escaped pipes, absent rows, and missing cells', () => {
    const aligned = renderMarkdown(
      '| Left | Center | Right | Plain |\n| :--- | :---: | ---: | --- |\n| a\\|b | c | d |'
    );
    const headerOnly = renderMarkdown('| Name | Value |\n| --- | --- |');

    expect(aligned).toContain('text-align:left');
    expect(aligned).toContain('text-align:center');
    expect(aligned).toContain('text-align:right');
    expect(aligned).toContain('<th>Plain</th>');
    expect(aligned).toContain('>a|b</td>');
    expect(aligned).toContain('<td></td>');
    expect(headerOnly).not.toContain('<tbody>');
  });

  it('highlights supported code families and leaves unknown languages escaped', () => {
    const html = renderMarkdown(
      [
        '```html',
        '<!-- note --><main>Ready</main>',
        '```',
        '```css',
        '/* note */ .x { color: #fff; margin: 2rem; }',
        '```',
        '```sh',
        '# note\necho $HOME "$SHELL" 2',
        '```',
        '```json',
        '{"name":"widget","ready":false,"count":2}',
        '```',
        '```unknown',
        '<raw>',
        '```',
        '```',
        'plain',
        '```'
      ].join('\n')
    );

    expect(html).toContain('data-language="markup"');
    expect(html).toContain('c7-token--comment');
    expect(html).toContain('c7-token--keyword');
    expect(html).toContain('data-language="css"');
    expect(html).toContain('c7-token--number');
    expect(html).toContain('data-language="shell"');
    expect(html).toContain('c7-token--variable');
    expect(html).toContain('c7-token--property');
    expect(html).toContain('c7-token--string');
    expect(html).toContain('&lt;raw&gt;');
  });

  it('normalizes safe link bases and falls back for invalid or unsafe values', () => {
    expect(resolveContext7MarkdownBaseUrl('/owner/repo', 'https://docs.example.com/api')).toBe(
      'https://docs.example.com/api'
    );
    expect(resolveContext7MarkdownBaseUrl('/owner/repo', 'ftp://docs.example.com')).toBe(
      'https://context7.com/owner/repo/'
    );
    expect(resolveContext7MarkdownBaseUrl('', 'not a url')).toBe('https://context7.com/');

    const links = renderMarkdown('[http](http://example.com) [mail](mailto:test@example.com) [bad](./guide)', {
      baseUrl: 'ftp://example.com'
    });
    expect(links).toContain('href="http://example.com"');
    expect(links).not.toContain('mailto:');
    expect(links).not.toContain('<a href="./guide"');
  });
});

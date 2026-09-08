import { describe, expect, it } from 'vitest';
import { renderMarkdown, resolveContext7MarkdownBaseUrl, trimLibraryPath } from '@src/markdown';

describe('markdown', () => {
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

  it.each(['', '   ', 'ts extra metadata', 'ts\u2028extra metadata'])('reads fence metadata %j', (metadata) => {
    const html = renderMarkdown(`  \`\`\`${metadata}\nconst ready = true;\n\`\`\``);

    expect(html).toContain('<pre part="code-block">');
    expect(html.includes('data-language="typescript"')).toBe(metadata.startsWith('ts'));
  });

  it('reads a long fence header containing a Unicode line separator', () => {
    const html = renderMarkdown(`\`\`\`${' '.repeat(50_000)}ts\u2028metadata\nconst ready = true;\n\`\`\``);

    expect(html).toContain('data-language="typescript"');
    expect(html).toContain('c7-token--keyword">const</span>');
  });

  it.each(['js', 'css', 'sh', 'json'])('consumes unfinished escaped quotes once in %s code', (language) => {
    const code = '"' + '\\"'.repeat(50_000) + '\\';
    const html = renderMarkdown(`\`\`\`${language}\n${code}\n\`\`\``);
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(container.querySelector('code')?.textContent).toBe(code);
    expect(container.querySelectorAll('.c7-token--string')).toHaveLength(1);
  });

  it('preserves escaped delimiters and line continuations in quoted code', () => {
    const code = "const value = 'it\\'s'; const template = `a\\`b`; const continued = \"a\\\nb\";";
    const container = document.createElement('div');
    container.innerHTML = renderMarkdown(`\`\`\`js\n${code}\n\`\`\``);

    expect(container.querySelector('code')?.textContent).toBe(code);
    expect(Array.from(container.querySelectorAll('.c7-token--string'), (token) => token.textContent)).toEqual([
      "'it\\'s'",
      '`a\\`b`',
      '"a\\\nb"'
    ]);
  });

  it('classifies JSON properties by position when keys and values repeat', () => {
    const html = renderMarkdown('```json\n{"name":"name","other":"name"}\n```');
    const container = document.createElement('div');
    container.innerHTML = html;

    expect(Array.from(container.querySelectorAll('.c7-token--property'), (token) => token.textContent)).toEqual([
      '"name"',
      '"other"'
    ]);
    expect(container.querySelectorAll('.c7-token--string')).toHaveLength(2);
  });

  it.each(['js', 'ts', 'json', 'css', 'sh', 'html', 'unknown'])(
    'escapes HTML characters inside and between %s tokens exactly once',
    (language) => {
      const code = `left & < > "quoted & < >" middle & < > 'tail & < >`;
      const container = document.createElement('div');
      container.innerHTML = renderMarkdown(`\`\`\`${language}\n${code}\n\`\`\``);

      expect(container.querySelector('code')?.textContent).toBe(code);
      expect(container.querySelectorAll('code *:not(span)')).toHaveLength(0);
    }
  );

  it.each([
    {
      language: 'js',
      code: `'/* text */' /* "comment" */ return 1.5`,
      tokens: [
        ['string', "'/* text */'"],
        ['comment', '/* "comment" */'],
        ['keyword', 'return'],
        ['number', '1.5']
      ]
    },
    {
      language: 'jsonc',
      code: '{"key": "value", "count": -1.5e+2, "ready": TRUE}',
      tokens: [
        ['property', '"key"'],
        ['string', '"value"'],
        ['property', '"count"'],
        ['number', '-1.5e+2'],
        ['property', '"ready"'],
        ['keyword', 'TRUE']
      ]
    },
    {
      language: 'css',
      code: `.card { content: '/* text */'; margin: 1.5rem; color: #abc; }`,
      tokens: [
        ['string', "'/* text */'"],
        ['number', '1.5rem'],
        ['comment', '#abc']
      ]
    },
    {
      language: 'bash',
      code: 'echo "$HOME # text" $HOME 2\n# comment\necho 3',
      tokens: [
        ['string', '"$HOME # text"'],
        ['variable', '$HOME'],
        ['number', '2'],
        ['comment', '# comment'],
        ['number', '3']
      ]
    },
    {
      language: 'xml',
      code: '<!-- <tag> --><tag title="&">text & more</tag>',
      tokens: [
        ['comment', '<!-- <tag> -->'],
        ['keyword', '<tag title="&">'],
        ['keyword', '</tag>']
      ]
    }
  ])('preserves token precedence and classification in $language code', ({ language, code, tokens }) => {
    const container = document.createElement('div');
    container.innerHTML = renderMarkdown(`\`\`\`${language}\n${code}\n\`\`\``);

    expect(container.querySelector('code')?.textContent).toBe(code);
    expect(
      Array.from(container.querySelectorAll('.c7-token'), (token) => [
        token.className.replace('c7-token c7-token--', ''),
        token.textContent
      ])
    ).toEqual(tokens);
  });

  it('keeps token positions stable across repeated code fences and renders', () => {
    const fence = '```json\n{"&":"&","other" : "&"}\n```';
    const markdown = `${fence}\n${fence}`;
    const html = renderMarkdown(markdown);
    renderMarkdown('```js\nconst value = "other";\n```');
    const container = document.createElement('div');
    container.innerHTML = renderMarkdown(markdown);

    expect(renderMarkdown(markdown)).toBe(html);
    expect(Array.from(container.querySelectorAll('.c7-token--property'), (token) => token.textContent)).toEqual([
      '"&"',
      '"other"',
      '"&"',
      '"other"'
    ]);
    expect(container.querySelectorAll('.c7-token--string')).toHaveLength(4);
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

  it.each(['', '///', '  ///owner/repo///  ', `/owner${'/'.repeat(50_000)}repo/`])(
    'normalizes library paths without changing internal slashes (%#)',
    (library) => {
      const path = library.trim().split('/');
      while (path[0] === '') path.shift();
      while (path[path.length - 1] === '') path.pop();
      const expected = path.join('/');

      expect(resolveContext7MarkdownBaseUrl(library)).toBe(`https://context7.com/${expected}${expected ? '/' : ''}`);
    }
  );

  it.each([
    ['trimLibraryPath: empty input', '', ''],
    ['trimLibraryPath: whitespace only', ' \t\n\r ', ''],
    ['trimLibraryPath: slashes only', '///', ''],
    ['trimLibraryPath: whitespace and slashes only', ' \t///\r\n', ''],
    ['trimLibraryPath: an already normalized path', 'owner/repo', 'owner/repo'],
    ['trimLibraryPath: leading slashes', '///owner/repo', 'owner/repo'],
    ['trimLibraryPath: trailing slashes', 'owner/repo///', 'owner/repo'],
    ['trimLibraryPath: surrounding whitespace and slashes', ' \t///owner/repo///\n', 'owner/repo'],
    ['trimLibraryPath: internal slashes', '/owner///repo/', 'owner///repo'],
    ['trimLibraryPath: spaces inside the surrounding slashes', ' / owner / repo / ', ' owner / repo ']
  ])('handles %s', (_description, library, expected) => {
    expect(trimLibraryPath(library)).toBe(expected);
  });

  it('trimLibraryPath: trims long runs of surrounding slashes', () => {
    const slashes = '/'.repeat(50_000);

    expect(trimLibraryPath(`${slashes}owner/repo${slashes}`)).toBe('owner/repo');
  });

  it('trimLibraryPath: preserves long runs of internal slashes', () => {
    const path = `owner${'/'.repeat(50_000)}repo`;

    expect(trimLibraryPath(` /${path}/ `)).toBe(path);
  });
});

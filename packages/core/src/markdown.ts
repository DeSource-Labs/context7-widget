export interface Context7MarkdownOptions {
  /** Base URL used to resolve relative documentation links. */
  readonly baseUrl?: string;
  /** Accessible label rendered on fenced-code copy buttons. */
  readonly copyCodeLabel?: string;
}

interface MarkdownState {
  readonly lines: string[];
  readonly options: Context7MarkdownOptions;
  readonly output: string[];
  readonly paragraph: string[];
}

interface ListMatch {
  readonly content: string;
  readonly indent: number;
  readonly kind: 'ol' | 'ul';
}

interface RenderedBlock {
  readonly html: string;
  readonly nextIndex: number;
}

const LANGUAGE_ALIASES: Readonly<Record<string, string>> = {
  bash: 'shell',
  cjs: 'javascript',
  html: 'markup',
  js: 'javascript',
  jsonc: 'json',
  jsx: 'javascript',
  md: 'markdown',
  mjs: 'javascript',
  sh: 'shell',
  shell: 'shell',
  ts: 'typescript',
  tsx: 'typescript',
  vue: 'markup',
  xml: 'markup'
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Render the deliberately small, safe Markdown subset used by Context7.
 * Raw HTML is always escaped and links are restricted to HTTP(S).
 */
export function renderMarkdown(markdown: string, options: Context7MarkdownOptions = {}): string {
  const state: MarkdownState = {
    lines: markdown.replace(/\r\n?/g, '\n').split('\n'),
    options,
    output: [],
    paragraph: []
  };

  for (let index = 0; index < state.lines.length;) {
    const rawLine = state.lines[index] ?? '';
    const line = rawLine.trim();

    if (!line) {
      flushParagraph(state);
      index += 1;
      continue;
    }

    const fence = rawLine.match(/^\s*```\s*([^\s`]*)?.*$/);
    if (fence) {
      flushParagraph(state);
      const block = renderCodeFence(state.lines, index, fence[1] ?? '', options);
      state.output.push(block.html);
      index = block.nextIndex;
      continue;
    }

    if (isTableStart(state.lines, index)) {
      flushParagraph(state);
      const block = renderTable(state.lines, index, options);
      state.output.push(block.html);
      index = block.nextIndex;
      continue;
    }

    if (/^\s*>/.test(rawLine)) {
      flushParagraph(state);
      const block = renderBlockquote(state.lines, index, options);
      state.output.push(block.html);
      index = block.nextIndex;
      continue;
    }

    const list = matchListLine(rawLine);
    if (list) {
      flushParagraph(state);
      const block = renderList(state.lines, index, list.indent, list.kind, options);
      state.output.push(block.html);
      index = block.nextIndex;
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      flushParagraph(state);
      const level = Math.min((heading[1]?.length ?? 1) + 2, 6);
      state.output.push(`<h${level}>${renderInline(heading[2] ?? '', options)}</h${level}>`);
      index += 1;
      continue;
    }

    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushParagraph(state);
      state.output.push('<hr>');
      index += 1;
      continue;
    }

    state.paragraph.push(renderInline(line, options));
    index += 1;
  }

  flushParagraph(state);
  return state.output.join('');
}

/** Resolve a safe base for relative answer links, falling back to the configured Context7 library page. */
export function resolveContext7MarkdownBaseUrl(library: string, baseUrl?: string): string {
  try {
    if (baseUrl) {
      const explicit = new URL(baseUrl);
      if (explicit.protocol === 'http:' || explicit.protocol === 'https:') return explicit.href;
    }
  } catch {
    // Fall through to the stable Context7 library URL.
  }

  const url = new URL('https://context7.com');
  const libraryPath = library.trim().replace(/^\/+|\/+$/g, '');
  url.pathname = libraryPath ? `/${libraryPath}/` : '/';
  return url.href;
}

function flushParagraph(state: MarkdownState): void {
  if (state.paragraph.length === 0) return;
  state.output.push(`<p>${state.paragraph.join(' ')}</p>`);
  state.paragraph.length = 0;
}

function renderCodeFence(
  lines: readonly string[],
  startIndex: number,
  rawLanguage: string,
  options: Context7MarkdownOptions
): RenderedBlock {
  const code: string[] = [];
  let index = startIndex + 1;
  while (index < lines.length && !/^\s*```/.test(lines[index] ?? '')) {
    code.push(lines[index] ?? '');
    index += 1;
  }
  if (index < lines.length) index += 1;

  const language = normalizeLanguage(rawLanguage);
  const languageAttribute = language ? ` data-language="${escapeHtml(language)}"` : '';
  const languageClass = language ? ` class="language-${escapeHtml(language)}"` : '';
  const languageLabel = language ? `<span class="c7-code-language">${escapeHtml(language)}</span>` : '';
  const copyLabel = escapeHtml(options.copyCodeLabel?.trim() || 'Copy code');
  const header = `<div class="c7-code-header">${languageLabel}<button aria-label="${copyLabel}" class="c7-code-copy" data-c7-copy-code type="button">${copyLabel}</button></div>`;
  const highlighted = highlightCode(code.join('\n'), language);

  return {
    html: `<div class="c7-code-block"${languageAttribute}>${header}<pre part="code-block"><code${languageClass}>${highlighted}</code></pre></div>`,
    nextIndex: index
  };
}

function renderBlockquote(
  lines: readonly string[],
  startIndex: number,
  options: Context7MarkdownOptions
): RenderedBlock {
  const quote: string[] = [];
  let index = startIndex;
  while (index < lines.length) {
    const match = (lines[index] ?? '').match(/^\s*>\s?(.*)$/);
    if (!match) break;
    quote.push(match[1] ?? '');
    index += 1;
  }
  return {
    html: `<blockquote>${renderMarkdown(quote.join('\n'), options)}</blockquote>`,
    nextIndex: index
  };
}

function renderList(
  lines: readonly string[],
  startIndex: number,
  indent: number,
  kind: 'ol' | 'ul',
  options: Context7MarkdownOptions
): RenderedBlock {
  const items: string[] = [];
  let index = startIndex;

  while (index < lines.length) {
    const item = matchListLine(lines[index] ?? '');
    if (!item || item.indent < indent) break;

    if (item.indent > indent) {
      if (items.length === 0) break;
      const nested = renderList(lines, index, item.indent, item.kind, options);
      items[items.length - 1] = `${items[items.length - 1]}${nested.html}`;
      index = nested.nextIndex;
      continue;
    }

    if (item.kind !== kind) break;
    items.push(renderListItem(item.content, options));
    index += 1;
  }

  return {
    html: `<${kind}>${items.map((item) => `<li>${item}</li>`).join('')}</${kind}>`,
    nextIndex: index
  };
}

function renderListItem(content: string, options: Context7MarkdownOptions): string {
  const task = content.match(/^\[([ xX])]\s+(.+)/);
  if (!task) return renderInline(content, options);
  const checked = task[1]?.toLowerCase() === 'x';
  return `<label class="c7-task"><input aria-hidden="true" disabled type="checkbox"${checked ? ' checked' : ''}><span>${renderInline(task[2] ?? '', options)}</span></label>`;
}

function matchListLine(line: string): ListMatch | null {
  const match = line.match(/^(\s*)([-+*]|\d+[.)])\s+(.+)/);
  if (!match) return null;
  return {
    content: match[3] ?? '',
    indent: countIndent(match[1] ?? ''),
    kind: /^\d/.test(match[2] ?? '') ? 'ol' : 'ul'
  };
}

function countIndent(value: string): number {
  return value.replace(/\t/g, '  ').length;
}

function isTableStart(lines: readonly string[], index: number): boolean {
  const header = lines[index] ?? '';
  const divider = lines[index + 1] ?? '';
  if (!header.includes('|') || !divider.includes('|')) return false;
  const cells = splitTableRow(divider);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function renderTable(lines: readonly string[], startIndex: number, options: Context7MarkdownOptions): RenderedBlock {
  const headers = splitTableRow(lines[startIndex] ?? '');
  const alignments = splitTableRow(lines[startIndex + 1] ?? '').map(resolveTableAlignment);
  let index = startIndex + 2;
  const rows: string[][] = [];
  while (index < lines.length && (lines[index] ?? '').includes('|') && (lines[index] ?? '').trim()) {
    rows.push(splitTableRow(lines[index] ?? ''));
    index += 1;
  }

  const renderCell = (tag: 'td' | 'th', value: string, cellIndex: number): string => {
    const alignment = alignments[cellIndex];
    const attribute = alignment ? ` style="text-align:${alignment}"` : '';
    return `<${tag}${attribute}>${renderInline(value.trim(), options)}</${tag}>`;
  };
  const head = `<thead><tr>${headers.map((cell, cellIndex) => renderCell('th', cell, cellIndex)).join('')}</tr></thead>`;
  const body = rows.length
    ? `<tbody>${rows
        .map(
          (row) =>
            `<tr>${headers.map((_header, cellIndex) => renderCell('td', row[cellIndex] ?? '', cellIndex)).join('')}</tr>`
        )
        .join('')}</tbody>`
    : '';

  return {
    html: `<div class="c7-table-scroll"><table>${head}${body}</table></div>`,
    nextIndex: index
  };
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let cell = '';
  for (let index = 0; index < trimmed.length; index += 1) {
    const character = trimmed[index] ?? '';
    if (character === '\\' && trimmed[index + 1] === '|') {
      cell += '|';
      index += 1;
    } else if (character === '|') {
      cells.push(cell);
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell);
  return cells;
}

function resolveTableAlignment(value: string): 'center' | 'left' | 'right' | null {
  const trimmed = value.trim();
  if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
  if (trimmed.endsWith(':')) return 'right';
  if (trimmed.startsWith(':')) return 'left';
  return null;
}

function renderInline(value: string, options: Context7MarkdownOptions): string {
  const tokens: string[] = [];
  const stash = (html: string): string => {
    const token = `\uE000C7-${tokens.length}\uE001`;
    tokens.push(html);
    return token;
  };

  let output = value
    .replace(/`([^`\n]+)`/g, (_match, code: string) => stash(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[([^\]]+)]\(((?:[^()\s]|\([^)]*\))+)\)/g, (_match, label: string, href: string) => {
      const safeHref = toSafeHttpUrl(href, options.baseUrl);
      if (!safeHref) return stash(renderInline(label, options));
      return stash(
        `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${renderInline(label, options)}</a>`
      );
    });

  output = escapeHtml(output)
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>');

  return output.replace(/\uE000C7-(\d+)\uE001/g, (_match, index: string) => tokens[Number(index)] ?? '');
}

function toSafeHttpUrl(value: string, baseUrl?: string): string | null {
  try {
    const isRelative = !/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value);
    const url = isRelative ? new URL(value, normalizeBaseUrl(baseUrl)) : new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? (isRelative ? url.href : value) : null;
  } catch {
    return null;
  }
}

function normalizeBaseUrl(baseUrl?: string): string | undefined {
  if (!baseUrl) return undefined;
  const url = new URL(baseUrl);
  return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : undefined;
}

function normalizeLanguage(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9_+#.-]{1,32}$/.test(normalized)) return '';
  return LANGUAGE_ALIASES[normalized] ?? normalized;
}

function highlightCode(code: string, language: string): string {
  const normalized = LANGUAGE_ALIASES[language] ?? language;
  if (normalized === 'javascript' || normalized === 'typescript') {
    return highlightTokens(
      code,
      /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|`(?:\\.|[^`\\])*`|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b(?:async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|false|finally|for|from|function|if|import|in|instanceof|interface|let|new|null|of|return|static|super|switch|this|throw|true|try|type|typeof|undefined|var|void|while|yield)\b|\b\d+(?:\.\d+)?\b)/g,
      classifyScriptToken
    );
  }
  if (normalized === 'json') {
    return highlightTokens(
      code,
      /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)/gi,
      (token) =>
        token.endsWith('"') && new RegExp(`${escapeRegExp(token)}\\s*:`).test(code)
          ? 'property'
          : classifyScriptToken(token)
    );
  }
  if (normalized === 'markup') {
    return highlightTokens(code, /(<!--[\s\S]*?-->|<\/?[a-zA-Z][^>]*>)/g, (token) =>
      token.startsWith('<!--') ? 'comment' : 'keyword'
    );
  }
  if (normalized === 'css') {
    return highlightTokens(
      code,
      /(\/\*[\s\S]*?\*\/|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|#[\da-fA-F]{3,8}|\b\d+(?:\.\d+)?(?:px|rem|em|%|s|ms)?\b)/g,
      classifyScriptToken
    );
  }
  if (normalized === 'shell') {
    return highlightTokens(
      code,
      /(#.*$|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\$[\w@#?$!*-]+|\b\d+(?:\.\d+)?\b)/gm,
      classifyScriptToken
    );
  }
  return escapeHtml(code);
}

function highlightTokens(
  code: string,
  pattern: RegExp,
  classify: (token: string) => 'comment' | 'keyword' | 'number' | 'property' | 'string' | 'variable'
): string {
  let output = '';
  let lastIndex = 0;
  for (const match of code.matchAll(pattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    output += escapeHtml(code.slice(lastIndex, index));
    output += `<span class="c7-token c7-token--${classify(token)}">${escapeHtml(token)}</span>`;
    lastIndex = index + token.length;
  }
  return output + escapeHtml(code.slice(lastIndex));
}

function classifyScriptToken(token: string): 'comment' | 'keyword' | 'number' | 'property' | 'string' | 'variable' {
  if (token.startsWith('//') || token.startsWith('/*') || token.startsWith('#')) return 'comment';
  if (token.startsWith('$')) return 'variable';
  if (/^['"`]/.test(token)) return 'string';
  if (/^-?\d/.test(token)) return 'number';
  return 'keyword';
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

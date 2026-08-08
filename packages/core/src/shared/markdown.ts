export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type ListKind = 'ol' | 'ul';

interface MarkdownState {
  codeFence: string[] | null;
  list: ListKind | null;
  output: string[];
  paragraph: string[];
}

export function renderMarkdown(markdown: string): string {
  const state: MarkdownState = {
    codeFence: null,
    list: null,
    output: [],
    paragraph: []
  };

  for (const line of markdown.replace(/\r\n/g, '\n').split('\n')) {
    consumeMarkdownLine(state, line);
  }

  if (state.codeFence !== null) state.output.push(renderCodeBlock(state.codeFence));
  flushParagraph(state);
  closeList(state);

  return state.output.join('');
}

function consumeMarkdownLine(state: MarkdownState, rawLine: string): void {
  if (/^\s*```/.test(rawLine)) {
    toggleCodeFence(state);
    return;
  }

  if (state.codeFence !== null) {
    state.codeFence.push(rawLine);
    return;
  }

  consumeBlockLine(state, rawLine.trim());
}

function toggleCodeFence(state: MarkdownState): void {
  if (state.codeFence !== null) {
    state.output.push(renderCodeBlock(state.codeFence));
    state.codeFence = null;
    return;
  }

  flushParagraph(state);
  closeList(state);
  state.codeFence = [];
}

function consumeBlockLine(state: MarkdownState, line: string): void {
  if (!line) {
    flushParagraph(state);
    closeList(state);
    return;
  }

  const listItem = line.match(/^([-*]|\d+\.)\s+(.+)/);
  if (listItem) {
    flushParagraph(state);
    openList(state, listItem[1]?.endsWith('.') ? 'ol' : 'ul');
    state.output.push(`<li>${renderInline(listItem[2] ?? '')}</li>`);
    return;
  }

  const heading = line.match(/^(#{1,4})\s+(.+)/);
  if (heading) {
    flushParagraph(state);
    closeList(state);
    const level = Math.min((heading[1]?.length ?? 1) + 2, 6);
    state.output.push(`<h${level}>${renderInline(heading[2] ?? '')}</h${level}>`);
    return;
  }

  closeList(state);
  state.paragraph.push(renderInline(line));
}

function flushParagraph(state: MarkdownState): void {
  if (state.paragraph.length === 0) return;
  state.output.push(`<p>${state.paragraph.join(' ')}</p>`);
  state.paragraph = [];
}

function closeList(state: MarkdownState): void {
  if (!state.list) return;
  state.output.push(`</${state.list}>`);
  state.list = null;
}

function openList(state: MarkdownState, kind: ListKind): void {
  if (state.list === kind) return;
  closeList(state);
  state.output.push(`<${kind}>`);
  state.list = kind;
}

function renderInline(value: string): string {
  const tokens: string[] = [];
  const stash = (html: string): string => {
    const token = `\uE000C7-${tokens.length}\uE001`;
    tokens.push(html);
    return token;
  };

  let output = value
    .replace(/`([^`\n]+)`/g, (_match, code: string) => stash(`<code>${escapeHtml(code)}</code>`))
    .replace(/\[([^\]]+)]\(((?:[^()\s]|\([^)]*\))+)\)/g, (_match, label: string, href: string) => {
      const safeHref = toSafeHttpUrl(href);
      if (!safeHref) return stash(renderInline(label));
      return stash(
        `<a href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer">${renderInline(label)}</a>`
      );
    });

  output = escapeHtml(output)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  return output.replace(/\uE000C7-(\d+)\uE001/g, (_match, index: string) => tokens[Number(index)] ?? '');
}

function renderCodeBlock(lines: string[]): string {
  return `<pre part="code-block"><code>${escapeHtml(lines.join('\n'))}</code></pre>`;
}

function toSafeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : null;
  } catch {
    return null;
  }
}

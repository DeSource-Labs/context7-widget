export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdown(markdown: string): string {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];
  let paragraph: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  let codeFence: string[] | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    output.push(`<p>${paragraph.join(' ')}</p>`);
    paragraph = [];
  }

  function closeList() {
    if (!list) return;
    output.push(`</${list}>`);
    list = null;
  }

  function openList(kind: 'ul' | 'ol') {
    if (list === kind) return;
    closeList();
    output.push(`<${kind}>`);
    list = kind;
  }

  for (const rawLine of lines) {
    if (/^\s*```/.test(rawLine)) {
      if (codeFence) {
        output.push(renderCodeBlock(codeFence));
        codeFence = null;
      } else {
        flushParagraph();
        closeList();
        codeFence = [];
      }
      continue;
    }

    if (codeFence) {
      codeFence.push(rawLine);
      continue;
    }

    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      closeList();
      continue;
    }

    const unordered = line.match(/^[-*]\s+(.+)/);
    if (unordered) {
      flushParagraph();
      openList('ul');
      output.push(`<li>${renderInline(unordered[1] ?? '')}</li>`);
      continue;
    }

    const ordered = line.match(/^\d+\.\s+(.+)/);
    if (ordered) {
      flushParagraph();
      openList('ol');
      output.push(`<li>${renderInline(ordered[1] ?? '')}</li>`);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)/);
    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min((heading[1]?.length ?? 1) + 2, 6);
      output.push(`<h${level}>${renderInline(heading[2] ?? '')}</h${level}>`);
      continue;
    }

    closeList();
    paragraph.push(renderInline(line));
  }

  if (codeFence) {
    output.push(renderCodeBlock(codeFence));
  }

  flushParagraph();
  closeList();

  return output.join('');
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

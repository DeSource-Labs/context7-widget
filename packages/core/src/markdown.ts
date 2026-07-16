const URL_PATTERN = /^https?:\/\//i;

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
    const fenceMatch = rawLine.match(/^```/);
    if (fenceMatch) {
      if (codeFence) {
        output.push(`<pre part="code-block"><code>${escapeHtml(codeFence.join('\n').trim())}</code></pre>`);
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

    const heading = line.match(/^#{1,4}\s+(.+)/);
    if (heading) {
      flushParagraph();
      closeList();
      output.push(`<p><strong>${renderInline(heading[1] ?? '')}</strong></p>`);
      continue;
    }

    closeList();
    paragraph.push(renderInline(line));
  }

  if (codeFence) {
    output.push(`<pre part="code-block"><code>${escapeHtml(codeFence.join('\n').trim())}</code></pre>`);
  }

  flushParagraph();
  closeList();

  return output.join('');
}

function renderInline(value: string): string {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)]\(([^)]+)\)/g, (_match, label: string, href: string) => {
      if (!URL_PATTERN.test(href)) return label;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
}

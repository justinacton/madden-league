/**
 * A tiny, safe Markdown-subset renderer for News article bodies. Escapes all
 * HTML first, then re-introduces only the small set of tags PRD ยง6.8 calls
 * for (paragraphs, headings, lists, links, images, bold/italic emphasis) —
 * raw HTML from Airtable is never rendered as-is.
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(text: string): string {
  let result = text;
  // Images: ![alt](url) — handled before links since both use [..](..).
  result = result.replace(
    /!\[([^\]]*)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    '<img src="$2" alt="$1" loading="lazy" />'
  );
  // Links: [text](url)
  result = result.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,
    '<a href="$2" rel="noopener noreferrer">$1</a>'
  );
  // Bold, then italic.
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  return result;
}

export function renderSafeMarkdown(markdown: string): string {
  const escaped = escapeHtml(markdown ?? '');
  const lines = escaped.split(/\r?\n/);
  const htmlParts: string[] = [];
  let listOpen: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listOpen) {
      htmlParts.push(`</${listOpen}>`);
      listOpen = null;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line === '') {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      closeList();
      const tag = `h${Math.min(heading[1]!.length + 1, 4)}`;
      htmlParts.push(`<${tag}>${formatInline(heading[2] ?? '')}</${tag}>`);
      continue;
    }

    const bullet = line.match(/^[-*]\s+(.*)$/);
    if (bullet) {
      if (listOpen !== 'ul') {
        closeList();
        htmlParts.push('<ul>');
        listOpen = 'ul';
      }
      htmlParts.push(`<li>${formatInline(bullet[1] ?? '')}</li>`);
      continue;
    }

    const numbered = line.match(/^\d+\.\s+(.*)$/);
    if (numbered) {
      if (listOpen !== 'ol') {
        closeList();
        htmlParts.push('<ol>');
        listOpen = 'ol';
      }
      htmlParts.push(`<li>${formatInline(numbered[1] ?? '')}</li>`);
      continue;
    }

    closeList();
    htmlParts.push(`<p>${formatInline(line)}</p>`);
  }
  closeList();

  return htmlParts.join('\n');
}

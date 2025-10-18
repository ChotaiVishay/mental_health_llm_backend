// Minimal, dependency-free Markdown renderer for our chat UI.
// Supports: bold **text**, italics *text*, links [text](url),
// unordered lists with "- ", ordered lists like "1. ",
// paragraphs and line breaks. Escapes HTML to reduce XSS risk.

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInline(input: string): string {
  // Bold: **text**
  let out = input.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text* (simple, non-greedy, avoid **)
  out = out.replace(/(^|[^*])\*(?!\s)([^*]+?)\*(?!\*)/g, ($0, p1, p2) => `${p1}<em>${p2}</em>`);
  // Links: [text](url)
  out = out.replace(/\[([^\]]+?)\]\((https?:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return out;
}

export function markdownToHtml(text: string): string {
  if (!text) return '';
  // Normalise newlines
  const src = text.replace(/\r\n?/g, '\n');

  const blocks = src.split(/\n{2,}/);
  const htmlBlocks: string[] = [];

  for (const block of blocks) {
    const lines = block.split(/\n/);
    const trimmed = lines.map((l) => l.trimEnd());

    // Ordered list?
    const olMatch = trimmed.every((l) => /^\d+[.)]\s+.+/.test(l));
    if (olMatch) {
      const items = trimmed
        .map((l) => l.replace(/^\d+[.)]\s+/, ''))
        .map((l) => `<li>${renderInline(escapeHtml(l))}</li>`) // inline MD inside each li
        .join('');
      htmlBlocks.push(`<ol>${items}</ol>`);
      continue;
    }

    // Unordered list?
    const ulMatch = trimmed.every((l) => /^[-*]\s+.+/.test(l));
    if (ulMatch) {
      const items = trimmed
        .map((l) => l.replace(/^[-*]\s+/, ''))
        .map((l) => `<li>${renderInline(escapeHtml(l))}</li>`)
        .join('');
      htmlBlocks.push(`<ul>${items}</ul>`);
      continue;
    }

    // Paragraph with line breaks
    const para = trimmed.map((l) => renderInline(escapeHtml(l))).join('<br/>');
    htmlBlocks.push(`<p>${para}</p>`);
  }

  return htmlBlocks.join('');
}


/**
 * Lightweight `[label](url)` parsing for CV bullets / free text.
 * Keeps content plain-string in storage while allowing clickable words in HTML/DOCX.
 */

export type TextSegment =
  | { type: "text"; value: string }
  | { type: "link"; label: string; url: string };

export function normalizeHttpUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Split text into plain segments and markdown-style links. */
export function parseInlineLinks(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let match = re.exec(text);
  while (match !== null) {
    if (match.index > last) segments.push({ type: "text", value: text.slice(last, match.index) });
    segments.push({ type: "link", label: match[1]!, url: match[2]! });
    last = match.index + match[0].length;
    match = re.exec(text);
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  if (segments.length === 0) segments.push({ type: "text", value: text });
  return segments;
}

/** HTML-escape-aware rendering of inline markdown links. */
export function inlineLinksToHtml(text: string, escapeHtml: (s: string) => string): string {
  return parseInlineLinks(text)
    .map((seg) =>
      seg.type === "text"
        ? escapeHtml(seg.value)
        : `<a href="${escapeHtml(normalizeHttpUrl(seg.url))}">${escapeHtml(seg.label)}</a>`
    )
    .join("");
}

export function noticePlainText(html: string): string {
  const decodeCodePoint = (value: number) =>
    Number.isInteger(value) && value >= 0 && value <= 0x10ffff
      ? String.fromCodePoint(value)
      : "";
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h[1-6]|blockquote|tr)>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, value: string) =>
      decodeCodePoint(Number(value)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, value: string) =>
      decodeCodePoint(Number.parseInt(value, 16)),
    )
    .replace(/\s+/g, " ")
    .trim();
}

export function noticeExcerpt(html: string, maxLength: number): string {
  const text = noticePlainText(html);
  return text.length > maxLength
    ? `${text.slice(0, maxLength).trimEnd()}…`
    : text;
}

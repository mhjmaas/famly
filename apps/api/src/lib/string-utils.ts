/**
 * Truncate a string to a maximum length and append ellipsis if needed.
 * Counts characters, not bytes. If text length <= max, returns original.
 */
export function truncateWithEllipsis(text: string, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  if (maxLength <= 3) return "...".slice(0, maxLength);
  return `${text.slice(0, maxLength - 3)}...`;
}

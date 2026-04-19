/**
 * String helpers.
 */

/** Extract initials from a full name for avatar fallback. "Alisher Navoiy" → "AN" */
export function initials(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Truncate with ellipsis (unicode-safe) */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return Array.from(text).slice(0, maxLength - 1).join('') + '…';
}

/** Basic slug for URL — keeps Latin + Cyrillic alphanumerics, lowercases */
export function slug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

/** Uppercase first letter (unicode-safe) */
export function capitalize(text: string): string {
  if (!text) return text;
  const first = Array.from(text)[0];
  if (first === undefined) return text;
  return first.toUpperCase() + text.substring(first.length);
}

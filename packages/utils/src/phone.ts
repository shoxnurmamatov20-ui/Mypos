/**
 * Uzbek phone number helpers.
 */

/** Normalize any UZ phone input → +998XXXXXXXXX format */
export function normalizeUZPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  // Accept: 998901234567, 901234567, +998901234567, 8901234567
  let normalized: string;
  if (digits.length === 12 && digits.startsWith('998')) {
    normalized = digits;
  } else if (digits.length === 9) {
    normalized = '998' + digits;
  } else if (digits.length === 10 && digits.startsWith('8')) {
    normalized = '998' + digits.substring(1);
  } else {
    return null;
  }
  if (!/^998\d{9}$/.test(normalized)) return null;
  return '+' + normalized;
}

/** Format for display: +998 90 123 45 67 */
export function formatUZPhone(phone: string): string {
  const normalized = normalizeUZPhone(phone);
  if (!normalized) return phone;
  // +998901234567 → +998 90 123 45 67
  const digits = normalized.substring(4); // skip "+998"
  return `+998 ${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5, 7)} ${digits.substring(7, 9)}`;
}

export function isValidUZPhone(phone: string): boolean {
  return normalizeUZPhone(phone) !== null;
}

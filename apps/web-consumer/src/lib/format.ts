/**
 * Display helpers for the consumer web app.
 *
 * Prices are stored as integer so'm (UZS, no fractional units). The
 * formatter renders e.g. `45 000 so'm`. Locale-aware variants will
 * land alongside the checkout flow.
 */

export function formatSom(amount: number): string {
  const rounded = Math.round(amount);
  const grouped = rounded.toLocaleString('ru-RU').replace(/,/g, ' ');
  return `${grouped} so'm`;
}

export function formatDeliveryFee(fee: number): string {
  return fee === 0 ? 'Bepul' : formatSom(fee);
}

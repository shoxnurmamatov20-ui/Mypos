/**
 * Cart fee calculation (mock — Phase 5).
 *
 * Mirrors the rules used in `apps/mobile-consumer` so totals match between
 * platforms while we wait for the public `/orders/quote` endpoint:
 *
 *   - Free delivery once the subtotal crosses 100 000 so'm. Below that, a
 *     flat 5 000 so'm courier fee applies.
 *   - 2 % service fee on the subtotal, rounded to whole so'm.
 *
 * Once the backend is wired up, swap call sites to the quote endpoint and
 * delete this file.
 */

export type CartAmounts = {
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  total: number;
};

const FREE_DELIVERY_THRESHOLD = 100_000;
const FLAT_DELIVERY_FEE = 5_000;
const SERVICE_FEE_RATE = 0.02;

export function computeCartFees(subtotal: number): CartAmounts {
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : FLAT_DELIVERY_FEE;
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE);
  return {
    subtotal,
    deliveryFee,
    serviceFee,
    total: subtotal + deliveryFee + serviceFee,
  };
}

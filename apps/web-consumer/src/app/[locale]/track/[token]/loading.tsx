/**
 * Route loading fallback intentionally renders nothing — we don't want
 * a centred spinner flashing during every Next.js navigation. If a page
 * truly needs a long-running placeholder, render it inside the page body.
 */
export default function Loading() {
  return null;
}

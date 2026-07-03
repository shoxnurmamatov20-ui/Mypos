/**
 * Decides where the universal portal sends a user straight after login.
 *
 * `waiter` lands on the **in-app waiter panel** (`/{locale}/tables`) — it
 * lives in this same app, so no cross-origin redirect is needed. Every
 * other role keeps the legacy `/dispatch` handoff, which forwards them to
 * their dedicated app using the backend-supplied `redirect_url`.
 *
 * Kept as a pure function so the routing decision is unit-testable
 * without a browser.
 */
export type PostLoginTarget = { kind: 'internal'; path: string } | { kind: 'dispatch' };

export function resolvePostLoginTarget(role: string, locale: string): PostLoginTarget {
  if (role === 'waiter') {
    // Portal app has Next.js basePath '/panel/portal'. `window.location.href`
    // is a raw browser nav so basePath is NOT auto-prepended — we must
    // include it here or the proxy routes `/uz/tables` to the marketing
    // fallback (404).
    return { kind: 'internal', path: `/panel/portal/${locale}/tables` };
  }
  return { kind: 'dispatch' };
}

/**
 * Thin fetch wrappers for the public onboarding endpoints.
 *
 * These hit the Laravel API skeleton at
 *   POST /api/v1/public/onboarding/start         → creates a tenant_registration
 *   POST /api/v1/public/onboarding/menu-generate → AI-generates 30 sample dishes
 *   POST /api/v1/public/onboarding/submit        → finalizes signup
 *
 * The API base URL is read from `NEXT_PUBLIC_API_URL` so we can point the
 * wizard at staging vs prod without rebuilding. In dev it falls back to the
 * Caddy hostname `https://api.mypos.local`.
 */
import type { CuisineType, FinalSubmission, MenuItem } from './wizard-schemas';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'https://api.mypos.uz';

type ApiEnvelope<T> = { data: T; meta?: Record<string, unknown>; errors?: unknown };

class OnboardingApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = 'OnboardingApiError';
  }
}

async function postJson<T>(path: string, body: unknown, locale = 'uz'): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1/public/onboarding${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Accept-Language': locale,
    },
    body: JSON.stringify(body),
  });

  let parsed: ApiEnvelope<T> | { message?: string; errors?: unknown };
  try {
    parsed = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new OnboardingApiError('invalid_json', res.status, null);
  }

  if (!res.ok) {
    const message = (parsed as { message?: string }).message ?? `request_failed_${res.status}`;
    throw new OnboardingApiError(message, res.status, parsed);
  }

  return (parsed as ApiEnvelope<T>).data;
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export type StartResponse = {
  registration_id: string;
  expires_at: string;
};

/** Step 1 commit — creates a `tenant_registrations` row, returns its UUID. */
export function startRegistration(
  payload: { name: string; slug: string; email: string; phone: string },
  locale: string,
): Promise<StartResponse> {
  return postJson<StartResponse>('/start', payload, locale);
}

export type MenuGenerateResponse = {
  items: MenuItem[];
};

/**
 * AI-generated 30 starter dishes for a given cuisine type. The API delegates
 * to Anthropic Messages API server-side; we never expose the key client-side.
 */
export function generateMenu(
  payload: { cuisine: CuisineType; registration_id?: string },
  locale: string,
): Promise<MenuGenerateResponse> {
  return postJson<MenuGenerateResponse>('/menu-generate', payload, locale);
}

export type SubmitResponse = {
  tenant_id: string;
  admin_email: string;
  admin_login_url: string;
  // For paid tiers, the API returns a Click subscription redirect URL.
  payment_redirect_url: string | null;
};

/** Final commit — provisions the tenant + returns a redirect target. */
export function submitOnboarding(
  payload: FinalSubmission,
  locale: string,
): Promise<SubmitResponse> {
  return postJson<SubmitResponse>('/submit', payload, locale);
}

export { OnboardingApiError };

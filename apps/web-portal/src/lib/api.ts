/**
 * Thin Laravel API client for the portal.
 *
 * Uses Sanctum SPA auth: a CSRF cookie + session cookie scoped to
 * `.localhost` (dev) / `.mypos.uz` (prod). All requests carry credentials
 * so the cookie rides along.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
    message?: string,
  ) {
    super(message ?? `API ${status}`);
  }
}

async function ensureCsrf(): Promise<void> {
  // Sanctum requires a CSRF cookie before any state-changing request.
  await fetch(`${API_BASE}/sanctum/csrf-cookie`, {
    credentials: 'include',
    method: 'GET',
  });
}

function getXsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(^|;\s*)XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[2]!) : null;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    locale: string;
    avatar_url: string | null;
    is_super_admin: boolean;
    roles?: string[];
    /** Full tenant resource for tenant-scoped users; `null` for super admins. */
    tenant: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
  role: string;
  redirect_url: string;
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  await ensureCsrf();
  const xsrf = getXsrfToken();

  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.errors ?? {}, body.message);
  }

  const body = await res.json();
  return body.data as LoginResponse;
}

export async function me() {
  const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new ApiError(res.status);
  }

  return res.json();
}

export interface ResetPasswordInput {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/auth/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.errors ?? {}, body.message);
  }
}

export async function logout(): Promise<void> {
  await ensureCsrf();
  const xsrf = getXsrfToken();
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
    },
  });
}

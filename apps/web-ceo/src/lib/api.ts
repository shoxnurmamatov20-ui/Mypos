/**
 * CEO API client. Hits Laravel `/api/v1/ceo/*` endpoints.
 * Auth: bearer token stored in localStorage by web-portal SSO handoff.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const TOKEN_KEY = 'mypos_token';
const ROLE_KEY = 'mypos_role';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`API ${status}`);
  }
}

/**
 * SSO handoff: web-portal redirects here with `#token=...&role=...` in the
 * URL hash. localStorage is per-origin, so the portal cannot write our key —
 * consume the hash once, persist it under our own key, then strip it from
 * the URL so the token never leaks into history or the referrer header.
 */
export function consumeSsoHandoff(): void {
  if (typeof window === 'undefined') return;
  const hash = window.location.hash;
  if (hash.length <= 1) return;
  const params = new URLSearchParams(hash.slice(1));
  const handoff = params.get('token');
  if (!handoff) return;
  window.localStorage.setItem(TOKEN_KEY, handoff);
  const role = params.get('role');
  if (role) window.localStorage.setItem(ROLE_KEY, role);
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

export function loadStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredRole(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ROLE_KEY);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(ROLE_KEY);
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  consumeSsoHandoff();
  return window.localStorage.getItem(TOKEN_KEY);
}

export async function ceoFetch<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { headers, credentials: 'include' });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => null));
  }
  return res.json() as Promise<T>;
}

/**
 * Variant of `ceoFetch` for non-GET requests. Body is JSON-encoded; the
 * server still returns `{ data: ... }` so the caller treats it the same.
 */
export async function ceoMutate<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => null));
  }
  // 204 No Content — return null
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export type DashboardResponse = {
  data: {
    tenants_owned: number;
    currency: string;
    metrics: {
      today: { revenue_minor: number; orders_count: number };
      last_7_days: { revenue_minor: number; orders_count: number };
      last_30_days: { revenue_minor: number; orders_count: number };
    };
  };
};

export type Restaurant = {
  id: string;
  slug: string;
  name: string;
  tier: string;
  status: string;
  logo_url: string | null;
  is_primary: boolean;
  today: { revenue_minor: number; orders_count: number };
};

export type RestaurantsResponse = { data: Restaurant[]; meta: { count: number } };

export type Clinic = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  region: string | null;
  logo_url: string | null;
  is_active: boolean;
  departments_count: number;
  doctors_count: number;
  feedback: { total: number; avg_rating: number; verified_count: number };
  complaints: { open: number; urgent: number };
};

export type ClinicsResponse = { data: Clinic[]; meta: { count: number } };

export type ClinicDepartment = {
  id: number;
  name: string;
  doctors_count: number;
  is_active: boolean;
};

export type ClinicDoctor = {
  id: number;
  name: string;
  specialty: string | null;
  photo_url: string | null;
  is_active: boolean;
  department: { id: number; name: string } | null;
};

export type ClinicFeedback = {
  id: number;
  rating: number | null;
  is_verified: boolean;
  sentiment: string | null;
  comment: string | null;
  submitted_at: string | null;
};

export type ClinicDetail = {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  region: string | null;
  logo_url: string | null;
  is_active: boolean;
  stats: {
    departments_count: number;
    doctors_count: number;
    feedback_total: number;
    avg_rating: number;
    verified_count: number;
    open_complaints: number;
    urgent_complaints: number;
  };
  departments: ClinicDepartment[];
  doctors: ClinicDoctor[];
  recent_feedback: ClinicFeedback[];
};

export type ClinicDetailResponse = { data: ClinicDetail };

// --- Complaints (port of ShifoReyting admin complaints) ---

export type ComplaintStatus = 'open' | 'in_review' | 'resolved' | 'escalated';

export type ComplaintSeverity = 'low' | 'medium' | 'high' | 'urgent';

export type Complaint = {
  id: number;
  severity: ComplaintSeverity;
  status: ComplaintStatus;
  is_urgent: boolean;
  summary: string | null;
  created_at: string;
  resolved_at: string | null;
  age_hours: number;
  resolution_hours: number | null;
  is_stale: boolean;
  clinic: { id: number; name: string; region: string | null } | null;
  department: { id: number; name: string } | null;
  doctor: { id: number; name: string; specialty: string | null } | null;
};

export type ComplaintSummary = {
  total: number;
  open: number;
  in_review: number;
  resolved: number;
  escalated: number;
  urgent: number;
  stale: number;
  avg_resolution_hours: number;
};

export type ComplaintsResponse = {
  data: Complaint[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  summary: ComplaintSummary;
  filters: {
    statuses: ComplaintStatus[];
    severities: ComplaintSeverity[];
    stale_hours: number;
  };
};

export type ComplaintShowResponse = { data: Complaint };

export type ComplaintRegionsResponse = { data: string[] };

export type ComplaintBulkResponse = { data: { touched: number } };

export type ComplaintFilters = {
  q?: string;
  clinic_id?: number;
  region?: string;
  severity?: ComplaintSeverity | '';
  status?: ComplaintStatus | '';
  urgent?: boolean;
  stale?: boolean;
  from?: string;
  to?: string;
  sort?: 'created_at' | 'severity' | 'status' | 'resolved_at';
  dir?: 'asc' | 'desc';
  per?: number;
  page?: number;
};

export function buildComplaintsQuery(f: ComplaintFilters): string {
  const params = new URLSearchParams();
  if (f.q) params.set('q', f.q);
  if (f.clinic_id) params.set('clinic_id', String(f.clinic_id));
  if (f.region) params.set('region', f.region);
  if (f.severity) params.set('severity', f.severity);
  if (f.status) params.set('status', f.status);
  if (f.urgent) params.set('urgent', '1');
  if (f.stale) params.set('stale', '1');
  if (f.from) params.set('from', f.from);
  if (f.to) params.set('to', f.to);
  if (f.sort) params.set('sort', f.sort);
  if (f.dir) params.set('dir', f.dir);
  if (f.per) params.set('per', String(f.per));
  if (f.page && f.page > 1) params.set('page', String(f.page));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export type FinancesResponse = {
  data: {
    mrr_minor: number;
    last_30_days_revenue_minor: number;
    lifetime_revenue_minor: number;
    by_tenant: Array<{
      id: string;
      name: string;
      subscription_plan: string | null;
      mrr_minor: number;
      lifetime_revenue_minor: number;
    }>;
    currency: string;
  };
};

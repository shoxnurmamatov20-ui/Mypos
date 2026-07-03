import type { MyPosApiClient } from './client';
import type { CollectionResponse, PaginatedResponse, ResourceResponse } from './menu';

/**
 * Super-admin (SaaS owner panel) API. All endpoints sit under
 * `/api/v1/super-admin/*`.
 *
 * Public endpoints (rate-limited, no bearer token required):
 *   - POST /super-admin/login
 *   - POST /super-admin/admins/accept-invitation
 *
 * Every other endpoint runs through the `auth:sanctum` + `super-admin`
 * middleware and requires a token issued by the login or accept-invitation
 * flow with the `super-admin` ability.
 *
 * NOTE: type names in this module are deliberately UNQUALIFIED (e.g.
 * `SubscriptionPlan`, not `SuperAdminSubscriptionPlan`) because they live in
 * a dedicated entry-point and there are no neighbouring modules that compete
 * for the same names yet. Consumers that import from
 * `@mypos/api-client/super-admin` get them in isolation; the index re-export
 * is alphabetised after `staff`/`courier`/`kiosk` so it doesn't shadow any
 * of those modules' types.
 */

// ─── Enums (string unions) ───────────────────────────────────────────────────

/**
 * Mirrors `App\Domain\SuperAdmin\Enums\SubscriptionPlan`.
 */
export type SubscriptionPlan = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';

/**
 * Mirrors `App\Domain\SuperAdmin\Enums\SubscriptionStatus`.
 */
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'suspended' | 'cancelled';

/**
 * Mirrors `App\Domain\SuperAdmin\Enums\SuperAdminRole`.
 */
export type SuperAdminRole = 'owner' | 'admin' | 'support' | 'finance' | 'developer';

/**
 * Mirrors `App\Domain\SuperAdmin\Enums\AuditSeverity`.
 */
export type AuditSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

/**
 * Mirrors `App\Domain\SuperAdmin\Enums\AuditActorType`.
 */
export type AuditActorType = 'user' | 'super_admin' | 'system' | 'api';

/**
 * Reasons accepted by `POST /super-admin/tenants/{tenant}/suspend`.
 * Mirrors `SuspendTenantRequest::rules()` exactly.
 */
export type TenantSuspensionReason = 'non_payment' | 'abuse' | 'other';

/**
 * Range buckets accepted by `GET /super-admin/dashboard/charts?range=...`.
 * Anything else is silently coerced to `30d` by the controller.
 */
export type DashboardChartsRange = '7d' | '30d' | '90d' | '1y';

// ─── Resource: TenantSummary ─────────────────────────────────────────────────

/**
 * Mirrors `App\Http\Resources\V1\SuperAdmin\TenantSummaryResource`.
 *
 * NOTE: the backend coalesces `subscription_plan` / `subscription_status`
 * with the legacy `plan` / `status` columns — `plan`/`status` therefore are
 * always populated, but during the rollout window they may carry legacy
 * values that aren't part of the new enums. The `SubscriptionPlan` /
 * `SubscriptionStatus` unions reflect the new (target) shape; widen with
 * `string` only if you encounter a legacy tenant that still hasn't been
 * migrated.
 *
 * `owner_name` / `owner_email` come from `tenant->owner` which is resolved
 * lazily by the controller via `resolveOwner()` — both are nullable when no
 * non-super-admin user is associated with the tenant.
 */
export type TenantSummary = {
  id: string;
  slug: string;
  name: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  /** Monthly recurring revenue in minor units (tiyin). */
  mrr_minor: number;
  owner_name: string | null;
  owner_email: string | null;
  total_orders_count: number;
  /** Lifetime revenue in minor units (tiyin). */
  total_revenue_minor: number;
  last_active_at: string | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string | null;
};

// ─── Resource: TenantDetail ──────────────────────────────────────────────────

/**
 * Mirrors `App\Http\Resources\V1\SuperAdmin\TenantDetailResource`.
 *
 * NOTE: `subscription_plan` / `subscription_status` may be `null` for
 * tenants that haven't been migrated to the new pricing schema yet — the
 * resource emits the raw column rather than coalescing with `plan`/`status`
 * (those siblings carry the coalesced value and are always populated).
 *
 * `settings` and `feature_flags` are arbitrary JSON columns; we type them as
 * `Record<string, unknown> | null` to forward unknown keys without forcing
 * a cast at every call site.
 */
export type TenantDetail = {
  id: string;
  slug: string;
  name: string;
  legal_name: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan | null;
  subscription_status: SubscriptionStatus | null;
  mrr_minor: number;
  default_locale: string;
  default_currency: string;
  timezone: string;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  settings: Record<string, unknown> | null;
  feature_flags: Record<string, unknown> | null;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  last_active_at: string | null;
  total_orders_count: number;
  total_revenue_minor: number;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

/**
 * `GET /super-admin/tenants/{tenant}` returns a richer envelope: the
 * TenantDetailResource plus owner contact, aggregate stats, and the most
 * recent audit-log entries. Mirrors `TenantController::show()` exactly.
 */
export type TenantOwnerContact = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export type TenantStats = {
  employees_count: number;
  orders_today: number;
  orders_30d: number;
  revenue_30d_minor: number;
};

export type TenantDetailEnvelope = {
  tenant: TenantDetail;
  owner: TenantOwnerContact | null;
  stats: TenantStats;
  subscription_history: AuditLog[];
  recent_audit: AuditLog[];
};

/**
 * `POST /super-admin/tenants` returns the freshly-created tenant + the
 * owner shorthand (no phone — the create flow doesn't require one to be
 * present, only allowed). Mirrors `TenantController::store()`.
 */
export type TenantCreatedEnvelope = {
  tenant: TenantDetail;
  owner: {
    id: string;
    name: string;
    email: string;
  };
};

// ─── Resource: AuditLog ──────────────────────────────────────────────────────

/**
 * Mirrors `App\Http\Resources\V1\SuperAdmin\AuditLogResource`.
 *
 * `actor_type` is typed as `AuditActorType | null` because the column is
 * nullable when the entry was logged via `AuditLogger::log` without an
 * explicit `actor_type` (the logger falls back to inferring it from
 * `actor_user`, but legacy rows may still have NULL).
 *
 * `metadata` is JSONB — typed as `Record<string, unknown> | null`.
 */
export type AuditLog = {
  id: string;
  tenant_id: string | null;
  actor_user_uuid: string | null;
  actor_type: AuditActorType | null;
  actor_label: string | null;
  action: string;
  subject_type: string | null;
  subject_id: string | null;
  subject_label: string | null;
  severity: AuditSeverity;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
};

// ─── Resource: SuperAdminUser ────────────────────────────────────────────────

/**
 * Mirrors `App\Http\Resources\V1\SuperAdmin\SuperAdminUserResource`.
 *
 * NOTE: the resource uses the user's UUID as `id` (not the integer PK), and
 * `super_admin_role` may be `null` for legacy rows that haven't been assigned
 * a role yet (the seeder/migration sets it for new ones).
 */
export type SuperAdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_super_admin: boolean;
  super_admin_role: SuperAdminRole | null;
  mfa_enabled: boolean;
  last_super_admin_login_at: string | null;
  last_login_at: string | null;
  created_at: string | null;
};

// ─── Resource: SuperAdminInvitation ──────────────────────────────────────────

/**
 * Mirrors `App\Http\Resources\V1\SuperAdmin\SuperAdminInvitationResource`.
 *
 * NOTE: `is_pending` is a derived boolean computed by the model
 * (`accepted_at === null && revoked_at === null && expires_at > now()`).
 */
export type SuperAdminInvitation = {
  id: string;
  email: string;
  invited_by_user_uuid: string | null;
  accepted_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  metadata: Record<string, unknown> | null;
  is_pending: boolean;
  created_at: string | null;
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

/**
 * Mirrors the array returned by
 * `App\Domain\SuperAdmin\Services\DashboardKpiService::compute()`.
 *
 * NOTE: `system.avg_response_ms` and `system.uptime_percent` are STABLE MOCKS
 * until APM/metrics wiring is in place — treat them as best-effort, not SLA.
 */
export type DashboardKpis = {
  tenants: {
    total: number;
    active: number;
    trialing: number;
    past_due: number;
    suspended: number;
    cancelled: number;
    growth_30d: number;
  };
  revenue: {
    mrr_total_minor: number;
    arr_total_minor: number;
    average_mrr_minor: number;
    growth_30d_percent: number;
  };
  orders: {
    today_count: number;
    today_revenue_minor: number;
    yesterday_count: number;
    growth_today_percent: number;
    this_month_count: number;
  };
  users: {
    total_customers: number;
    total_employees: number;
    active_today: number;
  };
  system: {
    errors_24h: number;
    avg_response_ms: number;
    uptime_percent: number;
  };
};

/**
 * NOTE: this point type is named `SaasDailyRevenuePoint` (not just
 * `DailyRevenuePoint`) to avoid colliding with `stats.ts`'s same-named type
 * which carries `{ date, orders, revenue }` rather than `{ date,
 * revenue_minor }`. Same convention for the count + plan points below.
 */
export type SaasDailyRevenuePoint = {
  date: string;
  revenue_minor: number;
};

export type SaasDailyCountPoint = {
  date: string;
  count: number;
};

export type SaasTenantsByPlanPoint = {
  plan: string;
  count: number;
};

/**
 * Mirrors `DashboardChartsService::compute()`. Every series is zero-filled
 * across the requested range — there are no gaps to fill on the client.
 */
export type DashboardCharts = {
  revenue_by_day: SaasDailyRevenuePoint[];
  signups_by_day: SaasDailyCountPoint[];
  orders_by_day: SaasDailyCountPoint[];
  tenants_by_plan: SaasTenantsByPlanPoint[];
};

/**
 * The dashboard charts endpoint also emits a `meta.range` echo of the
 * applied range (after server-side coercion to an allowed value).
 */
export type DashboardChartsResponse = {
  data: DashboardCharts;
  meta: {
    range: DashboardChartsRange;
  };
};

// ─── Billing ─────────────────────────────────────────────────────────────────

export type MrrByPlanRow = {
  plan: string;
  tenants: number;
  mrr_minor: number;
};

/**
 * Mirrors `MrrBreakdownService::compute()`. The `movement_30d.churn_mrr`
 * value is emitted as a NEGATIVE integer (the service flips the sign so the
 * frontend can sum the bars directly).
 */
export type MrrBreakdown = {
  by_plan: MrrByPlanRow[];
  movement_30d: {
    new_mrr: number;
    expansion_mrr: number;
    churn_mrr: number;
    net: number;
  };
};

// ─── Settings ────────────────────────────────────────────────────────────────

/**
 * Platform-wide settings stored in cache (`platform_settings`). The defaults
 * shipped by the backend include the keys below; the cache layer always
 * deep-merges the persisted overrides on top of these defaults, so callers
 * can rely on every field being present.
 *
 * Unknown keys are forwarded via the index signature — the controller does
 * `array_replace_recursive` and never strips extra payload, which lets us
 * extend the schema without touching this client.
 */
export type PlatformSettings = {
  feature_flags: {
    kiosk: boolean;
    qr_menu: boolean;
    courier: boolean;
    loyalty: boolean;
    inventory: boolean;
    [key: string]: boolean;
  };
  default_plan: string;
  default_trial_days: number;
  default_locale: string;
  default_currency: string;
  default_timezone: string;
  maintenance_mode: boolean;
  allow_signups: boolean;
  [key: string]: unknown;
};

/**
 * `PATCH /super-admin/settings` accepts any partial of `PlatformSettings`
 * wrapped in a `settings` envelope (see `UpdateSettingsRequest`).
 */
export type UpdatePlatformSettingsInput = {
  settings: Partial<PlatformSettings> | Record<string, unknown>;
};

// ─── Inputs ──────────────────────────────────────────────────────────────────

export type SuperAdminLoginInput = {
  email: string;
  password: string;
};

export type AcceptInvitationInput = {
  token: string;
  name: string;
  password: string;
};

/**
 * Body for `POST /super-admin/tenants`. Mirrors `CreateTenantRequest::rules()`.
 */
export type CreateTenantInput = {
  name: string;
  slug: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  owner_phone?: string | null;
  plan?: SubscriptionPlan | null;
  trial_days?: number | null;
  default_locale?: 'uz' | 'ru' | 'en' | null;
  default_currency?: string | null;
  timezone?: string | null;
  notes?: string | null;
};

/**
 * Body for `PATCH /super-admin/tenants/{tenant}`. Every field is optional;
 * the controller keeps `plan`/`status` in sync with `subscription_plan`/
 * `subscription_status` automatically when only one side is provided.
 */
export type UpdateTenantInput = {
  name?: string;
  plan?: SubscriptionPlan;
  subscription_plan?: SubscriptionPlan;
  subscription_status?: SubscriptionStatus;
  mrr_minor?: number;
  subscription_ends_at?: string | null;
  trial_ends_at?: string | null;
  notes?: string | null;
  phone?: string | null;
  email?: string | null;
  default_locale?: 'uz' | 'ru' | 'en';
  default_currency?: string;
};

export type SuspendTenantInput = {
  reason: TenantSuspensionReason;
  notes?: string | null;
};

/**
 * Body for `POST /super-admin/admins/invite`. The request rules accept
 * `name` rather than `message` (the latter wasn't wired into the action) —
 * the optional `name` is stored on the invitation metadata and used as the
 * default display name once the invite is accepted.
 */
export type InviteSuperAdminInput = {
  email: string;
  role?: SuperAdminRole | null;
  name?: string | null;
};

// ─── Query params ────────────────────────────────────────────────────────────

/**
 * Sort syntax for `GET /super-admin/tenants?sort=...`. The controller
 * accepts any of the allowed columns paired with `:asc` or `:desc`; unknown
 * values silently fall back to `created_at:desc`.
 */
export type ListTenantsSort =
  | 'created_at'
  | 'updated_at'
  | 'mrr_minor'
  | 'total_orders_count'
  | 'total_revenue_minor'
  | 'last_active_at'
  | 'name'
  | 'slug';

export type ListTenantsParams = {
  per_page?: number;
  page?: number;
  status?: SubscriptionStatus | string;
  plan?: SubscriptionPlan | string;
  q?: string;
  /** e.g. `created_at:desc` — default. */
  sort?: `${ListTenantsSort}:asc` | `${ListTenantsSort}:desc` | string;
};

export type ListAuditLogsParams = {
  per_page?: number;
  page?: number;
  /** Free-text match on `actor_label` or exact UUID match on `actor_user_uuid`. */
  actor?: string;
  /** Exact match on `action` (e.g. `tenant.suspended`). */
  action?: string;
  severity?: AuditSeverity | string;
  /** ISO 8601 lower bound on `created_at`. */
  from?: string;
  /** ISO 8601 upper bound on `created_at`. */
  to?: string;
  tenant_id?: string;
  /** Free-text query across `action`, `subject_label`, `actor_label`. */
  q?: string;
};

export type ListBillingSubscriptionsParams = {
  per_page?: number;
  page?: number;
  status?: SubscriptionStatus | string;
  plan?: SubscriptionPlan | string;
};

export type DashboardChartsParams = {
  range?: DashboardChartsRange;
};

// ─── Response envelopes ──────────────────────────────────────────────────────

/**
 * `POST /super-admin/login` and `POST /super-admin/admins/accept-invitation`
 * return the same shape: `{ token, user, role }`. `role` is the user's
 * `super_admin_role` column (string) and may be `null` for legacy rows.
 */
export type SuperAdminAuthResponse = {
  data: {
    token: string;
    user: SuperAdminUser;
    role: SuperAdminRole | null;
  };
};

/**
 * Minimal user payload returned by `POST /tenants/{tenant}/impersonate`.
 * NOT the same shape as `SuperAdminUser` or `AuthUser` — the controller
 * intentionally returns a four-field projection for security clarity.
 */
export type ImpersonateUserSummary = {
  id: string;
  name: string;
  email: string;
  tenant_id: string | null;
};

/**
 * `POST /super-admin/tenants/{tenant}/impersonate` issues a 1-hour token.
 * The frontend should redirect to the tenant's panel with this bearer
 * token, then discard it on the way out.
 */
export type ImpersonateTenantResponse = {
  data: {
    token: string;
    user: ImpersonateUserSummary;
    tenant: TenantDetail;
    expires_at: string;
  };
};

/**
 * `POST /super-admin/admins/invite` returns the invitation record plus the
 * plaintext token — shown ONCE; the caller is responsible for emailing it.
 *
 * NOTE: the README/spec mentions an `accept_url` field, but the controller
 * does NOT emit one (it only emits the raw `token`). The frontend must
 * compose the accept URL itself, e.g.
 *   `${SUPERADMIN_ORIGIN}/accept-invitation?token=${token}`.
 */
export type InviteSuperAdminResponse = {
  data: {
    invitation: SuperAdminInvitation;
    token: string;
  };
};

export type MessageResponse = {
  data: { message: string };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

// ─── API ─────────────────────────────────────────────────────────────────────

export const superAdminApi = {
  // ── Auth (PUBLIC, rate-limited) ─────────────────────────────────────────
  /** POST /api/v1/super-admin/login (rate-limited: 20 req / 15 min per IP). */
  login: (client: MyPosApiClient, input: SuperAdminLoginInput) =>
    client.post<SuperAdminAuthResponse>('/api/v1/super-admin/login', input),

  /** POST /api/v1/super-admin/admins/accept-invitation (rate-limited: 5 req / 15 min per IP). */
  acceptInvitation: (client: MyPosApiClient, input: AcceptInvitationInput) =>
    client.post<SuperAdminAuthResponse>('/api/v1/super-admin/admins/accept-invitation', input),

  // ── Session (authenticated) ─────────────────────────────────────────────
  /** GET /api/v1/super-admin/me */
  me: (client: MyPosApiClient) =>
    client.get<ResourceResponse<SuperAdminUser>>('/api/v1/super-admin/me'),

  /** POST /api/v1/super-admin/logout */
  logout: (client: MyPosApiClient) =>
    client.post<MessageResponse>('/api/v1/super-admin/logout', {}),

  // ── Dashboard ───────────────────────────────────────────────────────────
  /** GET /api/v1/super-admin/dashboard */
  dashboard: (client: MyPosApiClient) =>
    client.get<ResourceResponse<DashboardKpis>>('/api/v1/super-admin/dashboard'),

  /** GET /api/v1/super-admin/dashboard/charts?range=30d */
  dashboardCharts: (client: MyPosApiClient, params: DashboardChartsParams = {}) => {
    const qs = buildQueryString(params);
    return client.get<DashboardChartsResponse>(`/api/v1/super-admin/dashboard/charts${qs}`);
  },

  // ── Tenants ─────────────────────────────────────────────────────────────
  tenants: {
    /** GET /api/v1/super-admin/tenants */
    list: (client: MyPosApiClient, params?: ListTenantsParams) => {
      const qs = buildQueryString(params);
      return client.get<PaginatedResponse<TenantSummary>>(`/api/v1/super-admin/tenants${qs}`);
    },

    /** GET /api/v1/super-admin/tenants/{tenant} */
    show: (client: MyPosApiClient, tenantId: string) =>
      client.get<ResourceResponse<TenantDetailEnvelope>>(
        `/api/v1/super-admin/tenants/${encodeURIComponent(tenantId)}`,
      ),

    /** POST /api/v1/super-admin/tenants */
    create: (client: MyPosApiClient, input: CreateTenantInput) =>
      client.post<ResourceResponse<TenantCreatedEnvelope>>('/api/v1/super-admin/tenants', input),

    /** PATCH /api/v1/super-admin/tenants/{tenant} */
    update: (client: MyPosApiClient, tenantId: string, input: UpdateTenantInput) =>
      client.patch<ResourceResponse<TenantDetail>>(
        `/api/v1/super-admin/tenants/${encodeURIComponent(tenantId)}`,
        input,
      ),

    /** DELETE /api/v1/super-admin/tenants/{tenant} (soft delete). */
    delete: (client: MyPosApiClient, tenantId: string) =>
      client.delete<MessageResponse>(`/api/v1/super-admin/tenants/${encodeURIComponent(tenantId)}`),

    /** POST /api/v1/super-admin/tenants/{tenant}/suspend */
    suspend: (client: MyPosApiClient, tenantId: string, input: SuspendTenantInput) =>
      client.post<ResourceResponse<TenantDetail>>(
        `/api/v1/super-admin/tenants/${encodeURIComponent(tenantId)}/suspend`,
        input,
      ),

    /** POST /api/v1/super-admin/tenants/{tenant}/resume */
    resume: (client: MyPosApiClient, tenantId: string) =>
      client.post<ResourceResponse<TenantDetail>>(
        `/api/v1/super-admin/tenants/${encodeURIComponent(tenantId)}/resume`,
        {},
      ),

    /**
     * POST /api/v1/super-admin/tenants/{tenant}/impersonate.
     *
     * HIGH RISK — every call is logged at `warning` severity and the
     * issued token is valid for ONE HOUR only. Discard it as soon as the
     * impersonated session ends.
     */
    impersonate: (client: MyPosApiClient, tenantId: string) =>
      client.post<ImpersonateTenantResponse>(
        `/api/v1/super-admin/tenants/${encodeURIComponent(tenantId)}/impersonate`,
        {},
      ),
  },

  // ── Audit logs ──────────────────────────────────────────────────────────
  auditLogs: {
    /** GET /api/v1/super-admin/audit-logs */
    list: (client: MyPosApiClient, params?: ListAuditLogsParams) => {
      const qs = buildQueryString(params);
      return client.get<PaginatedResponse<AuditLog>>(`/api/v1/super-admin/audit-logs${qs}`);
    },

    /** GET /api/v1/super-admin/audit-logs/actions — distinct values for filtering. */
    actions: (client: MyPosApiClient) =>
      client.get<CollectionResponse<string>>('/api/v1/super-admin/audit-logs/actions'),
  },

  // ── Billing ─────────────────────────────────────────────────────────────
  billing: {
    /** GET /api/v1/super-admin/billing/subscriptions */
    subscriptions: (client: MyPosApiClient, params?: ListBillingSubscriptionsParams) => {
      const qs = buildQueryString(params);
      return client.get<PaginatedResponse<TenantSummary>>(
        `/api/v1/super-admin/billing/subscriptions${qs}`,
      );
    },

    /** GET /api/v1/super-admin/billing/mrr-breakdown */
    mrrBreakdown: (client: MyPosApiClient) =>
      client.get<ResourceResponse<MrrBreakdown>>('/api/v1/super-admin/billing/mrr-breakdown'),
  },

  // ── Team management ────────────────────────────────────────────────────
  admins: {
    /**
     * GET /api/v1/super-admin/admins.
     *
     * NOTE: the backend paginates this endpoint (50 per page) even though
     * the spec frames it as a `CollectionResponse` — we type the return
     * as `PaginatedResponse<SuperAdminUser>` to surface the pagination
     * meta. If you only want the first page, no params are required.
     */
    list: (client: MyPosApiClient) =>
      client.get<PaginatedResponse<SuperAdminUser>>('/api/v1/super-admin/admins'),

    /**
     * POST /api/v1/super-admin/admins/invite.
     *
     * The `token` field is plaintext and ONLY appears in this response —
     * surface it to the inviting admin so they can email an accept link
     * (the backend does not send the email itself).
     */
    invite: (client: MyPosApiClient, input: InviteSuperAdminInput) =>
      client.post<InviteSuperAdminResponse>('/api/v1/super-admin/admins/invite', input),

    /** GET /api/v1/super-admin/admins/invitations — pending only (max 100). */
    pendingInvitations: (client: MyPosApiClient) =>
      client.get<CollectionResponse<SuperAdminInvitation>>(
        '/api/v1/super-admin/admins/invitations',
      ),

    /** DELETE /api/v1/super-admin/admins/{user} — revoke super-admin rights. */
    revoke: (client: MyPosApiClient, userUuid: string) =>
      client.delete<MessageResponse>(`/api/v1/super-admin/admins/${encodeURIComponent(userUuid)}`),
  },

  // ── Platform settings ──────────────────────────────────────────────────
  settings: {
    /** GET /api/v1/super-admin/settings */
    get: (client: MyPosApiClient) =>
      client.get<ResourceResponse<PlatformSettings>>('/api/v1/super-admin/settings'),

    /** PATCH /api/v1/super-admin/settings */
    update: (client: MyPosApiClient, input: UpdatePlatformSettingsInput) =>
      client.patch<ResourceResponse<PlatformSettings>>('/api/v1/super-admin/settings', input),
  },
};

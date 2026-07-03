# Security Policy

## Supported Versions

MyPOS is under active development. Security fixes land on `main` and are
deployed continuously. Only the latest `main` is supported.

## Reporting a Vulnerability

**Do not open a public issue for security vulnerabilities.**

Report privately via GitHub Security Advisories
(**Security → Report a vulnerability**) on this repository, or email the
maintainer. Include:

- affected component (app/package/endpoint),
- reproduction steps or PoC,
- impact assessment (data exposure, tenant-isolation bypass, RCE, ...).

We aim to acknowledge within 48 hours and to ship a fix or mitigation for
high-severity issues within 7 days.

## Security Model (summary)

MyPOS is a multi-tenant SaaS. The load-bearing invariant is **tenant
isolation** — no tenant may ever read or write another tenant's data.

- **Two isolation layers** (defense-in-depth):
  1. Application: `BelongsToTenant` Eloquent global scope, **fail-closed**
     (returns zero rows when tenant context is unresolved).
  2. Database: PostgreSQL Row-Level Security policies keyed on the
     `app.current_tenant_id` GUC set per request. The web runtime connects
     as the non-owner `mypos_app` role so RLS actually binds. See
     [ADR-0006](docs/adr/0006-postgresql-18-return.md).
- **Auth:** Laravel Sanctum tokens; staff PIN login with per-phone rate
  limiting; super-admin and CEO surfaces gated by dedicated middleware.
- **PII:** phone/email/notes/delivery fields encrypted at rest via
  Laravel `Crypt`. Passwords/tokens/PINs are never logged.
- **Payments:** Click/Payme webhook signatures verified; unknown-order
  webhooks refused (no poison-tenant rows); `Str::isUuid()` guards on all
  attacker-controlled id lookups.
- **Rate limiting:** route-scoped named limiters on auth, checkout,
  onboarding and password-reset endpoints.
- **Secrets:** `.env` is git-ignored; `.env.example` holds only
  placeholders. Production secrets via Doppler/Coolify.

## Handling Guidelines for Contributors

- Never call `withoutGlobalScope('tenant')` without re-applying an explicit
  `tenant_id` filter on the same query.
- Every new tenant-scoped table MUST ship an RLS policy in its migration.
- Never commit real credentials; keep `.env.example` placeholder-only.
- Cross-tenant reads are permitted only in super-admin or CEO
  (owned-tenant-set) contexts.

# Architecture

High-level system design for MyPOS.

## Current State

This section describes the target architecture. Implementation progress in [../../MYPOS_ULTRA_PLAN.md](../../../MYPOS_ULTRA_PLAN.md) roadmap.

## Components

### Frontend

- **13 apps** — 6 web (Next.js), 5 mobile (Expo), 1 Telegram bot (Node), 1 KDS (Next.js)
- Shared UI, design tokens, API client via `packages/*`

### Backend

- **Laravel 12 modular monolith** — single API serving all clients
- **Domain-Driven Design** — `app/Domain/<Name>/` per business area
- **Filament Super Admin** — auto-generated CRUD for ops
- **Laravel Reverb** — WebSocket for real-time order updates, KDS, notifications
- **Laravel Horizon** — queue dashboard + auto-scale workers
- **Meilisearch via Scout** — full-text search

### Data

- **PostgreSQL 17** — primary + read replicas
- **Redis 7.4** — cache, queue, Reverb pub/sub, rate limit
- **Meilisearch** — search
- **MinIO** — S3-compatible file storage (UZ)
- **Cloudflare R2** — encrypted offsite backups

### Infrastructure

- **UZCLOUD VPS** (primary, UZ data sovereignty)
- **Beeline DC** (DR secondary)
- **Coolify** (self-hosted PaaS) for MVP
- **Kubernetes** for scale (Year 2+)
- **Caddy** (reverse proxy + auto-SSL)

### Security

- Defense-in-depth: Cloudflare WAF → Caddy → Laravel middleware → RLS policies
- MFA for admins, role-based access, tenant isolation
- Encrypted at rest (DB) + in transit (TLS 1.3)
- Activity logging + impersonation audit

## Cross-cutting concerns

- **i18n**: UZ / RU / EN across all apps
- **Multi-tenancy**: single-DB + RLS, see [ADR-0004](../adr/0004-multi-tenancy-strategy.md)
- **API versioning**: `/api/v1/*`, never break v1
- **Real-time**: Reverb + Laravel Echo (web + mobile)
- **Observability**: Sentry (errors) + Better Stack (logs) + Posthog (product)

## Data flow: "Create order"

```
1. POS Terminal (Expo) — cashier selects items, taps "Place Order"
2. → Laravel API /api/v1/orders (Sanctum token, tenant middleware)
3. → FormRequest validates input
4. → CreateOrderAction:
   a. Begin transaction
   b. Insert order + order_items (tenant_id set)
   c. Update table status → occupied
   d. Reduce ingredient stock (if recipe tracking on)
   e. Commit
   f. Dispatch OrderCreated event
5. Events fan out:
   ├── BroadcastOrderToKDS listener → Reverb → KDS screen
   ├── NotifyChefJob → push to chef mobile
   ├── UpdateDailyStatsJob → Redis counter
   └── LogAuditEvent → activity_log
6. ← Return OrderResource (typed via OpenAPI)
7. POS Terminal displays confirmation + prints chit
8. KDS screen shows new order (Reverb WebSocket)
9. Chef mobile receives push notification
```

## Diagrams

- `diagrams/high-level.mmd` — Mermaid, rendered in docs
- `diagrams/data-flow-order.mmd` — order lifecycle
- `diagrams/deployment.mmd` — infrastructure

(To be added as components land.)

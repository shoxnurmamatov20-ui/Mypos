# ADR-0004: Single-DB Multi-Tenancy with RLS

- **Status:** Accepted
- **Date:** 2026-04-20
- **Deciders:** Solo Founder

## Context

MyPOS serves many restaurants (tenants). Each tenant must see only their own data — orders, customers, menu, reports. We need isolation that's:

- Reliable (no data leakage)
- Performant (won't bottleneck at scale)
- Simple to reason about
- Backup/restore friendly

Common strategies:
- **Database-per-tenant**: total isolation, but expensive at 10K+ tenants, backup hell
- **Schema-per-tenant**: PostgreSQL native, still expensive at scale
- **Single DB, `tenant_id` column**: cheapest, most flexible, requires discipline

## Decision

**Single PostgreSQL database with `tenant_id` column on every tenant-scoped table, enforced via:**

1. **Eloquent Global Scope** (`spatie/laravel-multitenancy` "single-db" mode) — convenience layer
2. **PostgreSQL Row Level Security (RLS)** — defense-in-depth
3. **Middleware sets `app.current_tenant_id` session variable** — used by RLS policies

Example policy:
```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON orders
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

Super admin context bypasses with explicit `app.super_admin_mode = 'true'` check (logged).

## Alternatives Considered

- **DB-per-tenant**: ruled out at ≥100 tenants — operational burden.
- **Schema-per-tenant**: ~1K tenants OK but then migration runs become O(N). Rejected.
- **Global Scope only (no RLS)**: single developer mistake leaks data cross-tenant. Reject.
- **RLS only (no Global Scope)**: works but error messages cryptic, devs confused.

## Consequences

### Positive
- Cheapest ops — one DB to manage, backup, migrate
- Flexible — shared reference data (countries, currencies) in same DB
- Defense-in-depth — App bug + framework bug both blocked by RLS
- Easy analytics across tenants (when needed with proper auth)
- Works with Laravel migrations painlessly

### Negative
- Every table needs `tenant_id` column + index
- Queries must set `app.current_tenant_id` before touching tenant data
- Tenant size imbalance: one huge tenant can slow queries for others
  - Mitigation: monitor, partition large tables by `tenant_id` hash (future)
- Accidental "big query" risk if tenant_id forgotten
  - Mitigation: RLS prevents data leak; missing scope = zero rows
- Cross-tenant analytics requires explicit super admin context

### Neutral
- Schema changes apply to all tenants simultaneously (feature, not bug)

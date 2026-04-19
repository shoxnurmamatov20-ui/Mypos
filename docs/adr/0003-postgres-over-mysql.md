# ADR-0003: PostgreSQL 17 over MySQL

- **Status:** Accepted
- **Date:** 2026-04-20
- **Deciders:** Solo Founder

## Context

MyPOS is a SaaS multi-tenant platform with complex data model — nested JSON fields (modifier options, order metadata), full-text search on UZ/RU, row-level security for tenant isolation, analytics-ready structure.

Default Laravel choice is MySQL. Alternative: PostgreSQL.

## Decision

**Use PostgreSQL 17** as primary database.

## Alternatives Considered

- **MySQL 8**: Laravel default, slightly better sysadmin familiarity in some regions. Lacks native RLS, weaker JSON, no array types, weaker full-text.
- **MariaDB 11**: Fork of MySQL, same cons.
- **SQLite**: Not production-viable at scale.
- **CockroachDB**: Strong distributed story but overkill for MVP; adds complexity.

## Consequences

### Positive
- **Row-Level Security (RLS)** — defense-in-depth tenant isolation (critical for SaaS)
- **JSONB** — fast indexed queries on modifier options, order metadata
- **Arrays** — natural fit for tags, allergens lists
- **Full-text search** (`pg_trgm`, `tsvector`) — UZ/RU typo-tolerant
- **PostGIS** — ready when delivery zones come (P2)
- **Logical replication** — for DR and read replicas later
- **Better concurrency** — MVCC without locking reads
- **Analytics-ready** — ClickHouse-compatible export, CTEs, window functions

### Negative
- Slightly different Laravel migration syntax than MySQL defaults
- Connection pooling requires PgBouncer at scale (trivial to add)
- Hosting: less ubiquitous than MySQL in shared hosting (but we're self-hosted)

### Neutral
- Developers unfamiliar with Postgres need ~1 week ramp-up

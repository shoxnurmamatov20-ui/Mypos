# Infrastructure

## Local Development

```bash
# Start infra services (Postgres, Redis, Meilisearch, MinIO)
pnpm docker:up

# View logs
pnpm docker:logs

# Stop (preserves data)
pnpm docker:down

# Wipe all data (DESTRUCTIVE)
docker compose -f infra/docker-compose.yml down -v
```

## Services

| Service | Port | Credentials | Purpose |
|---------|------|-------------|---------|
| PostgreSQL | 5432 | mypos / mypos_local_pwd | Primary DB |
| Redis | 6379 | — | Cache, queue, Reverb |
| Meilisearch | 7700 | key: `mypos_meili_local` | Full-text search |
| MinIO API | 9000 | mypos_minio_local / mypos_minio_local_secret | S3 files |
| MinIO Console | 9001 | (same) | Web UI |

Default bucket `mypos-local` created automatically (public read).

## Production Deployment

Production uses **Coolify** on UZCLOUD VPS — see `docs/runbooks/deploy.md` (TBD).

### Recommended VPS specs (MVP → Year 1)

| Stage | Specs | Purpose |
|-------|-------|---------|
| MVP | 8 vCPU / 16 GB / 200 GB NVMe | Everything on 1 host |
| Growth (100+ tenants) | Split: 2x 8 vCPU + dedicated Postgres 16 GB | App + DB separation |
| Scale (1K+ tenants) | K8s cluster (3+ nodes) + managed Postgres | Horizontal scaling |

### Hosting providers (UZ)

- **UZCLOUD** (uzcloud.uz) — primary recommendation
- **Beeline Business DC** — DR secondary
- **Uztelecom Cloud** — alternative
- **IT Park Cloud** — startup grant option

## Backups

- Daily: `pg_dump` → MinIO local + encrypted upload to Cloudflare R2
- Weekly: full cluster snapshot
- Monthly: DR drill (restore to fresh VPS, verify integrity)

See `scripts/backup-db.sh`, `scripts/restore-db.sh`.

## Monitoring

- **Sentry** — errors + performance
- **Better Stack** — logs
- **Posthog** — product analytics (self-hostable)
- **Better Uptime** — external probing + status page

# MyPOS Production Deploy Plan

> **Status**: planning document, 2026-05-10 — **DB sections superseded 2026-07-02**
> **Scope**: ground-up production deployment for MyPOS SaaS
> **Stack**: Laravel 12 + **PostgreSQL 18** (ADR-0006) + Redis + Meilisearch + MinIO + Coolify + Caddy
> **Infrastructure**: UZCLOUD (UZ primary) + Beeline DC (DR)

> ⚠️ **ADR-0006 (2026-07-02)**: the database moved back to **PostgreSQL 18**.
> Read every "MySQL 8.4" reference below as PostgreSQL 18: §5 becomes a
> standard `postgresql-18` apt install; binlog replication becomes **streaming
> physical replication** (primary → DR standby via `pg_basebackup` +
> `primary_conninfo`); backups move from `mysqldump`/XtraBackup to
> `pg_dump`/`pgBackRest`. Two runtime roles are REQUIRED: the schema owner
> for migrations/workers and `mypos_app` (LOGIN, NOBYPASSRLS — see
> `infra/scripts/pg-app-role.sql`) for the web runtime so Row-Level Security
> binds. Data lands via `php artisan db:migrate-from-mysql`
> (docs/runbooks/mysql-to-postgres-migration.md).

---

## 0. Prerequisites checklist

Before any deploy:

- [ ] Domain `mypos.uz` purchased + DNS via Cloudflare
- [ ] UZCLOUD account + KYC for VPS provisioning
- [ ] Apple Developer Account (~$99/year) for Plus tier per-tenant builds
- [ ] Google Play Console account (~$25 one-time)
- [ ] Anthropic API key (Claude) — production tier
- [ ] Click + Payme merchant accounts (UZ payment providers)
- [ ] Cloudflare R2 bucket (offsite backups)
- [ ] GitHub Actions secrets configured
- [ ] Status page (status.mypos.uz) — Statuspage.io or self-hosted Cachet
- [ ] Sentry / Bugsnag / Datadog account for error tracking

---

## 1. Server topology (Phase 1 — single region)

```
                    ┌────────────────────────┐
                    │  Cloudflare (CDN/WAF)  │
                    │  *.mypos.uz wildcard   │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴────────────┐
                    │  UZCLOUD VPS — Caddy   │
                    │  (8 vCPU, 16GB RAM)    │
                    │  on-demand TLS         │
                    └───────────┬────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       │                        │                        │
┌──────┴──────┐         ┌───────┴────────┐       ┌──────┴──────┐
│  app-01     │         │  app-02        │       │  app-03     │
│  PHP-FPM    │         │  PHP-FPM       │       │  Reverb WS  │
│  (Laravel)  │         │  (Laravel)     │       │  Horizon    │
│  16GB RAM   │         │  16GB RAM      │       │  8GB RAM    │
└──────┬──────┘         └───────┬────────┘       └──────┬──────┘
       │                        │                        │
       └────────────────────────┼────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
┌───────┴────────┐    ┌─────────┴───────┐    ┌─────────┴──────┐
│ MySQL 8.4 LTS  │    │  Redis 7.4      │    │  Meilisearch   │
│ (16GB, 500GB)  │    │  (8GB)          │    │  (4GB, 100GB)  │
│ Primary +      │    │  Cluster        │    │                │
│ Read replica   │    │                 │    │                │
└────────────────┘    └─────────────────┘    └────────────────┘
                                                     │
                                            ┌────────┴────────┐
                                            │   MinIO         │
                                            │   (S3 compat)   │
                                            │   (1TB)         │
                                            └─────────────────┘

DR site (Beeline DC) — passive standby:
  - MySQL replica (logical replication via binlog)
  - MinIO replicated bucket
  - Redis snapshot daily
  - Switch over: change DNS A record (Cloudflare ~30s TTL)
```

---

## 2. UZCLOUD VPS provisioning

### 2.1 Recommended specs (per tier)

| Server | vCPU | RAM | Disk | Use |
|---|---|---|---|---|
| **edge-01** (Caddy) | 4 | 8 GB | 50 GB SSD | TLS termination, on-demand certs |
| **app-01** | 8 | 16 GB | 100 GB SSD | PHP-FPM, Laravel HTTP |
| **app-02** | 8 | 16 GB | 100 GB SSD | PHP-FPM, Laravel HTTP |
| **realtime-01** | 4 | 8 GB | 50 GB SSD | Reverb WebSocket + Horizon |
| **db-01** | 8 | 32 GB | 500 GB NVMe | MySQL 8.4 primary |
| **db-02** | 4 | 16 GB | 500 GB NVMe | MySQL replica |
| **cache-01** | 4 | 8 GB | 50 GB SSD | Redis 7.4 |
| **search-01** | 4 | 8 GB | 100 GB SSD | Meilisearch |
| **storage-01** | 4 | 8 GB | 1 TB | MinIO |
| **dr-mirror** (Beeline) | mirrors all | | | Passive standby |

**Year-1 cost estimate**: ~$800–1,200 / month UZCLOUD + ~$300 / mo Beeline DR.

### 2.2 Bootstrap script

```bash
# Run on each fresh Ubuntu 24.04 VPS
bash <(curl -fsSL https://raw.githubusercontent.com/<org>/mypos/main/infra/scripts/provision-vps.sh)
```

The script (`infra/scripts/provision-vps.sh`):
- Updates apt packages
- Configures firewall (UFW): SSH from bastion only, 80/443 public, internal traffic via private network
- Installs Docker + Coolify
- Sets timezone Asia/Tashkent
- Configures fail2ban
- Sets unattended-upgrades for security patches

---

## 3. Coolify orchestration

Coolify replaces manual Docker Compose / Kubernetes for the small-team phase.

### 3.1 Coolify install (one-time, on a separate small VPS)

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

### 3.2 App deployments

For each app:
- Create Coolify "Resource" → Public Repository → branch `main`
- Set build command per app (Dockerfile in monorepo)
- Set environment variables per app
- Set up GitHub webhook for auto-deploy on push

Apps to deploy:
- `apps/api` — Laravel 12 (Dockerfile: `infra/docker/api.Dockerfile`)
- `apps/web-marketing` — Next.js 15 (default Vercel-style)
- `apps/web-consumer` — Next.js 15
- `apps/web-dashboard` — Next.js 15
- `apps/web-superadmin` — Next.js 15
- `apps/web-qr` — Next.js 15 PWA
- `apps/kds` — Next.js 15
- `apps/telegram-bot` — Node.js 22

---

## 4. Caddy on-demand TLS

Custom restaurant domains (`jomeburger.uz`, `lavash-house.uz`, ...) get free Let's Encrypt certs on demand.

### 4.1 Caddyfile (already in `infra/docker/caddy/Caddyfile`)

```caddyfile
{
    on_demand_tls {
        ask https://api.mypos.uz/internal/caddy/verify
        interval 5m
        burst 10
    }
}

*.mypos.uz {
    tls /certs/mypos.uz.pem /certs/mypos.uz.key
    reverse_proxy app-01:9000 app-02:9000 {
        lb_policy least_conn
    }
}

# Tenant custom domains (catch-all with on-demand)
:443 {
    tls {
        on_demand
    }
    reverse_proxy app-01:9000 app-02:9000 {
        lb_policy least_conn
    }
}
```

### 4.2 Verify endpoint

`POST /internal/caddy/verify` — Caddy calls this before issuing a cert for an unknown domain.
- Looks up `tenant_domains` table
- Returns 200 only if domain is `is_verified = true`
- Implemented at `apps/api/app/Http/Controllers/Api/V1/Internal/CaddyVerifyController.php`

---

## 5. MySQL 8.4 LTS production setup

### 5.1 Server install

```bash
# On db-01 (Ubuntu 24.04)
wget https://dev.mysql.com/get/mysql-apt-config_0.8.31-1_all.deb
sudo dpkg -i mysql-apt-config_0.8.31-1_all.deb
sudo apt update
sudo apt install mysql-server-8.4
```

### 5.2 my.cnf for production (32 GB RAM)

```ini
[mysqld]
bind-address = 0.0.0.0          # Accept private network only via firewall
port = 3306

# InnoDB tuning — 70% of RAM for buffer pool
innodb_buffer_pool_size = 22G
innodb_buffer_pool_instances = 16
innodb_log_file_size = 4G
innodb_log_buffer_size = 256M
innodb_io_capacity = 4000
innodb_io_capacity_max = 8000
innodb_read_io_threads = 16
innodb_write_io_threads = 16
innodb_flush_method = O_DIRECT
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table = 1

# Connection capacity
max_connections = 500
thread_cache_size = 100
table_open_cache = 8000

# Strict mode + UTC
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
default_time_zone = '+05:00'    # Asia/Tashkent

# Binlog — required for replication + PITR
log_bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7
sync_binlog = 1

# Slow query log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 0.5
log_queries_not_using_indexes = 0
```

### 5.3 Replication (db-01 → db-02)

```sql
-- On primary
CREATE USER 'replicator'@'%' IDENTIFIED BY '<random>';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';

-- On replica
CHANGE MASTER TO
  MASTER_HOST = 'db-01.private.mypos.uz',
  MASTER_USER = 'replicator',
  MASTER_PASSWORD = '<random>',
  MASTER_AUTO_POSITION = 1;
START SLAVE;
```

App reads route to db-02 via Laravel `read` connection in `config/database.php`:

```php
'mysql' => [
    'read' => ['host' => env('DB_READ_HOST', '127.0.0.1')],
    'write' => ['host' => env('DB_HOST', '127.0.0.1')],
    'sticky' => true,    // Same request reads from primary after a write
    // ... other options
]
```

### 5.4 Backups (daily 03:00 UZ + binlog continuous)

`infra/scripts/backup-db.sh` already authored:
- `mysqldump --single-transaction --quick --routines --triggers`
- Compress + GPG encrypt
- Upload MinIO + Cloudflare R2
- 30-day daily, 90-day weekly, monthly forever

PITR via binlogs:
- Binlogs to MinIO every 5 min via `mysqlbinlog --read-from-remote-server --raw --stop-never`

---

## 6. Redis cluster

For Phase 1 a single Redis 7.4 instance suffices. Phase 2: 3-node cluster.

### 6.1 redis.conf

```
maxmemory 6gb
maxmemory-policy allkeys-lru
appendonly yes
appendfsync everysec
requirepass <random>
```

### 6.2 Laravel uses

- **Cache** (`CACHE_STORE=redis`) — `Cache::remember`, public menu cache
- **Queue** (`QUEUE_CONNECTION=redis`) — Horizon, all jobs
- **Session** (`SESSION_DRIVER=redis`) — staff portal sessions
- **Reverb pub/sub** — WebSocket fan-out across instances

---

## 7. Reverb (WebSocket) at scale

Phase 1: single Reverb instance — handles ~5k concurrent connections.

```bash
# REVERB_SCALING_ENABLED=true required for multi-instance
REVERB_SCALING_ENABLED=true
REVERB_HOST=realtime.mypos.uz
REVERB_PORT=443
REVERB_SCHEME=https
```

Phase 2 (>50k concurrent): switch `BROADCAST_CONNECTION` to managed Pusher or Ably.

---

## 8. Domain + DNS strategy

### 8.1 Cloudflare records

```
Type  Name              Content                  Proxy
A     mypos.uz          <edge-01-ip>             ✓ (orange)
A     www.mypos.uz      <edge-01-ip>             ✓
A     api.mypos.uz      <edge-01-ip>             ✓
A     admin.mypos.uz    <edge-01-ip>             ✓
A     app.mypos.uz      <edge-01-ip>             ✓
A     qr.mypos.uz       <edge-01-ip>             ✓
A     kitchen.mypos.uz  <edge-01-ip>             ✓
A     order.mypos.uz    <edge-01-ip>             ✓
A     realtime.mypos.uz <realtime-01-ip>         ✗ (gray — Cloudflare doesn't proxy WS well)
TXT   _acme-challenge   (managed by Caddy)       —
```

### 8.2 Tenant custom domains

Pro/Plus/Enterprise tenants add their domain via Filament Brand Studio:
1. Tenant creates `tenant_domains` row
2. UI shows DNS instructions: `CNAME jomeburger.uz → tenants.mypos.uz`
3. Verification job polls every 60s checking the CNAME points correctly
4. Once verified, `is_verified=true` and Caddy starts issuing TLS on demand

---

## 9. CI/CD pipeline

Already authored: `.github/workflows/ci.yml`

Production push flow:
1. Developer opens PR → CI runs (lint, typecheck, Pest, PHPStan)
2. Merge to `main` → triggers Coolify webhook
3. Coolify pulls + builds + zero-downtime deploys
4. Health check: `GET /health` returns 200
5. If 5xx rate spikes, Coolify auto-rollbacks

---

## 10. Observability

### 10.1 Error tracking — Sentry

```
SENTRY_LARAVEL_DSN=<dsn>
SENTRY_TRACES_SAMPLE_RATE=0.05    # 5% sampling
SENTRY_PROFILES_SAMPLE_RATE=0.05
```

Wire via `composer require sentry/sentry-laravel`.

### 10.2 Metrics — Prometheus + Grafana

Self-hosted on a small VPS. Scrape from:
- `node_exporter` on each VPS (CPU/RAM/disk/network)
- `mysqld_exporter` (DB stats)
- `redis_exporter`
- Laravel custom metrics: orders/sec, payment success rate, AI cost/day

Dashboards:
- `mypos-overview` — high-level KPIs
- `mypos-api-latency` — p50/p95/p99 per endpoint
- `mypos-db-health` — connections, slow queries, replication lag
- `mypos-revenue` — orders/min, GMV, MRR (cross-checked with billing)

### 10.3 Uptime — UptimeRobot or self-hosted

Monitors:
- `mypos.uz` (marketing) — every 1 min
- `api.mypos.uz/health` — every 1 min
- `app.mypos.uz` — every 5 min
- `admin.mypos.uz` — every 5 min
- One representative tenant custom domain — every 5 min

Alerts → Telegram channel `#mypos-ops`.

### 10.4 Log aggregation — Loki + Grafana

Each VPS runs `promtail` shipping `/var/log/mypos/*.log` + `nginx/access.log` to Loki.

---

## 11. Security hardening

### 11.1 OWASP top 10 baseline

- ✅ A01 Broken access control — Policies + `BelongsToTenant` (single-layer post ADR-0005)
- ✅ A02 Crypto — `Crypt::` for PII, TLS everywhere
- ✅ A03 Injection — Eloquent param binding, no string concat in SQL
- ⏳ A04 Insecure design — formal threat model TBD
- ✅ A05 Misconfiguration — env validated via `config/`
- ⏳ A06 Vulnerable components — `composer audit` + `pnpm audit` weekly
- ✅ A07 Auth — Sanctum scoped tokens, PIN attempts rate-limited
- ✅ A08 Logging — audit_logs domain
- ⏳ A09 Logging failures — alert on missing audit log writes
- ✅ A10 SSRF — webhook IP allowlist for Click/Payme

### 11.2 Mandatory pre-launch

- [ ] Run `security-auditor` agent on all auth/payment/tenant changes
- [ ] Penetration test (external) — at minimum, OWASP ZAP automated scan
- [ ] PCI DSS scope analysis (we don't store card numbers — Click/Payme do, so out of scope)
- [ ] Privacy policy + Terms of Service — UZ + RU + EN
- [ ] GDPR-style data deletion endpoint (`DELETE /api/v1/me/data`)

### 11.3 Secrets management

- Coolify env vars + GitHub secrets for CI
- For DB master passwords: Doppler or HashiCorp Vault (Phase 2)
- Rotate every 90 days

---

## 12. Disaster recovery

### 12.1 RTO / RPO targets

- **RTO** (Recovery Time Objective): 4 hours for region failover
- **RPO** (Recovery Point Objective): 5 minutes for primary data, 1 hour for object storage

### 12.2 Failure modes covered

| Scenario | Detection | Mitigation | RTO |
|---|---|---|---|
| db-01 disk failure | replication lag alert | promote db-02 → primary | 30 min |
| Whole UZCLOUD region outage | uptime monitor | failover DNS to Beeline DC | 4 hours |
| ransomware on backups | hash-verify on restore | Cloudflare R2 immutability | 24 hours |
| Accidental DROP TABLE | audit log | binlog replay to T-1 second | 1 hour |
| Caddy cert exhaustion | rate-limit alert | manual rate-limit reset + investigate | 15 min |

### 12.3 Game day exercises

Quarterly:
1. Simulate db-01 failure → drill failover to db-02
2. Simulate region failure → drill DR site activation
3. Restore from backup → verify data integrity

---

## 13. Phase 0 → Phase 1 → Phase 2 timeline

### Phase 0 — Pre-launch (NOW)

- [ ] Performance audit completed (done 2026-05-10, see ADR-0005 follow-up)
- [ ] Security audit completed (done 2026-05-10)
- [ ] CI green on main
- [ ] All tests pass on MySQL 8.4
- [ ] Demo data seeded for sales demos
- [ ] Privacy policy + ToS drafted

### Phase 1 — Launch (T+0 to T+30 days)

- [ ] Provision UZCLOUD servers (12 VPS as per topology)
- [ ] Coolify installed
- [ ] Domain + DNS configured
- [ ] First 5 production tenants onboarded manually
- [ ] Status page live
- [ ] Telegram alert channel
- [ ] On-call rotation (founder solo for now)

### Phase 2 — Growth (T+30 to T+180 days)

- [ ] Read replica live + Laravel sticky reads enabled
- [ ] Beeline DC DR site live
- [ ] Sentry / Datadog wired
- [ ] First 50 paying tenants
- [ ] Hire DevOps engineer

### Phase 3 — Scale (T+180 to T+365 days)

- [ ] Sharding plan if `tenants > 500`
- [ ] Edge cache (Cloudflare Workers) for public menu
- [ ] Multi-region active-active
- [ ] First 1000 paying tenants

---

## 14. Cost model (estimated, Phase 1)

| Category | Monthly | Notes |
|---|---|---|
| UZCLOUD VPS | $1,000 | 12 servers, see specs |
| Beeline DC (DR) | $300 | mirror nodes |
| Cloudflare R2 (offsite backup) | $20 | ~1TB / mo egress |
| Cloudflare Pro | $20 | DNS, WAF |
| Anthropic Claude API | $200–800 | scales with AI feature usage |
| Sentry / Datadog | $100 | Team tier |
| Domain + WHOIS privacy | $15 | renewals |
| **Total** | **~$1,700** | for 50 tenants ($90 avg) → $4,500 MRR → 62% margin |

---

## 16. Open decisions

- [ ] **Hosting**: stay on UZCLOUD or move to Beeline as primary? (Currently: UZCLOUD primary, Beeline DR.)
- [ ] **MariaDB vs MySQL** in production (this doc assumes MySQL 8.4 LTS).
- [ ] **Object storage**: keep self-hosted MinIO or use Cloudflare R2 as primary? (Speed of UZ users vs cost.)
- [ ] **Search**: stay with Meilisearch or evaluate Typesense / OpenSearch?
- [ ] **Bot platform**: Telegraf (current) or migrate to Telegraf-Sessions-Redis at Phase 2?
- [ ] **AI provider**: Claude only or add Gemini/GPT for cost-tier fallback?

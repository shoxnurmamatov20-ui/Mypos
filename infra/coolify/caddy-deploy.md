# Caddy production deployment (Coolify on UZCLOUD)

This document covers deploying the `caddy` reverse proxy as the single edge
ingress for the MyPOS platform — terminating TLS for `*.mypos.uz` and any
custom tenant domain (Phase 2).

## Topology

```
                 +------------------------- Internet -------------------------+
                                  |
                                  v
            +-------- Caddy (UZCLOUD) :80, :443 --------+
            |  on-demand TLS for any verified domain    |
            |  X-Caddy-Token shared with API            |
            +-------------------+-------------------+---+
                                |                   |
                                v                   v
                 +--------- nextjs:3000      api:80 (Laravel) ----+
                 |  marketing + dashboard      controllers + queue|
                 +-----------+-----------+   +-------+------------+
                             |                       |
                             v                       v
                     postgres / redis / meilisearch / minio
```

Caddy is the only public-facing service. Everything else binds to the internal
Coolify network.

## DNS

Two zones to manage:

1. **`mypos.uz` and subdomains** — point to Caddy:
   - `A  mypos.uz       -> <caddy-public-ip>`
   - `A  *.mypos.uz     -> <caddy-public-ip>`
   - `A  api.mypos.uz   -> <caddy-public-ip>`
   - `A  admin.mypos.uz -> <caddy-public-ip>`
   - `A  edge.mypos.uz  -> <caddy-public-ip>` ← restaurants CNAME their
     custom domains here

2. **Tenant custom domains** — restaurants set up themselves:
   - Owner adds the domain in the admin UI (Filament → Tenants → Domains).
   - Verification job tells the owner to create a TXT record:
     `_mypos-verify.<their-domain>  TXT  <verification-token>`
   - Once verified, owner CNAMEs `<their-domain>` → `edge.mypos.uz`.
   - First HTTPS hit triggers on-demand cert issuance.

## Coolify resource setup

In the Coolify UI:

1. Create a new **Application** of type "Docker Compose".
2. Source: this repo, working dir `infra/`.
3. Compose file: `docker-compose.yml`.
4. Profile: `edge` (so the `caddy` service starts).
5. Domains: leave Coolify's reverse-proxy disabled — Caddy IS our ingress.
6. Open ports `80/tcp` and `443/tcp` on the public interface; bind `2019` to
   loopback only (already enforced in `docker-compose.yml`).

## Required env vars (Coolify → Environment)

| Var                       | Notes                                                                                      |
|---------------------------|--------------------------------------------------------------------------------------------|
| `CADDY_INTERNAL_TOKEN`    | 32+ char random string, also set on the Laravel side as `CADDY_INTERNAL_TOKEN`.            |
| `APP_ENV=production`      | Disables `acme_ca` staging fallback + flips Laravel's fail-closed verify behavior.         |
| `LE_EMAIL=admin@mypos.uz` | Optional override for the global `email` directive in the Caddyfile.                       |

The Laravel side resolves the token via `config('app.caddy_secret')` — set
this through a Doppler/Coolify-injected env, **never** committed to the repo.

## Volumes

Caddy persists ACME state to `caddy_data` (issued certs, account keys) and
runtime config to `caddy_config`. Both are named volumes — back them up:

```bash
# Snapshot ACME state nightly. Losing this just forces re-issuance, which is
# rate-limited (50 certs / week per registered domain at LE) so make backups.
docker run --rm -v mypos_caddy_data:/data -v "$PWD":/backup alpine \
    tar czf /backup/caddy_data_$(date +%F).tgz -C /data .
```

## Health & rollout

- Liveness: `GET https://api.mypos.uz/up` — Laravel `/up` health endpoint.
- Caddy admin: `curl http://127.0.0.1:2019/config/` (loopback only).
- Reload config without downtime:
  ```bash
  docker exec mypos-caddy caddy reload --config /etc/caddy/Caddyfile
  ```

## Disaster recovery (Beeline DC standby)

1. Beeline DC runs an identical `caddy` profile but its `nextjs`/`api` are
   warm-standby (read replicas).
2. DNS is flipped via Cloudflare load balancer health check — when UZCLOUD
   probes start failing, traffic shifts to Beeline.
3. ACME state (`caddy_data`) is rsynced nightly UZCLOUD → Beeline so the DR
   side does not need to re-issue every cert.

## Common operational tasks

### Force-refresh a single cert

```bash
docker exec mypos-caddy caddy reload --config /etc/caddy/Caddyfile
# or, more aggressive:
docker exec mypos-caddy rm -rf /data/caddy/certificates/.../<domain>
```

### Check what got issued

```bash
docker exec mypos-caddy ls /data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/
```

### Investigate "ask" rejections

If a tenant complains their domain isn't getting SSL:

1. `docker logs mypos-caddy --tail 200 | grep <domain>`
2. From Caddy: `curl -H "X-Caddy-Token: $CADDY_INTERNAL_TOKEN" \
       http://api/api/internal/caddy/verify?domain=<domain>`
3. From the API: `php artisan tinker` → `TenantDomain::where('domain', '...')->first()`

## Hardening checklist (production only)

- [ ] `CADDY_INTERNAL_TOKEN` rotated quarterly (both Caddy + Laravel `.env`).
- [ ] `acme_ca` staging line in Caddyfile is **commented** (real LE in prod).
- [ ] `:2019` admin port bound to loopback (verified: `ss -lntp | grep 2019`).
- [ ] `caddy_data` is on persistent storage with off-host backups.
- [ ] Cloudflare or upstream WAF strips `X-Caddy-Token` from inbound traffic
      so external callers can't spoof it.
- [ ] On-demand TLS `burst` tuned to fleet size — default 5 is fine for first
      ~1000 tenants; raise alongside MRR.

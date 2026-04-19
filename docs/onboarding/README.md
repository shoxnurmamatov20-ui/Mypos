# Onboarding

Welcome to MyPOS. This guide helps you set up your local dev environment and understand the project.

## Prerequisites

- **Node.js 22+** — `nvm install 22` (or use `.nvmrc`)
- **pnpm 10+** — `npm install -g pnpm@10`
- **PHP 8.5+** — via asdf, mise, or official installer
- **Composer 2.9+** — https://getcomposer.org/
- **Docker 26+** + Docker Compose v2
- **Git** — any recent version

On Windows: use **Git Bash** or **WSL2** (recommended).

## Setup

### 1. Clone

```bash
git clone git@github.com:YOUR_ORG/mypos.git
cd mypos
```

### 2. Install JS dependencies

```bash
pnpm install
```

### 3. Start infrastructure

```bash
pnpm docker:up
# Wait ~30s for Postgres, Redis, Meilisearch, MinIO to be ready
```

Check services: http://localhost:9001 (MinIO console), http://localhost:7700 (Meilisearch).

### 4. Backend (Laravel)

```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
```

### 5. Create first user

```bash
php artisan mypos:create-super-admin  # custom command, TBD
```

### 6. Run all apps

From repo root:

```bash
pnpm dev
```

This starts (via Turborepo):
- Laravel API on http://localhost:8000
- Filament admin on http://localhost:8000/admin
- Manager Dashboard on http://localhost:3001
- (Others as they land)

## Architecture overview

1. Read **[CLAUDE.md](../../CLAUDE.md)** — project conventions
2. Skim **[MYPOS_ULTRA_PLAN.md](../../../MYPOS_ULTRA_PLAN.md)** — vision + roadmap
3. Read **[architecture/README.md](../architecture/README.md)** — system design
4. Review recent **[ADRs](../adr/)** — key decisions

## Daily workflow

```bash
# Morning
git pull
pnpm install    # if lockfile changed
pnpm docker:up
cd apps/api && composer install && php artisan migrate  # if migrations

# Dev
pnpm dev        # all services
pnpm lint       # before commit
pnpm test       # per app

# Before PR
pnpm typecheck
cd apps/api && vendor/bin/pest && vendor/bin/phpstan
```

## Getting help

- `CLAUDE.md` for coding conventions
- `docs/guides/` for how-tos
- `docs/runbooks/` for ops procedures
- ADRs for "why we did X"
- Ask via team chat / GitHub Discussions

## First tasks for new devs

Good first issues will be tagged `good-first-issue` on GitHub.

# MyPOS

> Markaziy Osiyo uchun #1 Restaurant Operating System

**MyPOS** — restoranlar uchun enterprise-level SaaS platforma. POS, KDS, delivery, analytics, loyalty, AI — hammasi bitta tizim.

[![CI](https://github.com/YOUR_ORG/mypos/actions/workflows/ci-api.yml/badge.svg)](https://github.com/YOUR_ORG/mypos/actions)

## 📦 Monorepo tuzilmasi

```
mypos/
├── apps/
│   ├── api/                    # Laravel 12 backend
│   ├── web-dashboard/          # Next.js Manager/Owner dashboard
│   ├── web-consumer/           # Next.js mijoz web
│   ├── web-superadmin/         # Next.js advanced super admin
│   ├── web-marketing/          # Next.js landing (mypos.uz)
│   ├── web-qr/                 # Next.js QR menu PWA
│   ├── kds/                    # Next.js kitchen display
│   └── telegram-bot/           # Node.js Telegraf
│
├── packages/                   # Shared TypeScript
├── infra/                      # Docker + Coolify + scripts
├── docs/                       # Architecture + API + runbooks
└── .claude/                    # Claude Code agents
```

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- pnpm 10+
- PHP 8.5+
- Composer 2.9+
- Docker 26+
- **XAMPP** (MySQL 8.4) — main DB runs on host, not in Docker

### Setup
```bash
# 1. Clone
git clone git@github.com:YOUR_ORG/mypos.git
cd mypos

# 2. Install JS deps
pnpm install

# 3. Start XAMPP → click Start next to MySQL
#    Open http://localhost/phpmyadmin → CREATE DATABASE mypos
#    Default root user (empty password) works out-of-the-box.

# 4. Start side infra (Redis + MinIO + Meilisearch — NOT MySQL)
pnpm docker:up

# 5. Install Laravel backend
cd apps/api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed

# 6. Run dev servers (all apps)
cd ../..
pnpm dev
```

## 🏗️ Tech Stack

- **Backend:** Laravel 12 + PHP 8.5 + MySQL 8.4 (XAMPP) + Redis + Meilisearch
- **Web:** Next.js 15 + React 19 + TypeScript 5.9 + Tailwind 4
- **Real-time:** Laravel Reverb (WebSocket)
- **Admin:** Filament 3 + custom Next.js superadmin
- **Search:** Meilisearch
- **Storage:** MinIO (S3-compat)
- **AI:** Claude API
- **Hosting:** UZCLOUD (UZ) + Beeline DC (DR)
- **Orchestration:** Coolify (self-hosted PaaS)

## 📚 Documentation

- [Architecture](docs/architecture/README.md)
- [API Reference](docs/api/)
- [ADRs](docs/adr/)
- [Runbooks](docs/runbooks/)
- [Contributing](CONTRIBUTING.md)

## 🗺️ Roadmap

See [MYPOS_ULTRA_PLAN.md](../MYPOS_ULTRA_PLAN.md) — 12-month plan.

## 📄 License

Proprietary. All rights reserved.

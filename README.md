# MyPOS

> Markaziy Osiyo uchun #1 Restaurant Operating System

**MyPOS** — restoranlar, kafelar va oshxonalar uchun enterprise-level ko'p-tenantli SaaS platforma. Super admin → CEO (ko'p-restoran egasi) → manager → jamoa iyerarxiyasi, POS, KDS, delivery, analytics, loyalty, AI — hammasi bitta tizimda.

[![CI](https://github.com/NurmamatovYoqubjon20022006/Mypos/actions/workflows/ci.yml/badge.svg)](https://github.com/NurmamatovYoqubjon20022006/Mypos/actions/workflows/ci.yml)
[![E2E](https://github.com/NurmamatovYoqubjon20022006/Mypos/actions/workflows/ci-e2e.yml/badge.svg)](https://github.com/NurmamatovYoqubjon20022006/Mypos/actions/workflows/ci-e2e.yml)

## 📦 Monorepo tuzilmasi

```
mypos/
├── apps/
│   ├── api/                    # Laravel 12 + PHP 8.5 backend (DDD domenlari)
│   ├── web-portal/             # Universal SSO kirish nuqtasi + waiter panel
│   ├── web-superadmin/         # Platforma super admin paneli
│   ├── web-ceo/                # Ko'p-restoran egasi (CEO) paneli
│   ├── web-dashboard/          # Manager/Owner dashboard
│   ├── web-cashier/            # Kassir POS
│   ├── web-consumer/           # Mijoz marketplace web
│   ├── web-qr/                 # QR menyu PWA
│   ├── web-marketing/          # Landing (mypos.uz)
│   ├── kds/                    # Kitchen Display System
│   └── telegram-bot/           # Node.js Telegraf bot
│
├── packages/                   # Ulashilgan TypeScript kutubxonalar (types, ui, api-client, ...)
├── infra/                      # Docker, Coolify, proxy, dev skriptlar
├── docs/                       # Arxitektura, ADR, runbook'lar
└── .claude/                    # Claude Code agentlari
```

## 🚀 Quick Start

### Talablar
- Node.js 22+
- pnpm 10+
- PHP 8.5+ (intl, pdo_pgsql, mbstring, zip kengaytmalari bilan)
- Composer 2.9+
- **PostgreSQL 18** (ADR-0006)
- Docker 26+ (Redis / Meilisearch / MinIO uchun, ixtiyoriy)

### Sozlash
```bash
# 1. Klon
git clone https://github.com/NurmamatovYoqubjon20022006/Mypos.git
cd Mypos

# 2. JS bog'liqliklar
pnpm install

# 3. PostgreSQL 18 — quyidagilardan birini tanlang:
#    a) Docker:   pnpm docker:up        (postgres servisi, port 55432)
#    b) Native:   port 5432
#    c) Windows dev helper (trust-auth klaster, port 5433):
#       powershell -File infra/scripts/dev-postgres.ps1

# 4. Yon infra (Redis + MinIO + Meilisearch)
pnpm docker:up

# 5. Laravel backend
cd apps/api
composer install
cp .env.example .env        # DB_HOST/DB_PORT ni klasteringizga moslang
php artisan key:generate
php artisan migrate --seed  # demo super admin/CEO/owner/staff hisoblarini yaratadi

# 6. Barcha dev serverlar
cd ../..
pnpm dev
```

### Demo hisoblar (faqat local/testing seed)
| Rol | Login | Parol |
|---|---|---|
| Super admin | `admin@mypos.uz` | `admin123` |
| CEO (5 restoran egasi) | `ceo@mypos.uz` | `ceo123` |
| Restoran egasi | `owner@demo.mypos.uz` | `demo123` |
| Ofitsiant | `waiter@demo.mypos.uz` | `demo123` |

Butun biznes zanjirini jonli tekshirish: `infra/scripts/e2e-smoke.ps1` (42 qadam — super admin → tenant → menyu → buyurtma → to'lov → hisobot → CEO panel → public QR/review).

## 🏗️ Tech Stack

- **Backend:** Laravel 12 + PHP 8.5 + **PostgreSQL 18** (RLS ikki-qavatli tenant izolyatsiya, partitioning, partial/covering indekslar, JSONB) + Redis + Meilisearch
- **Web:** Next.js 15 + React 19 + TypeScript 5.9 + Tailwind 4
- **Real-time:** Laravel Reverb (WebSocket)
- **Admin:** Filament 3 + custom Next.js superadmin
- **Search:** Meilisearch
- **Storage:** MinIO (S3-compat)
- **AI:** Claude API
- **Hosting:** UZCLOUD (UZ) + Beeline DC (DR)
- **Orchestration:** Coolify (self-hosted PaaS)

## 🔐 Ko'p-tenantlik va xavfsizlik

Har bir tenant-scoped jadval `tenant_id` ga ega. Izolyatsiya **ikki qavatda**:
1. Eloquent Global Scope (`BelongsToTenant`) — fail-closed application qavati
2. PostgreSQL Row-Level Security — `app.current_tenant_id` GUC bo'yicha DB qavati

Batafsil: [ADR-0006](docs/adr/0006-postgresql-18-return.md), [SECURITY.md](SECURITY.md).

## ✅ Sifat

- Backend: **Pest** (839 test), **PHPStan level 8**, **Pint**
- Web: **Vitest** + **Playwright**, **Biome** (lint + format), `tsc` typecheck
- CI: GitHub Actions — PostgreSQL 18 service konteyneri bilan

## 📚 Hujjatlar

- [ADR'lar](docs/adr/) — arxitektura qarorlari
- [Runbook'lar](docs/runbooks/) — deploy, migratsiya
- [Contributing](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)

## 📄 Litsenziya

Proprietary. All rights reserved.

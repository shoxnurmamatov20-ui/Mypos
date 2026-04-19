---
name: migrate
description: Run Laravel migrations in local dev, then regenerate Prisma/TS types if needed.
---

Run database migrations safely.

## Steps

1. `cd apps/api && php artisan migrate`
2. If new columns: regenerate factories
3. Run `php artisan db:seed --class=DevSeeder` (if in dev)
4. If shipping models: invoke `/sync-api` to regen TS types

## Rollback

`php artisan migrate:rollback --step=1`

## Fresh (DESTRUCTIVE)

`php artisan migrate:fresh --seed` — only in local dev.

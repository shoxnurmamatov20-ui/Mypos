---
name: add-module
description: Create a new backend domain module (Laravel DDD) with migration, model, action, controller, request, resource, policy, and Pest tests.
---

Create a new domain module in the Laravel backend.

Usage: `/add-module <ModuleName>` (PascalCase, singular — e.g., `Reservation`, `GiftCard`)

## Steps

1. Invoke `db-migration-author` to create migration with `tenant_id`, RLS policy, indexes
2. Invoke `laravel-backend-dev` to scaffold:
   - `apps/api/app/Domain/<ModuleName>/Models/<ModuleName>.php`
   - `apps/api/app/Domain/<ModuleName>/Actions/` (CreateAction, UpdateAction, DeleteAction)
   - `apps/api/app/Domain/<ModuleName>/DataTransferObjects/` (Data class)
   - `apps/api/app/Http/Controllers/Api/V1/<ModuleName>/` (Controller)
   - `apps/api/app/Http/Requests/V1/<ModuleName>/` (Store, Update requests)
   - `apps/api/app/Http/Resources/V1/<ModuleName>/` (Resource)
   - `apps/api/app/Policies/<ModuleName>Policy.php`
   - `apps/api/database/factories/<ModuleName>Factory.php`
   - `apps/api/routes/api.php` (add versioned routes)
3. Invoke `i18n-translator` to add `{module_snake}.*` translation keys to UZ/RU/EN
4. Invoke `test-writer` to create Pest Feature tests
5. Invoke `filament-resource-dev` (optional) to add admin CRUD
6. Invoke `api-contract-keeper` to regenerate OpenAPI + TS SDK
7. Run `composer test` + `composer phpstan` + `pnpm typecheck` — all must pass

## Checklist before done

- [ ] Migration has `tenant_id`, RLS policy, indexes
- [ ] Model uses `BelongsToTenant` trait
- [ ] Every endpoint has Policy check
- [ ] FormRequest validates all inputs
- [ ] Resource defines output shape
- [ ] Pest tests cover happy + unauth + validation + tenant isolation
- [ ] Translations in all 3 languages
- [ ] Scribe docs regenerated
- [ ] CI green

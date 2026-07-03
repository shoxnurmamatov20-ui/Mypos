# RLS Runtime Roles — ishlab turgan holat va tekshiruv

> ADR-0006 "Runtime roles" bo'limining amaldagi qo'llanmasi. Oxirgi yangilanish: 2026-07-03.

## Nima uchun

PostgreSQL'da jadval **egasi** (owner) va superuser'lar RLS policy'larni
chetlab o'tadi. Shuning uchun web-runtime hech qachon egalik roli bilan
ulanmasligi kerak:

| Kontekst | Rol | RLS |
|---|---|---|
| PHP-FPM (HTTP API, Filament) | `mypos_app` (LOGIN, NOBYPASSRLS) | **majburiy** |
| artisan CLI / migratsiyalar | `mypos` (owner) | chetlab o'tadi (mo'ljallangan) |
| Horizon workerlar, scheduler, Reverb | `mypos` (owner) | chetlab o'tadi (cross-tenant joblar) |

## Mexanizm (shu serverda joriy)

1. `mypos_app` roli migratsiyada yaratilgan
   (`2026_07_21_000001_extend_rls_and_create_app_role`), keyin ops tomonidan
   LOGIN + parol bilan faollashtirilgan (`infra/scripts/pg-app-role.sql`).
2. **PHP-FPM pool** (`/etc/php/8.4/fpm/pool.d/mypos.conf`) `env[DB_USERNAME]`
   / `env[DB_PASSWORD]` orqali FPM jarayonlariga `mypos_app` ni beradi.
   Laravel'ning Dotenv'i mavjud environment o'zgaruvchini QAYTA YOZMAYDI,
   shuning uchun `.env` dagi `DB_USERNAME=mypos` faqat CLI/workerga tegishli
   bo'lib qoladi.
3. Zaxira yo'l (Coolify/Docker uchun): `.env` da `DB_APP_USERNAME` /
   `DB_APP_PASSWORD` berilsa, `AppServiceProvider::bindWebRuntimeDatabaseRole()`
   FPM SAPI'da ulanish hisob ma'lumotlarini almashtiradi
   (`config/database.php` → `database.app_runtime`).

## GUC oqimi

RLS policy'lar `app.current_tenant_id` GUC'iga qaraydi. Yagona yozish yo'li —
`App\Support\TenantGuc`:

- `SetTenantContext` middleware — autentifikatsiyalangan so'rovlar
  (tenant UUID; super admin va `/api/v1/ceo/*` uchun `'*'`).
  **Middleware tartibi kernel priority ro'yxati bilan mahkamlangan**:
  `Authenticate` → `ResolveTenantFromDomain` → `SetTenantContext` →
  `SubstituteBindings` (aks holda route-model-binding GUC'siz bajarilib har
  bir `/{model}` route 404 qaytaradi — 2026-07-03 da tuzatilgan regressiya,
  `tests/Feature/Http/MiddlewarePriorityTest` qo'riqlaydi).
- Pre-auth oqimlar o'zi imprint qiladi: kiosk device auth, public slug
  endpointlar, staff PIN login, guest order tracking/review, to'lov va EAS
  webhook'lari (wildcard), broadcast guest kanali (bir martalik wildcard).

## Tekshiruv

```bash
# 1) Runtime posturasi (rls_runtime: true bo'lishi shart)
curl -s http://127.0.0.1:8000/api/v1/health | jq '.rls_runtime'

# 2) Rol atributlari
sudo -u postgres psql -c "SELECT rolname, rolcanlogin, rolbypassrls FROM pg_roles WHERE rolname LIKE 'mypos%'"

# 3) Izolyatsiya test to'plami
cd apps/api && php artisan test tests/Feature/Security/
```

## Rollback (favqulodda)

FPM pool'dan `env[DB_USERNAME]`/`env[DB_PASSWORD]` qatorlarini olib tashlab
`sudo systemctl restart php8.4-fpm` — web yana owner rolga qaytadi (RLS
o'chadi, faqat Eloquent scope qoladi). Bu holat `/api/v1/health` da
`rls_runtime: false` bilan ko'rinadi.

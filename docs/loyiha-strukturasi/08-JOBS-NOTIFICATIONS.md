# ⚙️ BACKGROUND JOBS + NOTIFICATIONS

> Manba: `apps/api/app/Jobs/` (8 ta) + `apps/api/app/Notifications/` (Manager + 5 driver)
> Queue: **Laravel Horizon** + **Redis**
> Multi-tenancy: barchasi `Spatie\Multitenancy\Jobs\NotTenantAware`

---

## 📊 STATISTIKA

| Element | Soni |
|---|---|
| Background Jobs | **8** ta |
| Notification Drivers | **5** ta + interface |
| Notification classes | 3 ta |
| Reverb broadcast events | 6 ta (04-REVERB-EVENTS.md) |
| Listeners | 1 ta |

---

## 🔄 1. BACKGROUND JOBS (8 ta)

### Phase 3 — Native App Builder

#### `DispatchEasBuildJob.php`
**Maqsad:** EAS Build pipeline'ga build dispatch qilish
**Trigger:** `GenerateNativeAppAction` (ChainQueueJobs)
**Uses:**
- `EasBuildClient` — Expo Apptication Services API
- `AppAssetService` — MinIO assets
- Tenant + TenantApp + TenantAppBuild model

**Logika:**
1. Read queued `tenant_app_builds` row
2. Build EAS dispatch payload (tenant identity + brand + i18n)
3. POST to EAS Build API
4. Success → `in_progress` + `eas_build_id` + `log_url`
5. Failure → `errored` + retry up to `tries`

**Retry:** Default `tries`, exponential backoff
**Idempotency:** Status check up-front

#### `PollBuildStatusJob.php`
**Maqsad:** EAS Build holatini periodic ravishda poll qilish
**Schedule:** Har 30 soniyada (in_progress builds uchun)
**Logika:**
- EAS API'dan build status oladi
- DB row'ni yangilaydi (`status`, `artifact_url`, `log_url`)
- Terminal state'ga (finished/failed/errored/canceled) yetganda to'xtaydi

#### `SubmitToStoreJob.php`
**Maqsad:** TestFlight + Google Play Internal Testing'ga submit
**Trigger:** `submitToStore()` action — manual yoki auto
**Uses:**
- `AppStoreConnectClient` — Apple API
- `GooglePlayClient` — Google API

#### `PollSubmissionStatusJob.php`
**Maqsad:** Submission holatini track qilish
**Schedule:** Har 5 daqiqada (submitted submissions uchun)

---

### Notifications

#### `SendNotificationJob.php`
**Maqsad:** Single (tenant, channel, recipient, template, data) tuple uchun notification yuborish
**Constructor:**
```php
public function __construct(
    public string $tenantId,
    public string $channel,
    public string $recipient,
    public NotificationTemplate $template,
    public array $data,
    public array $extraMeta = [],
) {}
```

**Tries:** 3
**Backoff:** 10 soniya
**NotTenantAware:** o'z tenantId'ni olib boradi

**Logika:** `SendNotificationAction::execute()` chaqiradi → driver tanlanadi (email/sms/push/telegram/in_app) → message yuboriladi → `NotificationLog` yangilanadi

---

### Phase 4 — Multi-currency

#### `SyncFxRatesJob.php`
**Maqsad:** Markaziy banklardan kunlik FX rate yuklash
**Schedule:** Har kuni 02:00 local time (Tashkent)
**Provider strategy:**
1. CBU (Markaziy bank Uzbekistan) — UZS uchun
2. NBP (National Bank Poland) — TJS uchun
3. NBKR (National Bank Kyrgyzstan) — KGS uchun
4. **Fixer.io** fallback — boshqa currency'lar yoki provider fail

**Idempotency:**
- Unique constraint `(from_currency, to_currency, rate_date)`
- Upsert — minor in-day correction propagatsiya qiladi

**DB target:** `exchange_rates` jadval (append-only ledger)

---

### Phase 2 — Custom Domains

#### `VerifyDomainJob.php`
**Maqsad:** DNS (TXT/CNAME) verifikatsiya qilish
**Trigger:** `POST /api/v1/admin/domains/{domain}/verify`
**Logika:**
1. DNS query (TXT yoki CNAME record)
2. Token mosligini tekshirish
3. Match → `is_verified = true`, `verified_at = now()`
4. SSL provisioning trigger (Caddy)

#### `SyncSslStatusJob.php`
**Maqsad:** Caddy ACME holatini tekshirish
**Schedule:** Har 5 daqiqada (provisioning domains)
**Logika:**
- Caddy admin API'ga query
- `ssl_status` yangilash (pending → provisioning → active | error)
- `ssl_issued_at` set qilish

---

## 📬 2. NOTIFICATION SYSTEM

### Manager class

#### `NotificationManager.php`
**Path:** `app/Notifications/NotificationManager.php`

```php
class NotificationManager
{
    public function channel(string $channel): DriverInterface
    public function all(): array
    public function has(NotificationChannel $channel): bool
}
```

**Driverlar map:**
- `email` → EmailDriver
- `sms` → SmsDriver
- `push` → PushDriver
- `telegram` → TelegramDriver
- `in_app` → InAppDriver

### `NotificationServiceProvider.php`
Drivers binding va service container registratsiyasi.

---

### Drivers (5 ta + interface)

#### `DriverInterface.php`
```php
interface DriverInterface
{
    public function send(string $recipient, string $subject, string $body, array $meta = []): void;
}
```

#### `EmailDriver.php` 📧
- Laravel Mail facade
- SMTP / Mailtrap (dev)

#### `SmsDriver.php` 📱
- O'zbek operator gateway
- Eskiz / PlayMobile API

#### `PushDriver.php` 🔔
- Mobile push (iOS/Android)
- Firebase / Expo Push

#### `TelegramDriver.php` 💬
- Telegram Bot API
- Tenant'ning Telegraf bot'i orqali

#### `InAppDriver.php` 🔵
- DB write — `NotificationLog`
- Frontend polling/Reverb broadcast

---

### Notification Classes (3 ta)

#### `OrderPlacedNotification.php`
**Trigger:** Yangi Order
**Channels:** push (mobile-staff), in_app (web-dashboard)
**Listener:** `NotifyOnOrderPlaced.php` (`OrderPlaced` event'ga)

#### `OrderReadyNotification.php`
**Trigger:** OrderItem status = 'ready'
**Channels:** push (mobile-consumer — "ovqat tayyor!")

#### `LowStockAlertNotification.php`
**Trigger:** `LowStockReportAction` (scheduled daily)
**Channels:** email + telegram (tenant manager)

---

### Actions (2 ta)

#### `RenderTemplateAction.php`
**Maqsad:** Template + data → final message text
**Logic:**
- Template `NotificationTemplate` enumda
- Locale resolution (tenant default → recipient locale)
- Variable substitution (`{{order_no}}`, `{{customer_name}}`)
- Translatable strings (Laravel `lang/`)

#### `SendNotificationAction.php`
**Maqsad:** End-to-end notification pipeline
**Steps:**
1. `RenderTemplateAction` — message text
2. `NotificationManager::channel($channel)` — driver tanlash
3. `driver->send()` — yuborish
4. `NotificationLog::markSent()` — audit
5. Failure → `markFailed($error)`

---

## 🎯 EVENT → JOB MAPPING

| Event | Listener | Job dispatched |
|---|---|---|
| `OrderPlaced` | `NotifyOnOrderPlaced` | `SendNotificationJob` (push to staff) |
| `OrderStatusChanged` (ready) | (auto) | `SendNotificationJob` (push to customer) |
| `PaymentCaptured` | (auto) | (Reverb broadcast only) |
| `LowStockReportAction` (scheduled) | direct | `SendNotificationJob` (email tenant) |
| `GenerateNativeAppAction` | direct | `DispatchEasBuildJob` |
| `console.php scheduled 02:00` | direct | `SyncFxRatesJob` |
| `ScheduleSslPoll` | direct | `SyncSslStatusJob` |
| `Domain::verify()` | direct | `VerifyDomainJob` |

---

## 🔄 SCHEDULED TASKS (`routes/console.php`)

| Schedule | Job | Maqsad |
|---|---|---|
| Daily 02:00 | `SyncFxRatesJob` | Phase 4 FX update |
| Every 5 min | `SyncSslStatusJob` | Phase 2 Caddy ACME poll |
| Every 30 sec (queue) | `PollBuildStatusJob` | Phase 3 EAS Build poll |
| Every 5 min (queue) | `PollSubmissionStatusJob` | Phase 3 store submission poll |
| Daily 03:00 | `LowStockReportAction` | Inventory alerts |
| Daily 04:00 | NotificationLog retention sweep | 90-day cleanup |
| Daily 04:30 | CourierLocation partition rotation | 7-day retention |

---

## 🛠️ HORIZON KONFIGURATSIYA

**File:** `config/horizon.php`
**UI:** `/horizon` (super-admin only)

**Default queues:**
- `default` — General jobs
- `notifications` — High-priority push/SMS
- `builds` — EAS Build dispatch
- `polling` — Status polling jobs
- `fx` — Daily FX sync

**Retry strategy:**
- `tries`: default 3
- `backoff`: 10s default
- Failed jobs → `failed_jobs` table

---

## 🌐 NOTIFICATION CHANNELS ENUM

```php
// app/Domain/Notification/Enums/NotificationChannel.php
enum NotificationChannel: string
{
    case Email = 'email';
    case Sms = 'sms';
    case Push = 'push';
    case Telegram = 'telegram';
    case InApp = 'in_app';
}
```

---

## 📋 NOTIFICATION TEMPLATE ENUM

```php
enum NotificationTemplate: string
{
    case OrderPlaced = 'order_placed';
    case OrderReady = 'order_ready';
    case OrderDelivered = 'order_delivered';
    case OrderCancelled = 'order_cancelled';
    case LowStockAlert = 'low_stock_alert';
    case PaymentReceived = 'payment_received';
    case StaffShiftReminder = 'staff_shift_reminder';
    // ...
}
```

---

## 🔒 PII HANDLING

**NotificationLog'da PII shifrlangan:**
- `recipient` (email/phone/device_token/chat_id) — `encrypted`
- `body` (full message text) — `encrypted`

**Filament UI'da decryption:**
- Auto-decrypt on view
- Audit log: `AuditLogger::log('admin.viewed_notification_pii')`

---

## 📡 REVERB INTEGRATION

Background jobs **emit Reverb events** (broadcasting):

| Job | Emits | Channel |
|---|---|---|
| `SendNotificationJob` (in_app) | — | (DB write only — frontend polls) |
| `CapturePaymentAction` | `PaymentCaptured` | tenant.{id}.dashboard, order.{id} |
| `RecordCourierLocationAction` | `CourierLocationUpdated` | order.{id} |
| `CreateOrderAction` | `OrderPlaced` | tenant.{id}.kitchen, dashboard |
| `UpdateOrderStatusAction` | `OrderStatusChanged` | tenant.{id}.dashboard, order.{id} |
| `UpdateOrderItemStatusAction` | `OrderItemStatusChanged` | tenant.{id}.kitchen, staff |

> Detailed: `04-REVERB-EVENTS.md`

---

## 🧪 TESTLAR

| Test | Tekshiradi |
|---|---|
| `tests/Feature/V1/Notification/NotificationChannelTest.php` | 5 driver behavior |
| `tests/Feature/AI/AnthropicClientTest.php` | API integration |
| `tests/Feature/App/EasBuildClientTest.php` | EAS API client |
| `tests/Feature/App/EasWebhookTest.php` | EAS webhook signature |
| `tests/Feature/App/GenerateBuildTest.php` | Job dispatch |
| `tests/Feature/App/SubmitToStoreTest.php` | Store submission flow |
| `tests/Feature/Money/FxRateServiceTest.php` | Rate provider chain |

---

> Yangilangan: 2026-05-03 · Manba: 8 Jobs + NotificationManager + 5 Drivers + 3 Notifications

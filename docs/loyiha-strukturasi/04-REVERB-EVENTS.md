# 📡 REVERB REAL-TIME EVENTS + CHANNELS

> Manba: `apps/api/routes/channels.php` + `apps/api/app/Events/`
> Protokol: **Pusher protocol** (Laravel Reverb)
> Auth endpoint: `POST /api/broadcasting/auth`
> Subscriber: `pusher-js` (web) + `laravel-echo` (mobile)

---

## 🎯 KANALLAR ARXITEKTURASI

### 4 ta asosiy kanal:

```
PrivateChannel("tenant.{tenantId}.kitchen")     ← KDS line — Chef/Manager/Owner
PrivateChannel("tenant.{tenantId}.dashboard")   ← Owner counters — Manager/Owner
PrivateChannel("tenant.{tenantId}.staff")       ← Generic staff (Waiter/Cashier/Chef/Courier)
PrivateChannel("order.{orderId}")               ← Per-order updates — Staff yoki guest tracking_token
```

---

## 🔐 AUTORIZATSIYA QOIDALARI (`routes/channels.php`)

### `tenant.{tenantId}.kitchen`
```php
Auth talabi:
- $user !== null
- $user->tenant_id === $tenantId
- Roles: Chef OR Manager OR Owner
```

### `tenant.{tenantId}.dashboard`
```php
Auth talabi:
- $user !== null
- $user->tenant_id === $tenantId
- Roles: Manager OR Owner
- Sabab: revenue / staff productivity ko'rsatkichlari leadership uchun
```

### `tenant.{tenantId}.staff`
```php
Auth talabi:
- $user !== null
- $user->tenant_id === $tenantId
- Roles: Owner OR Manager OR Cashier OR Waiter OR Chef OR Courier
```

### `order.{orderId}` ⭐ Eng murakkab
```php
2 ta valid auth path:

PATH 1 — Authenticated tenant user:
- Order tenant_id === $user->tenant_id
- Hech qanday role talabi yo'q (kelajakda customer roli bo'lishi mumkin)

PATH 2 — Guest customer (tracking page):
- Query parametri ?tracking_token=...
- Constant-time compare (hash_equals) ${order->tracking_token} bilan
- Order withoutGlobalScopes() orqali topiladi (guest-uchun)
```

---

## 📨 6 TA BROADCAST EVENT

### 1️⃣ `order.placed` — Yangi buyurtma
**Class:** `App\Events\Order\OrderPlaced`
**Trigger:** Yangi `Order` DB ga kommit qilingach
**Broadcast On:**
- `tenant.{tenant_id}.kitchen`
- `tenant.{tenant_id}.dashboard`

**Listeners:**
- `NotifyOnOrderPlaced` (in-app push)
- KDS frontend (real-time queue update)
- Dashboard widget (counter increment)

**Payload (broadcastWith):**
```json
{
  "id": "uuid",
  "tenant_id": "uuid",
  "order_no": "ORD-2024-001234",
  "type": "dine_in|delivery|takeout",
  "status": "pending",
  "table_id": "uuid|null",
  "table_no": "Table 5",
  "items_count": 4,
  "total_amount": 145000,
  "currency": "UZS",
  "placed_at": "2026-05-03T14:32:11+05:00"
}
```

> ⚠️ PII (delivery_address, encrypted phone) **broadcast qilinmaydi** — frontend kerak bo'lsa, REST orqali fetch qiladi.

---

### 2️⃣ `order.status_changed` — Order status o'zgarishi
**Class:** `App\Events\Order\OrderStatusChanged`
**Trigger:** Status transition (pending → preparing → ready → served → completed/cancelled/refunded)
**Broadcast On:**
- `tenant.{tenant_id}.dashboard`
- `order.{order_id}` ← Customer tracking page

**Constructor:**
```php
new OrderStatusChanged(
    Order $order,
    string $oldStatus,
    string $newStatus,
    ?int $etaMinutes = null
)
```

**Payload:**
```json
{
  "order_id": "uuid",
  "tenant_id": "uuid",
  "order_no": "ORD-2024-001234",
  "old_status": "pending",
  "new_status": "preparing",
  "eta_minutes": 12,
  "changed_at": "2026-05-03T14:35:42+05:00"
}
```

---

### 3️⃣ `order.item.status_changed` — Kitchen item o'zgarishi
**Class:** `App\Events\Order\OrderItemStatusChanged`
**Trigger:** OrderItem state machine:
- `pending → preparing` (chef claims item)
- `preparing → ready` (item plated)
- `ready → served` (waiter delivers)

**Broadcast On:**
- `tenant.{tenant_id}.kitchen` (KDS)
- `tenant.{tenant_id}.staff` (Waiter app — bilish kerak qachon ovqat tayyor)

**Payload:**
```json
{
  "order_id": "uuid",
  "item_id": "uuid",
  "tenant_id": "uuid",
  "name": "Choʻpon kebabi (snapshot)",
  "old_status": "preparing",
  "new_status": "ready",
  "cook_id": "uuid|null",
  "changed_at": "2026-05-03T14:42:15+05:00"
}
```

---

### 4️⃣ `kitchen.item_assigned` — Chef self-assigns
**Class:** `App\Events\Order\KitchenItemAssigned`
**Trigger:** Chef OrderItem'ni o'ziga oladi (status: pending → preparing)
**Broadcast On:**
- `tenant.{tenant_id}.kitchen`

**Maqsad:** Boshqa cheflar bilishi kerak — bu item olinib bo'lgan, double-claiming bo'lmasligi uchun.

**Payload:**
```json
{
  "item_id": "uuid",
  "order_id": "uuid",
  "chef_id": "uuid",
  "chef_name": "Bekzod",
  "assigned_at": "2026-05-03T14:36:01+05:00"
}
```

> Bu event `OrderItemStatusChanged`ni to'ldiradi — bu yerda chef nomi qo'shimcha ko'rsatiladi.

---

### 5️⃣ `courier.location_updated` — GPS yangilanish
**Class:** `App\Events\Order\CourierLocationUpdated`
**Trigger:** Courier delivery vaqtida GPS yuboradi (har ~0.5s)
**Broadcast On:**
- `order.{order_id}` ← Faqat customer tracking PWA + dispatcher dashboard

**Filter qoidasi:** Faqat "out-for-delivery" status'dagi orderlar uchun (idle courierlar Reverb'ni flood qilmasligi uchun)

**Constructor:**
```php
new CourierLocationUpdated(
    CourierLocation $location,
    ?int $etaMinutes = null
)
```

**Payload:**
```json
{
  "order_id": "uuid",
  "lat": 41.31152,
  "lng": 69.27975,
  "heading": 87.5,
  "speed_mps": 4.2,
  "eta_minutes": 8,
  "recorded_at": "2026-05-03T14:48:33+05:00"
}
```

> Throttling: API endpoint `POST /api/v1/staff/courier/location` 120 req/min bilan cheklangan.

---

### 6️⃣ `payment.captured` — To'lov qabul qilindi
**Class:** `App\Events\Payment\PaymentCaptured`
**Trigger:**
- Cash acknowledgement (`CapturePaymentAction`)
- Click webhook → `ClickWebhookController`
- Payme webhook → `PaymeWebhookController`

**Broadcast On:**
- `tenant.{tenant_id}.dashboard` ← Revenue counter
- `order.{order_id}` ← Customer page (paid status)

**Payload:**
```json
{
  "payment_id": "uuid",
  "order_id": "uuid|null",
  "tenant_id": "uuid",
  "amount": 145000,
  "currency": "UZS",
  "method": "click|payme|cash",
  "captured_at": "2026-05-03T14:50:18+05:00"
}
```

---

## 🧬 BROADCAST PATTERNS

### `NotTenantAware` qo'llanishi
Barcha eventlar `Spatie\Multitenancy\Jobs\NotTenantAware` interfeysini implement qiladi.

**Sabab:**
- Tenant kanal nomida zaten encoded (`tenant.{id}.kitchen`)
- Queued job dequeue paytida `BelongsToTenant` global scope orqali Order qaytadan yuklanadi
- RLS SQL layer'da multi-tenancy ni saqlaydi
- Spatie'ning DB connection switching kerak emas

### Implementation interfeyslari
```php
class XxxEvent implements NotTenantAware, ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;
}
```

### Public properties (read-only)
```php
public function __construct(
    public readonly Order $order,
    public readonly string $oldStatus,
    public readonly string $newStatus,
    public readonly ?int $etaMinutes = null,
) {}
```

---

## 📡 KANAL LISTENING TOPOLOGIYASI

### KDS (Kitchen Display System)
**Subscribes:** `tenant.{tenantId}.kitchen`
**Listens:**
- `order.placed` → yangi card paydo bo'ladi
- `order.item.status_changed` → item rangi o'zgaradi
- `kitchen.item_assigned` → chef nomi ko'rinadi

### Web Dashboard (Owner)
**Subscribes:** `tenant.{tenantId}.dashboard`
**Listens:**
- `order.placed` → counter +1
- `order.status_changed` → status widget update
- `payment.captured` → revenue +amount

### Mobile Staff (Waiter)
**Subscribes:** `tenant.{tenantId}.staff`
**Listens:**
- `order.item.status_changed` → "ovqat tayyor!" notif

### Customer Tracking PWA
**Subscribes:** `order.{orderId}` (with `?tracking_token=...`)
**Listens:**
- `order.status_changed` → status timeline
- `courier.location_updated` → marker move on map
- `payment.captured` → "to'landi" tick

### POS Terminal
**Subscribes:** `tenant.{tenantId}.staff`
**Listens:**
- `order.placed` (ga inkluzive)

---

## 🔌 CLIENT-SIDE INTEGRATSIYA

### Web (pusher-js)
```ts
// apps/web-dashboard/src/lib/echo.ts
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;
window.Echo = new Echo({
  broadcaster: 'reverb',
  key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
  wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
  wsPort: 8080,
  forceTLS: false,
  enabledTransports: ['ws', 'wss'],
});

window.Echo.private(`tenant.${tenantId}.dashboard`)
  .listen('.order.placed', (e) => { /* ... */ });
```

### Mobile (laravel-echo + pusher-js)
```ts
// apps/mobile-consumer/src/lib/echo.ts
// Identical setup — RN compatible
```

### Guest tracking page (no auth)
```ts
window.Echo.private(`order.${orderId}`, {
  auth: {
    params: { tracking_token: token } // <-- Critical!
  }
}).listen('.order.status_changed', (e) => { /* ... */ });
```

---

## 🛡️ XAVFSIZLIK FIKRLARI

| Element | Holat |
|---|---|
| Tenant scoping | ✅ Channel name + DB scope |
| Role-based auth | ✅ `routes/channels.php` |
| Guest tracking_token | ✅ `hash_equals` constant-time compare |
| PII filtration | ✅ broadcastWith hech qachon address/phone yubormaydi |
| Rate limiting | ✅ `/api/broadcasting/auth` 120/min |
| RLS defense-in-depth | ✅ DB layer scope |

### Trust ierarxiyasi
1. **Channel name** — eng birinchi gate (must be valid format)
2. **Auth callback** — channels.php closure (role + tenant check)
3. **broadcastWith** — payload PII-free
4. **Frontend** — render trusted data faqat

---

## 📊 EVENT FAN-OUT JADVALI

| Event | Kitchen | Dashboard | Staff | Order |
|---|:---:|:---:|:---:|:---:|
| `order.placed` | ✅ | ✅ | — | — |
| `order.status_changed` | — | ✅ | — | ✅ |
| `order.item.status_changed` | ✅ | — | ✅ | — |
| `kitchen.item_assigned` | ✅ | — | — | — |
| `courier.location_updated` | — | — | — | ✅ |
| `payment.captured` | — | ✅ | — | ✅ |

---

## 🧪 TESTLAR

| Test fayli | Maqsad |
|---|---|
| `tests/Feature/Reverb/ChannelAuthTest.php` | 4 ta kanal auth qoidalari |
| `tests/Feature/Reverb/EventBroadcastTest.php` | 6 ta event broadcastWith payload |

---

## ⚙️ KONFIGURATSIYA

**Server:** `config/reverb.php`
**Broadcasting:** `config/broadcasting.php`
**Connection:** `BROADCAST_CONNECTION=reverb` env
**Default port:** `8080`
**Protocol:** Pusher

```env
REVERB_APP_ID=mypos-local
REVERB_APP_KEY=mypos-key-local
REVERB_APP_SECRET=mypos-secret-local
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

---

> Yangilangan: 2026-05-03 · Manba: 4 ta channel + 6 ta event class.

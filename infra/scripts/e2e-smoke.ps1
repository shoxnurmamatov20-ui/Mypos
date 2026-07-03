# MyPOS E2E business-chain smoke against the live API + PostgreSQL.
# Chain: super admin -> tenant+owner (CEO cabinet) -> menu/tables/staff ->
#        order -> KDS -> payment -> reports -> CEO panel -> public QR/review.
#
# Usage (local dev, from repo root):
#   cd apps/api
#   php artisan migrate:fresh --seed        # demo users incl. admin@mypos.uz
#   php artisan cache:clear                 # reset rate-limiter buckets
#   php artisan serve --host=127.0.0.1 --port=8010
#   powershell -ExecutionPolicy Bypass -File infra/scripts/e2e-smoke.ps1
#
# Exits with the count of failed steps; every step prints PASS/FAIL.
# Demo credentials come from the local-only seeders (DemoTenantSeeder,
# DemoCeoSeeder) and never exist outside local/testing environments.
$ErrorActionPreference = 'Continue'
$BASE = 'http://127.0.0.1:8010/api/v1'
$script:pass = 0; $script:fail = 0

function Invoke-Api {
    param([string]$Method, [string]$Path, $Body = $null, [string]$Token = $null)
    $headers = @{ Accept = 'application/json' }
    if ($Token) { $headers.Authorization = "Bearer $Token" }
    $params = @{ Method = $Method; Uri = "$BASE$Path"; Headers = $headers; TimeoutSec = 30 }
    if ($null -ne $Body) {
        $params.ContentType = 'application/json'
        $params.Body = ($Body | ConvertTo-Json -Depth 8)
    }
    try {
        $resp = Invoke-WebRequest @params -UseBasicParsing
        return @{ status = [int]$resp.StatusCode; json = ($resp.Content | ConvertFrom-Json) }
    } catch {
        $r = $_.Exception.Response
        $status = if ($r) { [int]$r.StatusCode } else { 0 }
        $bodyText = ''
        try { $reader = New-Object IO.StreamReader($r.GetResponseStream()); $bodyText = $reader.ReadToEnd() } catch {}
        $json = $null; try { $json = $bodyText | ConvertFrom-Json } catch {}
        return @{ status = $status; json = $json; raw = $bodyText }
    }
}

function Step {
    param([string]$Name, [scriptblock]$Check)
    try {
        $out = & $Check
        if ($out -eq $true) { $script:pass++; Write-Output ("PASS  " + $Name) }
        else { $script:fail++; Write-Output ("FAIL  {0}  => {1}" -f $Name, $out) }
    } catch {
        $script:fail++; Write-Output ("FAIL  {0}  => EXC {1}" -f $Name, $_.Exception.Message)
    }
}

# ── 1. SUPER ADMIN ────────────────────────────────────────────────────────
$sa = Invoke-Api POST '/super-admin/login' @{ email = 'admin@mypos.uz'; password = 'admin123' }
Step '1.1 super admin login' { if ($sa.status -eq 200 -and $sa.json.data.token) { $true } else { "$($sa.status) $($sa.raw)" } }
$saTok = $sa.json.data.token

$slug = "e2e-kafe-$(Get-Random -Maximum 99999)"
$mkTenant = Invoke-Api POST '/super-admin/tenants' @{
    name = 'E2E Kafe'; slug = $slug;
    owner_name = 'E2E Owner'; owner_email = "owner-$slug@test.uz"; owner_password = 'e2e-pass-123'
} $saTok
Step '1.2 super admin creates tenant + owner (CEO cabinet)' { if ($mkTenant.status -in 200,201) { $true } else { "$($mkTenant.status) $($mkTenant.raw)" } }

$saTenants = Invoke-Api GET '/super-admin/tenants?per_page=100' $null $saTok
Step '1.3 tenant appears in super admin list (from DB)' {
    $found = $saTenants.json.data | Where-Object { $_.slug -eq $slug }
    if ($saTenants.status -eq 200 -and $found) { $true } else { "$($saTenants.status) not-found" }
}

# ── 2. NEW OWNER CABINET WORKS ───────────────────────────────────────────
$newOwner = Invoke-Api POST '/auth/login' @{ identifier = "owner-$slug@test.uz"; password = 'e2e-pass-123' }
Step '2.1 freshly created owner can log in' { if ($newOwner.status -eq 200 -and $newOwner.json.data.token) { $true } else { "$($newOwner.status) $($newOwner.raw)" } }

# ── 3. DEMO OWNER: MENU / TABLES / STAFF (manager builds the team) ──────
$own = Invoke-Api POST '/auth/login' @{ identifier = 'owner@demo.mypos.uz'; password = 'demo123' }
Step '3.1 demo owner login' { if ($own.status -eq 200 -and $own.json.data.token) { $true } else { "$($own.status) $($own.raw)" } }
$ownTok = $own.json.data.token

$cat = Invoke-Api POST '/menu/categories' @{
    name = @{ uz = 'E2E Taomlar'; ru = 'E2E Blyuda'; en = 'E2E Dishes' }; sort_order = 99
} $ownTok
Step '3.2 create menu category' { if ($cat.status -in 200,201 -and $cat.json.data.id) { $true } else { "$($cat.status) $($cat.raw)" } }

$item = Invoke-Api POST '/menu/items' @{
    category_id = $cat.json.data.id
    name = @{ uz = 'E2E Osh'; ru = 'E2E Plov'; en = 'E2E Pilaf' }
    price_amount = 45000; price_currency = 'UZS'; is_active = $true
} $ownTok
Step '3.3 create menu item' { if ($item.status -in 200,201 -and $item.json.data.id) { $true } else { "$($item.status) $($item.raw)" } }
$itemId = $item.json.data.id

$tcat = Invoke-Api POST '/tables/categories' @{ name = @{ uz = 'E2E Zal'; ru = 'E2E Zal'; en = 'E2E Hall' }; sort_order = 9 } $ownTok
Step '3.4 create table category (zone)' { if ($tcat.status -in 200,201 -and $tcat.json.data.id) { $true } else { "$($tcat.status) $($tcat.raw)" } }

$tbl = Invoke-Api POST '/tables' @{ category_id = $tcat.json.data.id; name = "E2E-Stol-$(Get-Random -Maximum 99999)"; capacity = 4 } $ownTok
Step '3.5 create table' { if ($tbl.status -in 200,201 -and $tbl.json.data.id) { $true } else { "$($tbl.status) $($tbl.raw)" } }
$tableId = $tbl.json.data.id

$rand = Get-Random -Maximum 99999
$emp = Invoke-Api POST '/employees' @{
    user_data = @{ name = 'E2E Waiter'; email = "e2e-waiter-$rand@test.uz"; password = 'e2e-pass-123' }
    position = 'waiter'; hire_date = '2026-07-01'; hourly_rate = 30000
} $ownTok
Step '3.6 manager hires staff (waiter)' { if ($emp.status -in 200,201 -and $emp.json.data.id) { $true } else { "$($emp.status) $($emp.raw)" } }

# ── 4. ORDER LIFECYCLE (POS) ─────────────────────────────────────────────
$order = Invoke-Api POST '/orders' @{
    type = 'dine_in'; table_id = $tableId; guest_count = 2
    items = @(@{ menu_item_id = $itemId; quantity = 2 })
} $ownTok
Step '4.1 place dine-in order' { if ($order.status -in 200,201 -and $order.json.data.id) { $true } else { "$($order.status) $($order.raw)" } }
$orderId = $order.json.data.id
$orderTotal = $order.json.data.amounts.total

Step '4.2 order total computed from DB prices (2 x 45000)' { if ($orderTotal -eq 90000) { $true } else { "total=$orderTotal" } }

foreach ($st in @('preparing','ready','served')) {
    $mv = Invoke-Api PATCH "/orders/$orderId/status" @{ status = $st } $ownTok
    Step "4.3 order status -> $st (KDS flow)" { if ($mv.status -eq 200) { $true } else { "$($mv.status) $($mv.raw)" } }
}

$pay = Invoke-Api POST '/payments' @{ order_id = $orderId; provider = 'cash' } $ownTok
Step '4.4 create cash payment intent' { if ($pay.status -in 200,201 -and $pay.json.data.payment.id) { $true } else { "$($pay.status) $($pay.raw)" } }
$payId = $pay.json.data.payment.id

$cap = Invoke-Api POST "/payments/$payId/capture" @{} $ownTok
Step '4.5 capture payment' { if ($cap.status -eq 200) { $true } else { "$($cap.status) $($cap.raw)" } }

$ordAfter = Invoke-Api GET "/orders/$orderId" $null $ownTok
Step '4.6 order marked PAID after capture' {
    $ps = $ordAfter.json.data.payment_status
    if ($ps -eq 'paid') { $true } else { "payment_status=$ps" }
}

# ── 5. REPORTS / ACCOUNTING (visible to management) ─────────────────────
$sum = Invoke-Api GET '/orders/stats/summary' $null $ownTok
Step '5.1 orders summary from DB' { if ($sum.status -eq 200 -and $null -ne $sum.json.data.total_orders) { $true } else { "$($sum.status)" } }

$z = Invoke-Api GET '/reports/z-report' $null $ownTok
Step '5.2 Z-report' { if ($z.status -eq 200) { $true } else { "$($z.status) $($z.raw)" } }

$repOrders = Invoke-Api GET '/reports/orders' $null $ownTok
Step '5.3 orders report' { if ($repOrders.status -eq 200) { $true } else { "$($repOrders.status)" } }

$repMenu = Invoke-Api GET '/reports/menu-items' $null $ownTok
Step '5.4 menu-items report (ANY_VALUE fix)' { if ($repMenu.status -eq 200) { $true } else { "$($repMenu.status) $($repMenu.raw)" } }

$repTables = Invoke-Api GET '/reports/tables' $null $ownTok
Step '5.5 tables report' { if ($repTables.status -eq 200) { $true } else { "$($repTables.status)" } }

# ── 6. STAFF PANEL (waiter/chef surfaces: KDS source) ───────────────────
$waiter = Invoke-Api POST '/auth/login' @{ identifier = 'waiter@demo.mypos.uz'; password = 'demo123' }
Step '6.1 staff (waiter) login' { if ($waiter.status -eq 200 -and $waiter.json.data.token) { $true } else { "$($waiter.status)" } }
$wTok = $waiter.json.data.token

$kq = Invoke-Api GET '/staff/kitchen/queue' $null $wTok
Step '6.2 kitchen queue (KDS data)' { if ($kq.status -eq 200) { $true } else { "$($kq.status) $($kq.raw)" } }

$stme = Invoke-Api GET '/staff/me' $null $wTok
Step '6.3 staff profile' { if ($stme.status -eq 200) { $true } else { "$($stme.status)" } }

# ── 7. PUBLIC (web-qr / web-consumer sources) ────────────────────────────
$pubMenu = Invoke-Api GET '/public/menu/demo-restaurant'
Step '7.1 public QR menu from DB' { if ($pubMenu.status -eq 200 -and $pubMenu.json.data.items.Count -gt 0) { $true } else { "$($pubMenu.status) items=$($pubMenu.json.data.items.Count)" } }

$qrOrder = Invoke-Api POST '/public/menu/demo-restaurant/orders' @{
    table_id = $tableId
    items = @(@{ menu_item_id = $itemId; quantity = 1 })
}
Step '7.2 guest places table QR order (no auth)' { if ($qrOrder.status -in 200,201 -and $qrOrder.json.data.id) { $true } else { "$($qrOrder.status) $($qrOrder.raw)" } }

# Marketplace checkout — the web-consumer flow that issues a tracking token.
# throttle:5,1 per IP — retry once after the window if a previous run's
# requests are still inside the current minute.
$mktBody = @{
    restaurant_slug = 'demo-restaurant'
    items = @(@{ menu_item_id = $itemId; qty = 1 })
    customer = @{ phone = '+998901234599'; name = 'E2E Guest' }
    delivery = @{ is_pickup = $true }
    payment_method = 'cash'
}
$mkt = Invoke-Api POST '/public/orders' $mktBody
if ($mkt.status -eq 429) { Start-Sleep -Seconds 61; $mkt = Invoke-Api POST '/public/orders' $mktBody }
Step '7.3 marketplace guest checkout (web-consumer)' { if ($mkt.status -in 200,201) { $true } else { "$($mkt.status) $($mkt.raw)" } }
$trackToken = $mkt.json.data.tracking_token
$qrOrderId = $mkt.json.data.order_id

Step '7.3b checkout returns tracking token' { if ($trackToken) { $true } else { "keys: $((($mkt.json.data | Get-Member -MemberType NoteProperty).Name) -join ',')" } }

if ($trackToken) {
    $track = Invoke-Api GET "/public/orders/track/$trackToken"
    Step '7.4 guest tracks order by token' { if ($track.status -eq 200) { $true } else { "$($track.status) $($track.raw)" } }

    $review = Invoke-Api POST '/public/orders/review' @{
        order_id = $qrOrderId; tracking_token = $trackToken; rating = 5; comment = 'E2E: juda zo''r!'
    }
    Step '7.5 guest submits review' { if ($review.status -in 200,201) { $true } else { "$($review.status) $($review.raw)" } }
}

# ── 8. CEO PANEL (multi-restaurant owner) ────────────────────────────────
$ceo = Invoke-Api POST '/auth/login' @{ identifier = 'ceo@mypos.uz'; password = 'ceo123' }
Step '8.1 CEO login' { if ($ceo.status -eq 200 -and $ceo.json.data.token) { $true } else { "$($ceo.status) $($ceo.raw)" } }
$ceoTok = $ceo.json.data.token

$dash = Invoke-Api GET '/ceo/dashboard' $null $ceoTok
Step '8.2 CEO dashboard KPIs' { if ($dash.status -eq 200) { $true } else { "$($dash.status) $($dash.raw)" } }

$rests = Invoke-Api GET '/ceo/restaurants' $null $ceoTok
Step '8.3 CEO sees owned restaurants (5 seeded)' {
    $n = $rests.json.data.Count
    if ($rests.status -eq 200 -and $n -ge 5) { $true } else { "$($rests.status) count=$n" }
}

$fin = Invoke-Api GET '/ceo/finances/summary' $null $ceoTok
Step '8.4 CEO finances summary' { if ($fin.status -eq 200) { $true } else { "$($fin.status) $($fin.raw)" } }

$ceoTenantId = $rests.json.data[0].id
$mint = Invoke-Api POST '/ceo/tokens' @{ tenant_id = $ceoTenantId; ttl_hours = 24; count = 2; visit_reference = 'E2E-BATCH' } $ceoTok
Step '8.5 CEO mints visit tokens' { if ($mint.status -eq 200 -and $mint.json.tokens.Count -eq 2) { $true } else { "$($mint.status) $($mint.raw)" } }

$tokList = Invoke-Api GET '/ceo/tokens?q=e2e' $null $ceoTok
Step '8.6 CEO token list + summary' { if ($tokList.status -eq 200 -and $tokList.json.summary.total -ge 2) { $true } else { "$($tokList.status) total=$($tokList.json.summary.total)" } }

$fb = Invoke-Api GET '/ceo/feedback' $null $ceoTok
Step '8.7 CEO feedback endpoint' { if ($fb.status -eq 200) { $true } else { "$($fb.status) $($fb.raw)" } }

$fbStats = Invoke-Api GET '/ceo/feedback/stats' $null $ceoTok
Step '8.8 CEO feedback stats' { if ($fbStats.status -eq 200) { $true } else { "$($fbStats.status) $($fbStats.raw)" } }

# ── 9. SUPER ADMIN SEES THE WHOLE PICTURE ────────────────────────────────
$saDash = Invoke-Api GET '/super-admin/dashboard' $null $saTok
Step '9.1 super admin dashboard KPIs' { if ($saDash.status -eq 200) { $true } else { "$($saDash.status) $($saDash.raw)" } }

$saCharts = Invoke-Api GET '/super-admin/dashboard/charts' $null $saTok
Step '9.2 super admin charts (revenue across all tenants)' { if ($saCharts.status -eq 200) { $true } else { "$($saCharts.status) $($saCharts.raw)" } }

Write-Output ''
Write-Output ("RESULT: {0} passed, {1} failed" -f $script:pass, $script:fail)
exit $script:fail

import {
  ArrowRight,
  ArrowsClockwise,
  ChatCircleDots,
  CheckCircle,
  Code,
  Copy,
  CurrencyCircleDollar,
  FileText,
  Key,
  Lightning,
  Lock,
  Package,
  PlayCircle,
  ShieldCheck,
  Terminal,
  WebhooksLogo,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'API havolasi — MyPOS',
  description: "MyPOS REST API · 40+ endpoint · OAuth 2.0 · WebhooksLogo · SDK uchun TypeScript, PHP, Python.",
};

const STATS = [
  { value: '40+',  label: 'endpoint',     Icon: Code },
  { value: '5ms',  label: 'o\'rtacha p50', Icon: Lightning },
  { value: '99.99%',label: 'uptime SLA',  Icon: ShieldCheck },
  { value: 'v1',   label: 'stable',       Icon: Package },
] as const;

type EndpointGroup = {
  Icon: Icon;
  tint: string;
  bg: string;
  title: string;
  body: string;
  routes: ReadonlyArray<{ method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string }>;
};

const ENDPOINTS: ReadonlyArray<EndpointGroup> = [
  {
    Icon: Package, tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]',
    title: 'Buyurtmalar', body: 'Buyurtma yaratish, status yangilash, bekor qilish',
    routes: [
      { method: 'GET',  path: '/v1/orders' },
      { method: 'POST', path: '/v1/orders' },
      { method: 'PATCH',path: '/v1/orders/{id}' },
      { method: 'POST', path: '/v1/orders/{id}/refund' },
    ],
  },
  {
    Icon: Code, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    title: 'Menyu', body: 'Kategoriyalar, taomlar, narxlar, modifikatorlar',
    routes: [
      { method: 'GET',  path: '/v1/menu/categories' },
      { method: 'GET',  path: '/v1/menu/items' },
      { method: 'POST', path: '/v1/menu/items' },
      { method: 'PATCH',path: '/v1/menu/items/{id}' },
    ],
  },
  {
    Icon: CurrencyCircleDollar, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    title: "To'lovlar", body: 'Click, Payme, Uzcard tranzaksiyalari',
    routes: [
      { method: 'POST', path: '/v1/payments/click' },
      { method: 'POST', path: '/v1/payments/payme' },
      { method: 'GET',  path: '/v1/payments/{id}' },
      { method: 'POST', path: '/v1/payments/{id}/refund' },
    ],
  },
  {
    Icon: ShieldCheck, tint: 'text-blue-400', bg: 'bg-blue-500/15',
    title: 'Xodimlar', body: 'Rol, ruxsat, smena va ish vaqti',
    routes: [
      { method: 'GET',    path: '/v1/staff' },
      { method: 'POST',   path: '/v1/staff' },
      { method: 'PATCH',  path: '/v1/staff/{id}' },
      { method: 'DELETE', path: '/v1/staff/{id}' },
    ],
  },
  {
    Icon: FileText, tint: 'text-purple-400', bg: 'bg-purple-500/15',
    title: 'Hisobotlar', body: 'Smena, daromad, kategoriya tahlili',
    routes: [
      { method: 'GET', path: '/v1/reports/shift' },
      { method: 'GET', path: '/v1/reports/revenue' },
      { method: 'GET', path: '/v1/reports/category' },
      { method: 'GET', path: '/v1/reports/export' },
    ],
  },
  {
    Icon: WebhooksLogo, tint: 'text-emerald-400', bg: 'bg-emerald-500/15',
    title: 'WebhooksLogo', body: 'Real-time hodisa eshitish',
    routes: [
      { method: 'GET',    path: '/v1/webhooks' },
      { method: 'POST',   path: '/v1/webhooks' },
      { method: 'DELETE', path: '/v1/webhooks/{id}' },
      { method: 'POST',   path: '/v1/webhooks/{id}/test' },
    ],
  },
];

const METHOD_COLOR: Record<'GET' | 'POST' | 'PATCH' | 'DELETE', string> = {
  GET:    'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
  POST:   'bg-blue-500/15 text-blue-300 ring-blue-500/25',
  PATCH:  'bg-amber-500/15 text-amber-300 ring-amber-500/25',
  DELETE: 'bg-[rgba(255,0,55,0.12)] text-[#ff8aa1] ring-[rgba(255,0,55,0.25)]',
};

const SDKS: ReadonlyArray<{ name: string; cmd: string; bg: string }> = [
  { name: 'TypeScript', cmd: 'npm install @mypos/sdk',  bg: 'from-blue-500/25 via-blue-500/10' },
  { name: 'PHP',        cmd: 'composer require mypos/sdk', bg: 'from-purple-500/25 via-purple-500/10' },
  { name: 'Python',     cmd: 'pip install mypos-sdk',  bg: 'from-amber-500/25 via-amber-500/10' },
  { name: 'cURL',       cmd: 'curl -X POST ...',       bg: 'from-emerald-500/25 via-emerald-500/10' },
];

const WEBHOOK_EVENTS = [
  'order.created', 'order.updated', 'order.cancelled', 'order.refunded',
  'payment.succeeded', 'payment.failed', 'shift.opened', 'shift.closed',
  'menu.item.updated', 'inventory.low_stock', 'staff.clock_in', 'staff.clock_out',
] as const;

export default async function ApiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="bg-[#001B1B]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Terminal size={11} weight="bold" />
            API · v1
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Restoraningizni{' '}
            <span className="gradient-teal">dasturlash</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            40+ endpoint · OAuth 2.0 · WebhooksLogo · TypeScript, PHP va Python uchun SDK. Buyurtmadan eksportgacha — barchasi REST orqali.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://api.mypos.uz/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-full bg-[#ff0037] hover:bg-[#e6002f] text-white text-[14px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
            >
              <FileText size={14} weight="bold" />
              To&apos;liq havola
              <ArrowRight size={13} weight="bold" />
            </a>
            <a
              href="https://github.com/mypos/postman"
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-full border border-white/15 bg-white/[0.06] text-white text-[14px] font-bold hover:bg-white/[0.12] transition-colors"
            >
              <PlayCircle size={14} weight="fill" />
              Postman
            </a>
          </div>

          {/* Stats */}
          <div className="glass-card mx-auto mt-12 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {STATS.map((s) => (
              <div key={s.label} className="px-3 py-5 text-center bg-white/[0.02]">
                <s.Icon size={18} weight="bold" className="mx-auto mb-2 text-[#5eead4]" />
                <div className="tabular text-[22px] sm:text-[24px] font-extrabold leading-none text-white">{s.value}</div>
                <div className="mt-1 text-[10.5px] sm:text-[11px] font-semibold text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick start — auth + first request */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5 grid gap-5 lg:grid-cols-2">
          {/* Auth */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <Key size={17} weight="bold" className="text-[#5eead4]" />
              </span>
              <h2 className="text-[18px] font-extrabold tracking-tight text-white">
                Autentifikatsiya
              </h2>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-white/65">
              API kalitingizni admin paneldagi <strong className="text-white">Sozlamalar → API</strong> bo&apos;limidan oling.
            </p>
            <div className="mt-4 rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(0,16,16,0.55)] overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.06]">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">Header</span>
                <button type="button" aria-label="Nusxa" className="press inline-flex h-6 w-6 items-center justify-center rounded text-white/55 hover:text-[#5eead4]">
                  <Copy size={11} weight="bold" />
                </button>
              </div>
              <pre className="px-4 py-3 text-[11.5px] leading-relaxed font-mono text-white/85 overflow-x-auto">
{`Authorization: Bearer sk_live_xxxxxxxxxxxxxx
Content-Type: application/json`}
              </pre>
            </div>
            <ul className="mt-4 space-y-1.5 text-[12px] text-white/70">
              <li className="flex items-center gap-2">
                <CheckCircle size={12} weight="fill" className="text-[#5eead4] shrink-0" />
                <span>OAuth 2.0 yoki API key — sizning tanlovingiz</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={12} weight="fill" className="text-[#5eead4] shrink-0" />
                <span>Har bir kalit alohida ruxsat (scopes)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={12} weight="fill" className="text-[#5eead4] shrink-0" />
                <span>IP whitelisting va rate limiting</span>
              </li>
            </ul>
          </div>

          {/* First request */}
          <div className="rounded-2xl ring-1 ring-inset ring-white/10 bg-[rgba(0,16,16,0.55)] backdrop-blur-md overflow-hidden">
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-white/[0.06]">
              <span className="h-2 w-2 rounded-full bg-[#ff605c]" />
              <span className="h-2 w-2 rounded-full bg-[#ffbd44]" />
              <span className="h-2 w-2 rounded-full bg-[#00ca4e]" />
              <span className="ml-2 inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-300 ring-1 ring-inset ring-blue-500/25 tabular">
                POST
              </span>
              <span className="text-[11px] font-mono text-white/55">/v1/orders</span>
            </div>
            <pre className="px-4 py-4 text-[11.5px] leading-relaxed font-mono text-white/85 overflow-x-auto tabular">
{`curl -X POST https://api.mypos.uz/v1/orders \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "table_id": 12,
    "items": [
      { "sku": "OSH-001", "qty": 2 },
      { "sku": "TEA-GR", "qty": 1 }
    ],
    "payment": "click"
  }'

# 201 Created
{
  "id": "ord_8h2k...",
  "total": 87000,
  "status": "pending",
  "created_at": "2026-05-11T14:32:00Z"
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">Endpoints</p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Endpoint guruhlari
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              40+ endpoint 6 ta domen bo&apos;yicha. Hammasi versiyalangan va orqaga mos.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ENDPOINTS.map((g) => (
              <article key={g.title} className="glass-card glass-card-hover rounded-2xl p-5">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${g.bg}`}>
                    <g.Icon size={20} weight="bold" className={g.tint} />
                  </span>
                  <div>
                    <h3 className="text-[14.5px] font-bold tracking-tight text-white">{g.title}</h3>
                    <p className="text-[11px] text-white/55">{g.body}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-1.5">
                  {g.routes.map((r) => (
                    <li key={r.path} className="flex items-center gap-2 text-[11.5px] font-mono">
                      <span className={`tabular inline-flex w-12 items-center justify-center py-0.5 rounded ring-1 ring-inset font-bold text-[9.5px] uppercase tracking-wide ${METHOD_COLOR[r.method]}`}>
                        {r.method}
                      </span>
                      <span className="text-white/70 truncate">{r.path}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">SDK</p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Sizning tilingizdagi kutubxonalar
            </h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {SDKS.map((s) => (
              <article key={s.name} className={`glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${s.bg} to-transparent pointer-events-none`} />
                <div className="relative">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-white/[0.06]">
                    <Code size={20} weight="bold" className="text-white" />
                  </span>
                  <h3 className="mt-3.5 text-[15px] font-bold tracking-tight text-white">{s.name}</h3>
                  <pre className="mt-3 px-3 py-2 rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(0,16,16,0.55)] text-[10.5px] font-mono text-white/85 overflow-x-auto tabular">
                    {s.cmd}
                  </pre>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WebhooksLogo */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-10 grid gap-6 md:grid-cols-2 md:items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background: 'radial-gradient(circle at 100% 0%, rgba(20,184,166,0.18), transparent 50%)',
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-[10.5px] font-bold uppercase tracking-[0.08em]">
                <ArrowsClockwise size={11} weight="bold" />
                Real-time
              </span>
              <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white leading-[1.1]">
                WebhooksLogo
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">
                Buyurtma, to&apos;lov yoki smena hodisalarini real-time olib turing. HTTPS endpoint va HMAC imzo bilan ishonchli.
              </p>
              <ul className="mt-4 space-y-1.5 text-[12.5px] text-white/75">
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} weight="fill" className="text-[#5eead4]" />
                  HMAC SHA-256 imzo har bir so&apos;rovda
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} weight="fill" className="text-[#5eead4]" />
                  Avtomatik retry — 5 marta, exponential backoff
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle size={12} weight="fill" className="text-[#5eead4]" />
                  Test endpoint &mdash; production'ga ulanmasdan sinash
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4] mb-2.5">
                12+ hodisa
              </div>
              <div className="flex flex-wrap gap-1.5">
                {WEBHOOK_EVENTS.map((e) => (
                  <span
                    key={e}
                    className="inline-flex h-7 items-center px-2.5 rounded-md ring-1 ring-inset ring-white/10 bg-white/[0.04] text-white/75 text-[11px] font-mono"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rate limit / status */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5 grid gap-3 sm:grid-cols-3">
          {[
            { Icon: Lightning, tint: 'text-amber-400', bg: 'bg-amber-500/15', title: 'Rate limit', body: '300 req/daqiqa · Burst: 50/soniya' },
            { Icon: Lock,      tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]', title: 'Versiyalash', body: "v1 stable · v2 alpha · 12 oy deprecation" },
            { Icon: WebhooksLogo,  tint: 'text-blue-400',  bg: 'bg-blue-500/15', title: 'Status', body: 'status.mypos.uz · 99.99% SLA' },
          ].map((c) => (
            <article key={c.title} className="glass-card glass-card-hover rounded-2xl p-5">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${c.bg}`}>
                <c.Icon size={20} weight="bold" className={c.tint} />
              </span>
              <h3 className="mt-3.5 text-[14px] font-bold tracking-tight text-white">{c.title}</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{c.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Help */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card rounded-2xl px-6 py-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-white">Developer yordami</h3>
              <p className="mt-1 text-[12px] text-white/55">
                Texnik savol, integration yoki bug — to&apos;g&apos;ridan-to&apos;g&apos;ri muhandislarga.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="mailto:developers@mypos.uz"
                className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold transition-colors"
              >
                developers@mypos.uz
                <ArrowRight size={12} weight="bold" />
              </a>
              <a
                href="https://t.me/mypos_dev"
                target="_blank"
                rel="noopener noreferrer"
                className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[13px] font-bold transition-colors"
              >
                <ChatCircleDots size={13} weight="bold" />
                Telegram
              </a>
              <Link
                href={`/${locale}/docs`}
                className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                Hujjatlar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

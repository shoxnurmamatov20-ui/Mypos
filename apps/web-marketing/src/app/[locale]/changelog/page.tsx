import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  Brain,
  Bug,
  CalendarBlank,
  ChartLineUp,
  ClockClockwise,
  EnvelopeSimple,
  Lightning,
  Newspaper,
  Package,
  Plus,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkle,
  Storefront,
  TelegramLogo,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Changelog — MyPOS',
  description: 'MyPOS mahsulot yangiliklari va versiya tarixi. Har hafta yangi xususiyat.',
};

type ChangeType = 'new' | 'improved' | 'fixed' | 'security';
type Category = 'product' | 'integrations' | 'mobile' | 'api' | 'admin';

const TYPE_BADGE: Record<ChangeType, { label: string; cls: string; Icon: Icon }> = {
  new: {
    label: 'Yangi',
    cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
    Icon: Plus,
  },
  improved: {
    label: 'Yaxshilangan',
    cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/25',
    Icon: Sparkle,
  },
  fixed: { label: 'Tuzatildi', cls: 'bg-blue-500/15 text-blue-300 ring-blue-500/25', Icon: Bug },
  security: {
    label: 'Xavfsizlik',
    cls: 'bg-[rgba(255,0,55,0.12)] text-[#ff8aa1] ring-[rgba(255,0,55,0.25)]',
    Icon: ShieldCheck,
  },
};

const CATEGORIES: ReadonlyArray<{ slug: Category | 'all'; label: string; Icon: Icon }> = [
  { slug: 'all', label: 'Hammasi', Icon: Sparkle },
  { slug: 'product', label: 'Mahsulot', Icon: Storefront },
  { slug: 'integrations', label: 'Integratsiya', Icon: Lightning },
  { slug: 'mobile', label: 'Mobil ilova', Icon: Package },
  { slug: 'api', label: 'API', Icon: Wrench },
  { slug: 'admin', label: 'Admin panel', Icon: ChartLineUp },
];

type Change = { type: ChangeType; category: Category; title: string; body: string };

type Release = {
  version: string;
  date: string;
  title: string;
  Icon: Icon;
  highlight?: { Icon: Icon; tint: string; bg: string; body: string };
  changes: ReadonlyArray<Change>;
};

const RELEASES: ReadonlyArray<Release> = [
  {
    version: 'v3.8',
    date: '2026-05-08',
    title: 'AI menyu yordamchisi · Yangi tahlil paneli',
    Icon: Rocket,
    highlight: {
      Icon: Brain,
      tint: 'text-[#5eead4]',
      bg: 'bg-[rgba(20,184,166,0.15)]',
      body: 'Claude asosida menyu tarjima, narxlash takliflari va talab bashorati. 30 soniyada UZ/RU/EN.',
    },
    changes: [
      {
        type: 'new',
        category: 'product',
        title: 'AI menyu yordamchisi',
        body: 'Avtomatik tarjima, mavsumiy narxlash takliflari va kelgusi hafta talabini bashorat qilish.',
      },
      {
        type: 'new',
        category: 'admin',
        title: 'Yangi tahlil paneli',
        body: 'Real-time chart, year-over-year taqqoslash, eksport PNG/PDF.',
      },
      {
        type: 'improved',
        category: 'integrations',
        title: 'Yandex Eats x2 tezroq',
        body: 'Buyurtma sinxronizatsiyasi 2.4 soniyadan 1.1 soniyaga tushdi.',
      },
      {
        type: 'fixed',
        category: 'mobile',
        title: 'iOS offline rejim',
        body: '24 soat oflayn ishlash mexanizmi tuzatildi, batareya 18% kam ishlatadi.',
      },
    ],
  },
  {
    version: 'v3.7',
    date: '2026-04-22',
    title: 'Humo kartasi · Smena rejasi 2.0',
    Icon: Sparkle,
    changes: [
      {
        type: 'new',
        category: 'integrations',
        title: 'Humo karta tizimi',
        body: "Yangi milliy karta tizimi qo'shildi. To'lov real-time tasdiqlanadi.",
      },
      {
        type: 'improved',
        category: 'admin',
        title: 'Smena rejasi 2.0',
        body: 'Drag-and-drop interfeysi, ish vaqti avtomatik hisoblash, ish haqi proksi.',
      },
      {
        type: 'fixed',
        category: 'product',
        title: 'Chek printer xatosi',
        body: 'Epson TM-T20 model uchun timeout 30s ga uzaytirildi.',
      },
      {
        type: 'security',
        category: 'api',
        title: 'API kalit aylantirish',
        body: "Endi API kalitni 90 kunda majburiy yangilash mumkin. Audit log to'liq.",
      },
    ],
  },
  {
    version: 'v3.6',
    date: '2026-04-05',
    title: 'Wolt integratsiyasi · Telegram bot v2',
    Icon: Lightning,
    changes: [
      {
        type: 'new',
        category: 'integrations',
        title: "Wolt to'liq integratsiya",
        body: "Buyurtma POS'ga 5 soniyada tushadi, status sinxron yangilanadi.",
      },
      {
        type: 'improved',
        category: 'product',
        title: 'Telegram bot v2',
        body: "Inline menyu, kartochkali to'lov, sodiqlik bali — hammasi botda.",
      },
      {
        type: 'fixed',
        category: 'admin',
        title: 'Eksport CSV formati',
        body: "BOM bayt qo'shildi, Excel'da UZ alifbosi to'g'ri ko'rinadi.",
      },
      {
        type: 'fixed',
        category: 'mobile',
        title: 'Android push xabar',
        body: 'Yangi buyurtma push xabar kechikishi kamaytirildi (3s → <1s).',
      },
    ],
  },
  {
    version: 'v3.5',
    date: '2026-03-18',
    title: 'Inventar 3.0 · Tarmoq filiallari',
    Icon: Package,
    changes: [
      {
        type: 'new',
        category: 'product',
        title: 'Inventar moduli 3.0',
        body: "Ingredient bo'yicha hisob, retsept asosida avtomatik kamayish, low-stock signal.",
      },
      {
        type: 'new',
        category: 'admin',
        title: 'Tarmoq filiallari',
        body: 'Bir akkauntda 15 + filial, har biriga alohida menyu va xodimlar.',
      },
      {
        type: 'improved',
        category: 'integrations',
        title: '1C export tezligi',
        body: 'Hisobot eksporti 8 marta tezroq (45s → 5s).',
      },
      {
        type: 'security',
        category: 'api',
        title: 'IP whitelisting',
        body: "API kalit uchun IP cheklovi qo'shish imkoniyati.",
      },
    ],
  },
  {
    version: 'v3.4',
    date: '2026-02-28',
    title: 'Sodiqlik dasturi · Express24',
    Icon: ChartLineUp,
    changes: [
      {
        type: 'new',
        category: 'product',
        title: 'Sodiqlik dasturi',
        body: "Ball to'plash, chegirma, mukofotlar. Mijoz profili va segmentatsiya.",
      },
      {
        type: 'new',
        category: 'integrations',
        title: 'Express24 yetkazish',
        body: 'Toshkent va 6 viloyat. Buyurtma avtomatik yuboriladi.',
      },
      {
        type: 'improved',
        category: 'mobile',
        title: 'Faster app startup',
        body: 'Mobil ilova 1.8s tezroq ochiladi (4.2s → 2.4s).',
      },
    ],
  },
  {
    version: 'v3.3',
    date: '2026-02-10',
    title: "Soliq qo'mitasi · Yangi dashboard",
    Icon: Shield,
    changes: [
      {
        type: 'new',
        category: 'integrations',
        title: "Soliq qo'mitasi OFD",
        body: 'Fiskal cheklar avtomatik soliq idoralariga yuboriladi (MyTaxes).',
      },
      {
        type: 'improved',
        category: 'admin',
        title: 'Yangi dashboard',
        body: 'Bento layout, real-time KPI, hot-spot tahlil.',
      },
      {
        type: 'fixed',
        category: 'product',
        title: 'Smena yopish xatosi',
        body: 'Z-hisobotda yumaloqlash xatosi tuzatildi.',
      },
    ],
  },
];

const FILTER_TYPES: ReadonlyArray<{ value: ChangeType | 'all'; label: string }> = [
  { value: 'all', label: 'Hammasi' },
  { value: 'new', label: 'Yangi' },
  { value: 'improved', label: 'Yaxshilangan' },
  { value: 'fixed', label: 'Tuzatildi' },
  { value: 'security', label: 'Xavfsizlik' },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default async function ChangelogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const totalChanges = RELEASES.reduce((sum, r) => sum + r.changes.length, 0);

  return (
    <main className="bg-[#001B1B]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Newspaper size={11} weight="fill" />
            CHANGELOG
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Mahsulot <span className="gradient-teal">yangiliklari</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Har hafta yangi xususiyat. Har release uchun batafsil tavsif. Hech narsa yashirilmaydi.
          </p>

          {/* Stats */}
          <div className="glass-card mx-auto mt-10 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {[
              { v: RELEASES.length.toString(), l: 'oxirgi release' },
              { v: totalChanges.toString(), l: "o'zgarish" },
              { v: '7', l: 'kun chastota' },
              { v: '99.99%', l: 'uptime' },
            ].map((s) => (
              <div key={s.l} className="px-3 py-5 text-center bg-white/[0.02]">
                <div className="tabular text-[22px] sm:text-[24px] font-extrabold leading-none text-white">
                  {s.v}
                </div>
                <div className="mt-1 text-[10.5px] sm:text-[11px] font-semibold text-white/60">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="pb-6">
        <div className="mx-auto max-w-5xl px-5 space-y-3">
          {/* Type filter */}
          <div className="glass-card rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/55 pr-1">
              Tur:
            </span>
            {FILTER_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                className={`press inline-flex h-7 items-center px-2.5 rounded-full text-[11.5px] font-semibold transition-colors ${
                  t.value === 'all'
                    ? 'bg-white text-[#001B1B]'
                    : 'border border-white/[0.10] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/25'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="glass-card rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-white/55 pr-1">
              Kategoriya:
            </span>
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                className={`press inline-flex h-7 items-center gap-1 px-2.5 rounded-full text-[11.5px] font-semibold transition-colors ${
                  c.slug === 'all'
                    ? 'bg-white text-[#001B1B]'
                    : 'border border-white/[0.10] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/25'
                }`}
              >
                <c.Icon size={11} weight="bold" />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-10">
        <div className="mx-auto max-w-3xl px-5">
          <ol className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[rgba(20,184,166,0.40)] before:via-[rgba(20,184,166,0.20)] before:to-transparent">
            {RELEASES.map((r, idx) => (
              <li key={r.version} className="relative pl-14">
                <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-[rgba(2,47,47,0.85)] backdrop-blur-md">
                  <r.Icon size={16} weight="bold" className="text-[#5eead4]" />
                </span>

                <article className="glass-card rounded-2xl p-6">
                  <header className="flex flex-wrap items-center gap-2">
                    <span className="tabular inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#ff0037] text-white text-[11px] font-extrabold tracking-tight">
                      {r.version}
                    </span>
                    {idx === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 ring-1 ring-inset ring-emerald-500/25 text-emerald-300 text-[9.5px] font-bold uppercase tracking-wide">
                        <Sparkle size={10} weight="fill" />
                        Yangi
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1 ml-auto text-[11px] text-white/50">
                      <CalendarBlank size={11} weight="bold" />
                      {fmtDate(r.date)}
                    </span>
                  </header>

                  <h2 className="mt-3 text-[18px] sm:text-[22px] font-extrabold tracking-tight text-white leading-snug">
                    {r.title}
                  </h2>

                  {r.highlight ? (
                    <div
                      className={`mt-4 flex items-start gap-3 rounded-xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.02] p-4`}
                    >
                      <span
                        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${r.highlight.bg}`}
                      >
                        <r.highlight.Icon size={18} weight="bold" className={r.highlight.tint} />
                      </span>
                      <p className="text-[13px] leading-relaxed text-white/80">
                        {r.highlight.body}
                      </p>
                    </div>
                  ) : null}

                  <ul className="mt-5 space-y-3">
                    {r.changes.map((c) => {
                      const badge = TYPE_BADGE[c.type];
                      return (
                        <li key={c.title} className="grid grid-cols-[auto_1fr] gap-3">
                          <span
                            className={`tabular inline-flex h-6 items-center gap-1 px-2 rounded ring-1 ring-inset font-bold text-[9.5px] uppercase tracking-wide whitespace-nowrap shrink-0 ${badge.cls}`}
                          >
                            <badge.Icon size={9} weight="fill" />
                            {badge.label}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-bold text-white">{c.title}</div>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-white/65">
                              {c.body}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              </li>
            ))}
          </ol>

          {/* End-of-list strip */}
          <div className="glass-card mt-8 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-amber-500/15">
              <ClockClockwise size={16} weight="bold" className="text-amber-400" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">Eski versiyalar</div>
              <div className="text-[11.5px] text-white/55">
                v3.2 va undan oldingilar — GitHub'da to&apos;liq tarix
              </div>
            </div>
            <a
              href="https://github.com/mypos/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
            >
              GitHub
              <ArrowRight size={11} weight="bold" />
            </a>
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-12">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 80% 0%, rgba(255,0,55,0.15), transparent 50%), radial-gradient(circle at 0% 100%, rgba(20,184,166,0.18), transparent 50%)',
              }}
            />
            <div className="relative grid gap-5 md:grid-cols-5 md:items-center">
              <div className="md:col-span-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)]">
                  <EnvelopeSimple size={20} weight="bold" className="text-[#ff0037]" />
                </div>
                <h2 className="mt-4 text-[22px] sm:text-[26px] font-extrabold tracking-tight text-white leading-[1.15]">
                  Yangiliklarni o&apos;tkazib yubormang
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                  Har release haqida email · Spam yo&apos;q · Istalgan vaqtda bekor qiling.
                </p>
              </div>

              <form className="md:col-span-2 flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="email@kompaniya.uz"
                  aria-label="Email"
                  className="h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13px] placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
                />
                <button
                  type="submit"
                  className="press inline-flex h-11 items-center justify-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
                >
                  Obuna bo&apos;lish
                  <ArrowRight size={12} weight="bold" />
                </button>
              </form>
            </div>
          </div>

          {/* Telegram strip */}
          <div className="glass-card mt-3 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(38,165,228,0.15)]">
              <TelegramLogo size={16} weight="fill" className="text-[#26A5E4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">Tezroq?</div>
              <div className="text-[11.5px] text-white/55">
                Telegramda kanal — har release haqida darhol xabar
              </div>
            </div>
            <a
              href="https://t.me/mypos_releases"
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[12px] font-bold transition-colors"
            >
              Kanalga qo&apos;shiling
              <ArrowRight size={11} weight="bold" />
            </a>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

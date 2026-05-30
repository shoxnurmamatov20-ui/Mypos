import {
  ArrowRight,
  BookOpen,
  ChatCircleDots,
  ClockClockwise,
  Code,
  CreditCard,
  CurrencyCircleDollar,
  FileText,
  Lifebuoy,
  Lightning,
  MagnifyingGlass,
  Package,
  PlayCircle,
  Plug,
  Question,
  Rocket,
  ShieldCheck,
  Storefront,
  Terminal,
  Users,
  VideoCamera,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Hujjatlar — MyPOS',
  description: "MyPOS bilan tezda ishga tushish. Qo'llanmalar, API, integratsiyalar va FAQ.",
};

type DocCategory = {
  Icon: Icon;
  tint: string;
  bg: string;
  title: string;
  body: string;
  count: string;
  href: string;
};

const CATEGORIES: ReadonlyArray<DocCategory> = [
  {
    Icon: Rocket, tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]',
    title: 'Boshlash',
    body: "Birinchi kunda restoraningizni ishga tushiring. O'rnatish, menyu va xodimlar.",
    count: '12 maqola', href: '#getting-started',
  },
  {
    Icon: Storefront, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    title: "Sotuv va kassa",
    body: "Buyurtmalar, chek, to'lov turlari, smena boshqaruvi va kassa hisoboti.",
    count: '24 maqola', href: '#sales',
  },
  {
    Icon: Package, tint: 'text-emerald-400', bg: 'bg-emerald-500/15',
    title: "Inventar va menyu",
    body: "Ingredientlar, retseptlar, ombor, narxlash, kategoriyalar va modifikatorlar.",
    count: '18 maqola', href: '#inventory',
  },
  {
    Icon: Users, tint: 'text-purple-400', bg: 'bg-purple-500/15',
    title: 'Xodimlar va rollar',
    body: 'Hodimlar qo\'shish, ruxsatlar, smenalar, ish vaqti va ish haqi hisobi.',
    count: '15 maqola', href: '#staff',
  },
  {
    Icon: CurrencyCircleDollar, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    title: 'To\'lov va billing',
    body: "Click, Payme, Uzcard, naqd. Hisoblar, soliqlar va eksport.",
    count: '14 maqola', href: '#payments',
  },
  {
    Icon: Plug, tint: 'text-blue-400', bg: 'bg-blue-500/15',
    title: 'Integratsiyalar',
    body: "Yandex, Wolt, Telegram, soliq idoralari va boshqa xizmatlar.",
    count: '21 maqola', href: '#integrations',
  },
  {
    Icon: Code, tint: 'text-cyan-400', bg: 'bg-cyan-500/15',
    title: 'API havolasi',
    body: "REST API endpoints, autentifikatsiya, webhooks va SDK.",
    count: '40+ endpoint', href: '#api',
  },
  {
    Icon: ShieldCheck, tint: 'text-rose-400', bg: 'bg-rose-500/15',
    title: 'Xavfsizlik',
    body: "Ma'lumotlar himoyasi, ikki bosqichli autentifikatsiya va audit.",
    count: '9 maqola', href: '#security',
  },
];

type PopularArticle = {
  Icon: Icon; title: string; minutes: number; level: 'basic' | 'mid' | 'adv';
};

const POPULAR: ReadonlyArray<PopularArticle> = [
  { Icon: Rocket,        title: "Birinchi 30 daqiqada ishga tushish",   minutes: 8,  level: 'basic' },
  { Icon: Storefront,    title: "Yangi buyurtma qabul qilish",            minutes: 4,  level: 'basic' },
  { Icon: CreditCard,    title: "Click va Payme'ni ulash",                minutes: 6,  level: 'basic' },
  { Icon: Package,       title: "Menyu va ingredientlarni import qilish", minutes: 12, level: 'mid'   },
  { Icon: Users,         title: "Xodimlar va ruxsat darajalari",          minutes: 9,  level: 'mid'   },
  { Icon: ClockClockwise, title: "Smena yopish va Z-hisobot",             minutes: 5,  level: 'basic' },
  { Icon: Code,          title: "API kalitini olish va webhooks sozlash", minutes: 14, level: 'adv'   },
  { Icon: ChatCircleDots,title: "Telegram bot bilan buyurtma qabul",      minutes: 11, level: 'mid'   },
];

const LEVEL_LABEL: Record<PopularArticle['level'], { label: string; cls: string }> = {
  basic: { label: "Boshlovchi", cls: 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/25' },
  mid:   { label: "O'rta",      cls: 'bg-amber-500/12 text-amber-300 ring-amber-500/25' },
  adv:   { label: "Murakkab",   cls: 'bg-[rgba(255,0,55,0.12)] text-[#ff8aa1] ring-[rgba(255,0,55,0.25)]' },
};

const QUICK_LINKS: ReadonlyArray<{ Icon: Icon; title: string; body: string; href: string }> = [
  { Icon: BookOpen,    title: "Qo'llanmalar",   body: "Bosqichma-bosqich darslar",  href: '#guides'   },
  { Icon: VideoCamera, title: 'Video darslar',  body: "YouTube'da 50+ video",        href: '#videos'   },
  { Icon: Terminal,    title: 'API havolasi',   body: 'REST · Webhooks · SDK',       href: '#api'      },
  { Icon: Lifebuoy,    title: 'Yordam',         body: "24/7 Telegram va telefon",    href: '#support'  },
];

export default async function DocsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      {/* Hero with search */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <BookOpen size={11} weight="fill" />
            HUJJATLAR
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Sizga kerakli javob —{' '}
            <span className="gradient-teal">1 daqiqada</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Boshlash, API havolasi, integratsiya va eng ko&apos;p so&apos;raladigan savollar — barchasi bir joyda.
          </p>

          {/* Search input */}
          <form className="glass-card mx-auto mt-8 flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 max-w-[36rem]">
            <MagnifyingGlass size={18} weight="bold" className="text-white/50" aria-hidden="true" />
            <input
              type="search"
              placeholder='Misol: "Click ulash", "Z-hisobot", "API key"...'
              aria-label="Hujjatlar bo'yicha qidirish"
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="submit"
              className="press inline-flex h-9 items-center gap-1.5 px-4 rounded-full bg-[#ff0037] hover:bg-[#e6002f] text-white text-[12.5px] font-bold transition-colors"
            >
              Qidirish
            </button>
          </form>

          {/* Popular search chips */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-[11.5px]">
            <span className="text-white/40">Mashhur:</span>
            {['Boshlash', 'Click', 'Payme', 'Menyu import', 'Z-hisobot', 'API'].map((tag) => (
              <Link
                key={tag}
                href={`#${tag.toLowerCase()}`}
                className="press inline-flex h-7 items-center px-2.5 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/70 hover:text-[#5eead4] hover:border-[#5eead4]/30 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links — 4 cards */}
      <section className="bg-[#001B1B] py-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((q) => (
              <Link
                key={q.title}
                href={q.href}
                className="glass-card glass-card-hover press group flex items-center gap-3 rounded-2xl p-4"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                  <q.Icon size={18} weight="bold" className="text-[#5eead4]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-bold text-white">{q.title}</div>
                  <div className="text-[11.5px] text-white/60 mt-0.5">{q.body}</div>
                </div>
                <ArrowRight
                  size={14}
                  weight="bold"
                  className="shrink-0 text-white/40 group-hover:text-[#5eead4] group-hover:translate-x-0.5 transition-all"
                />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section id="getting-started" className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Kategoriyalar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Mavzu bo&apos;yicha hujjatlar
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              160+ maqola · har bir mavzu uchun bosqichma-bosqich qo&apos;llanma.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((c) => (
              <Link
                key={c.title}
                href={c.href}
                className="glass-card glass-card-hover press group rounded-2xl p-5"
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${c.bg}`}>
                  <c.Icon size={20} weight="bold" className={c.tint} />
                </span>
                <h3 className="mt-3.5 text-[14.5px] font-bold tracking-tight text-white">
                  {c.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
                  {c.body}
                </p>
                <div className="mt-3 flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-white/45">{c.count}</span>
                  <span className="inline-flex items-center gap-0.5 text-[#5eead4] group-hover:translate-x-0.5 transition-transform">
                    O&apos;qish
                    <ArrowRight size={11} weight="bold" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular articles */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Eng ko&apos;p o&apos;qiladigan
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Top maqolalar
            </h2>
          </div>

          <ul className="mt-10 glass-card divide-y divide-white/[0.06] rounded-2xl overflow-hidden">
            {POPULAR.map((p, idx) => {
              const level = LEVEL_LABEL[p.level];
              return (
                <li key={p.title}>
                  <Link
                    href="#"
                    className="press group flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="tabular w-6 text-[12px] font-bold text-white/35">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-white/[0.04]">
                      <p.Icon size={15} weight="bold" className="text-[#5eead4]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-semibold text-white truncate">
                        {p.title}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/50">
                        <span className="inline-flex items-center gap-1">
                          <ClockClockwise size={10} weight="bold" />
                          {p.minutes} daq.
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-px rounded-full ring-1 ring-inset font-bold uppercase tracking-wide text-[9px] ${level.cls}`}
                        >
                          {level.label}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={13}
                      weight="bold"
                      className="shrink-0 text-white/30 group-hover:text-[#5eead4] group-hover:translate-x-0.5 transition-all"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* API banner */}
      <section id="api" className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12 grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 text-[10.5px] font-bold uppercase tracking-[0.08em]">
                <Terminal size={11} weight="bold" />
                API · v1
              </span>
              <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white leading-[1.1]">
                Restoraningizni{' '}
                <span className="gradient-teal">dasturlash mumkin</span>
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-white/70">
                40+ endpoint · Real-time webhooks · OAuth 2.0 · TS/PHP/Python SDK. Buyurtmadan eksportgacha — barchasi REST orqali.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/${locale}/api`}
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
                >
                  API havolasi
                  <ArrowRight size={12} weight="bold" />
                </Link>
                <Link
                  href="#"
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
                >
                  <PlayCircle size={14} weight="fill" />
                  Postman kolleksiyasi
                </Link>
              </div>
            </div>

            {/* Mock code card */}
            <div className="rounded-2xl ring-1 ring-inset ring-white/10 bg-[rgba(0,16,16,0.55)] backdrop-blur-md overflow-hidden">
              <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-white/[0.06]">
                <span className="h-2 w-2 rounded-full bg-[#ff605c]" />
                <span className="h-2 w-2 rounded-full bg-[#ffbd44]" />
                <span className="h-2 w-2 rounded-full bg-[#00ca4e]" />
                <span className="ml-2 text-[10.5px] font-semibold text-white/45">
                  POST /v1/orders
                </span>
              </div>
              <pre className="text-[11.5px] leading-relaxed text-white/85 px-4 py-3.5 overflow-x-auto font-mono tabular">
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
  "status": "pending"
}`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Help */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-card rounded-2xl p-7">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <Question size={20} weight="bold" className="text-[#5eead4]" />
              </div>
              <h3 className="mt-4 text-[18px] font-bold text-white">
                Javob topa olmadingizmi?
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                FAQ bo&apos;limimizda 80+ tez-tez so&apos;raladigan savol javoblari mavjud.
              </p>
              <Link
                href={`/${locale}/faq`}
                className="press mt-5 inline-flex h-10 items-center gap-1.5 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                FAQ ko&apos;rish
                <ArrowRight size={12} weight="bold" />
              </Link>
            </div>

            <div id="support" className="glass-card rounded-2xl p-7">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)]">
                <Lifebuoy size={20} weight="bold" className="text-[#ff0037]" />
              </div>
              <h3 className="mt-4 text-[18px] font-bold text-white">
                Texnik yordam — 24/7
              </h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                Telegram, telefon yoki email — o&apos;rtacha javob 5 daqiqada.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <Link
                  href={`/${locale}/contact`}
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold transition-colors"
                >
                  Bog&apos;lanish
                  <ArrowRight size={12} weight="bold" />
                </Link>
                <a
                  href="https://t.me/mypos_uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
                >
                  <ChatCircleDots size={14} weight="fill" />
                  Telegram
                </a>
              </div>
            </div>
          </div>

          {/* What's new strip */}
          <div className="glass-card mt-4 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-amber-500/15">
              <Lightning size={16} weight="fill" className="text-amber-400" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">
                Yangi: AI menyu yordamchisi — 2026-05-08
              </div>
              <div className="text-[11.5px] text-white/55">
                Claude orqali avtomatik tarjima, narxlash takliflari va talab bashorati.
              </div>
            </div>
            <Link
              href={`/${locale}/changelog`}
              className="press inline-flex h-8 items-center gap-1 px-3 rounded-lg text-[#5eead4] hover:text-white text-[12px] font-bold transition-colors"
            >
              <FileText size={12} weight="bold" />
              Changelog
            </Link>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

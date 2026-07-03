import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  Calculator,
  ChartBar,
  ChatCircleDots,
  CheckCircle,
  CreditCard,
  Globe,
  Lightning,
  MagnifyingGlass,
  Plug,
  Printer,
  Receipt,
  Sparkle,
  Storefront,
  TelegramLogo,
  Truck,
  UsersThree,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Integratsiyalar — MyPOS',
  description:
    '40+ tayyor integratsiya: Click, Payme, Yandex, Wolt, Telegram, soliq idoralari va boshqalar.',
};

type Category = { slug: string; label: string; Icon: Icon; count: number };

const CATEGORIES: ReadonlyArray<Category> = [
  { slug: 'all', label: 'Hammasi', Icon: Sparkle, count: 32 },
  { slug: 'payment', label: "To'lovlar", Icon: CreditCard, count: 6 },
  { slug: 'delivery', label: 'Yetkazib berish', Icon: Truck, count: 5 },
  { slug: 'marketing', label: 'Marketing', Icon: ChartBar, count: 5 },
  { slug: 'accounting', label: 'Hisob va soliq', Icon: Calculator, count: 4 },
  { slug: 'hardware', label: 'Apparat', Icon: Printer, count: 6 },
  { slug: 'communication', label: 'Aloqa', Icon: ChatCircleDots, count: 6 },
];

type Integration = {
  slug: string;
  name: string;
  category: Exclude<Category['slug'], 'all'>;
  body: string;
  initials: string;
  tint: string;
  bg: string;
  status?: 'native' | 'soon' | 'partner';
  popular?: boolean;
};

const INTEGRATIONS: ReadonlyArray<Integration> = [
  // Payments
  {
    slug: 'click',
    name: 'Click',
    category: 'payment',
    body: "Mahalliy onlayn to'lov · Eng mashhur Click karta orqali",
    initials: 'CK',
    tint: 'text-white',
    bg: 'from-blue-500/30 via-blue-500/10',
    status: 'native',
    popular: true,
  },
  {
    slug: 'payme',
    name: 'Payme',
    category: 'payment',
    body: "Onlayn to'lov · QR kod orqali to'lash · Avtomatik fiskal chek",
    initials: 'PM',
    tint: 'text-white',
    bg: 'from-cyan-500/30 via-cyan-500/10',
    status: 'native',
    popular: true,
  },
  {
    slug: 'uzcard',
    name: 'Uzcard',
    category: 'payment',
    body: 'Milliy karta tizimi · POS-terminal va onlayn',
    initials: 'UZ',
    tint: 'text-white',
    bg: 'from-emerald-500/30 via-emerald-500/10',
    status: 'native',
  },
  {
    slug: 'humo',
    name: 'Humo',
    category: 'payment',
    body: "Yangi milliy karta · Ko'pchilik banklar qo'llab-quvvatlaydi",
    initials: 'HM',
    tint: 'text-white',
    bg: 'from-amber-500/30 via-amber-500/10',
    status: 'native',
  },
  {
    slug: 'visa',
    name: 'Visa',
    category: 'payment',
    body: "Xalqaro to'lov · Turistik restoranlar uchun zarur",
    initials: 'VS',
    tint: 'text-white',
    bg: 'from-blue-600/30 via-blue-600/10',
    status: 'native',
  },
  {
    slug: 'paynet',
    name: 'Paynet',
    category: 'payment',
    body: "Terminal va onlayn · Kambriyali to'lov tizimi",
    initials: 'PN',
    tint: 'text-white',
    bg: 'from-purple-500/30 via-purple-500/10',
    status: 'native',
  },

  // Delivery
  {
    slug: 'yandex',
    name: 'Yandex Eats',
    category: 'delivery',
    body: "Yetkazib berish · Buyurtma POS'ga avtomatik tushadi",
    initials: 'YE',
    tint: 'text-white',
    bg: 'from-red-500/30 via-red-500/10',
    status: 'native',
    popular: true,
  },
  {
    slug: 'wolt',
    name: 'Wolt',
    category: 'delivery',
    body: 'Yetkazib berish · Real-time buyurtma sinxronizatsiya',
    initials: 'WT',
    tint: 'text-white',
    bg: 'from-cyan-500/30 via-cyan-500/10',
    status: 'native',
  },
  {
    slug: 'uzum',
    name: 'Uzum Tezkor',
    category: 'delivery',
    body: 'Mahalliy yetkazib berish · 30 daqiqada',
    initials: 'UT',
    tint: 'text-white',
    bg: 'from-purple-500/30 via-purple-500/10',
    status: 'native',
  },
  {
    slug: 'express24',
    name: 'Express24',
    category: 'delivery',
    body: 'Tezkor yetkazish · Toshkent + 6 viloyat',
    initials: 'E2',
    tint: 'text-white',
    bg: 'from-amber-500/30 via-amber-500/10',
    status: 'partner',
  },
  {
    slug: 'mybazar',
    name: 'MyBazar Food',
    category: 'delivery',
    body: 'Yangi platform · 0% komissiya birinchi 3 oy',
    initials: 'MB',
    tint: 'text-white',
    bg: 'from-emerald-500/30 via-emerald-500/10',
    status: 'soon',
  },

  // Marketing
  {
    slug: 'instagram',
    name: 'Instagram',
    category: 'marketing',
    body: "Menyu, story va reels integratsiyasi · 'Buyurtma berish' tugma",
    initials: 'IG',
    tint: 'text-white',
    bg: 'from-pink-500/30 via-pink-500/10',
    status: 'native',
  },
  {
    slug: 'meta-ads',
    name: 'Meta Ads',
    category: 'marketing',
    body: 'Reklama hisoboti · Buyurtma manbasini kuzating',
    initials: 'MA',
    tint: 'text-white',
    bg: 'from-blue-500/30 via-blue-500/10',
    status: 'partner',
  },
  {
    slug: 'google-business',
    name: 'Google Business',
    category: 'marketing',
    body: 'Xarita, menyu va reyting · Avtomatik yangilanish',
    initials: 'GB',
    tint: 'text-white',
    bg: 'from-red-500/30 via-red-500/10',
    status: 'native',
  },
  {
    slug: 'yandex-business',
    name: 'Yandex Business',
    category: 'marketing',
    body: "Xarita va menyu · O'zbekistondagi #1 qidiruv",
    initials: 'YB',
    tint: 'text-white',
    bg: 'from-yellow-500/30 via-yellow-500/10',
    status: 'native',
  },
  {
    slug: 'loyalty',
    name: 'Loyalty Box',
    category: 'marketing',
    body: 'Sodiqlik dasturi · Ball, chegirma, mukofotlar',
    initials: 'LB',
    tint: 'text-white',
    bg: 'from-[#ff0037]/30 via-[#ff0037]/10',
    status: 'native',
  },

  // Accounting
  {
    slug: 'tax',
    name: "Soliq qo'mitasi",
    category: 'accounting',
    body: 'OFD ulanish · Fiskal cheklar avtomatik · MyTaxes',
    initials: 'SQ',
    tint: 'text-white',
    bg: 'from-emerald-500/30 via-emerald-500/10',
    status: 'native',
    popular: true,
  },
  {
    slug: '1c',
    name: '1C: Buxgalteriya',
    category: 'accounting',
    body: 'Hisobchilik · 2 tomonlama sinxronizatsiya',
    initials: '1C',
    tint: 'text-white',
    bg: 'from-amber-500/30 via-amber-500/10',
    status: 'native',
  },
  {
    slug: 'kassa-uz',
    name: 'Kassa.uz',
    category: 'accounting',
    body: 'Online kassa · Soliq hisobotlari va eksport',
    initials: 'KU',
    tint: 'text-white',
    bg: 'from-blue-500/30 via-blue-500/10',
    status: 'partner',
  },
  {
    slug: 'finance-uz',
    name: 'Finance.uz',
    category: 'accounting',
    body: 'Bank statement import · Avtomatik moliyaviy hisobot',
    initials: 'FU',
    tint: 'text-white',
    bg: 'from-purple-500/30 via-purple-500/10',
    status: 'native',
  },

  // Hardware
  {
    slug: 'epson',
    name: 'Epson chek',
    category: 'hardware',
    body: 'Termal printer · Plug-and-play USB/LAN',
    initials: 'EP',
    tint: 'text-white',
    bg: 'from-blue-500/30 via-blue-500/10',
    status: 'native',
  },
  {
    slug: 'star',
    name: 'Star Micronics',
    category: 'hardware',
    body: 'Yuqori sifatli chek printerlari',
    initials: 'SM',
    tint: 'text-white',
    bg: 'from-emerald-500/30 via-emerald-500/10',
    status: 'native',
  },
  {
    slug: 'kds',
    name: 'Oshxona ekrani (KDS)',
    category: 'hardware',
    body: 'Oshpaz uchun buyurtma ekrani · Smart TV ham mumkin',
    initials: 'KD',
    tint: 'text-white',
    bg: 'from-amber-500/30 via-amber-500/10',
    status: 'native',
  },
  {
    slug: 'scale',
    name: 'Tarozi',
    category: 'hardware',
    body: "Elektron tarozi integratsiyasi · Vazn bo'yicha narxlash",
    initials: 'TZ',
    tint: 'text-white',
    bg: 'from-cyan-500/30 via-cyan-500/10',
    status: 'native',
  },
  {
    slug: 'scanner',
    name: 'Barcode skanner',
    category: 'hardware',
    body: 'QR/EAN/UPC kod · Inventar va menyu uchun',
    initials: 'BS',
    tint: 'text-white',
    bg: 'from-purple-500/30 via-purple-500/10',
    status: 'native',
  },
  {
    slug: 'cash',
    name: 'Kassa apparati',
    category: 'hardware',
    body: 'Naqd pul jihozi · Avtomatik ochiluvchi javon',
    initials: 'KA',
    tint: 'text-white',
    bg: 'from-emerald-500/30 via-emerald-500/10',
    status: 'native',
  },

  // Communication
  {
    slug: 'telegram',
    name: 'Telegram bot',
    category: 'communication',
    body: 'Buyurtma qabul qilish · Restoran kanali · Mijoz bildirgisi',
    initials: 'TG',
    tint: 'text-white',
    bg: 'from-[#26A5E4]/30 via-[#26A5E4]/10',
    status: 'native',
    popular: true,
  },
  {
    slug: 'whatsapp',
    name: 'WhatsApp Business',
    category: 'communication',
    body: 'Buyurtma va xabarlar · Broadcast hisoboti',
    initials: 'WA',
    tint: 'text-white',
    bg: 'from-green-500/30 via-green-500/10',
    status: 'native',
  },
  {
    slug: 'sms-eskiz',
    name: 'Eskiz SMS',
    category: 'communication',
    body: 'SMS yuborish · Tasdiqlash va marketing',
    initials: 'EK',
    tint: 'text-white',
    bg: 'from-amber-500/30 via-amber-500/10',
    status: 'native',
  },
  {
    slug: 'playmobile',
    name: 'PlayMobile',
    category: 'communication',
    body: 'SMS provayder · Mass yuborish',
    initials: 'PB',
    tint: 'text-white',
    bg: 'from-purple-500/30 via-purple-500/10',
    status: 'partner',
  },
  {
    slug: 'gmail',
    name: 'Gmail SMTP',
    category: 'communication',
    body: 'Email yuborish · Hisobotlar va xabarlar',
    initials: 'GM',
    tint: 'text-white',
    bg: 'from-red-500/30 via-red-500/10',
    status: 'native',
  },
  {
    slug: 'zoom',
    name: 'Zoom',
    category: 'communication',
    body: 'Demo va onboarding uchrashuvlar',
    initials: 'ZM',
    tint: 'text-white',
    bg: 'from-blue-500/30 via-blue-500/10',
    status: 'partner',
  },
];

const STATUS_BADGE: Record<
  NonNullable<Integration['status']>,
  { label: string; cls: string; Icon: Icon }
> = {
  native: {
    label: 'Native',
    cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
    Icon: CheckCircle,
  },
  partner: { label: 'Hamkor', cls: 'bg-amber-500/15 text-amber-300 ring-amber-500/25', Icon: Plug },
  soon: { label: 'Tez orada', cls: 'bg-white/[0.06] text-white/55 ring-white/15', Icon: Lightning },
};

const STATS = [
  { value: '32+', label: 'integratsiya' },
  { value: '6', label: 'kategoriya' },
  { value: '5min', label: 'ulanish vaqti' },
  { value: '0', label: "qo'shimcha haq" },
] as const;

export default async function IntegrationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

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
            <Plug size={11} weight="bold" />
            INTEGRATSIYALAR
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Hamma narsa <span className="gradient-teal">bog&apos;langan</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Click, Payme, Yandex, Wolt, Telegram, soliq idoralari va 32+ boshqa xizmat — 5 daqiqada
            ulang. Qo&apos;shimcha haq yo&apos;q.
          </p>

          {/* Search */}
          <form className="glass-card mx-auto mt-7 flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 max-w-[36rem]">
            <MagnifyingGlass size={18} weight="bold" className="text-white/50" />
            <input
              type="search"
              placeholder="Misol: Click, Yandex, soliq, Telegram..."
              aria-label="Integratsiya qidirish"
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="submit"
              className="press inline-flex h-9 items-center gap-1.5 px-4 rounded-full bg-[#ff0037] hover:bg-[#e6002f] text-white text-[12.5px] font-bold transition-colors"
            >
              Qidirish
            </button>
          </form>

          {/* Stats */}
          <div className="glass-card mx-auto mt-10 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {STATS.map((s) => (
              <div key={s.label} className="px-3 py-5 text-center bg-white/[0.02]">
                <div className="tabular text-[22px] sm:text-[24px] font-extrabold leading-none text-white">
                  {s.value}
                </div>
                <div className="mt-1 text-[10.5px] sm:text-[11px] font-semibold text-white/60">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category filter */}
      <section className="pb-6">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                className={`press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-full text-[12px] font-semibold transition-colors ${
                  c.slug === 'all'
                    ? 'bg-white text-[#001B1B]'
                    : 'border border-white/[0.10] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/25'
                }`}
              >
                <c.Icon size={12} weight="bold" />
                {c.label}
                <span
                  className={`tabular text-[10px] font-bold ${c.slug === 'all' ? 'text-[#001B1B]/60' : 'text-white/40'}`}
                >
                  {c.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations grid */}
      <section className="py-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((it) => {
              const badge = it.status ? STATUS_BADGE[it.status] : null;
              return (
                <article
                  key={it.slug}
                  className="glass-card glass-card-hover press group rounded-2xl p-5 relative overflow-hidden"
                >
                  {it.popular ? (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff0037] text-white text-[9.5px] font-bold uppercase tracking-[0.06em]">
                      <Sparkle size={9} weight="fill" />
                      Mashhur
                    </span>
                  ) : null}

                  <div className="flex items-center gap-3">
                    <div
                      className={`relative h-12 w-12 shrink-0 rounded-xl ring-1 ring-inset ring-white/10 overflow-hidden bg-gradient-to-br ${it.bg} to-transparent`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="tabular font-extrabold text-[13px] text-white drop-shadow-sm">
                          {it.initials}
                        </span>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[14.5px] font-bold tracking-tight text-white truncate">
                        {it.name}
                      </h3>
                      {badge ? (
                        <span
                          className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded ring-1 ring-inset text-[9.5px] font-bold uppercase tracking-wide ${badge.cls}`}
                        >
                          <badge.Icon size={9} weight="fill" />
                          {badge.label}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-3 text-[12px] leading-relaxed text-white/65 line-clamp-2">
                    {it.body}
                  </p>

                  <div className="mt-3.5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#5eead4] group-hover:translate-x-0.5 transition-transform">
                      Sozlash
                      <ArrowRight size={11} weight="bold" />
                    </span>
                    {it.status === 'native' ? (
                      <span className="text-[10.5px] text-white/40 tabular">5 daq.</span>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>

          {/* Suggest banner */}
          <div className="glass-card mt-6 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
              <Plug size={17} weight="bold" className="text-[#5eead4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">
                Sizga kerakli xizmat ro&apos;yxatda yo&apos;qmi?
              </div>
              <div className="text-[11.5px] text-white/55">
                Bizga yozing — 4 ish haftasida tayyor qilamiz. Ovoz berish bilan tartibni
                belgilaymiz.
              </div>
            </div>
            <Link
              href={`/${locale}/contact?subject=integration`}
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
            >
              Taklif qiling
              <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Qanday ishlaydi
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              5 daqiqada ulang
            </h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: MagnifyingGlass, t: '1. Tanlang', b: 'Kerakli xizmatni qidirib toping' },
              { Icon: Plug, t: '2. Ulang', b: 'API kalit yoki OAuth orqali ruxsat bering' },
              { Icon: Lightning, t: '3. Sozlang', b: 'Avtomatik sinxronizatsiya yoqiladi' },
              { Icon: CheckCircle, t: '4. Ishlatib turing', b: "Ma'lumotlar real-time keladi" },
            ].map((s) => (
              <article key={s.t} className="glass-card rounded-2xl p-5">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                  <s.Icon size={20} weight="bold" className="text-[#5eead4]" />
                </span>
                <h3 className="mt-3.5 text-[14px] font-bold text-white">{s.t}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{s.b}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Partner program */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-10 grid gap-6 md:grid-cols-2 md:items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 100% 0%, rgba(255,0,55,0.15), transparent 50%), radial-gradient(circle at 0% 100%, rgba(20,184,166,0.18), transparent 50%)',
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#5eead4]/30 bg-[#5eead4]/10 text-[#5eead4] text-[10.5px] font-bold uppercase tracking-[0.08em]">
                <UsersThree size={11} weight="bold" />
                Hamkor dasturi
              </span>
              <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white leading-[1.1]">
                Xizmat yetkazib beruvchimisiz?
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/75">
                MyPOS bilan integratsiyangizni qiling — 500+ restoran sizning xizmatingizdan
                foydalanishi mumkin. Royalty 0%, doimiy texnik yordam.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <Link
                  href={`/${locale}/contact?subject=partnership`}
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold transition-colors"
                >
                  Hamkor bo&apos;lish
                  <ArrowRight size={12} weight="bold" />
                </Link>
                <Link
                  href={`/${locale}/api`}
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
                >
                  API hujjatlari
                </Link>
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-2">
              {[
                { Icon: Globe, tint: 'text-[#5eead4]' },
                { Icon: Receipt, tint: 'text-amber-400' },
                { Icon: Storefront, tint: 'text-emerald-400' },
                { Icon: Truck, tint: 'text-blue-400' },
              ].map((b, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-2xl ring-1 ring-inset ring-white/10 bg-white/[0.03] flex items-center justify-center"
                >
                  <b.Icon size={36} weight="duotone" className={b.tint} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Help */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(38,165,228,0.15)]">
              <TelegramLogo size={16} weight="fill" className="text-[#26A5E4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">
                Integratsiya bo&apos;yicha savol?
              </div>
              <div className="text-[11.5px] text-white/55">
                Telegramda yozing — 5 daqiqada javob beramiz.
              </div>
            </div>
            <Link
              href={`/${locale}/contact`}
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[12px] font-bold transition-colors"
            >
              Bog&apos;lanish
              <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

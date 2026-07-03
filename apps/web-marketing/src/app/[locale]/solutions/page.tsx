import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  BeerStein,
  CheckCircle,
  Coffee,
  Confetti,
  ForkKnife,
  Hamburger,
  Lightning,
  Pizza,
  Sparkle,
  Storefront,
  TelegramLogo,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Yechimlar — MyPOS',
  description:
    'Restoran, kafe, fast-food, bar va boshqalar uchun maxsus yechimlar. Sizning biznesingiz uchun moslangan.',
};

type Industry = {
  slug: string;
  available: boolean;
  Icon: Icon;
  tint: string;
  bg: string;
  accent: string;
  title: string;
  body: string;
  features: ReadonlyArray<string>;
  customers?: string;
  popular?: boolean;
};

const INDUSTRIES: ReadonlyArray<Industry> = [
  {
    slug: 'restaurant',
    available: true,
    Icon: ForkKnife,
    tint: 'text-[#5eead4]',
    bg: 'bg-[rgba(20,184,166,0.15)]',
    accent: 'from-[rgba(20,184,166,0.30)] via-[rgba(20,184,166,0.10)]',
    title: 'Restoran',
    body: "To'liq xizmatli restoranlar uchun — ofitsiantlar, stolllar, oshxona ekrani, smena hisoboti.",
    features: [
      'Stol va xona xaritasi',
      'Oshxona ekrani (KDS)',
      'Ofitsiant ilovasi',
      'Split chek va combine',
    ],
    customers: '180+',
    popular: true,
  },
  {
    slug: 'cafe',
    available: true,
    Icon: Coffee,
    tint: 'text-amber-400',
    bg: 'bg-amber-500/15',
    accent: 'from-amber-500/30 via-amber-500/10',
    title: 'Kafe va kofehona',
    body: 'Kofe nuqtalari, qaymoqxonalar, choyxonalar. Tezkor xizmat va sodiqlik bali.',
    features: ['Express kassa', 'Sodiqlik dasturi', 'QR-menyu', 'Ovqat olib ketish'],
    customers: '120+',
    popular: true,
  },
  {
    slug: 'fastfood',
    available: true,
    Icon: Hamburger,
    tint: 'text-[#ff0037]',
    bg: 'bg-[rgba(255,0,55,0.15)]',
    accent: 'from-[rgba(255,0,55,0.30)] via-[rgba(255,0,55,0.10)]',
    title: 'Fast food',
    body: 'Burger, hot-dog, shaurma va boshqa tez-tayyor taomlar. Drive-thru va tartibni boshqarish.',
    features: ['Tezkor combo', 'Drive-thru rejim', 'Yetkazib berish', 'Mobil buyurtma'],
    customers: '85+',
  },
  {
    slug: 'bar',
    available: true,
    Icon: BeerStein,
    tint: 'text-purple-400',
    bg: 'bg-purple-500/15',
    accent: 'from-purple-500/30 via-purple-500/10',
    title: 'Bar va pab',
    body: 'Spirtli ichimliklar uchun maxsus — yosh tekshirish, oshxona-bar ajratish, hisobotlar.',
    features: ['Yoshni tekshirish', 'Inventar ichimlik', 'Tab boshqaruvi', 'Happy hour'],
    customers: '45+',
  },
  // Coming soon
  {
    slug: 'osh-markazi',
    available: false,
    Icon: Storefront,
    tint: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    accent: 'from-emerald-500/30 via-emerald-500/10',
    title: 'Osh markazi',
    body: 'Milliy taomlar uchun — qozon hisobi, navbat, kunlik menyu.',
    features: ['Qozon hisobi', 'Kunlik menyu', 'Naqd asosli', 'Tezkor smena'],
    customers: '60+',
  },
  {
    slug: 'pizzeria',
    available: false,
    Icon: Pizza,
    tint: 'text-blue-400',
    bg: 'bg-blue-500/15',
    accent: 'from-blue-500/30 via-blue-500/10',
    title: 'Pizzeria',
    body: 'Pizza nuqtalar uchun — recept asosli inventar, yetkazib berish.',
    features: [
      'Modifikator boshqaruvi',
      'Pech navbati',
      "Hudud bo'yicha yetkazib berish",
      'Combo savatlar',
    ],
    customers: '32+',
  },
  {
    slug: 'cloud-kitchen',
    available: false,
    Icon: Lightning,
    tint: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    accent: 'from-cyan-500/30 via-cyan-500/10',
    title: 'Cloud kitchen',
    body: 'Faqat yetkazib berish — bir nechta brend bir oshxonada.',
    features: ["Ko'p brend", 'Faqat delivery', 'Operatsion KPI', 'Maxsus paketlash'],
  },
  {
    slug: 'sweets',
    available: false,
    Icon: Confetti,
    tint: 'text-pink-400',
    bg: 'bg-pink-500/15',
    accent: 'from-pink-500/30 via-pink-500/10',
    title: 'Shirinliklar',
    body: "Shirinlik do'kon, qandolat — vazn asosli sotish, hediya qadog'i.",
    features: ['Vazn asosli', "Hediya qadog'i", 'Buyurtma asosli', 'Ingredient hisobi'],
  },
];

const COMMON_FEATURES = [
  'Cheksiz menyu va modifikator',
  "UZ/RU/EN ko'p tilli",
  'Click, Payme, Uzcard, Humo',
  "Soliq qo'mitasi OFD ulanish",
  '24/7 texnik yordam',
  'Offline 24 soat ishlash',
  'Telegram bot bilan buyurtma',
  '500+ restoran ishonchi',
];

export default async function SolutionsIndexPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const available = INDUSTRIES.filter((i) => i.available);
  const upcoming = INDUSTRIES.filter((i) => !i.available);

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
            <Sparkle size={11} weight="fill" />
            YECHIMLAR
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Sizning biznesingiz uchun <span className="gradient-teal">moslangan</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Har bir restoran turi turlicha ishlaydi. MyPOS — sizning aniq biznes modelingiz uchun
            sozlangan.
          </p>

          {/* Stats */}
          <div className="glass-card mx-auto mt-10 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {[
              { v: '8', l: 'biznes turi' },
              { v: '500+', l: 'restoran' },
              { v: '12', l: 'shahar' },
              { v: '4.9', l: 'reyting' },
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

      {/* Available industries */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Mavjud yechimlar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Sizning biznesingizni tanlang
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              Har bir variantda sizning sohaga maxsus xususiyatlar, qo&apos;llanmalar va case
              studies.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {available.map((it) => (
              <Link
                key={it.slug}
                href={`/${locale}/solutions/${it.slug}`}
                className="glass-card glass-card-hover press group relative overflow-hidden rounded-2xl p-6"
              >
                {it.popular ? (
                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff0037] text-white text-[9.5px] font-bold uppercase tracking-[0.06em]">
                    <Sparkle size={9} weight="fill" />
                    Mashhur
                  </span>
                ) : null}

                {/* Cover */}
                <div
                  className={`relative aspect-[2.4/1] rounded-xl ring-1 ring-inset ring-white/10 bg-gradient-to-br ${it.accent} to-transparent overflow-hidden mb-4`}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <it.Icon size={72} weight="duotone" className="text-white/80" />
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[18px] sm:text-[20px] font-extrabold tracking-tight text-white">
                      {it.title}
                    </h3>
                    {it.customers ? (
                      <p className="mt-0.5 text-[11.5px] text-white/50 tabular">
                        {it.customers} restoran ishlatmoqda
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${it.bg}`}
                  >
                    <it.Icon size={20} weight="bold" className={it.tint} />
                  </span>
                </div>

                <p className="mt-3 text-[13px] leading-relaxed text-white/70">{it.body}</p>

                <ul className="mt-4 grid grid-cols-2 gap-1.5">
                  {it.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[11.5px] text-white/65">
                      <CheckCircle
                        size={11}
                        weight="fill"
                        className="mt-[3px] text-[#5eead4] shrink-0"
                      />
                      <span className="leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 inline-flex items-center gap-1 text-[12.5px] font-bold text-[#5eead4] group-hover:translate-x-0.5 transition-transform">
                  Batafsil ko&apos;rish
                  <ArrowRight size={12} weight="bold" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-amber-400">
              Tez orada
            </p>
            <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white">
              Yangi yechimlar yo&apos;lda
            </h2>
            <p className="mt-3 text-[13.5px] text-white/65">
              Hozir ham foydalanish mumkin — ammo maxsus sozlash va qo&apos;llanma keyinroq tayyor
              bo&apos;ladi.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {upcoming.map((it) => (
              <article key={it.slug} className="glass-card rounded-2xl p-5 relative">
                <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-inset ring-amber-500/25 text-amber-300 text-[9.5px] font-bold uppercase tracking-[0.06em]">
                  Tez orada
                </span>
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${it.bg}`}
                >
                  <it.Icon size={20} weight="bold" className={it.tint} />
                </span>
                <h3 className="mt-3.5 text-[14.5px] font-bold tracking-tight text-white">
                  {it.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/60">{it.body}</p>
                {it.customers ? (
                  <p className="mt-3 text-[10.5px] text-white/45 tabular">
                    {it.customers} early adopter
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Common features */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card rounded-3xl p-6 sm:p-10">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
                Hamma yechimga umumiy
              </p>
              <h2 className="mt-3 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-white">
                Asosiy xususiyatlar
              </h2>
              <p className="mt-2 text-[13.5px] text-white/65">
                Qaysi biznes turini tanlasangiz ham — quyidagi 8 imkoniyat doim ishlaydi.
              </p>
            </div>

            <ul className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {COMMON_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-[12.5px] text-white/75 rounded-xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.02] px-3 py-2.5"
                >
                  <CheckCircle
                    size={13}
                    weight="fill"
                    className="mt-[3px] text-[#5eead4] shrink-0"
                  />
                  <span className="leading-snug">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Not listed strip */}
      <section className="py-12">
        <div className="mx-auto max-w-5xl px-5 space-y-3">
          <div className="glass-card flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
              <Sparkle size={17} weight="bold" className="text-[#5eead4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-white">
                Sizning biznes turi ro&apos;yxatda yo&apos;qmi?
              </div>
              <div className="text-[11.5px] text-white/55">
                Maxsus yechim — restoran tarmoqlari, mehmonxonalar, qo&apos;rg&apos;onlar, food
                courts uchun ham.
              </div>
            </div>
            <Link
              href={`/${locale}/contact`}
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[12px] font-bold transition-colors"
            >
              Bog&apos;lanish
              <ArrowRight size={11} weight="bold" />
            </Link>
          </div>

          <div className="glass-card flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(38,165,228,0.15)]">
              <TelegramLogo size={17} weight="fill" className="text-[#26A5E4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-bold text-white">Tezkor maslahat</div>
              <div className="text-[11.5px] text-white/55">
                Sizning biznesingizga eng mos yechimni Telegramda maslahatlashing.
              </div>
            </div>
            <a
              href="https://t.me/mypos_uz"
              target="_blank"
              rel="noopener noreferrer"
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[12px] font-bold transition-colors"
            >
              Telegram
              <ArrowRight size={11} weight="bold" />
            </a>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

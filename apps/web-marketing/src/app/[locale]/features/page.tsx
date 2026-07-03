import type { Icon } from '@phosphor-icons/react';
import {
  ChartLineUp,
  ChatTeardropText,
  Check,
  CreditCard,
  Cube,
  Desktop,
  Globe,
  Lightning,
  Monitor,
  Package,
  Printer,
  QrCode,
  Receipt,
  Sparkle,
  TelegramLogo,
  Users,
  WifiSlash,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';
import { HowItWorks } from '@/components/landing/how-it-works';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'features_page' });
  return { title: t('title'), description: t('subtitle') };
}

type FeatureBlock = {
  key: string;
  Icon: Icon;
  tint: string;
  bg: string;
  title: string;
  tagline: string;
  metric: string;
  metricLabel: string;
  bullets: ReadonlyArray<{ Icon: Icon; text: string }>;
};

const FEATURES: ReadonlyArray<FeatureBlock> = [
  {
    key: 'pos',
    Icon: Desktop,
    tint: 'text-[#5eead4]',
    bg: 'bg-[rgba(20,184,166,0.15)]',
    title: 'POS Terminal',
    tagline: 'Buyurtmaga 2 soniya. Click/Payme integratsiyasi. Offline rejim.',
    metric: '2s',
    metricLabel: 'buyurtma vaqti',
    bullets: [
      { Icon: Lightning, text: 'Buyurtmani 2 soniyada qabul qilish' },
      { Icon: WifiSlash, text: 'Offline rejim — internet uzilsa ham ishlaydi' },
      { Icon: Printer, text: "Chek printeri va shtrix-kod skanner qo'llab-quvvatlash" },
      { Icon: CreditCard, text: "Click va Payme onlayn to'lovlari" },
    ],
  },
  {
    key: 'kds',
    Icon: Monitor,
    tint: 'text-blue-400',
    bg: 'bg-blue-500/15',
    title: 'KDS — Oshxona Ekrani',
    tagline: 'Raqamli buyurtma ekrani. Tayyorlash navbati va avtomatik ogohlantirish.',
    metric: '−40%',
    metricLabel: 'tayyorlash vaqti',
    bullets: [
      { Icon: Lightning, text: 'Tayyorlash vaqti taymeri har taom uchun' },
      { Icon: Receipt, text: 'Avtomatik navbat va prioritet' },
      { Icon: ChatTeardropText, text: "Oshpaz va ofitsiant o'rtasida xabarlar" },
      { Icon: Check, text: '"Tayyor" tugma — bir bosishda mijozga signal' },
    ],
  },
  {
    key: 'qr',
    Icon: QrCode,
    tint: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    title: 'QR Menyu',
    tagline: 'Mijoz stol ustidagi QR-ni skanerlab buyurtma beradi. UZ/RU/EN tarjimalar.',
    metric: '−30%',
    metricLabel: 'ofisiant xarajati',
    bullets: [
      { Icon: Globe, text: 'UZ/RU/EN avtomatik tarjima' },
      { Icon: Receipt, text: "O'z-o'ziga buyurtma — mijoz to'g'ridan-to'g'ri oshxonaga" },
      { Icon: CreditCard, text: "Onlayn to'lov mijoz telefonida" },
      { Icon: Sparkle, text: 'Kuponlar va loyalty integratsiyasi' },
    ],
  },
  {
    key: 'analytics',
    Icon: ChartLineUp,
    tint: 'text-amber-400',
    bg: 'bg-amber-500/15',
    title: 'Analitika',
    tagline: 'Kunlik tushum, top taomlar, xodimlar KPI. PDF va Excel eksport.',
    metric: '+18%',
    metricLabel: "marja o'sishi",
    bullets: [
      { Icon: ChartLineUp, text: "Real-time tushum va buyurtma ko'rsatkichlari" },
      { Icon: Users, text: 'Xodimlar samaradorligi va KPI tracker' },
      { Icon: Package, text: 'Top sotiluvchi va foydasiz taomlar tahlili' },
      { Icon: Receipt, text: 'PDF/Excel eksport — buxgalteriya uchun' },
    ],
  },
  {
    key: 'ai',
    Icon: ChatTeardropText,
    tint: 'text-purple-400',
    bg: 'bg-purple-500/15',
    title: 'AI Yordamchi',
    tagline: 'Claude asosida menyu tarjimalari, talabni bashorat va inventar optimallashtirish.',
    metric: '24/7',
    metricLabel: 'avtomatlashtirish',
    bullets: [
      { Icon: Globe, text: 'Menyu UZ → RU / EN avtomatik tarjima' },
      { Icon: ChartLineUp, text: "Talabni bashorat — qaysi taom ko'p sotiladi" },
      { Icon: Cube, text: 'Inventar minimum — avtomatik xarid ogohlantirish' },
      { Icon: Sparkle, text: 'Mijoz fikrlari avtomatik tahlil' },
    ],
  },
  {
    key: 'telegram',
    Icon: TelegramLogo,
    tint: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    title: 'Telegram Bot',
    tagline: 'Mijozlar Telegram orqali buyurtma beradi. Avtomatik xabarnomalar.',
    metric: '10×',
    metricLabel: "ko'proq mijoz",
    bullets: [
      { Icon: TelegramLogo, text: "Mijoz Telegram'da menyu va buyurtma" },
      { Icon: Receipt, text: 'Buyurtma holati avtomatik xabarnomalar' },
      { Icon: CreditCard, text: "To'lov bot ichida Click/Payme bilan" },
      { Icon: Sparkle, text: 'Marketing kampaniyalari va aksiyalar' },
    ],
  },
];

const INTEGRATIONS = [
  'Click',
  'Payme',
  'Uzcard',
  'Humo',
  'Visa',
  'Mastercard',
  'Telegram',
  '1C',
  'Yandex Food',
  'Express24',
  'Stripe',
  'Mailgun',
] as const;

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'features_page' });

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div
          aria-hidden="true"
          className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Sparkle size={11} weight="fill" />
            IMKONIYATLAR
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            {t('subtitle')}
          </p>
        </div>
      </section>

      {/* Quick feature chips row */}
      <section className="bg-[#001B1B] pb-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {FEATURES.map((f) => {
              const Icon = f.Icon;
              return (
                <a
                  key={f.key}
                  href={`#${f.key}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] text-[12px] font-semibold text-white/80 hover:bg-white/[0.08] hover:border-[#14b8a6]/40 transition-colors"
                >
                  <Icon size={13} weight="bold" className={f.tint} />
                  {f.title}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Detailed feature blocks */}
      <section className="bg-[#001B1B] py-10 sm:py-12">
        <div className="mx-auto max-w-5xl px-5 space-y-6">
          {FEATURES.map((f, i) => {
            const Icon = f.Icon;
            const isOdd = i % 2 === 1;
            return (
              <article
                id={f.key}
                key={f.key}
                className="glass-card rounded-2xl overflow-hidden scroll-mt-24"
              >
                <div className={`grid gap-0 md:grid-cols-2 ${isOdd ? 'md:[direction:rtl]' : ''}`}>
                  {/* Left column — copy */}
                  <div className="p-6 sm:p-8 md:[direction:ltr] order-2 md:order-none">
                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${f.bg}`}
                    >
                      <Icon size={22} weight="bold" className={f.tint} />
                    </div>
                    <h2 className="mt-4 text-[22px] sm:text-[28px] font-extrabold tracking-tight text-white">
                      {f.title}
                    </h2>
                    <p className="mt-2 text-[14px] sm:text-[15px] leading-relaxed text-white/70">
                      {f.tagline}
                    </p>

                    <ul className="mt-5 space-y-2.5">
                      {f.bullets.map((b) => (
                        <li key={b.text} className="flex items-start gap-2.5">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${f.bg}`}
                          >
                            <b.Icon size={12} weight="bold" className={f.tint} />
                          </span>
                          <span className="text-[13.5px] text-white/85 leading-relaxed">
                            {b.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Right column — metric callout */}
                  <div className="relative p-6 sm:p-8 md:[direction:ltr] order-1 md:order-none flex items-center justify-center min-h-[200px] bg-white/[0.02] border-t border-white/[0.06] md:border-t-0 md:border-l md:border-white/[0.06]">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 opacity-50"
                      style={{
                        background: `radial-gradient(circle at 50% 50%, ${
                          f.key === 'pos'
                            ? 'rgba(20,184,166,0.20)'
                            : f.key === 'kds'
                              ? 'rgba(59,130,246,0.20)'
                              : f.key === 'qr'
                                ? 'rgba(16,185,129,0.20)'
                                : f.key === 'analytics'
                                  ? 'rgba(245,158,11,0.20)'
                                  : f.key === 'ai'
                                    ? 'rgba(168,85,247,0.20)'
                                    : 'rgba(34,211,238,0.20)'
                        }, transparent 60%)`,
                      }}
                    />
                    <div className="relative text-center">
                      <div
                        className={`tabular text-[56px] sm:text-[72px] font-extrabold leading-none ${f.tint}`}
                      >
                        {f.metric}
                      </div>
                      <div className="mt-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-white/60">
                        {f.metricLabel}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Integrations strip */}
      <section className="bg-[#001B1B] py-12">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
            Integratsiyalar
          </p>
          <h2 className="mt-3 text-[22px] sm:text-[28px] font-extrabold tracking-tight text-white">
            Eng yaxshi xizmatlar bilan ulanish
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {INTEGRATIONS.map((name) => (
              <span
                key={name}
                className="glass-card inline-flex items-center px-4 py-2 rounded-full text-[12.5px] font-semibold text-white/80"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <HowItWorks />

      <CtaSection />
    </main>
  );
}

import {
  ArrowRight,
  Briefcase,
  Buildings,
  Clock,
  Eye,
  Globe,
  HandHeart,
  Heart,
  Lightning,
  MapPin,
  Rocket,
  Sparkle,
  Star,
  Target,
  Users,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'about_page' });
  return { title: t('title'), description: t('subtitle') };
}

const COMPANY_STATS = [
  { value: '2023',  label: "Tashkil topgan",      Icon: Rocket    },
  { value: '500+',  label: "restoran",             Icon: Buildings },
  { value: '12',    label: "shahar",               Icon: MapPin    },
  { value: '40+',   label: "jamoa a'zosi",         Icon: Users     },
] as const;

const VALUES: ReadonlyArray<{ Icon: Icon; tint: string; bg: string; title: string; body: string }> = [
  {
    Icon: HandHeart, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    title: "Mijozga yaqinlik",
    body: 'Har bir mijoz to\'g\'ridan-to\'g\'ri jamoa rahbarlariga murojaat qila oladi. Biz har bir feedback\'ni jiddiy olamiz va product roadmap\'imizning 70% mijoz so\'rovi.',
  },
  {
    Icon: Lightning, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    title: 'Tezlik va sifat',
    body: 'Buyurtma 2 soniya, javob 5 daqiqa, deploy haftada 3 marta. Lekin tezlik sifatni qurbon qilmaydi — har xususiyat real restoranda sinaladi.',
  },
  {
    Icon: Globe, tint: 'text-emerald-400', bg: 'bg-emerald-500/15',
    title: "Mahalliy ekspertiza",
    body: "Tashkent'da yaratilgan. UZ/RU/EN — barchasi birinchi class. Click va Payme bilan native integratsiya. O\'zbek restoran biznesining nyuansi bizga tanish.",
  },
  {
    Icon: Eye, tint: 'text-blue-400', bg: 'bg-blue-500/15',
    title: 'Ochiqlik',
    body: 'Narxlar shaffof. Status page real-time. Roadmap public. Yashirin to\'lov yo\'q, yashirin xususiyat yo\'q. Sizning ma\'lumotingiz — sizniki.',
  },
];

const TIMELINE: ReadonlyArray<{ year: string; quarter: string; title: string; body: string; Icon: Icon }> = [
  {
    year: '2023', quarter: 'Q2', Icon: Rocket,
    title: "Loyiha boshlandi",
    body: "Toshkent'dagi 3 nafar restoran egasi va 2 nafar muhandis tomonidan asos solindi.",
  },
  {
    year: '2023', quarter: 'Q4', Icon: Buildings,
    title: 'Birinchi 10 ta restoran',
    body: "Osh Markazi, Pizza House va Cafe Aroma birinchi mijozlar — hozirgacha hamkor.",
  },
  {
    year: '2024', quarter: 'Q2', Icon: Sparkle,
    title: 'AI yordamchi ishga tushdi',
    body: 'Claude asosida menyu tarjimasi, talab bashorati va inventar optimallashtirish.',
  },
  {
    year: '2024', quarter: 'Q4', Icon: Globe,
    title: "Kengayish: 100+ shahar",
    body: 'Toshkent, Samarqand, Buxoro, Andijon, Namangan, Farg\'ona va boshqa shaharlarga yetib bordik.',
  },
  {
    year: '2025', quarter: 'Q2', Icon: Star,
    title: '500+ restoran milestone',
    body: 'Markaziy Osiyo bo\'ylab eng tezroq o\'sayotgan POS platforma bo\'lib qoldik.',
  },
  {
    year: '2026', quarter: 'Q1', Icon: Heart,
    title: "Bugun va kelajak",
    body: '40+ jamoa a\'zosi · 1M+ oylik buyurtma · 98% mijoz mamnunligi. Markaziy Osiyo bo\'ylab kengayishni davom ettiramiz.',
  },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'about_page' });

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
            <Heart size={11} weight="fill" />
            BIZ HAQIMIZDA
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            {t('subtitle')}
          </p>

          {/* Company stats */}
          <div className="glass-card mx-auto mt-10 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {COMPANY_STATS.map((s) => (
              <div key={s.label} className="px-3 py-5 text-center bg-white/[0.02]">
                <s.Icon size={18} weight="bold" className="mx-auto mb-2 text-[#5eead4]" aria-hidden="true" />
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

      {/* Story — big mission statement */}
      <section className="bg-[#001B1B] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card rounded-2xl px-6 py-8 sm:px-10 sm:py-12">
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              <Target size={14} weight="fill" />
              Bizning missiya
            </div>
            <p className="mt-4 text-[20px] sm:text-[24px] font-extrabold leading-[1.3] tracking-tight text-white">
              &ldquo;Markaziy Osiyodagi har bir restoranga{' '}
              <span className="gradient-teal">global darajadagi texnologiya</span> berish —
              sodda, qulay va arzon.&rdquo;
            </p>
            <p className="mt-5 text-[14px] sm:text-[15px] leading-relaxed text-white/70">
              {t('mission')} Bizning yondashuv oddiy: restoran egasi POS texnologiyasini emas, mijozini va taomini boshqarishi kerak.
              Biz shu uchun har bir interfeysni 2 soniyada o&apos;rganiladigan qilib, har bir hisobotni 1 bosishda olinadigan qilib yaratamiz.
            </p>
          </div>
        </div>
      </section>

      {/* Values grid */}
      <section className="bg-[#001B1B] py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Qadriyatlar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Biz qanday ishlaymiz
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              Har bir qaror — har bir feature — shu to&apos;rt tamoyil asosida.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <article key={v.title} className="glass-card glass-card-hover rounded-2xl p-6">
                <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${v.bg}`}>
                  <v.Icon size={22} weight="bold" className={v.tint} />
                </div>
                <h3 className="mt-4 text-[17px] font-bold tracking-tight text-white">{v.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{v.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="bg-[#001B1B] py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Bizning yo&apos;l
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Hikoyamizning asosiy nuqtalari
            </h2>
          </div>

          <ol className="mt-12 relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[rgba(20,184,166,0.40)] before:via-[rgba(20,184,166,0.20)] before:to-transparent">
            {TIMELINE.map((item) => (
              <li key={`${item.year}-${item.quarter}-${item.title}`} className="relative pl-14">
                <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-[rgba(2,47,47,0.85)] backdrop-blur-md">
                  <item.Icon size={16} weight="bold" className="text-[#5eead4]" />
                </span>
                <div className="glass-card rounded-xl px-5 py-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5eead4]">
                    <span>{item.year}</span>
                    <span className="text-white/40">·</span>
                    <span>{item.quarter}</span>
                  </div>
                  <h3 className="mt-1.5 text-[15px] sm:text-[16px] font-bold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Office / Location */}
      <section className="bg-[#001B1B] py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card rounded-2xl p-6 sm:p-10 grid gap-6 md:grid-cols-3">
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <MapPin size={20} weight="bold" className="text-[#5eead4]" />
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-white">Bosh ofis</h3>
              <p className="mt-1.5 text-[13px] text-white/70 leading-relaxed">
                Toshkent shahri,<br />Mirzo Ulug&apos;bek tumani,<br />Innovation Hub
              </p>
            </div>
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-amber-500/15">
                <Clock size={20} weight="bold" className="text-amber-400" />
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-white">Ish vaqti</h3>
              <p className="mt-1.5 text-[13px] text-white/70 leading-relaxed">
                Du–Ju: 09:00–19:00<br />Sh: 10:00–15:00<br />Texnik yordam: 24/7
              </p>
            </div>
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)]">
                <Briefcase size={20} weight="bold" className="text-[#ff0037]" />
              </div>
              <h3 className="mt-4 text-[15px] font-bold text-white">Karyera</h3>
              <p className="mt-1.5 text-[13px] text-white/70 leading-relaxed">
                40+ jamoa a&apos;zosi<br />Doimo o&apos;sib boruvchi<br />
                <Link
                  href={`/${locale}/careers`}
                  className="inline-flex items-center gap-1 mt-1.5 text-[#5eead4] hover:text-white font-bold transition-colors"
                >
                  Vakansiyalar
                  <ArrowRight size={11} weight="bold" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

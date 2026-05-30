import {
  ArrowRight,
  Briefcase,
  Buildings,
  ChalkboardTeacher,
  ChatCircleDots,
  Coffee,
  CurrencyCircleDollar,
  ForkKnife,
  Globe,
  GraduationCap,
  Handshake,
  Headset,
  Heart,
  House,
  Lightning,
  MapPin,
  Megaphone,
  Smiley,
  Sparkle,
  Star,
  Storefront,
  Trophy,
  Users,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Karyera — MyPOS',
  description: "Restoranlar bilan ishlang. MyPOS jamoasiga qo'shiling — Sales, Onboarding, Training, Customer Success. 8 ta ochiq vakansiya.",
};

const COMPANY_STATS = [
  { value: '40+', label: "jamoa a'zosi",     Icon: Users     },
  { value: '8',   label: "ochiq vakansiya",   Icon: Briefcase },
  { value: '4.9', label: 'Glassdoor reyting', Icon: Star      },
  { value: '92%', label: "qoladi 2+ yil",      Icon: Heart     },
] as const;

type Dept = { slug: string; label: string; Icon: Icon; tint: string; bg: string; count: number };

const DEPARTMENTS: ReadonlyArray<Dept> = [
  { slug: 'all',          label: 'Hammasi',         Icon: Sparkle,            tint: 'text-[#5eead4]',   bg: 'bg-[rgba(20,184,166,0.15)]', count: 8 },
  { slug: 'sales',        label: 'Sotuv',           Icon: Handshake,          tint: 'text-emerald-400', bg: 'bg-emerald-500/15',          count: 3 },
  { slug: 'success',      label: 'Mijoz xizmati',   Icon: Smiley,             tint: 'text-[#5eead4]',   bg: 'bg-[rgba(20,184,166,0.15)]', count: 2 },
  { slug: 'onboarding',   label: 'Onboarding',      Icon: ChalkboardTeacher,  tint: 'text-amber-400',   bg: 'bg-amber-500/15',            count: 1 },
  { slug: 'support',      label: "Yordam 24/7",     Icon: Headset,            tint: 'text-[#ff0037]',   bg: 'bg-[rgba(255,0,55,0.15)]',   count: 1 },
  { slug: 'field',        label: "O'rnatish",       Icon: Wrench,             tint: 'text-blue-400',    bg: 'bg-blue-500/15',             count: 1 },
];

type Role = {
  slug: string;
  title: string;
  dept: Exclude<Dept['slug'], 'all'>;
  level: 'junior' | 'mid' | 'senior';
  location: 'tashkent' | 'samarkand' | 'remote' | 'hybrid' | 'travel';
  salary: string;
  summary: string;
  hot?: boolean;
};

const ROLES: ReadonlyArray<Role> = [
  {
    slug: 'sales-manager-tashkent',
    title: "Sotuv menejeri — Toshkent",
    dept: 'sales', level: 'mid', location: 'tashkent',
    salary: "$1,200 + bonus (jami $2,500+)",
    summary: "Toshkentdagi restoranlarga MyPOS sotish. Telefon, demo va shartnoma yopish. Restoran sohasida tajriba katta plyus. Oyiga 8-12 yangi mijoz.",
    hot: true,
  },
  {
    slug: 'sales-manager-samarkand',
    title: "Sotuv menejeri — Samarqand",
    dept: 'sales', level: 'mid', location: 'samarkand',
    salary: "$1,000 + bonus (jami $2,200+)",
    summary: "Samarqand viloyatidagi restoran, oshxona va kafe egalariga MyPOS taklif qilish. Mahalliy bozorni yaxshi bilish kerak.",
    hot: true,
  },
  {
    slug: 'account-executive',
    title: "Account Executive — yirik restoranlar",
    dept: 'sales', level: 'senior', location: 'tashkent',
    salary: '$1,800 + komissiya',
    summary: "5+ filiali bo'lgan tarmoq restoranlar bilan ishlash. Enterprise shartnomalar, RFP javoblar, C-level uchrashuvlar.",
  },
  {
    slug: 'restaurant-success',
    title: 'Restoran Success Manager',
    dept: 'success', level: 'mid', location: 'tashkent',
    salary: '$900 – $1,500',
    summary: "20-30 ta restoranni boshqarish: ish ko'rsatkichlari, retention, upsell. Har oy biznes review, har chorak strategiya majlisi.",
  },
  {
    slug: 'customer-success-junior',
    title: 'Customer Success Specialist',
    dept: 'success', level: 'junior', location: 'tashkent',
    salary: '$700 – $1,200',
    summary: "Yangi mijozlarga onboarding chiqishi · Telegram orqali kunlik suhbat · Feature request'larni product'ga yetkazish. UZ/RU.",
  },
  {
    slug: 'onboarding-specialist',
    title: 'Onboarding Mutaxassis',
    dept: 'onboarding', level: 'mid', location: 'travel',
    salary: '$1,000 – $1,600',
    summary: "Yangi restoranni 7 kunda ishga tushirish: menyu kiritish, xodimlar treningi, kassa sozlash. Toshkent + viloyatlar (haftada 1-2 safar).",
    hot: true,
  },
  {
    slug: 'support-specialist',
    title: "24/7 Texnik yordam mutaxassisi",
    dept: 'support', level: 'junior', location: 'hybrid',
    salary: '$700 – $1,200 + tungi qo\'shimcha',
    summary: "Smenali ish (kunduz/tun) · Telegram, telefon, email · O'rtacha javob 5 daqiqada. Restoran ishini tushunish — afzallik.",
  },
  {
    slug: 'field-implementation',
    title: "POS terminal o'rnatuvchi",
    dept: 'field', level: 'junior', location: 'travel',
    salary: '$800 – $1,200 + safar pul',
    summary: "Restoranga borib jismoniy o'rnatish: terminal, chek printer, Wi-Fi, kassa apparati. Kuniga 1-2 obyekt. Haydovchilik guvohnomasi shart.",
  },
];

const DEPT_MAP = Object.fromEntries(DEPARTMENTS.map((d) => [d.slug, d])) as Record<string, Dept>;

const LEVEL_LABEL: Record<Role['level'], { label: string; cls: string }> = {
  junior: { label: 'Boshlovchi', cls: 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/25' },
  mid:    { label: "O'rta",      cls: 'bg-amber-500/12 text-amber-300 ring-amber-500/25' },
  senior: { label: 'Tajribali',  cls: 'bg-[rgba(255,0,55,0.12)] text-[#ff8aa1] ring-[rgba(255,0,55,0.25)]' },
};

const LOCATION_LABEL: Record<Role['location'], { label: string; Icon: Icon }> = {
  tashkent:  { label: 'Toshkent',          Icon: Buildings },
  samarkand: { label: 'Samarqand',         Icon: Buildings },
  remote:    { label: 'Remote',            Icon: House },
  hybrid:    { label: 'Gibrid',            Icon: Globe },
  travel:    { label: "Safarli",           Icon: MapPin },
};

type Benefit = { Icon: Icon; tint: string; bg: string; title: string; body: string };

const BENEFITS: ReadonlyArray<Benefit> = [
  {
    Icon: CurrencyCircleDollar, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    title: 'Maosh + bonus',
    body: "Sotuv jamoasi uchun komissiya cheksiz · Har chorakda bonus · Yarim yilda ko'tarilish imkoniyati",
  },
  {
    Icon: GraduationCap, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    title: "O'qish budjeti",
    body: "Yiliga $600 — restoran biznesi, marketing, hisob, sotuv kurslari · Sertifikat olganga +bonus",
  },
  {
    Icon: ForkKnife, tint: 'text-emerald-400', bg: 'bg-emerald-500/15',
    title: "Bepul tushlik",
    body: "Mijoz restoranlarimizdan har kuni navbatma-navbat tushlik · Toshkent ofisida bepul kofe va smoothie",
  },
  {
    Icon: Heart, tint: 'text-rose-400', bg: 'bg-rose-500/15',
    title: "Sog'liq sug'urtasi",
    body: "Oila a'zolari uchun ham · Doctor on call · Stomatologiya va ko'z tekshiruvi qoplanadi",
  },
  {
    Icon: House, tint: 'text-blue-400', bg: 'bg-blue-500/15',
    title: 'Moslashuvchan grafik',
    body: "Asosiy talab — natija. Sales jamoasi uchun gibrid · Onboarding va o'rnatishchilar uchun field ish",
  },
  {
    Icon: Trophy, tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]',
    title: 'Tan olish',
    body: "Oylik 'eng yaxshi sotuvchi' mukofoti · Yillik retreat (Issiq-Ko'l, Buxoro) · Sertifikat va medal",
  },
];

const VALUES: ReadonlyArray<{ Icon: Icon; title: string; body: string }> = [
  {
    Icon: Lightning, title: 'Tez harakat qiling',
    body: "Mijoz qo'ng'iroq qilsa 3 jiringgacha javob beriladi. Demo so'rasa 24 soat ichida tashriffariga boriladi.",
  },
  {
    Icon: Smiley, title: "Mijozni tushuning",
    body: "Restoran egasi 14 soatlik ish kunidan keyin qo'ng'iroq qilyapti. Sabr, hurmat va aniqlik — har bir suhbatda.",
  },
  {
    Icon: Handshake, title: "Birga g'alaba",
    body: "Hech kim yolg'iz emas. Sotuv jamoasi commission ulashadi, onboarding va support — bitta natijaga ishlaydi.",
  },
  {
    Icon: Globe, title: "Mahalliy, lekin global",
    body: "Toshkentdamiz, lekin har qaror — Markaziy Osiyodagi 500+ restoran egasi uchun. Mahalliy nyuansni hech kim bizdek bilmaydi.",
  },
];

const PROCESS = [
  { step: '01', title: 'Ariza',         body: "CV yuboring · 2-3 kunda javob",                Icon: Briefcase },
  { step: '02', title: 'Suhbat #1',     body: "HR bilan 30 daqiqa · Madaniyat va rol",        Icon: ChatCircleDots },
  { step: '03', title: "Vazifa",        body: "Sotuv: rolepley · Support: muammo yechish",    Icon: Megaphone },
  { step: '04', title: 'Jamoa',         body: "2 jamoa a'zosi bilan suhbat · Restoran taqdimi", Icon: Users },
  { step: '05', title: 'Taklif',        body: "Maosh, bonus va boshlash sanasi · 1 hafta",   Icon: Sparkle },
] as const;

export default async function CareersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Briefcase size={11} weight="fill" />
            KARYERA
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Restoranlar bilan{' '}
            <span className="gradient-teal">ishlang</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            500+ restoranni boshqarishda yordam beramiz. Sotuvchi, onboarding, mijoz xizmati — biznesga real ta&apos;sir qiling.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="#openings"
              className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-full bg-[#ff0037] hover:bg-[#e6002f] text-white text-[14px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
            >
              Ochiq vakansiyalar
              <ArrowRight size={14} weight="bold" />
            </Link>
            <Link
              href="#culture"
              className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-full border border-white/15 bg-white/[0.06] text-white text-[14px] font-bold hover:bg-white/[0.12] transition-colors"
            >
              Madaniyatimiz
            </Link>
          </div>

          {/* Stats */}
          <div className="glass-card mx-auto mt-12 grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
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

      {/* Why join — values */}
      <section id="culture" className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Madaniyatimiz
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Bizning qoidalarimiz
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              4 ta tamoyil — har bir qaror va har bir mijoz qo&apos;ng&apos;irog&apos;ida.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <article key={v.title} className="glass-card glass-card-hover rounded-2xl p-6">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                  <v.Icon size={22} weight="bold" className="text-[#5eead4]" />
                </div>
                <h3 className="mt-4 text-[17px] font-bold tracking-tight text-white">{v.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">{v.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Imtiyozlar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Biz qanday g&apos;amxo&apos;rlik qilamiz
            </h2>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map((b) => (
              <article key={b.title} className="glass-card glass-card-hover rounded-2xl p-5">
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${b.bg}`}>
                  <b.Icon size={20} weight="bold" className={b.tint} />
                </span>
                <h3 className="mt-3.5 text-[14.5px] font-bold tracking-tight text-white">{b.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">{b.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section id="openings" className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Ochiq vakansiyalar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              {ROLES.length} ta rol kutmoqda
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              Restoran sohasida tajribangiz bormi? Bizga yozing — yangi rollar har oy ochiladi.
            </p>
          </div>

          {/* Department filter */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
            {DEPARTMENTS.map((d) => (
              <button
                key={d.slug}
                type="button"
                className={`press inline-flex h-8 items-center gap-1.5 px-3 rounded-full text-[12px] font-semibold transition-colors ${
                  d.slug === 'all'
                    ? 'bg-white text-[#001B1B]'
                    : 'border border-white/[0.10] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/25'
                }`}
              >
                <d.Icon size={12} weight="bold" className={d.slug === 'all' ? '' : d.tint} />
                {d.label}
                <span className={`tabular text-[10px] font-bold ${d.slug === 'all' ? 'text-[#001B1B]/60' : 'text-white/40'}`}>
                  {d.count}
                </span>
              </button>
            ))}
          </div>

          {/* Roles list */}
          <ul className="mt-8 space-y-3">
            {ROLES.map((r) => {
              const dept = DEPT_MAP[r.dept];
              const level = LEVEL_LABEL[r.level];
              const loc = LOCATION_LABEL[r.location];
              if (!dept) return null;
              return (
                <li key={r.slug}>
                  <Link
                    href={`/${locale}/careers/${r.slug}`}
                    className="glass-card glass-card-hover press group flex flex-col gap-4 rounded-2xl px-5 py-5 sm:px-6 sm:flex-row sm:items-center"
                  >
                    {/* Dept icon */}
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${dept.bg}`}>
                      <dept.Icon size={20} weight="bold" className={dept.tint} />
                    </span>

                    {/* Body */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[15.5px] sm:text-[16px] font-bold text-white tracking-tight">
                          {r.title}
                        </h3>
                        {r.hot ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff0037] text-white text-[9.5px] font-bold uppercase tracking-[0.06em]">
                            <Lightning size={9} weight="fill" />
                            Tez
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65 line-clamp-2">
                        {r.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 ring-inset font-bold uppercase tracking-wide text-[9.5px] ${level.cls}`}>
                          {level.label}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 ring-inset ring-white/10 bg-white/[0.04] text-white/70 text-[10.5px] font-semibold">
                          <loc.Icon size={10} weight="bold" />
                          {loc.label}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 ring-inset ring-white/10 bg-white/[0.04] text-white/70 text-[10.5px] font-semibold tabular">
                          <CurrencyCircleDollar size={10} weight="bold" />
                          {r.salary}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <span className="press hidden sm:inline-flex h-10 items-center gap-1 px-4 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12.5px] font-bold group-hover:bg-[#ff0037] group-hover:border-[#ff0037] transition-colors shrink-0">
                      Ariza
                      <ArrowRight size={12} weight="bold" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* No match strip */}
          <div className="glass-card mt-6 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
              <Sparkle size={16} weight="bold" className="text-[#5eead4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">
                Mos rol topilmadimi?
              </div>
              <div className="text-[11.5px] text-white/55">
                Restoran sohasidan kelmagan bo&apos;lsangiz ham — bizga yozing. O&apos;rgatamiz.
              </div>
            </div>
            <Link
              href={`/${locale}/contact?subject=careers`}
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
            >
              Yozing
              <ArrowRight size={11} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hiring process */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Tanlov jarayoni
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Ariza yuborgandan offergacha
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              O&apos;rtacha 2 hafta · Har bosqichdan keyin 48 soat ichida javob beramiz.
            </p>
          </div>

          <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PROCESS.map((p) => (
              <li key={p.step} className="glass-card rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="tabular text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4]">
                    Bosqich {p.step}
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-white/[0.04]">
                    <p.Icon size={15} weight="bold" className="text-[#5eead4]" />
                  </span>
                </div>
                <h3 className="mt-3 text-[15px] font-bold tracking-tight text-white">{p.title}</h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{p.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Office location */}
      <section className="bg-[#001B1B] py-12 sm:py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-10 grid gap-6 md:grid-cols-2 md:items-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 100% 0%, rgba(20,184,166,0.20), transparent 50%)',
              }}
            />
            <div className="relative">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <MapPin size={20} weight="bold" className="text-[#5eead4]" />
              </div>
              <h2 className="mt-4 text-[22px] sm:text-[28px] font-extrabold tracking-tight text-white leading-[1.15]">
                Toshkentdagi bosh ofis
              </h2>
              <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">
                Mirzo Ulug&apos;bek tumani, Innovation Hub · 5 daqiqa metroga · Ochiq planirovka, demo-zona (haqiqiy restoran kassasi), oshxona.
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-[12px]">
                <span className="inline-flex items-center gap-1.5 text-white/70">
                  <Buildings size={13} weight="bold" className="text-[#5eead4]" />
                  450 m² ofis
                </span>
                <span className="inline-flex items-center gap-1.5 text-white/70">
                  <Storefront size={13} weight="bold" className="text-amber-400" />
                  Demo zona
                </span>
                <span className="inline-flex items-center gap-1.5 text-white/70">
                  <Coffee size={13} weight="bold" className="text-emerald-400" />
                  Bepul tushlik
                </span>
              </div>
            </div>
            <div className="relative grid grid-cols-2 gap-2">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[rgba(20,184,166,0.25)] via-[rgba(20,184,166,0.10)] to-transparent ring-1 ring-inset ring-white/10 flex items-center justify-center">
                <Storefront size={56} weight="duotone" className="text-white/75" />
              </div>
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-amber-500/25 via-amber-500/10 to-transparent ring-1 ring-inset ring-white/10 flex items-center justify-center">
                <ForkKnife size={48} weight="duotone" className="text-white/75" />
              </div>
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-purple-500/25 via-purple-500/10 to-transparent ring-1 ring-inset ring-white/10 flex items-center justify-center">
                <Users size={48} weight="duotone" className="text-white/75" />
              </div>
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-[rgba(255,0,55,0.25)] via-[rgba(255,0,55,0.10)] to-transparent ring-1 ring-inset ring-white/10 flex items-center justify-center">
                <Coffee size={48} weight="duotone" className="text-white/75" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

import {
  ArrowRight,
  CalendarBlank,
  ChartBar,
  ChatCircleDots,
  CheckCircle,
  Cookie,
  EnvelopeSimple,
  Eye,
  FileText,
  Globe,
  Info,
  Key,
  Lock,
  Prohibit,
  Question,
  ShieldCheck,
  Sliders,
  Sparkle,
  XCircle,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Cookie siyosati — MyPOS',
  description: "MyPOS qanday cookie'lardan foydalanadi va siz qanday boshqarishingiz mumkin.",
};

const LAST_UPDATED = '2026-05-01';

type Category = {
  id: string;
  Icon: Icon;
  tint: string;
  bg: string;
  title: string;
  required: boolean;
  summary: string;
  cookies: ReadonlyArray<{ name: string; purpose: string; duration: string; provider: 'MyPOS' | 'Plausible' }>;
};

const CATEGORIES: ReadonlyArray<Category> = [
  {
    id: 'essential',
    Icon: Lock,
    tint: 'text-[#5eead4]',
    bg: 'bg-[rgba(20,184,166,0.15)]',
    title: 'Zarur cookie',
    required: true,
    summary: "Tizim ishlashi uchun shart. O'chirib bo'lmaydi. Ularsiz xizmatga kira olmaysiz.",
    cookies: [
      { name: 'mypos_session', purpose: 'Tizimga kirish va session saqlash',         duration: '24 soat',  provider: 'MyPOS' },
      { name: 'csrf_token',    purpose: 'CSRF himoyasi (xavfsizlik)',                  duration: 'Session',  provider: 'MyPOS' },
      { name: 'NEXT_LOCALE',   purpose: "Tanlangan til (UZ/RU/EN/KZ)",                duration: '1 yil',    provider: 'MyPOS' },
      { name: 'theme',         purpose: "Kun/tun rejim afzalligi",                     duration: '1 yil',    provider: 'MyPOS' },
      { name: 'cookie_consent',purpose: "Cookie afzalliklaringizni eslab qolish",      duration: '1 yil',    provider: 'MyPOS' },
    ],
  },
  {
    id: 'analytics',
    Icon: ChartBar,
    tint: 'text-amber-400',
    bg: 'bg-amber-500/15',
    title: 'Tahlil cookie',
    required: false,
    summary: "Xizmatni yaxshilash uchun anonim foydalanish statistikasi. IP saqlanmaydi, sizni alohida aniqlab bo'lmaydi.",
    cookies: [
      { name: '_pa_visitor',   purpose: 'Anonim sahifa ko\'rishlar (Plausible)',     duration: '24 soat',  provider: 'Plausible' },
      { name: '_pa_session',   purpose: 'Session davomida sahifa harakati',          duration: '30 daqiqa',provider: 'Plausible' },
    ],
  },
  {
    id: 'preferences',
    Icon: Sliders,
    tint: 'text-blue-400',
    bg: 'bg-blue-500/15',
    title: "Sozlamalar cookie",
    required: false,
    summary: "Sizning afzalliklaringizni eslab qolish — masalan, sahifa joylashuvi, jadval ustun tartibi.",
    cookies: [
      { name: 'mypos_layout',  purpose: 'Sidebar va dashboard joylashuvi',          duration: '6 oy',    provider: 'MyPOS' },
      { name: 'table_columns', purpose: 'Jadval ustunlari va saralash',              duration: '6 oy',    provider: 'MyPOS' },
    ],
  },
  {
    id: 'marketing',
    Icon: Prohibit,
    tint: 'text-[#ff0037]',
    bg: 'bg-[rgba(255,0,55,0.15)]',
    title: 'Reklama cookie',
    required: false,
    summary: "Yo'q. MyPOS reklama cookie'lari yo'q. Google Ads, Facebook Pixel, Meta yoki boshqa reklama tarmoqlariga ulanmagan.",
    cookies: [],
  },
];

type Faq = { Icon: Icon; q: string; a: string };

const FAQ: ReadonlyArray<Faq> = [
  {
    Icon: Cookie,
    q: "Cookie nima?",
    a: "Cookie — bu sizning brauzeringizda saqlanadigan kichik matn fayli. U sizni qayta tanish, til afzalligini eslab qolish va xizmatni shaxsiylashtirish uchun ishlatiladi. Cookie virus emas va kompyuteringizga zarar yetkazmaydi.",
  },
  {
    Icon: Sliders,
    q: "Cookie'larni qanday boshqaraman?",
    a: "Sahifaning pastki qismidagi banner orqali yoki '/cookies' sahifasidagi sozlamalar orqali — har bir kategoriyani alohida yoqib/o'chirishingiz mumkin. Brauzer sozlamalaridan ham boshqarish mumkin.",
  },
  {
    Icon: Eye,
    q: "Cookie'larni butunlay o'chirsam nima bo'ladi?",
    a: "Zarur cookie'larsiz tizimga kira olmaysiz va kassa ishlamaydi. Tahlil va sozlamalar cookie'larini o'chirish xavfsiz — faqat har safar til va sozlamalarni qayta tanlashga to'g'ri keladi.",
  },
  {
    Icon: Globe,
    q: "3-tomon cookie'lari bormi?",
    a: "Faqat bitta — Plausible Analytics (Germaniyada joylashgan, GDPR-friendly tahlil xizmati). Ular IP-manzilni saqlamaydi va shaxsiy ma'lumot to'plamaydi. Google, Facebook, Meta'dan hech qanday cookie YO'Q.",
  },
  {
    Icon: ShieldCheck,
    q: "Cookie ma'lumotim qayerda saqlanadi?",
    a: "Faqat sizning brauzeringizda — bizning serverda emas. Cookie qiymatlarining bir qismi (session ID, locale) bizning serverga so'rov bilan birga keladi, lekin biz uni faqat tizimni ishga tushirish uchun ishlatamiz.",
  },
  {
    Icon: Key,
    q: "Cookie afzalliklarimni qaytadan ko'rib chiqsam bo'ladimi?",
    a: "Ha. Sahifa pastidagi 'Cookie sozlamalari' havolasini bosing yoki shu sahifaning yuqorisidagi 'Sozlamalarni boshqarish' tugmasidan foydalaning.",
  },
];

const FACTS = [
  { value: '5',    label: "zarur cookie",      Icon: Lock },
  { value: '2',    label: "tahlil cookie",     Icon: ChartBar },
  { value: '0',    label: "reklama cookie",    Icon: Prohibit },
  { value: '100%', label: "GDPR mos",          Icon: ShieldCheck },
] as const;

export default async function CookiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Cookie size={11} weight="fill" />
            COOKIE
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Cookie{' '}
            <span className="gradient-teal">siyosati</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Reklama cookie&apos;lari yo&apos;q. Kuzatuv yo&apos;q. Faqat tizim ishlashi va xizmatni yaxshilash uchun zarur narsalar.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[11.5px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/70">
              <CalendarBlank size={11} weight="bold" className="text-[#5eead4]" />
              Yangilangan: <span className="tabular text-white font-semibold">{LAST_UPDATED}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 font-bold">
              <CheckCircle size={11} weight="fill" />
              GDPR-mos
            </span>
          </div>
        </div>
      </section>

      {/* Quick facts */}
      <section className="bg-[#001B1B] pb-6">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card grid grid-cols-2 sm:grid-cols-4 gap-px rounded-2xl overflow-hidden">
            {FACTS.map((f) => (
              <div key={f.label} className="px-3 py-5 text-center bg-white/[0.02]">
                <f.Icon size={18} weight="bold" className="mx-auto mb-2 text-[#5eead4]" aria-hidden="true" />
                <div className="tabular text-[22px] sm:text-[24px] font-extrabold leading-none text-white">
                  {f.value}
                </div>
                <div className="mt-1 text-[10.5px] sm:text-[11px] font-semibold text-white/60">
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="bg-[#001B1B] py-10">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card rounded-2xl p-6 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <Info size={18} weight="bold" className="text-[#5eead4]" />
              </span>
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-tight text-white">
                  Asosiy fakt
                </h2>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-white/75">
                  MyPOS sizni internetda <strong className="text-white">kuzatmaydi</strong>. Bizning cookie&apos;larimiz faqat:
                  <span className="block mt-2 text-white/85">
                    1) Tizimga kirish va ishlash uchun · 2) Sizning til va kun/tun afzalligingizni eslab qolish uchun · 3) Anonim foydalanish statistikasi uchun (siz buni o&apos;chirishingiz mumkin).
                  </span>
                </p>
                <p className="mt-3 text-[13px] leading-relaxed text-white/65">
                  Reklama tarmoqlari, kuzatuv pikselilari yoki <em>retargeting</em> uchun cookie ishlatmaymiz. Sizning ma&apos;lumotingiz reklama uchun sotilmaydi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-[#001B1B] py-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Kategoriyalar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Biz qanday cookie&apos;lardan foydalanamiz
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              Har bir cookie, uning maqsadi va davomiyligi — to&apos;liq shaffof.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {CATEGORIES.map((cat) => (
              <article
                key={cat.id}
                id={cat.id}
                className="glass-card rounded-2xl p-6 sm:p-7 scroll-mt-24"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${cat.bg}`}>
                      <cat.Icon size={22} weight="bold" className={cat.tint} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[17px] sm:text-[18px] font-extrabold tracking-tight text-white">
                        {cat.title}
                      </h3>
                      <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/65">
                        {cat.summary}
                      </p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="flex items-center gap-2 shrink-0">
                    {cat.required ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/15 text-white/80 text-[10.5px] font-bold uppercase tracking-[0.06em]">
                        <Lock size={10} weight="bold" />
                        Doim yoqilgan
                      </span>
                    ) : cat.cookies.length === 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgba(255,0,55,0.10)] ring-1 ring-inset ring-[#ff0037]/25 text-[#ff8aa1] text-[10.5px] font-bold uppercase tracking-[0.06em]">
                        <XCircle size={10} weight="fill" />
                        Foydalanilmaydi
                      </span>
                    ) : (
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="peer sr-only" />
                        <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/15 transition-colors peer-checked:bg-[#5eead4]/80 ring-1 ring-inset ring-white/10">
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                        </span>
                        <span className="text-[11px] font-bold text-white/70 tabular">
                          {cat.cookies.length} ta
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                {/* Cookie list */}
                {cat.cookies.length > 0 ? (
                  <div className="mt-5 overflow-hidden rounded-xl ring-1 ring-inset ring-white/[0.08]">
                    {/* Header — desktop only */}
                    <div className="hidden sm:grid grid-cols-[2fr_3fr_1.4fr_1fr] gap-3 px-4 py-2.5 bg-white/[0.04] text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">
                      <span>Nomi</span>
                      <span>Maqsad</span>
                      <span>Davomiylik</span>
                      <span>Provayder</span>
                    </div>
                    <ul className="divide-y divide-white/[0.06]">
                      {cat.cookies.map((c) => (
                        <li
                          key={c.name}
                          className="grid grid-cols-1 sm:grid-cols-[2fr_3fr_1.4fr_1fr] gap-y-1 gap-x-3 px-4 py-3 text-[12.5px]"
                        >
                          <span className="font-mono font-semibold text-[#5eead4]">{c.name}</span>
                          <span className="text-white/75">{c.purpose}</span>
                          <span className="tabular text-white/60">{c.duration}</span>
                          <span className="text-white/60">{c.provider}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-xl ring-1 ring-inset ring-emerald-500/20 bg-emerald-500/8 text-[12.5px] text-white/80">
                    <Sparkle size={14} weight="fill" className="text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-white">Bu kategoriyada hech qanday cookie yo&apos;q.</strong>{' '}
                      MyPOS reklama, kuzatuv yoki retargeting cookie&apos;laridan foydalanmaydi.
                    </span>
                  </div>
                )}
              </article>
            ))}
          </div>

          {/* Save preferences strip */}
          <div className="glass-card mt-6 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-amber-500/15">
              <Sliders size={16} weight="bold" className="text-amber-400" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">
                Cookie afzalliklaringizni saqlash
              </div>
              <div className="text-[11.5px] text-white/55">
                Tanlovingiz brauzeringizda saqlanadi va istalgan vaqtda o&apos;zgartirilishi mumkin.
              </div>
            </div>
            <button
              type="button"
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[12px] font-bold transition-colors"
            >
              Tanlovni saqlash
              <ArrowRight size={11} weight="bold" />
            </button>
          </div>
        </div>
      </section>

      {/* Browser-level control */}
      <section className="bg-[#001B1B] py-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card rounded-2xl p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-blue-500/15">
                <Globe size={20} weight="bold" className="text-blue-400" />
              </span>
              <h2 className="text-[20px] font-extrabold tracking-tight text-white">
                Brauzer orqali boshqarish
              </h2>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">
              Hamma cookie&apos;larni brauzer sozlamalaridan ham boshqarishingiz mumkin. Quyidagi qo&apos;llanmalar yordamida:
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: 'Chrome',  href: 'https://support.google.com/chrome/answer/95647' },
                { name: 'Safari',  href: 'https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac' },
                { name: 'Firefox', href: 'https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer' },
                { name: 'Edge',    href: 'https://support.microsoft.com/en-us/microsoft-edge' },
              ].map((b) => (
                <a
                  key={b.name}
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex h-10 items-center justify-between gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12.5px] font-bold hover:bg-white/[0.12] transition-colors"
                >
                  {b.name}
                  <ArrowRight size={12} weight="bold" className="text-white/50" />
                </a>
              ))}
            </div>
            <p className="mt-4 text-[11.5px] text-white/50">
              Eslatma: brauzerda &apos;Zarur cookie&apos;larni o&apos;chirsangiz, tizimga kira olmaysiz.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              FAQ
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Cookie haqida savollar
            </h2>
          </div>

          <div className="mt-10 space-y-2.5">
            {FAQ.map((f, idx) => (
              <details
                key={f.q}
                className="glass-card rounded-2xl group"
                open={idx === 0}
              >
                <summary className="press flex cursor-pointer items-center gap-3 px-5 py-4 list-none">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                    <f.Icon size={14} weight="bold" className="text-[#5eead4]" />
                  </span>
                  <span className="min-w-0 flex-1 text-[14.5px] font-bold text-white">{f.q}</span>
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-white/[0.05] text-white/70 group-open:bg-[#5eead4]/15 group-open:text-[#5eead4] group-open:ring-[#5eead4]/30 transition-colors">
                    <ArrowRight size={11} weight="bold" className="group-open:rotate-90 transition-transform" />
                  </span>
                </summary>
                <div className="px-5 pb-5 pl-[68px] -mt-1 text-[13px] leading-relaxed text-white/70">
                  {f.a}
                </div>
              </details>
            ))}
          </div>

          <div className="glass-card mt-5 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-amber-500/15">
              <Question size={16} weight="bold" className="text-amber-400" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">Boshqa savol bormi?</div>
              <div className="text-[11.5px] text-white/55">
                privacy@mypos.uz · 7 ish kunida javob beramiz
              </div>
            </div>
            <a
              href="mailto:privacy@mypos.uz?subject=Cookie savol"
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
            >
              <EnvelopeSimple size={12} weight="bold" />
              Email
            </a>
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="bg-[#001B1B] py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card rounded-2xl px-6 py-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-white">Boshqa huquqiy hujjatlar</h3>
              <p className="mt-1 text-[12px] text-white/55">
                Maxfiylik siyosati, foydalanish shartlari va xavfsizlik kafolatlari.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/${locale}/privacy`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                <ShieldCheck size={12} weight="bold" />
                Maxfiylik
              </Link>
              <Link
                href={`/${locale}/terms`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                <FileText size={12} weight="bold" />
                Shartlar
              </Link>
              <Link
                href={`/${locale}/security`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                <Lock size={12} weight="bold" />
                Xavfsizlik
              </Link>
            </div>
          </div>

          <Link
            href={`/${locale}/contact`}
            className="glass-card glass-card-hover press mt-3 flex items-center gap-3 rounded-2xl px-5 py-4"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(38,165,228,0.15)]">
              <ChatCircleDots size={16} weight="bold" className="text-[#26A5E4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">Tezkor yordam kerakmi?</div>
              <div className="text-[11.5px] text-white/55">Telegramda 5 daqiqada javob beramiz.</div>
            </div>
            <ArrowRight size={14} weight="bold" className="text-white/50" />
          </Link>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

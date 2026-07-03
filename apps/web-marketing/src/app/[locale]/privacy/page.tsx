import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  CalendarBlank,
  ChatCircleDots,
  CheckCircle,
  Database,
  Download,
  EnvelopeSimple,
  Eye,
  FileText,
  Globe,
  Key,
  Lock,
  Prohibit,
  ShieldCheck,
  Trash,
  UserCircle,
  Warning,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Maxfiylik siyosati — MyPOS',
  description: "MyPOS qanday ma'lumotlarni yig'adi, qanday saqlaydi va sizning huquqlaringiz.",
};

const LAST_UPDATED = '2026-05-01';
const EFFECTIVE = '2026-05-01';

type Principle = { Icon: Icon; tint: string; bg: string; title: string; body: string };

const PRINCIPLES: ReadonlyArray<Principle> = [
  {
    Icon: Lock,
    tint: 'text-[#5eead4]',
    bg: 'bg-[rgba(20,184,166,0.15)]',
    title: 'Shifrlash by default',
    body: "Barcha ma'lumotlar TLS 1.3 orqali uzatiladi · Diskda AES-256 · Parollar bcrypt + salt",
  },
  {
    Icon: Database,
    tint: 'text-blue-400',
    bg: 'bg-blue-500/15',
    title: "Ma'lumot — O'zbekistonda",
    body: 'Server UZCLOUD (Toshkent) · Backup Beeline DC · Hech qachon mamlakat tashqarisiga chiqmaydi',
  },
  {
    Icon: Prohibit,
    tint: 'text-[#ff0037]',
    bg: 'bg-[rgba(255,0,55,0.15)]',
    title: 'Hech kimga sotmaymiz',
    body: "Sizning ma'lumotingiz — sizniki. Reklama berasizmi, 3-tomonga sotamizmi — hech qachon",
  },
  {
    Icon: Eye,
    tint: 'text-amber-400',
    bg: 'bg-amber-500/15',
    title: "To'liq shaffof",
    body: "Qanday ma'lumot yig'amiz · Qancha vaqt saqlaymiz · Kim ko'ra oladi — bu yerda yozilgan",
  },
];

type Section = {
  id: string;
  Icon: Icon;
  title: string;
  intro?: string;
  items?: ReadonlyArray<{ label: string; body: string }>;
  bullets?: ReadonlyArray<string>;
  note?: string;
};

const SECTIONS: ReadonlyArray<Section> = [
  {
    id: 'collect',
    Icon: Database,
    title: "1. Biz qanday ma'lumotlarni yig'amiz",
    intro:
      "MyPOS faqat sizga xizmat ko'rsatish uchun zarur bo'lgan ma'lumotlarni yig'adi. Hech qaysi qo'shimcha shaxsiy ma'lumot so'ralmaydi.",
    items: [
      {
        label: "Hisob ma'lumotlari",
        body: "Ism, familiya, telefon raqam, email, restoran nomi va manzili — ro'yxatdan o'tishda kiritilgan ma'lumotlar.",
      },
      {
        label: "Biznes ma'lumotlari",
        body: "Menyu, narxlar, buyurtmalar, chek hisobotlari, smena hisobotlari, inventar, xodimlar ro'yxati va ish vaqti.",
      },
      {
        label: "To'lov ma'lumotlari",
        body: "Tranzaksiya turi (Click, Payme, naqd, Uzcard) va summasi. Karta raqami yoki PIN HECH QACHON saqlanmaydi — ular to'g'ridan-to'g'ri to'lov tizimiga uzatiladi.",
      },
      {
        label: "Foydalanish ma'lumotlari",
        body: "Qachon kirgansiz, qaysi tugmalarni bosgan, qaysi sahifani ko'rgan — xizmatni yaxshilash uchun anonim shaklda yig'iladi.",
      },
    ],
  },
  {
    id: 'use',
    Icon: UserCircle,
    title: "2. Ma'lumotlardan qanday foydalanamiz",
    intro: "Yig'ilgan ma'lumotlardan faqat quyidagi maqsadlarda foydalanamiz:",
    bullets: [
      "Xizmat ko'rsatish — buyurtma, chek, hisobotlar",
      'Texnik yordam — muammoni hal qilish va savollarga javob berish',
      'Hisobchilik va soliq hisoboti — qonun talabiga muvofiq',
      "Tizimni yaxshilash — yangi xususiyatlar va bug'larni topish",
      "Bog'lanish — muhim yangiliklar, tizim yangilanishlari (faqat ruxsat bilan)",
      'Firibgarlik va xavfsizlik tahdidlarining oldini olish',
    ],
    note: 'Reklama, profil yaratish yoki 3-tomon xizmatlariga sotish uchun — HECH QACHON foydalanmaymiz.',
  },
  {
    id: 'storage',
    Icon: ShieldCheck,
    title: "3. Ma'lumotlar qayerda va qancha saqlanadi",
    intro: "Sizning ma'lumotlaringiz xavfsiz va O'zbekiston hududidan tashqariga chiqmaydi.",
    items: [
      {
        label: 'Asosiy server',
        body: "UZCLOUD — Toshkent shahridagi sertifikatlangan ma'lumot markazi. Tier III sertifikat, 99.99% uptime kafolat.",
      },
      {
        label: 'Zaxira (backup)',
        body: "Beeline DC — alohida ma'lumot markazi. Har 6 soatda zaxira nusxa olinadi, 30 kun saqlanadi.",
      },
      {
        label: 'Saqlash muddati',
        body: "Faol akkaunt — cheksiz. Bekor qilingan akkaunt — 90 kun ichida butunlay o'chiriladi (soliq hisoboti talabi bo'yicha moliyaviy ma'lumotlar 5 yil saqlanadi).",
      },
    ],
  },
  {
    id: 'sharing',
    Icon: Globe,
    title: "4. Kim ma'lumotni ko'ra oladi",
    intro: "Sizning ma'lumotlaringizni faqat quyidagi hollarda 3-tomon ko'rishi mumkin:",
    items: [
      {
        label: "To'lov tizimlari",
        body: "Click, Payme, Uzcard — faqat tranzaksiyani amalga oshirish uchun zarur ma'lumotlar (summa, sana). Karta raqami biz tarafda hech qachon ko'rinmaydi.",
      },
      {
        label: 'Soliq idoralari',
        body: "Qonun talabi bo'yicha — Soliq qo'mitasi rasmiy so'rov yuborgan taqdirda, faqat soliq hisoboti uchun zarur ma'lumotlar.",
      },
      {
        label: 'MyPOS texnik xodimlari',
        body: "Faqat texnik muammoni hal qilish uchun va siz ruxsat bergan taqdirda. Har bir kirish log qilinadi va siz ko'rishingiz mumkin.",
      },
    ],
    note: "Boshqa tashkilotlarga — reklama tarmoqlari, ma'lumot brokerlari, marketing kompaniyalariga — HECH QACHON taqdim qilmaymiz.",
  },
  {
    id: 'rights',
    Icon: Key,
    title: '5. Sizning huquqlaringiz',
    intro:
      "Siz ma'lumotlaringiz ustidan to'liq nazoratga egasiz. Quyidagi huquqlarni har qanday vaqtda amalga oshirishingiz mumkin:",
    bullets: [
      "Kirish — qanday ma'lumotlar saqlanganligini bilish",
      "To'g'rilash — noto'g'ri ma'lumotni o'zgartirish",
      "O'chirish — akkaunt va barcha ma'lumotlarni butunlay yo'qotish",
      "Eksport — barcha ma'lumotlarni JSON yoki Excel formatida yuklab olish",
      "Cheklash — ma'lum maqsadlarda foydalanishni taqiqlash",
      "Bog'lanmaslik — yangiliklar va xabarlarni o'chirish",
    ],
    note: 'Huquqlaringizdan foydalanish uchun: privacy@mypos.uz · 7 ish kunida javob beramiz.',
  },
  {
    id: 'cookies',
    Icon: FileText,
    title: '6. Cookie va kuzatuv',
    intro:
      "MyPOS faqat ishlash uchun zarur bo'lgan cookie'lardan foydalanadi. Reklama yoki kuzatuv cookie'lari yo'q.",
    items: [
      {
        label: 'Zarur cookie',
        body: "Tizimga kirish, session saqlash, tilni eslab qolish. Bu cookie'larsiz tizim ishlamaydi.",
      },
      {
        label: 'Tahlil cookie',
        body: "Plausible Analytics (privacy-friendly) — anonim sahifa ko'rishlar. IP saqlanmaydi, sizni alohida aniqlab bo'lmaydi.",
      },
      {
        label: 'Reklama cookie',
        body: "Yo'q. MyPOS reklama ko'rsatmaydi va sizni internetda kuzatmaydi.",
      },
    ],
  },
  {
    id: 'children',
    Icon: Warning,
    title: '7. Bolalar va voyaga yetmaganlar',
    intro:
      "MyPOS faqat 18+ yoshdagi tadbirkorlar uchun mo'ljallangan. 18 yoshga to'lmagan shaxslardan ma'lumot to'plamaymiz. Agar siz 18 yoshga to'lmagan bolaning ma'lumoti tizimimizda borligini aniqlasangiz, darhol privacy@mypos.uz manziliga xabar bering — biz uni darhol o'chirib tashlaymiz.",
  },
  {
    id: 'changes',
    Icon: CalendarBlank,
    title: "8. Siyosat o'zgarishlari",
    intro:
      "Ushbu siyosat vaqti-vaqti bilan yangilanishi mumkin. Har bir muhim o'zgarish haqida sizga email orqali 30 kun oldin xabar beramiz. So'nggi versiya har doim shu sahifada bo'ladi.",
  },
];

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div
          aria-hidden="true"
          className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]"
        />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <ShieldCheck size={11} weight="fill" />
            HUQUQIY
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Maxfiylik <span className="gradient-teal">siyosati</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Sizning ma&apos;lumotingiz — sizniki. Qanday yig&apos;amiz, qayerda saqlaymiz va qanday
            himoya qilamiz — barchasi shaffof.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-[11.5px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/70">
              <CalendarBlank size={11} weight="bold" className="text-[#5eead4]" />
              Yangilangan: <span className="tabular text-white font-semibold">{LAST_UPDATED}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/70">
              <CheckCircle size={11} weight="fill" className="text-emerald-400" />
              Kuchga kirgan: <span className="tabular text-white font-semibold">{EFFECTIVE}</span>
            </span>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-[#001B1B] py-12 sm:py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Asosiy tamoyillar
            </p>
            <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white">
              4 ta va&apos;da
            </h2>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRINCIPLES.map((p) => (
              <article key={p.title} className="glass-card glass-card-hover rounded-2xl p-5">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${p.bg}`}
                >
                  <p.Icon size={20} weight="bold" className={p.tint} />
                </span>
                <h3 className="mt-3.5 text-[14px] font-bold tracking-tight text-white">
                  {p.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Sections — sidebar nav + content */}
      <section className="bg-[#001B1B] py-12 sm:py-14">
        <div className="mx-auto max-w-5xl px-5 grid gap-6 lg:grid-cols-[1fr_3fr]">
          {/* Sidebar nav */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="glass-card rounded-2xl p-4">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4] px-2 pb-2">
                Bo&apos;limlar
              </div>
              <ul className="space-y-0.5">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="press group flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12.5px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <s.Icon
                        size={13}
                        weight="bold"
                        className="text-[#5eead4]/70 shrink-0 group-hover:text-[#5eead4] transition-colors"
                      />
                      <span className="truncate">{s.title.replace(/^\d+\.\s/, '')}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Content */}
          <div className="space-y-5">
            {SECTIONS.map((s) => (
              <article
                key={s.id}
                id={s.id}
                className="glass-card rounded-2xl p-6 sm:p-7 scroll-mt-24"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                    <s.Icon size={20} weight="bold" className="text-[#5eead4]" />
                  </span>
                  <h2 className="text-[18px] sm:text-[20px] font-extrabold tracking-tight text-white">
                    {s.title}
                  </h2>
                </div>

                {s.intro ? (
                  <p className="mt-4 text-[13.5px] leading-relaxed text-white/75">{s.intro}</p>
                ) : null}

                {s.items ? (
                  <ul className="mt-4 space-y-3">
                    {s.items.map((it) => (
                      <li
                        key={it.label}
                        className="rounded-xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.02] px-4 py-3"
                      >
                        <div className="text-[12.5px] font-bold text-white">{it.label}</div>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-white/65">
                          {it.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {s.bullets ? (
                  <ul className="mt-4 space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-[13px] text-white/75">
                        <CheckCircle
                          size={14}
                          weight="fill"
                          className="mt-[3px] text-[#5eead4] shrink-0"
                        />
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {s.note ? (
                  <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl ring-1 ring-inset ring-[#ff0037]/20 bg-[rgba(255,0,55,0.06)]">
                    <Warning size={14} weight="fill" className="mt-[3px] text-[#ff0037] shrink-0" />
                    <p className="text-[12px] leading-relaxed text-white/80">{s.note}</p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="bg-[#001B1B] py-12 sm:py-14">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Tezkor amallar
            </p>
            <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white">
              Ma&apos;lumotlaringiz ustidan nazorat
            </h2>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href="mailto:privacy@mypos.uz?subject=Ma'lumot eksport"
              className="glass-card glass-card-hover press group rounded-2xl p-5 text-left"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-blue-500/15">
                <Download size={20} weight="bold" className="text-blue-400" />
              </span>
              <h3 className="mt-3.5 text-[14.5px] font-bold tracking-tight text-white">
                Ma&apos;lumotlarni yuklab olish
              </h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">
                Barcha ma&apos;lumotlaringizni JSON yoki Excel formatida olish.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#5eead4] group-hover:translate-x-0.5 transition-transform">
                Eksport so&apos;rash
                <ArrowRight size={11} weight="bold" />
              </span>
            </a>

            <a
              href="mailto:privacy@mypos.uz?subject=Ma'lumotni o'chirish"
              className="glass-card glass-card-hover press group rounded-2xl p-5 text-left"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)]">
                <Trash size={20} weight="bold" className="text-[#ff0037]" />
              </span>
              <h3 className="mt-3.5 text-[14.5px] font-bold tracking-tight text-white">
                Akkauntni o&apos;chirish
              </h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">
                Akkaunt va barcha ma&apos;lumotlaringizni butunlay o&apos;chirish (90 kunda).
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#ff0037] group-hover:translate-x-0.5 transition-transform">
                So&apos;rov yuborish
                <ArrowRight size={11} weight="bold" />
              </span>
            </a>

            <a
              href="mailto:privacy@mypos.uz"
              className="glass-card glass-card-hover press group rounded-2xl p-5 text-left"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-amber-500/15">
                <EnvelopeSimple size={20} weight="bold" className="text-amber-400" />
              </span>
              <h3 className="mt-3.5 text-[14.5px] font-bold tracking-tight text-white">
                Maxfiylik bo&apos;limi
              </h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-white/65">
                Boshqa savol bormi? privacy@mypos.uz · 7 ish kuni javob.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-[#5eead4] group-hover:translate-x-0.5 transition-transform">
                Yozish
                <ArrowRight size={11} weight="bold" />
              </span>
            </a>
          </div>

          {/* Telegram strip */}
          <div className="glass-card mt-4 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(38,165,228,0.15)]">
              <ChatCircleDots size={16} weight="bold" className="text-[#26A5E4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">Tezkor savol bormi?</div>
              <div className="text-[11.5px] text-white/55">
                Telegramda yozing — privacy bo&apos;yicha mutaxassisimiz 1 soatda javob beradi.
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

      {/* Related */}
      <section className="bg-[#001B1B] py-12">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card rounded-2xl px-6 py-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[15px] font-bold text-white">Boshqa huquqiy hujjatlar</h3>
              <p className="mt-1 text-[12px] text-white/55">
                Foydalanish shartlari, cookie va xavfsizlik.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/${locale}/terms`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                <FileText size={12} weight="bold" />
                Shartlar
              </Link>
              <Link
                href={`/${locale}/cookies`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                Cookies
              </Link>
              <Link
                href={`/${locale}/security`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                <ShieldCheck size={12} weight="bold" />
                Xavfsizlik
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

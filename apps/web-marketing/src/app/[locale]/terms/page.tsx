import {
  ArrowRight,
  CalendarBlank,
  CheckCircle,
  ChatCircleDots,
  CurrencyCircleDollar,
  FileText,
  Gavel,
  Globe,
  Handshake,
  Info,
  Lock,
  Prohibit,
  ScalesIcon,
  ShieldCheck,
  Sparkle,
  UserCircle,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react/dist/ssr';
import type { Icon } from '@phosphor-icons/react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Foydalanish shartlari — MyPOS',
  description: "MyPOS xizmatidan foydalanish shartlari. Sizning huquqlaringiz va majburiyatlaringiz.",
};

const LAST_UPDATED = '2026-05-01';
const EFFECTIVE = '2026-05-01';
const VERSION = '3.2';

type Highlight = { Icon: Icon; tint: string; bg: string; title: string; body: string };

const HIGHLIGHTS: ReadonlyArray<Highlight> = [
  {
    Icon: Handshake, tint: 'text-[#5eead4]', bg: 'bg-[rgba(20,184,166,0.15)]',
    title: '14 kun bepul',
    body: "Karta kerak emas · Istalgan vaqtda bekor qilish · Hech qanday majburiyat",
  },
  {
    Icon: CurrencyCircleDollar, tint: 'text-emerald-400', bg: 'bg-emerald-500/15',
    title: "30 kun pul qaytarish",
    body: "Birinchi 30 kun ichida xohlasangiz — to'liq pul qaytariladi, savol berilmaydi",
  },
  {
    Icon: Lock, tint: 'text-amber-400', bg: 'bg-amber-500/15',
    title: "Yashirin to'lov yo'q",
    body: "Tarifda ko'rsatilgan narx — yakuniy narx. Hech qanday qo'shimcha komissiya yoki yashirin haq",
  },
  {
    Icon: ShieldCheck, tint: 'text-[#ff0037]', bg: 'bg-[rgba(255,0,55,0.15)]',
    title: '99.9% uptime kafolat',
    body: "Tizim ishlamasa — har soat uchun 1% pul qaytariladi. SLA aniq va o'lchanadigan",
  },
];

type Section = {
  id: string;
  Icon: Icon;
  title: string;
  intro?: string;
  items?: ReadonlyArray<{ label: string; body: string }>;
  bullets?: ReadonlyArray<string>;
  prohibited?: ReadonlyArray<string>;
  note?: string;
};

const SECTIONS: ReadonlyArray<Section> = [
  {
    id: 'acceptance',
    Icon: CheckCircle,
    title: '1. Shartlarni qabul qilish',
    intro: "MyPOS xizmatidan ro'yxatdan o'tib foydalanishni boshlaganingizda — ushbu shartlarga rozisiz deb hisoblanadi. Shartlarga rozi bo'lmasangiz, xizmatdan foydalanmang.",
    bullets: [
      "Siz 18 yoshdan katta va shartnoma tuzishga huquqlisiz",
      "O'zbekiston Respublikasi yoki Markaziy Osiyo davlatlaridan birida ro'yxatdan o'tgan tadbirkorsiz",
      "Yuboradigan barcha ma'lumotlar haqiqiy va to'liq",
      "Akkauntdan faqat siz va sizning xodimlaringiz foydalanadi",
    ],
  },
  {
    id: 'service',
    Icon: Sparkle,
    title: "2. Xizmatning ta'rifi",
    intro: "MyPOS — restoran, kafe, oshxona va boshqa ovqatlanish nuqtalari uchun cloud asosidagi POS (kassa) tizimidir.",
    items: [
      {
        label: "Asosiy funksiyalar",
        body: "Buyurtma qabul qilish, chek chiqarish, smena hisoboti, menyu va inventar boshqaruvi, xodimlar va smena rejasi, biznes tahlili.",
      },
      {
        label: "To'lov integratsiyasi",
        body: "Click, Payme, Uzcard, Visa/Mastercard va naqd to'lov. Har bir tranzaksiya — to'lov tizimining o'z qoidalariga bo'ysunadi.",
      },
      {
        label: "Yetkazib berish",
        body: "Cloud xizmat — internet orqali ishlaydi. Offline rejim 24 soatgacha mavjud. Avtomatik sinxronizatsiya.",
      },
    ],
  },
  {
    id: 'account',
    Icon: UserCircle,
    title: '3. Akkaunt va xavfsizlik',
    intro: "Akkauntingiz — sizning mas'uliyatingizdadir. Parol va kirish ma'lumotlarini xavfsiz saqlang.",
    bullets: [
      "Parolingizni hech kim bilan ulashmang",
      "Xodimlaringizga alohida hisoblar yarating (har biri uchun rol va ruxsat)",
      "Shubhali faollik sezsangiz darhol xabar bering: security@mypos.uz",
      "Sizning akkauntingiz orqali amalga oshirilgan barcha amallar uchun siz javobgar",
      "Akkauntni boshqalarga sotish yoki ijaraga berish — ta'qiqlanadi",
    ],
  },
  {
    id: 'pricing',
    Icon: CurrencyCircleDollar,
    title: "4. Narxlar va to'lov",
    intro: "MyPOS oyma-oy yoki yillik obuna asosida ishlaydi. Joriy tariflar — mypos.uz/pricing sahifasida.",
    items: [
      {
        label: "To'lov muddati",
        body: "Oylik tariflar — har oyning 1-sanasi · Yillik tariflar — har yilning birinchi kunidan. Karta yoki bank o'tkazmasi orqali.",
      },
      {
        label: "Narx o'zgarishi",
        body: "Yangi narxlar haqida 60 kun oldin email orqali xabar beramiz. Yangi narx faqat keyingi billing davridan boshlanadi.",
      },
      {
        label: "Tarif yangilash/pasaytirish",
        body: "Yangilash — darhol faollashadi, narx pro-rata hisoblanadi. Pasaytirish — keyingi davrdan.",
      },
      {
        label: "Pul qaytarish",
        body: "Birinchi 30 kun ichida — to'liq qaytariladi. Keyin — qo'llanilmagan davr uchun pro-rata.",
      },
    ],
    note: "Vaqtida to'lov qilinmasa — 14 kun grace period beriladi. Keyin akkaunt vaqtincha bloklanadi (ma'lumot saqlanadi).",
  },
  {
    id: 'usage',
    Icon: Globe,
    title: '5. Foydalanish qoidalari',
    intro: "MyPOS'ni qonuniy va halol biznes uchun foydalaning. Quyidagi amallar qat'iyan ta'qiqlanadi:",
    prohibited: [
      "Qonunga zid biznes faoliyati uchun foydalanish",
      "Spam yuborish, foydalanuvchilarni aldash, firibgarlik",
      "Tizimga noruxsat kirishga urinish, hack qilish",
      "Boshqa foydalanuvchilarga ziyon yetkazish",
      "MyPOS kodini reverse-engineer qilish yoki nusxalash",
      "Ma'lumotlarni mass-eksport qilish va sotish",
      "Bir akkauntdan bir nechta restoran boshqarish (har biri uchun alohida akkaunt)",
      "Avtomatik bot yoki skript bilan tizimni majburlash",
    ],
    note: "Qoidalarni buzganda — akkaunt darhol bloklanadi, pul qaytarilmaydi. Jiddiy holatlarda — huquq-tartibot organlariga murojaat qilamiz.",
  },
  {
    id: 'data',
    Icon: ShieldCheck,
    title: "6. Sizning ma'lumotlaringiz",
    intro: "Restoraningiz tarkibida yaratilgan barcha ma'lumotlar — menyu, buyurtmalar, hisobotlar, mijoz ma'lumotlari — SIZNING mulkingiz. MyPOS faqat xizmat ko'rsatish uchun foydalanadi.",
    bullets: [
      "Ma'lumotlaringizni istalgan vaqtda eksport qilishingiz mumkin (JSON yoki Excel)",
      "Akkaunt o'chirilganda — 90 kun ichida butunlay yo'q qilinadi",
      "MyPOS ma'lumotlaringizni reklamaga, marketingga yoki 3-tomonga sotmaydi",
      "Soliq idoralari rasmiy so'rov yuborgan taqdirda — qonun talabini bajaramiz",
    ],
    note: "To'liq ma'lumot: privacy siyosatimizda.",
  },
  {
    id: 'uptime',
    Icon: Sparkle,
    title: "7. SLA va xizmat kafolati",
    intro: "MyPOS 99.9% uptime'ga kafolat beradi. Bu yiliga maksimal 8 soat 45 daqiqa downtime degani.",
    items: [
      {
        label: "Ishlamay qolish",
        body: "Tizim ishlamagan har bir to'liq soat uchun — joriy oy narxidan 1% kompensatsiya. Maksimal 50%.",
      },
      {
        label: "Planli xizmat",
        body: "Yangilanish va texnik ishlar — Yakshanba 03:00–05:00 (Toshkent vaqti). Sizga 7 kun avval xabar beriladi. Bu downtime hisobiga kirmaydi.",
      },
      {
        label: "Force majeure",
        body: "Tabiiy ofat, urush, hukumat qarori, internet provayder uzilishi va boshqa MyPOS nazoratidan tashqaridagi holatlar SLA hisobiga kirmaydi.",
      },
    ],
  },
  {
    id: 'liability',
    Icon: ScalesIcon,
    title: "8. Mas'uliyat chegarasi",
    intro: "MyPOS o'z xizmatini iloji boricha mukammal ko'rsatishga harakat qiladi, ammo ba'zi cheklovlar mavjud:",
    bullets: [
      "Mas'uliyatimizning maksimal hajmi — oxirgi 12 oy ichida to'langan pulingiz miqdoridir",
      "Bilvosita zararlar (mijoz yo'qotish, foyda yo'qolishi) qoplanmaydi",
      "Sizning xato kiritgan ma'lumotlaringiz uchun javobgar emasmiz",
      "3-tomon xizmatlari (Click, Payme, soliq idoralari) muammosi uchun javobgar emasmiz",
      "Internet aloqasi muammolari MyPOS'ning mas'uliyatida emas",
    ],
  },
  {
    id: 'termination',
    Icon: XCircle,
    title: "9. Shartnomani bekor qilish",
    intro: "Siz yoki MyPOS shartnomani istalgan vaqtda bekor qila olasiz.",
    items: [
      {
        label: "Sizning huquqingiz",
        body: "Istalgan vaqtda 'Akkauntni o'chirish' tugmasini bosib bekor qilish mumkin. Hech qanday sabab kerak emas. Joriy davr oxirigacha xizmat ishlaydi.",
      },
      {
        label: "Bizning huquqimiz",
        body: "Quyidagi hollarda akkauntni bekor qilamiz: shartlarni buzish, to'lov 30+ kun kechikishi, qonunbuzarlik, boshqa foydalanuvchilarga zarar yetkazish.",
      },
      {
        label: "Ma'lumotlaringiz",
        body: "Bekor qilingandan keyin — 90 kun ichida ma'lumotlarni eksport qilish imkoniyati saqlanadi. Keyin butunlay o'chiriladi.",
      },
    ],
  },
  {
    id: 'changes',
    Icon: CalendarBlank,
    title: '10. Shartlardagi o\'zgarishlar',
    intro: "Ushbu shartlar vaqti-vaqti bilan yangilanishi mumkin. Har bir muhim o'zgarish haqida sizga email orqali 30 kun oldin xabar beramiz. Yangi versiya kuchga kirgandan keyin xizmatdan foydalanishni davom ettirsangiz — yangi shartlarga rozisiz deb hisoblanadi.",
  },
  {
    id: 'law',
    Icon: Gavel,
    title: '11. Qo\'llaniladigan qonun',
    intro: "Ushbu shartnoma O'zbekiston Respublikasi qonunlari asosida tartibga solinadi.",
    bullets: [
      "Barcha kelishmovchiliklar avval do'stona muzokaralar orqali hal qilinadi",
      "Hal qilinmagan holatlar — Toshkent shahar Iqtisodiy sudida ko'riladi",
      "Shartnoma tili — o'zbek (lotin). Tarjima nusxalari ma'lumot uchun",
    ],
  },
];

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[500px]" />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Gavel size={11} weight="fill" />
            HUQUQIY
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Foydalanish{' '}
            <span className="gradient-teal">shartlari</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            MyPOS xizmatidan foydalanish bo&apos;yicha siz va biz o&apos;rtasidagi rasmiy kelishuv. Aniq, oddiy va halol.
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
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/70">
              <FileText size={11} weight="bold" className="text-amber-400" />
              Versiya: <span className="tabular text-white font-semibold">v{VERSION}</span>
            </span>
          </div>
        </div>
      </section>

      {/* TL;DR / Highlights */}
      <section className="bg-[#001B1B] py-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card rounded-2xl p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <Info size={16} weight="bold" className="text-[#5eead4]" />
              </span>
              <div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#5eead4]">
                  Asosiy nuqtalar
                </div>
                <h2 className="text-[18px] font-extrabold tracking-tight text-white">
                  Hujjat uzun, lekin asosiy 4 narsa
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {HIGHLIGHTS.map((h) => (
                <article key={h.title} className="rounded-xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.02] p-4">
                  <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 ${h.bg}`}>
                    <h.Icon size={17} weight="bold" className={h.tint} />
                  </span>
                  <h3 className="mt-3 text-[13.5px] font-bold tracking-tight text-white">{h.title}</h3>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-white/60">{h.body}</p>
                </article>
              ))}
            </div>
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
                      <s.Icon size={13} weight="bold" className="text-[#5eead4]/70 shrink-0 group-hover:text-[#5eead4] transition-colors" />
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
                  <p className="mt-4 text-[13.5px] leading-relaxed text-white/75">
                    {s.intro}
                  </p>
                ) : null}

                {s.items ? (
                  <ul className="mt-4 space-y-3">
                    {s.items.map((it) => (
                      <li key={it.label} className="rounded-xl ring-1 ring-inset ring-white/[0.08] bg-white/[0.02] px-4 py-3">
                        <div className="text-[12.5px] font-bold text-white">
                          {it.label}
                        </div>
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
                        <CheckCircle size={14} weight="fill" className="mt-[3px] text-[#5eead4] shrink-0" />
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {s.prohibited ? (
                  <ul className="mt-4 space-y-2">
                    {s.prohibited.map((b) => (
                      <li key={b} className="flex items-start gap-2.5 text-[13px] text-white/75">
                        <Prohibit size={14} weight="bold" className="mt-[3px] text-[#ff0037] shrink-0" />
                        <span className="leading-relaxed">{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {s.note ? (
                  <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl ring-1 ring-inset ring-amber-500/25 bg-amber-500/8">
                    <WarningCircle size={14} weight="fill" className="mt-[3px] text-amber-400 shrink-0" />
                    <p className="text-[12px] leading-relaxed text-white/80">
                      {s.note}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact for questions */}
      <section className="bg-[#001B1B] py-12 sm:py-14">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card relative overflow-hidden rounded-2xl px-6 py-7 sm:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 100% 0%, rgba(20,184,166,0.18), transparent 50%)',
              }}
            />
            <div className="relative grid gap-5 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <Handshake size={24} weight="bold" className="text-[#5eead4]" />
              </span>
              <div>
                <h3 className="text-[17px] font-bold text-white">
                  Huquqiy savol bormi?
                </h3>
                <p className="mt-1 text-[12.5px] text-white/65">
                  Shartlar yoki shartnoma bo&apos;yicha tushunmovchilik bo&apos;lsa — huquqiy bo&apos;limimizga yozing.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="mailto:legal@mypos.uz"
                  className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold transition-colors"
                >
                  legal@mypos.uz
                  <ArrowRight size={12} weight="bold" />
                </a>
              </div>
            </div>
          </div>

          {/* Telegram strip */}
          <div className="glass-card mt-3 flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(38,165,228,0.15)]">
              <ChatCircleDots size={16} weight="bold" className="text-[#26A5E4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">Oddiy savol?</div>
              <div className="text-[11.5px] text-white/55">
                Telegramda yozing — texnik yordam jamoasi 5 daqiqada javob beradi.
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
                Maxfiylik siyosati, cookie va xavfsizlik kafolatlari.
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
                href={`/${locale}/cookies`}
                className="press inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
              >
                Cookies
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
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

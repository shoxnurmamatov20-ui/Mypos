import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  ChalkboardTeacher,
  ChatCircleDots,
  CreditCard,
  CurrencyCircleDollar,
  MagnifyingGlass,
  Plug,
  Question,
  Rocket,
  ShieldCheck,
  Sparkle,
  TelegramLogo,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'FAQ — MyPOS',
  description:
    "MyPOS bo'yicha eng ko'p so'raladigan savollar. Demo, narxlar, integratsiyalar, xavfsizlik va boshqalar.",
};

type Category = { slug: string; label: string; Icon: Icon; tint: string; bg: string };

const CATEGORIES: ReadonlyArray<Category> = [
  {
    slug: 'getting-started',
    label: 'Boshlash',
    Icon: Rocket,
    tint: 'text-[#5eead4]',
    bg: 'bg-[rgba(20,184,166,0.15)]',
  },
  {
    slug: 'pricing',
    label: 'Narxlar',
    Icon: CurrencyCircleDollar,
    tint: 'text-[#ff0037]',
    bg: 'bg-[rgba(255,0,55,0.15)]',
  },
  {
    slug: 'onboarding',
    label: 'Onboarding',
    Icon: ChalkboardTeacher,
    tint: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
  {
    slug: 'features',
    label: 'Xususiyatlar',
    Icon: Sparkle,
    tint: 'text-purple-400',
    bg: 'bg-purple-500/15',
  },
  {
    slug: 'payments',
    label: "To'lovlar",
    Icon: CreditCard,
    tint: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
  {
    slug: 'integrations',
    label: 'Integratsiyalar',
    Icon: Plug,
    tint: 'text-blue-400',
    bg: 'bg-blue-500/15',
  },
  {
    slug: 'security',
    label: 'Xavfsizlik',
    Icon: ShieldCheck,
    tint: 'text-rose-400',
    bg: 'bg-rose-500/15',
  },
  {
    slug: 'support',
    label: 'Yordam',
    Icon: ChatCircleDots,
    tint: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
  },
];

type Faq = { q: string; a: string };

const FAQS: Record<string, ReadonlyArray<Faq>> = {
  'getting-started': [
    {
      q: 'MyPOS nima va u qanday ishlaydi?',
      a: "MyPOS — bu restoran, kafe va boshqa ovqatlanish nuqtalari uchun cloud asosidagi POS (kassa) tizimi. U buyurtma qabul qilish, chek chiqarish, menyu boshqaruvi, inventar, xodimlar va biznes tahlili uchun barcha vositalarni o'z ichiga oladi.",
    },
    {
      q: "MyPOS bilan ishlashni qanday boshlasam bo'ladi?",
      a: "3 oddiy qadam: 1) Saytda ariza qoldiring yoki demo so'rang; 2) 30 daqiqalik onlayn demo o'tkazamiz; 3) Yoqtirsangiz — 14 kun bepul akkaunt yaratiladi va bizning mutaxassis 1-3 kun ichida sizni ishga tushiradi.",
    },
    {
      q: "Tajriba kerakmi yoki o'rganish qiyinmi?",
      a: "Mutlaqo yo'q. MyPOS interfeysi shunday loyihalanganki, ofitsiantlar 5-10 daqiqada o'rganadi. Bizning mutaxassis butun jamoangizni bepul o'qitadi.",
    },
    {
      q: "Kassa apparati yo'q — POS terminalni qayerdan olaman?",
      a: "Bizdan to'g'ridan-to'g'ri sotib olishingiz yoki ijara qilishingiz mumkin. Yoki o'zingizning iPad/iPhone'da ishlatishingiz mumkin — alohida qurilma kerak emas.",
    },
    {
      q: "Eski POS tizimimdan ma'lumotlarni o'tkaza olamanmi?",
      a: "Ha. Excel/CSV faylidan import qilishimiz mumkin yoki API orqali to'g'ridan-to'g'ri ko'chirib olamiz. Menyu, mijozlar, hisobotlar — barchasi ko'chiriladi.",
    },
  ],
  pricing: [
    {
      q: 'Tariflar qancha?',
      a: "Bepul (0 so'm — 1 kassa, 100 buyurtma/oy), Starter (199,000 so'm/oy — 2 kassa, cheksiz buyurtma), Pro (499,000 so'm/oy — 5 kassa + AI), Business (1,499,000 so'm/oy — cheksiz). Yillik to'lasangiz 2 oy bepul.",
    },
    {
      q: "Yashirin to'lovlar bormi?",
      a: "Yo'q. Tarifda ko'rsatilgan narx — yakuniy narx. Hech qanday qo'shimcha komissiya, ulanish puli yoki yashirin haq yo'q. To'lov tizimlari (Click/Payme) o'zlari komissiya oladi — bu MyPOS narxiga kirmaydi.",
    },
    {
      q: "14 kun tugagandan keyin nima bo'ladi?",
      a: "Hech narsa avtomatik to'lov olinmaydi. Sizdan tarifni tanlashingiz so'raladi. Tanlamasangiz — Bepul tarif faollashadi va asosiy funksiyalar ishlaydi.",
    },
    {
      q: 'Pul qaytarish bormi?',
      a: "Ha, birinchi 30 kun ichida — to'liq qaytariladi, savol berilmaydi. Keyin — qo'llanilmagan davr uchun pro-rata.",
    },
    {
      q: "Tarifni o'zgartirsam bo'ladimi?",
      a: 'Albatta. Yangilash darhol faollashadi, narx pro-rata hisoblanadi. Pasaytirish keyingi billing davridan boshlanadi.',
    },
  ],
  onboarding: [
    {
      q: 'Onboarding qancha vaqt oladi?',
      a: "O'rtacha 1-3 kun. Birinchi kun — menyu kiritish va kassa sozlash. Ikkinchi kun — xodimlarni o'qitish. Uchinchi kun — birinchi smena bizning kuzatuvimiz ostida.",
    },
    {
      q: 'Onboarding bepulmi?',
      a: 'Ha, butunlay bepul. Mutaxassisimiz sizning restoraningizga keladi (Toshkent + 11 viloyat) yoki onlayn yordam beradi.',
    },
    {
      q: 'Menyumda 500+ taom bor — qancha vaqt oladi?',
      a: "Excel/CSV fayli bilan 1 soatda import qilamiz. Surat va tavsiflarni alohida qo'shamiz — 1 kunda.",
    },
    {
      q: "Xodimlarni qanday o'qitasiz?",
      a: "Bir necha usul: 1) Mutaxassis joyga keladi va 2 soatlik trening o'tkazadi; 2) Video darslar (50+ ta video); 3) Telegram bot interaktiv treningi; 4) Sizning ofitsiantlaringizdan biri 'champion' bo'ladi va boshqalarni o'rgatadi.",
    },
  ],
  features: [
    {
      q: 'Qaysi xususiyatlar mavjud?',
      a: 'Asosiy: buyurtma, chek, smena, menyu, inventar, xodimlar, hisobotlar. Premium: AI menyu yordamchisi, talab bashorati, multi-filial, white-label, dedicated manager.',
    },
    {
      q: 'Offline ishlaydi mi?',
      a: "Ha. Internet uzilsa, kassa 24 soatgacha mustaqil ishlaydi. Internet qaytganda — avtomatik sinxronizatsiya bo'ladi.",
    },
    {
      q: "Ko'p tilli ishlaydi mi?",
      a: 'Ha — UZ (lotin va kirill), RU va EN. Menyu uchta tilga avtomatik tarjima qilinadi (AI yordamchisi orqali).',
    },
    {
      q: 'Mobil ilova bormi?',
      a: "Ha — iOS va Android uchun. Ofitsiantlar telefon orqali buyurtma qabul qiladi, oshpazlar oshxona ekranida buyurtmalarni ko'radi.",
    },
    {
      q: 'AI yordamchisi nima qiladi?',
      a: "Claude asosida 3 narsa: 1) Menyu tarjima (UZ/RU/EN 30 soniyada); 2) Narxlash takliflari — qaysi taomni qancha narxda sotish optimal; 3) Talab bashorati — keyingi hafta qancha ingredient kerak bo'lishini bashorat qiladi.",
    },
  ],
  payments: [
    {
      q: "Qaysi to'lov turlarini qabul qiladi?",
      a: "Click, Payme, Uzcard, Humo, Visa/Mastercard, naqd va bank o'tkazmasi. Hammasi MyPOS bilan integratsiyalashgan.",
    },
    {
      q: "To'lov tizimlari komissiyasi qancha?",
      a: "Click va Payme: 0.5-1.5% (sizning shartnomangizga bog'liq). Uzcard/Humo: 0.7-1%. MyPOS qo'shimcha komissiya olmaydi.",
    },
    {
      q: "QR kod orqali to'lov bormi?",
      a: "Ha. Mijoz Payme/Click ilovasida QR kodni skan qilib to'laydi. Pul real-time hisobingizga tushadi va fiskal chek avtomatik chiqadi.",
    },
    {
      q: "Naqd to'lov bilan ham ishlaydi mi?",
      a: "Albatta. Naqd to'lov uchun maxsus naqd sxema, qaytish, kassa balansi va Z-hisobot mavjud. Soliq qo'mitasiga avtomatik yuboriladi.",
    },
    {
      q: 'Pulni qaytarish — refund qanday?',
      a: 'Bir tugma bilan. Click/Payme refund avtomatik (mijoz kartasiga qaytadi). Naqd — kassadan beriladi, refund chek chiqariladi.',
    },
  ],
  integrations: [
    {
      q: 'Qaysi yetkazib berish xizmatlari bilan ishlaydi?',
      a: "Yandex Eats, Wolt, Uzum Tezkor, Express24 va MyBazar Food. Buyurtma POS'ga 5 soniyada tushadi, status real-time sinxron yangilanadi.",
    },
    {
      q: "Soliq qo'mitasi bilan integratsiya bormi?",
      a: "Ha, OFD orqali. Har bir chek avtomatik soliq idoralariga yuboriladi (MyTaxes). Hech narsa qo'shimcha qilish kerak emas.",
    },
    {
      q: 'Telegram bot bilan buyurtma qabul qila olamanmi?',
      a: "Ha. Mijoz Telegram bot orqali menyu ko'radi, buyurtma beradi, to'laydi (Click/Payme), va sizning ofitsiantlaringiz xabar oladi.",
    },
    {
      q: '1C bilan ishlaydimi?',
      a: "Ha, 1C: Buxgalteriya bilan 2 tomonlama sinxronizatsiya. Hisobotlar avtomatik o'tkaziladi.",
    },
    {
      q: 'Instagram menyu bilan integratsiya bormi?',
      a: "Ha. Sizning Instagram sahifangizda 'Buyurtma berish' tugmasi qo'shiladi — mijoz bevosita MyPOS'ga buyurtma yuboradi.",
    },
  ],
  security: [
    {
      q: "Ma'lumotlarim qayerda saqlanadi?",
      a: "Toshkentdagi UZCLOUD ma'lumot markazida. Zaxira nusxa Beeline DC'da. Ma'lumot hech qachon mamlakat tashqarisiga chiqmaydi.",
    },
    {
      q: "Ma'lumotlarim xavfsizmi?",
      a: 'Ha. TLS 1.3 shifrlash, AES-256 diskda, 2FA, IP whitelisting, 24/7 monitoring, har 6 soatda backup. Bank darajasidagi himoya.',
    },
    {
      q: "Xodimlarim faqat o'z bo'limini ko'rishi mumkinmi?",
      a: "Ha — RBAC orqali. Egasi, menejer, ofitsiant, oshpaz, hisobchi — har biri uchun alohida rol va ruxsat. Filial bo'yicha ham cheklash mumkin.",
    },
    {
      q: "MyPOS xodimlari mening ma'lumotimni ko'radimi?",
      a: "Faqat siz ruxsat bergan taqdirda va texnik muammoni hal qilish uchun. Har bir kirish log qilinadi va siz ko'rishingiz mumkin.",
    },
    {
      q: "Akkauntimni o'chirsam ma'lumotlar nima bo'ladi?",
      a: "90 kun ichida butunlay yo'q qilinadi. Avval — eksport qilish imkoniyati saqlanadi (JSON yoki Excel).",
    },
  ],
  support: [
    {
      q: 'Texnik yordam qachon ishlaydi?',
      a: "24/7. Telegramda o'rtacha javob 5 daqiqada, telefonda darhol, email orqali 4 soat ichida.",
    },
    {
      q: 'Qaysi tilda yordam beradi?',
      a: "O'zbek (lotin va kirill), rus va ingliz. Siz xohlagan tilda.",
    },
    {
      q: 'Yordam pulli mi?',
      a: "Yo'q, butunlay bepul. Hatto Bepul tarif uchun ham 24/7 yordam mavjud.",
    },
    {
      q: 'Tizim ishlamasa nima qilaman?',
      a: "1) status.mypos.uz tekshiring; 2) Telegram'ga yozing — darhol javob beramiz; 3) Offline rejim 24 soatgacha avtomatik faollashadi — kassa ishlay beradi.",
    },
  ],
};

const POPULAR_TAGS = [
  'Demo',
  'Click',
  'Payme',
  'Narxlar',
  'Onboarding',
  '14 kun bepul',
  'Telegram',
  'AI',
] as const;

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const totalQuestions = Object.values(FAQS).reduce((s, arr) => s + arr.length, 0);

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
            <Question size={11} weight="fill" />
            FAQ
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Eng ko&apos;p so&apos;raladigan <span className="gradient-teal">savollar</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            {totalQuestions}+ savol · 8 kategoriya · Javob topa olmasangiz — bizga yozing,
            qo&apos;shamiz.
          </p>

          {/* Search */}
          <form className="glass-card mx-auto mt-7 flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 max-w-[36rem]">
            <MagnifyingGlass size={18} weight="bold" className="text-white/50" />
            <input
              type="search"
              placeholder="Savolingizni yozing..."
              aria-label="FAQ qidirish"
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="submit"
              className="press inline-flex h-9 items-center gap-1.5 px-4 rounded-full bg-[#ff0037] hover:bg-[#e6002f] text-white text-[12.5px] font-bold transition-colors"
            >
              Qidirish
            </button>
          </form>

          {/* Popular tags */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 text-[11.5px]">
            <span className="text-white/40">Mashhur:</span>
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="press inline-flex h-7 items-center px-2.5 rounded-full border border-white/[0.10] bg-white/[0.04] text-white/70 hover:text-[#5eead4] hover:border-[#5eead4]/30 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="pb-6">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <a
                key={c.slug}
                href={`#${c.slug}`}
                className="glass-card glass-card-hover press group flex items-center gap-2.5 rounded-2xl p-3"
              >
                <span
                  className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 ${c.bg}`}
                >
                  <c.Icon size={15} weight="bold" className={c.tint} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-bold text-white truncate">{c.label}</div>
                  <div className="tabular text-[10.5px] text-white/45">
                    {(FAQS[c.slug] ?? []).length} ta
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ sections */}
      <section className="py-10">
        <div className="mx-auto max-w-3xl px-5 space-y-10">
          {CATEGORIES.map((c) => (
            <div key={c.slug} id={c.slug} className="scroll-mt-24">
              <div className="flex items-center gap-3 mb-5">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 ${c.bg}`}
                >
                  <c.Icon size={20} weight="bold" className={c.tint} />
                </span>
                <div>
                  <h2 className="text-[20px] sm:text-[22px] font-extrabold tracking-tight text-white">
                    {c.label}
                  </h2>
                  <p className="text-[11.5px] text-white/50 tabular">
                    {(FAQS[c.slug] ?? []).length} ta savol
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {(FAQS[c.slug] ?? []).map((f, idx) => (
                  <details
                    key={f.q}
                    className="glass-card rounded-2xl group"
                    open={idx === 0 && c.slug === 'getting-started'}
                  >
                    <summary className="press flex cursor-pointer items-center gap-3 px-5 py-4 list-none">
                      <span className="min-w-0 flex-1 text-[14px] font-bold text-white">{f.q}</span>
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-white/[0.05] text-white/70 group-open:bg-[#5eead4]/15 group-open:text-[#5eead4] group-open:ring-[#5eead4]/30 transition-colors">
                        <ArrowRight
                          size={11}
                          weight="bold"
                          className="group-open:rotate-90 transition-transform"
                        />
                      </span>
                    </summary>
                    <div className="px-5 pb-5 -mt-1 text-[13px] leading-relaxed text-white/70">
                      {f.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still need help */}
      <section className="py-14">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-10 sm:p-10 text-center">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 50% 0%, rgba(20,184,166,0.20), transparent 50%)',
              }}
            />
            <div className="relative">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
                <Question size={24} weight="bold" className="text-[#5eead4]" />
              </div>
              <h2 className="mt-5 text-[24px] sm:text-[28px] font-extrabold tracking-tight text-white">
                Javob topa olmadingizmi?
              </h2>
              <p className="mx-auto mt-2 max-w-[28rem] text-[13.5px] text-white/70">
                Bizning jamoa 24/7 ishlaydi. Telegram orqali 5 daqiqada javob beramiz.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <a
                  href="https://t.me/mypos_uz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-lg bg-[#26A5E4] hover:bg-[#1d8fc7] text-white text-[13.5px] font-bold transition-colors"
                >
                  <TelegramLogo size={14} weight="fill" />
                  Telegramda yozish
                </a>
                <Link
                  href={`/${locale}/contact`}
                  className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13.5px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
                >
                  Forma yuborish
                  <ArrowRight size={13} weight="bold" />
                </Link>
                <a
                  href="tel:+998712006060"
                  className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13.5px] font-bold hover:bg-white/[0.12] transition-colors tabular"
                >
                  +998 71 200 60 60
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

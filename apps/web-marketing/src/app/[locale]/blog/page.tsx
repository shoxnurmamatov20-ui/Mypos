import type { Icon } from '@phosphor-icons/react';
import {
  ArrowRight,
  BookmarkSimple,
  CalendarBlank,
  ChartLineUp,
  ChatCircleDots,
  Clock,
  Coffee,
  CurrencyCircleDollar,
  EnvelopeSimple,
  Eye,
  FileText,
  Lightbulb,
  MagnifyingGlass,
  Package,
  PenNib,
  Sparkle,
  Storefront,
  TrendUp,
  Users,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: 'Blog — MyPOS',
  description:
    'Restoran biznesi, texnologiya va MyPOS yangiliklari. Markaziy Osiyo restoran egasiga maxsus.',
};

type Category = { slug: string; label: string; Icon: Icon; tint: string; bg: string };

const CATEGORIES: ReadonlyArray<Category> = [
  {
    slug: 'all',
    label: 'Hammasi',
    Icon: Sparkle,
    tint: 'text-[#5eead4]',
    bg: 'bg-[rgba(20,184,166,0.15)]',
  },
  {
    slug: 'business',
    label: 'Biznes',
    Icon: ChartLineUp,
    tint: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
  {
    slug: 'tech',
    label: 'Texnologiya',
    Icon: Lightbulb,
    tint: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
  {
    slug: 'operations',
    label: 'Operatsiya',
    Icon: Storefront,
    tint: 'text-blue-400',
    bg: 'bg-blue-500/15',
  },
  {
    slug: 'marketing',
    label: 'Marketing',
    Icon: TrendUp,
    tint: 'text-purple-400',
    bg: 'bg-purple-500/15',
  },
  {
    slug: 'finance',
    label: 'Moliya',
    Icon: CurrencyCircleDollar,
    tint: 'text-[#ff0037]',
    bg: 'bg-[rgba(255,0,55,0.15)]',
  },
  {
    slug: 'product',
    label: 'Mahsulot',
    Icon: Package,
    tint: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
  },
] as const;

type Post = {
  slug: string;
  title: string;
  excerpt: string;
  category: Exclude<Category['slug'], 'all'>;
  author: string;
  date: string;
  minutes: number;
  views: string;
  Icon: Icon;
  accent: string;
  featured?: boolean;
};

const POSTS: ReadonlyArray<Post> = [
  {
    slug: 'restoran-foyda-2026',
    title: 'Restoraningiz foydasini 30% oshirishning 7 ta isbotlangan usuli',
    excerpt:
      "Markaziy Osiyodagi 500+ restoran ma'lumotlari asosida — qaysi taktikalar haqiqatan ishlaydi va qaysi biri vaqt isrofi. Real raqamlar, real misollar.",
    category: 'business',
    author: 'Aziz Rahmonov',
    date: '2026-05-08',
    minutes: 12,
    views: '8.4K',
    Icon: ChartLineUp,
    accent: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
    featured: true,
  },
  {
    slug: 'menyu-narxlash-strategiya',
    title: 'Menyu narxlash: foydani 22% oshirgan psixologik 5 ta usul',
    excerpt:
      "Mijoz qanday narxni 'arzon' deb hisoblaydi? 9-effekt, anchor narx, 'choy menyusi' va boshqa Toshkent restoranlarida sinab ko'rilgan taktikalar.",
    category: 'business',
    author: 'Madina Yusupova',
    date: '2026-05-05',
    minutes: 9,
    views: '12.1K',
    Icon: ChartLineUp,
    accent: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  },
  {
    slug: 'kassa-balansi-yopilmaydi',
    title: 'Kassa balansi kechqurun mos kelmasa: 7 ta sabab va yechim',
    excerpt:
      "Eng ko'p uchraydigan muammo. Ofitsiant xatosi, qaytarish, dilling, hisobotda yo'qotish — har birini qanday topish va oldini olish.",
    category: 'operations',
    author: 'Jamshid Tursunov',
    date: '2026-05-02',
    minutes: 8,
    views: '6.2K',
    Icon: Coffee,
    accent: 'from-blue-500/30 via-blue-500/10 to-transparent',
  },
  {
    slug: 'osh-markazi-keys',
    title: 'Osh Markazi: kunlik 800 tovuq somsadan startup gacha',
    excerpt:
      "Toshkentdagi mashhur osh markazi qanday qilib POS'ga o'tdi va 6 oyda oborotini 2.5 baravar oshirdi.",
    category: 'business',
    author: 'Dilnoza Sodiqova',
    date: '2026-04-28',
    minutes: 14,
    views: '15.3K',
    Icon: Coffee,
    accent: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  },
  {
    slug: 'smena-yopish-checklist',
    title: "Smena yopish checklisti: 12 ta nuqta hech narsa o'tkazib yubormaslik uchun",
    excerpt:
      'Z-hisobotdan kassa balansigacha — har kuni 5 daqiqada bajaring va xatolarni minimal qiling.',
    category: 'operations',
    author: 'Jamshid Tursunov',
    date: '2026-04-24',
    minutes: 5,
    views: '4.8K',
    Icon: Storefront,
    accent: 'from-blue-500/30 via-blue-500/10 to-transparent',
  },
  {
    slug: 'instagram-restoran-marketing',
    title: 'Instagram orqali restoraningizga kuniga 50+ mijoz olib kelish',
    excerpt:
      'Toshkent restoranlarida ishlagan 5 ta haqiqiy strategiya — kontent, reels, geotag va influencer hamkorligi.',
    category: 'marketing',
    author: 'Madina Yusupova',
    date: '2026-04-20',
    minutes: 10,
    views: '9.7K',
    Icon: TrendUp,
    accent: 'from-purple-500/30 via-purple-500/10 to-transparent',
  },
  {
    slug: 'inventar-ish-tortish',
    title: 'Inventar ish tortish — 30% chiqimni qanday kamaytirdik',
    excerpt:
      "Mishuck (ingredient yo'qotish) restoran foydasini yeydi. Bizning yangi inventar moduli buni qanday hal qiladi.",
    category: 'operations',
    author: 'Bobur Ergashev',
    date: '2026-04-15',
    minutes: 9,
    views: '5.6K',
    Icon: Package,
    accent: 'from-blue-500/30 via-blue-500/10 to-transparent',
  },
  {
    slug: 'soliq-2026-restoranlar',
    title: '2026 yilgi yangi soliq qoidalari: restoran egasi nimani bilishi kerak',
    excerpt:
      "QQS, daromad solig'i va kassa apparati talablari — hisobchi va yurist bilan tayyorlangan to'liq tahlil.",
    category: 'finance',
    author: 'Nodira Karimova',
    date: '2026-04-10',
    minutes: 11,
    views: '7.2K',
    Icon: CurrencyCircleDollar,
    accent: 'from-rose-500/30 via-rose-500/10 to-transparent',
  },
  {
    slug: 'xodimlar-motivatsiya',
    title: 'Ofitsiantlar kadr almashinuvini 70% kamaytirgan 4 ta yondashuv',
    excerpt:
      "Markaziy Osiyoda restoranlar uchun eng yirik muammo — kadr aylanmasi. Real ish tajribasidan o'rganamiz.",
    category: 'business',
    author: 'Aziz Rahmonov',
    date: '2026-04-05',
    minutes: 8,
    views: '11.4K',
    Icon: Users,
    accent: 'from-emerald-500/30 via-emerald-500/10 to-transparent',
  },
];

const FEATURED = POSTS.find((p) => p.featured) ?? POSTS[0]!;
const REGULAR = POSTS.filter((p) => p !== FEATURED);

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c])) as Record<
  string,
  Category
>;

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const featuredCat = CATEGORY_MAP[FEATURED.category]!;

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
            <PenNib size={11} weight="fill" />
            BLOG
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            Restoran egasining <span className="gradient-teal">qo&apos;llanmasi</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            Markaziy Osiyodagi 500+ restoran tajribasi · Biznes maslahatlari · Texnologiya
            yangiliklari · Real raqamlar.
          </p>

          {/* Search */}
          <form className="glass-card mx-auto mt-8 flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 max-w-[36rem]">
            <MagnifyingGlass size={18} weight="bold" className="text-white/50" aria-hidden="true" />
            <input
              type="search"
              placeholder='Misol: "instagram marketing", "smena yopish"...'
              aria-label="Blog bo'yicha qidirish"
              className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="submit"
              className="press inline-flex h-9 items-center gap-1.5 px-4 rounded-full bg-[#ff0037] hover:bg-[#e6002f] text-white text-[12.5px] font-bold transition-colors"
            >
              Qidirish
            </button>
          </form>
        </div>
      </section>

      {/* Category filter chips */}
      <section className="bg-[#001B1B] pb-6">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                className={`press inline-flex h-8 items-center gap-1.5 px-3 rounded-full text-[12px] font-semibold transition-colors ${
                  c.slug === 'all'
                    ? 'bg-white text-[#001B1B]'
                    : 'border border-white/[0.10] bg-white/[0.04] text-white/70 hover:text-white hover:border-white/25'
                }`}
              >
                <c.Icon size={12} weight="bold" className={c.slug === 'all' ? '' : c.tint} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured post */}
      <section className="bg-[#001B1B] py-10">
        <div className="mx-auto max-w-5xl px-5">
          <Link
            href={`/${locale}/blog/${FEATURED.slug}`}
            className="glass-card glass-card-hover press group relative overflow-hidden rounded-3xl grid gap-6 lg:gap-10 lg:grid-cols-5 p-6 sm:p-8"
          >
            {/* Cover */}
            <div
              className={`relative lg:col-span-2 aspect-[4/3] lg:aspect-auto rounded-2xl overflow-hidden ring-1 ring-inset ring-white/10 bg-gradient-to-br ${FEATURED.accent}`}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <FEATURED.Icon size={88} weight="duotone" className="text-white/85" />
              </div>
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#ff0037] text-white text-[10px] font-bold uppercase tracking-[0.08em]">
                <Sparkle size={10} weight="fill" />
                Tavsiya
              </span>
            </div>

            {/* Body */}
            <div className="lg:col-span-3 flex flex-col">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.08em]">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 ring-inset ring-white/10 ${featuredCat.bg} ${featuredCat.tint}`}
                >
                  <featuredCat.Icon size={11} weight="bold" />
                  {featuredCat.label}
                </span>
                <span className="text-white/40">·</span>
                <span className="inline-flex items-center gap-1 text-white/55">
                  <CalendarBlank size={11} weight="bold" />
                  {fmtDate(FEATURED.date)}
                </span>
              </div>
              <h2 className="mt-3 text-[24px] sm:text-[32px] font-extrabold tracking-tight text-white leading-[1.15]">
                {FEATURED.title}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-white/70">{FEATURED.excerpt}</p>

              <div className="mt-auto pt-5 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-[rgba(20,184,166,0.18)] text-[#5eead4] text-[11px] font-bold">
                    {FEATURED.author
                      .split(' ')
                      .map((s) => s[0])
                      .join('')
                      .slice(0, 2)}
                  </span>
                  <div className="leading-tight">
                    <div className="font-semibold text-white">{FEATURED.author}</div>
                    <div className="text-white/45 text-[11px]">Bosh muharrir</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-white/55">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={11} weight="bold" />
                    {FEATURED.minutes} daq.
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye size={11} weight="bold" />
                    {FEATURED.views}
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-bold text-[#5eead4] group-hover:translate-x-0.5 transition-transform">
                    O&apos;qish
                    <ArrowRight size={11} weight="bold" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Posts grid */}
      <section className="bg-[#001B1B] py-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
                Eng so&apos;nggi
              </p>
              <h2 className="mt-1.5 text-[22px] sm:text-[26px] font-extrabold tracking-tight text-white">
                Barcha maqolalar
              </h2>
            </div>
            <span className="text-[12px] text-white/55 tabular">{POSTS.length} ta maqola</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {REGULAR.map((p) => {
              const cat = CATEGORY_MAP[p.category];
              if (!cat) return null;
              return (
                <Link
                  key={p.slug}
                  href={`/${locale}/blog/${p.slug}`}
                  className="glass-card glass-card-hover press group flex flex-col overflow-hidden rounded-2xl"
                >
                  {/* Cover */}
                  <div
                    className={`relative aspect-[16/9] bg-gradient-to-br ${p.accent} ring-1 ring-inset ring-white/10`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p.Icon size={56} weight="duotone" className="text-white/80" />
                    </div>
                    <span
                      className={`absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ring-1 ring-inset ring-white/10 text-[10px] font-bold uppercase tracking-[0.06em] backdrop-blur-md ${cat.bg} ${cat.tint}`}
                    >
                      <cat.Icon size={10} weight="bold" />
                      {cat.label}
                    </span>
                    <button
                      type="button"
                      aria-label="Saqlash"
                      className="absolute top-2.5 right-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-inset ring-white/15 bg-[rgba(0,16,16,0.55)] backdrop-blur-md text-white/70 hover:text-[#5eead4] transition-colors"
                    >
                      <BookmarkSimple size={13} weight="bold" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="flex flex-1 flex-col px-5 py-4">
                    <h3 className="text-[15px] font-bold tracking-tight text-white leading-snug line-clamp-2">
                      {p.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-white/65 line-clamp-2">
                      {p.excerpt}
                    </p>

                    <div className="mt-auto pt-4 flex items-center justify-between text-[11px] text-white/55">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarBlank size={11} weight="bold" />
                        {fmtDate(p.date)}
                      </span>
                      <span className="inline-flex items-center gap-2.5">
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} weight="bold" />
                          {p.minutes}d
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye size={11} weight="bold" />
                          {p.views}
                        </span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Load more */}
          <div className="mt-10 text-center">
            <button
              type="button"
              className="press inline-flex h-11 items-center gap-1.5 px-5 rounded-full border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors"
            >
              <FileText size={14} weight="bold" />
              Yana yuklash
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-[#001B1B] py-14 sm:py-18">
        <div className="mx-auto max-w-3xl px-5">
          <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-10 sm:px-10 sm:py-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(circle at 80% 0%, rgba(255,0,55,0.18), transparent 50%), radial-gradient(circle at 0% 100%, rgba(20,184,166,0.20), transparent 50%)',
              }}
            />
            <div className="relative grid gap-6 md:grid-cols-5 md:items-center">
              <div className="md:col-span-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)]">
                  <EnvelopeSimple size={20} weight="bold" className="text-[#ff0037]" />
                </div>
                <h2 className="mt-4 text-[22px] sm:text-[28px] font-extrabold tracking-tight text-white leading-[1.15]">
                  Haftalik newsletter
                </h2>
                <p className="mt-2 text-[13.5px] leading-relaxed text-white/70">
                  Har juma — yangi maqolalar, restoran biznesi statistikasi va MyPOS yangiliklari.{' '}
                  <span className="text-white">10,000+</span> restoran egasi obuna.
                </p>
              </div>

              <form className="md:col-span-2 flex flex-col gap-2">
                <input
                  type="email"
                  placeholder="email@kompaniya.uz"
                  aria-label="Email"
                  className="h-11 px-3.5 rounded-lg bg-white/[0.06] border border-white/15 text-white text-[13px] placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
                />
                <button
                  type="submit"
                  className="press inline-flex h-11 items-center justify-center gap-1.5 px-4 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
                >
                  Obuna bo&apos;lish
                  <ArrowRight size={12} weight="bold" />
                </button>
                <p className="text-[10.5px] text-white/45 text-center">
                  Spam yo&apos;q · Istalgan vaqtda bekor qiling
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Authors strip */}
      <section className="bg-[#001B1B] py-10">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card flex flex-wrap items-center gap-3 rounded-2xl px-5 py-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ring-white/10 bg-[rgba(20,184,166,0.15)]">
              <ChatCircleDots size={16} weight="bold" className="text-[#5eead4]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-white">
                Mehmon muallif bo&apos;lasizmi?
              </div>
              <div className="text-[11.5px] text-white/55">
                Restoran biznesi haqida yozasizmi? Maqola yuboring — auditoriyamiz 50K+.
              </div>
            </div>
            <Link
              href={`/${locale}/contact`}
              className="press inline-flex h-9 items-center gap-1 px-3.5 rounded-lg border border-white/15 bg-white/[0.06] text-white text-[12px] font-bold hover:bg-white/[0.12] transition-colors"
            >
              <PenNib size={12} weight="bold" />
              Yuborish
            </Link>
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

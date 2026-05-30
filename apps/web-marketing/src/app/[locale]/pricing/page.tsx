import {
  ArrowRight,
  Briefcase,
  Check,
  Lightning,
  Minus,
  Sparkle,
  X as XIcon,
} from '@phosphor-icons/react/dist/ssr';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CtaSection } from '@/components/landing/cta-section';
import { PricingTable } from '@/components/landing/pricing-table';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing_page' });
  return { title: t('title'), description: t('subtitle') };
}

/** Feature × plan availability — true / false / 'limited'. */
type Cell = boolean | 'limited';
const FEATURES: ReadonlyArray<{ key: string; label: string; free: Cell; starter: Cell; pro: Cell; business: Cell }> = [
  { key: 'pos',           label: 'POS terminal',          free: true,       starter: true,  pro: true,  business: true  },
  { key: 'kds',           label: 'KDS oshxona ekrani',    free: false,      starter: true,  pro: true,  business: true  },
  { key: 'qr',            label: 'QR menyu',              free: false,      starter: false, pro: true,  business: true  },
  { key: 'tg',            label: 'Telegram bot',          free: false,      starter: false, pro: true,  business: true  },
  { key: 'inv',           label: 'Inventar boshqaruvi',   free: false,      starter: 'limited', pro: true, business: true },
  { key: 'loyalty',       label: 'Loyallik dasturi',      free: false,      starter: false, pro: true,  business: true  },
  { key: 'multi',         label: 'Ko\'p filial',          free: false,      starter: false, pro: 'limited', business: true },
  { key: 'ai',            label: 'AI yordamchi',          free: false,      starter: false, pro: false, business: true  },
  { key: 'api',           label: 'API kirish',            free: false,      starter: false, pro: false, business: true  },
  { key: 'support',       label: '24/7 ustuvor qo\'llab', free: false,      starter: false, pro: true,  business: true  },
  { key: 'click',         label: 'Click va Payme',        free: true,       starter: true,  pro: true,  business: true  },
  { key: 'report',        label: 'Hisobotlar',            free: 'limited', starter: true,  pro: true,  business: true  },
];

const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  { q: 'Bepul trial qancha davom etadi?',       a: '14 kun to\'liq imkoniyatlar bilan. Kredit karta kerak emas.' },
  { q: 'Tarifni o\'zgartirib bo\'ladimi?',      a: 'Ha — istalgan vaqtda yuqori yoki past tarifga o\'tasiz. Pro-rata hisobi qilinadi.' },
  { q: 'Qaysi to\'lov usullari qabul qilinadi?', a: 'Click, Payme, Uzcard, Humo va Visa/Mastercard. Yuridik shaxslar uchun bank o\'tkazmasi.' },
  { q: 'Yashirin to\'lovlar bormi?',            a: 'Yo\'q. Yulduz bilan belgilangan barcha narxlar yakuniy. SMS, eksport va to\'lov komissiyalari shaffof.' },
  { q: 'Internet uzilsa qanday ishlaydi?',      a: 'POS terminal offline rejimda ishlay oladi. Internet qaytganda ma\'lumotlar avtomatik sinxronlanadi.' },
  { q: 'Mavjud Excel/1C ma\'lumotlarimni ko\'chiramanmi?', a: 'Ha. Excel/CSV importi mavjud, 1C uchun maxsus migration utility. Demo qo\'ng\'irog\'ida yordam beramiz.' },
  { q: 'Restoran necha xodim bilan ishlashi mumkin?', a: 'Tarifga qarab: Free 2, Starter 10, Pro 30, Business 100. Cheksiz xodim — Korxonaviy tarif.' },
  { q: 'Bekor qilsam ma\'lumotlar yo\'qoladimi?', a: 'Yo\'q. 90 kun davomida to\'liq eksport qilish mumkin. CSV, JSON yoki PDF formatda yuklab oling.' },
];

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'pricing_page' });

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#001B1B]">
        <div
          aria-hidden="true"
          className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[450px]"
        />
        <div className="relative mx-auto max-w-3xl px-5 pt-20 sm:pt-24 pb-10 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[rgba(15,118,110,0.25)] bg-[rgba(15,118,110,0.10)] text-[#5eead4] text-[11px] font-bold uppercase tracking-[0.08em]">
            <Sparkle size={11} weight="fill" />
            NARXLAR
          </span>
          <h1 className="mt-5 text-[36px] sm:text-[48px] lg:text-[56px] font-extrabold leading-[1.05] tracking-tight text-white">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-[36rem] text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            {t('subtitle')}
          </p>

          {/* Quick highlight chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-[12px] text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Check size={12} weight="bold" className="text-emerald-400" />
              14 kun bepul
            </span>
            <span className="text-white/30">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={12} weight="bold" className="text-emerald-400" />
              Karta talab qilinmaydi
            </span>
            <span className="text-white/30">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Check size={12} weight="bold" className="text-emerald-400" />
              Istalgan vaqtda bekor qilish
            </span>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <PricingTable />

      {/* Enterprise banner */}
      <section className="bg-[#001B1B] pt-4 pb-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="glass-card flex flex-col gap-5 rounded-2xl px-6 py-7 sm:px-10 sm:py-9 sm:flex-row sm:items-center">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset ring-white/10 bg-[rgba(255,0,55,0.15)]">
              <Briefcase size={26} weight="duotone" className="text-[#ff0037]" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] sm:text-[20px] font-extrabold tracking-tight text-white">
                Korxonaviy — katta tarmoqlar uchun
              </h3>
              <p className="mt-1.5 text-[13.5px] text-white/70 leading-relaxed">
                10+ filial · cheksiz xodim · SLA · maxsus integratsiya va dedicated account manager.
              </p>
            </div>
            <Link
              href={`/${locale}/contact`}
              className="press inline-flex h-10 items-center gap-1.5 px-4 rounded-lg bg-white text-[#001B1B] text-[13px] font-bold hover:bg-white/90 transition-colors shrink-0"
            >
              Bizga murojaat
              <ArrowRight size={13} weight="bold" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature comparison table */}
      <section className="bg-[#001B1B] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Taqqoslash
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              Tariflar bo&apos;yicha to&apos;liq taqqoslash
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              Har bir tarifda nimalar bor — bir qarashda ko&apos;ring.
            </p>
          </div>

          <div className="glass-card mt-10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-[13px]">
                <thead className="bg-white/[0.04] border-b border-white/[0.08]">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-[0.05em] text-white/60">
                      Xususiyat
                    </th>
                    <th className="px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.05em] text-white/60">
                      Free
                    </th>
                    <th className="px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.05em] text-white/60">
                      Starter
                    </th>
                    <th className="px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.05em] text-[#ff0037] bg-[rgba(255,0,55,0.08)]">
                      Pro ★
                    </th>
                    <th className="px-3 py-3.5 text-center text-[11px] font-bold uppercase tracking-[0.05em] text-white/60">
                      Business
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {FEATURES.map((row) => (
                    <tr key={row.key} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white font-medium">{row.label}</td>
                      <CellTd value={row.free} />
                      <CellTd value={row.starter} />
                      <CellTd value={row.pro} featured />
                      <CellTd value={row.business} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-[11px] text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Check size={12} weight="bold" className="text-emerald-400" />
              Mavjud
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Minus size={12} weight="bold" className="text-amber-400" />
              Cheklangan
            </span>
            <span className="inline-flex items-center gap-1.5">
              <XIcon size={12} weight="bold" className="text-white/40" />
              Yo&apos;q
            </span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#001B1B] py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-5">
          <div className="text-center">
            <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
              Tez-tez beriladigan savollar
            </p>
            <h2 className="mt-3 text-[28px] sm:text-[36px] font-extrabold tracking-tight text-white">
              FAQ
            </h2>
            <p className="mt-3 text-[14px] text-white/70">
              Eng ko&apos;p so&apos;raladigan savollar va aniq javoblar.
            </p>
          </div>

          <div className="mt-10 space-y-2.5">
            {FAQ.map((item, i) => (
              <details
                key={item.q}
                className="glass-card group rounded-xl px-5 py-4 cursor-pointer"
                open={i === 0}
              >
                <summary className="flex items-center justify-between gap-4 list-none">
                  <span className="text-[14px] font-bold text-white">{item.q}</span>
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/70 group-open:bg-[#ff0037] group-open:text-white transition-colors">
                    <Lightning
                      size={12}
                      weight="bold"
                      className="group-open:rotate-180 transition-transform"
                    />
                  </span>
                </summary>
                <p className="mt-3 text-[13.5px] leading-relaxed text-white/70">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <CtaSection />
    </main>
  );
}

function CellTd({ value, featured = false }: { value: Cell; featured?: boolean }) {
  return (
    <td
      className={
        featured
          ? 'px-3 py-3 text-center bg-[rgba(255,0,55,0.04)]'
          : 'px-3 py-3 text-center'
      }
    >
      {value === true ? (
        <Check size={16} weight="bold" className="inline text-emerald-400" aria-label="Mavjud" />
      ) : value === 'limited' ? (
        <Minus size={16} weight="bold" className="inline text-amber-400" aria-label="Cheklangan" />
      ) : (
        <XIcon size={16} weight="bold" className="inline text-white/30" aria-label="Yo'q" />
      )}
    </td>
  );
}

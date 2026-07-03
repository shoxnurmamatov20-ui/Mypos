import {
  ChartLine,
  ChatTeardropText,
  CreditCard,
  Desktop,
  Monitor,
  QrCode,
} from '@phosphor-icons/react/dist/ssr';
import { useTranslations } from 'next-intl';

const FEATURES = [
  {
    key: 'pos',
    Icon: Desktop,
    ring: 'ring-[rgba(20,184,166,0.30)]',
    bg: 'bg-[rgba(20,184,166,0.15)]',
    color: 'text-[#14b8a6]',
  },
  {
    key: 'kds',
    Icon: Monitor,
    ring: 'ring-blue-400/30',
    bg: 'bg-blue-500/10',
    color: 'text-blue-400',
  },
  {
    key: 'qr_menu',
    Icon: QrCode,
    ring: 'ring-emerald-400/30',
    bg: 'bg-emerald-500/10',
    color: 'text-emerald-400',
  },
  {
    key: 'analytics',
    Icon: ChartLine,
    ring: 'ring-amber-400/30',
    bg: 'bg-amber-500/10',
    color: 'text-amber-400',
  },
  {
    key: 'ai',
    Icon: ChatTeardropText,
    ring: 'ring-purple-400/30',
    bg: 'bg-purple-500/10',
    color: 'text-purple-400',
  },
  {
    key: 'telegram',
    Icon: CreditCard,
    ring: 'ring-cyan-400/30',
    bg: 'bg-cyan-500/10',
    color: 'text-cyan-400',
  },
] as const;

/** Always-dark feature grid section on the deep teal canvas. */
export function FeaturesGrid() {
  const t = useTranslations('features');

  return (
    <section id="features" className="bg-[#001B1B] py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.10em] text-[#5eead4]">
            {t('section_label')}
          </p>
          <h2 className="mt-3 text-[28px] sm:text-[40px] font-extrabold leading-tight tracking-tight text-white">
            {t('title')}
          </h2>
          <p className="mt-3 text-[15px] sm:text-[16px] leading-relaxed text-white/70">
            {t('subtitle')}
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ key, Icon, ring, bg, color }) => (
            <div
              key={key}
              className="glass-card glass-card-hover group rounded-2xl p-6 transition-colors"
            >
              <div
                className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1 ring-inset ${ring} ${bg}`}
              >
                <Icon size={22} weight="bold" className={color} />
              </div>
              <h3 className="mt-5 text-[17px] font-bold tracking-tight text-white">
                {t(`items.${key}.title`)}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                {t(`items.${key}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

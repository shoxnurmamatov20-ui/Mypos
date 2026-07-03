import { CheckCircle } from '@phosphor-icons/react/dist/ssr';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

const PLANS = ['free', 'starter', 'pro', 'business'] as const;

/** 4-plan pricing on the base-tier deep-teal canvas. */
export function PricingTable() {
  const t = useTranslations('pricing');
  const locale = useLocale();

  return (
    <section className="bg-[#001B1B] py-20 sm:py-24">
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

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const featured = plan === 'pro';
            const features = t.raw(`plans.${plan}.features`) as string[];

            return (
              <div
                key={plan}
                className={
                  featured
                    ? 'glass-card relative flex h-full flex-col rounded-2xl p-6 ring-2 ring-[#ff0037] shadow-[0_20px_50px_-20px_rgba(255,0,55,0.55)] lg:-my-3 lg:scale-[1.02]'
                    : 'glass-card relative flex h-full flex-col rounded-2xl p-6'
                }
              >
                {featured ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center px-2.5 py-1 rounded-full bg-[#ff0037] text-white text-[10px] font-extrabold uppercase tracking-[0.08em] shadow-[0_4px_12px_-2px_rgba(255,0,55,0.50)]">
                    {t('most_popular')}
                  </span>
                ) : null}

                <h3 className="text-[18px] font-extrabold text-white">{t(`plans.${plan}.name`)}</h3>
                <p className="mt-1 text-[12.5px] text-white/60">{t(`plans.${plan}.tagline`)}</p>

                <div className="mt-4 flex items-baseline">
                  <span className="tabular text-[36px] font-extrabold leading-none text-white">
                    {t(`plans.${plan}.price_usd`)}
                  </span>
                  <span className="ml-1.5 text-[12px] text-white/60">{t('per_month')}</span>
                </div>

                <ul className="mt-5 flex-1 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        weight="fill"
                        className={
                          featured
                            ? 'mt-0.5 shrink-0 text-[#5eead4]'
                            : 'mt-0.5 shrink-0 text-emerald-400'
                        }
                      />
                      <span className="text-[13.5px] leading-relaxed text-white/90">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/${locale}/get-started`}
                  className={
                    featured
                      ? 'press mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[13px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors'
                      : 'press mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-white/15 bg-white/[0.06] text-white text-[13px] font-bold hover:bg-white/[0.12] transition-colors'
                  }
                >
                  {t('cta')}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

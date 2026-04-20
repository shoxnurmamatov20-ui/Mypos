import { ArrowRight, PlayCircle, Sparkles, TrendingUp, Users2 } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

export function Hero() {
  const t = useTranslations('hero');
  const locale = useLocale();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-mint-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
      >
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-mint-200/50 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:py-24">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-1.5 text-xs font-semibold text-brand-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {t('badge')}
          </span>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            {t('subtitle')}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/contact`}
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-600 hover:shadow-xl"
            >
              {t('cta_primary')}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
            <Link
              href={`/${locale}/features`}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-semibold text-neutral-800 transition hover:border-brand-300 hover:text-brand-700"
            >
              <PlayCircle className="h-4 w-4" aria-hidden="true" />
              {t('cta_secondary')}
            </Link>
          </div>

          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-neutral-200/80 pt-6">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {t('stats.restaurants')}
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 font-display text-2xl font-bold text-neutral-900">
                <Users2 className="h-5 w-5 text-brand-500" aria-hidden="true" />
                500+
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {t('stats.orders')}
              </dt>
              <dd className="mt-1 flex items-center gap-1.5 font-display text-2xl font-bold text-neutral-900">
                <TrendingUp className="h-5 w-5 text-mint-600" aria-hidden="true" />
                2M+
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                {t('stats.uptime')}
              </dt>
              <dd className="mt-1 font-display text-2xl font-bold text-neutral-900">99.9%</dd>
            </div>
          </dl>
        </div>

        <HeroMockup alt={t('dashboard_alt')} caption={t('dashboard_caption')} subtitle={t('dashboard_subtitle')} />
      </div>
    </section>
  );
}

function HeroMockup({ alt, caption, subtitle }: { alt: string; caption: string; subtitle: string }) {
  return (
    <div className="relative" role="img" aria-label={alt}>
      <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-brand-300/30 via-white/0 to-mint-300/30 blur-2xl" />

      <div className="rounded-3xl border border-neutral-200 bg-white/90 p-3 shadow-2xl shadow-brand-900/10 backdrop-blur">
        <div className="flex items-center gap-1.5 px-2 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" aria-hidden="true" />
          <span className="ml-3 text-xs font-medium text-neutral-400">dashboard.mypos.uz</span>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-600">
                {caption}
              </div>
              <div className="mt-0.5 text-sm text-neutral-500">{subtitle}</div>
            </div>
            <div className="rounded-lg bg-mint-100 px-2.5 py-1 text-xs font-semibold text-mint-700">
              +18%
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: 'Revenue', value: '12.4M', color: 'from-brand-500 to-brand-700' },
              { label: 'Orders', value: '284', color: 'from-mint-500 to-mint-700' },
              { label: 'Tables', value: '18 / 24', color: 'from-gold-500 to-gold-700' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-neutral-200 bg-white p-3"
              >
                <div className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                  {stat.label}
                </div>
                <div
                  className={`mt-1 bg-gradient-to-r ${stat.color} bg-clip-text font-display text-xl font-bold text-transparent`}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-end justify-between">
              <div className="text-xs font-semibold text-neutral-700">Sales (last 7 days)</div>
              <div className="text-[10px] text-neutral-400">UZS</div>
            </div>
            <div className="flex h-24 items-end gap-2">
              {[50, 62, 48, 78, 70, 92, 88].map((h, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: static decorative bars
                  key={i}
                  className="flex-1 rounded-md bg-gradient-to-t from-brand-400 to-brand-600"
                  style={{ height: `${h}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

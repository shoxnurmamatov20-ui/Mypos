import { ArrowRight } from '@phosphor-icons/react/dist/ssr';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';

/** Closing CTA on the surface-tier teal section with a brighter inner card. */
export function CtaSection() {
  const t = useTranslations('cta');
  const locale = useLocale();

  return (
    <section className="bg-[#001B1B] py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-5">
        <div className="glass-card relative overflow-hidden rounded-3xl px-6 py-14 sm:px-12 sm:py-20 text-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 30% 0%, rgba(20,184,166,0.25), transparent 50%)',
            }}
          />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-[28px] sm:text-[42px] font-extrabold leading-[1.1] tracking-tight text-white">
              {t('title')}
            </h2>
            <p className="mx-auto mt-4 max-w-[32rem] text-[15px] sm:text-[16px] leading-relaxed text-white/80">
              {t('subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/get-started`}
                className="press inline-flex h-11 items-center gap-1.5 px-6 rounded-lg bg-[#ff0037] hover:bg-[#e6002f] text-white text-[14px] font-bold shadow-[0_10px_28px_-8px_rgba(255,0,55,0.55)] transition-colors"
              >
                {t('button')}
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                href={`/${locale}/demo`}
                className="press inline-flex h-11 items-center gap-1.5 px-6 rounded-lg border border-white/20 bg-white/10 text-white text-[14px] font-bold hover:bg-white/20 backdrop-blur-sm transition-colors"
              >
                {t('secondary')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

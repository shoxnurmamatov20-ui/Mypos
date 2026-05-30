import { useTranslations } from 'next-intl';

const STEPS = ['one', 'two', 'three'] as const;

/** 3-step "how it works" on the base deep-teal canvas. */
export function HowItWorks() {
  const t = useTranslations('how');

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

        <div className="relative mt-14 grid gap-6 sm:grid-cols-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-[22px] left-[8%] right-[8%] hidden sm:block h-px bg-gradient-to-r from-transparent via-[rgba(20,184,166,0.40)] to-transparent"
          />
          {STEPS.map((step, i) => (
            <div key={step} className="relative flex flex-col items-center text-center">
              <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-[#014D4E] border border-[rgba(20,184,166,0.40)] text-[#5eead4] tabular text-[15px] font-extrabold">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-[18px] font-bold tracking-tight text-white">
                {t(`steps.${step}.title`)}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70 max-w-[20rem]">
                {t(`steps.${step}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

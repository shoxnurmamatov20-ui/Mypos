'use client';

import { Minus, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { step3Schema } from '@/lib/wizard-schemas';
import { useWizardStore } from '@/lib/wizard-store';
import { WizardNavButtons } from './WizardNavButtons';

export function Step3Tables() {
  const t = useTranslations('onboarding.step3');
  const tErr = useTranslations('onboarding.errors');

  const tables = useWizardStore((s) => s.tables);
  const setTables = useWizardStore((s) => s.setTables);
  const next = useWizardStore((s) => s.next);
  const prev = useWizardStore((s) => s.prev);

  const total = tables.zones * tables.tablesPerZone;

  function handleNext() {
    const result = step3Schema.safeParse(tables);
    if (!result.success) return;
    next();
  }

  return (
    <section
      aria-labelledby="step3-title"
      className="rounded-card border border-hairline-soft bg-canvas p-lg shadow-hairline-ring sm:p-xl"
    >
      <h2
        id="step3-title"
        className="font-display font-semibold text-display-sm text-ink"
      >
        {t('title')}
      </h2>
      <p className="mt-xs text-caption text-ink-muted-80">{t('subtitle')}</p>

      <div className="mt-xl grid gap-md sm:grid-cols-2">
        <CounterField
          label={t('zones_label')}
          hint={t('zones_hint')}
          value={tables.zones}
          min={1}
          max={20}
          onChange={(v) => setTables({ zones: v })}
        />
        <CounterField
          label={t('tables_per_zone_label')}
          hint={t('tables_per_zone_hint')}
          value={tables.tablesPerZone}
          min={1}
          max={50}
          onChange={(v) => setTables({ tablesPerZone: v })}
        />
      </div>

      <div className="mt-xl rounded-card bg-parchment p-lg">
        <div className="text-caption text-ink-muted-80">{t('preview_label')}</div>
        <div className="mt-xxs font-display font-semibold text-display-sm text-ink tabular">
          {t('preview_total', { count: total })}
        </div>
        <p className="mt-xs text-fine-print text-ink-muted-48">{t('preview_hint')}</p>
      </div>

      {total > 100 && (
        <p role="alert" className="mt-md rounded-pearl bg-error-soft px-md py-xs text-caption text-error">
          {tErr('too_many_tables')}
        </p>
      )}

      <WizardNavButtons onPrev={prev} onNext={handleNext} />
    </section>
  );
}

function CounterField({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <div>
      <div className="mb-xxs font-display font-semibold text-caption-strong text-ink">{label}</div>
      <div className="flex items-stretch overflow-hidden rounded-card border border-hairline-soft">
        <button
          type="button"
          onClick={dec}
          aria-label="decrease"
          className="flex w-12 items-center justify-center bg-parchment text-ink-muted-80 transition-colors duration-fast hover:bg-pearl disabled:opacity-50"
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = Number.parseInt(e.target.value, 10);
            if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          className="flex-1 border-0 bg-transparent text-center font-display font-semibold text-display-sm text-ink outline-none tabular"
        />
        <button
          type="button"
          onClick={inc}
          aria-label="increase"
          className="flex w-12 items-center justify-center bg-parchment text-ink-muted-80 transition-colors duration-fast hover:bg-pearl disabled:opacity-50"
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <p className="mt-xxs text-fine-print text-ink-muted-48">{hint}</p>
    </div>
  );
}

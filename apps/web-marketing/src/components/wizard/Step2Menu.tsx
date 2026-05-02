'use client';

import { Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { generateMenu, OnboardingApiError } from '@/lib/wizard-api';
import { MENU_MODES, type MenuItem } from '@/lib/wizard-schemas';
import { useWizardStore } from '@/lib/wizard-store';
import { WizardNavButtons } from './WizardNavButtons';

const INPUT_CLASS =
  'w-full rounded-pearl border border-hairline-soft bg-canvas px-sm py-xxs text-caption text-ink transition focus:shadow-focus focus:outline-none';

export function Step2Menu() {
  const t = useTranslations('onboarding.step2');
  const tErr = useTranslations('onboarding.errors');
  const locale = useLocale();

  const restaurant = useWizardStore((s) => s.restaurant);
  const menu = useWizardStore((s) => s.menu);
  const setMenuMode = useWizardStore((s) => s.setMenuMode);
  const setMenuItems = useWizardStore((s) => s.setMenuItems);
  const next = useWizardStore((s) => s.next);
  const prev = useWizardStore((s) => s.prev);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateMenu({ cuisine: restaurant.cuisine }, locale);
      setMenuItems(res.items);
    } catch (e) {
      const message = e instanceof OnboardingApiError ? `api_${e.status}` : 'menu_generate_failed';
      setError(message);
    } finally {
      setGenerating(false);
    }
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const items = parseCsvText(String(reader.result));
        if (items.length === 0) {
          setError('csv_empty');
          return;
        }
        setMenuItems(items);
      } catch {
        setError('csv_parse_failed');
      }
    };
    reader.onerror = () => setError('csv_parse_failed');
    reader.readAsText(file);
  }

  function removeItem(idx: number) {
    setMenuItems(menu.items.filter((_, i) => i !== idx));
  }

  function handleNext() {
    next();
  }

  return (
    <section
      aria-labelledby="step2-title"
      className="rounded-card border border-hairline-soft bg-canvas p-lg shadow-hairline-ring sm:p-xl"
    >
      <h2
        id="step2-title"
        className="font-display font-semibold text-display-sm text-ink"
      >
        {t('title')}
      </h2>
      <p className="mt-xs text-caption text-ink-muted-80">{t('subtitle')}</p>

      <div className="mt-md grid gap-sm sm:grid-cols-3">
        {MENU_MODES.map((mode) => (
          <ModeCard
            key={mode}
            active={menu.mode === mode}
            onClick={() => setMenuMode(mode)}
            title={t(`modes.${mode}.title`)}
            description={t(`modes.${mode}.description`)}
            badge={mode === 'ai' ? t('modes.ai.badge') : null}
          />
        ))}
      </div>

      <div className="mt-md">
        {menu.mode === 'ai' && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="inline-flex items-center gap-xs rounded-pill bg-tenant px-lg py-xs font-display font-semibold text-caption-strong text-tenant-on-primary transition-transform duration-fast active:scale-95 disabled:opacity-60"
          >
            {generating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                {t('generating')}
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                {t('generate_cta')}
              </>
            )}
          </button>
        )}

        {menu.mode === 'csv' && (
          <label
            htmlFor="csv-upload"
            className="inline-flex cursor-pointer items-center gap-xs rounded-pill border border-hairline-soft bg-canvas px-lg py-xs font-display font-semibold text-caption-strong text-ink transition-transform duration-fast active:scale-95 hover:border-coral/40 hover:text-coral"
          >
            <Upload className="h-5 w-5" aria-hidden="true" />
            {t('csv_cta')}
            <input
              id="csv-upload"
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              className="hidden"
            />
          </label>
        )}

        {menu.mode === 'manual' && (
          <p className="rounded-pearl bg-parchment px-md py-xs text-caption text-ink-muted-80">
            {t('manual_hint')}
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-md rounded-pearl bg-error-soft px-md py-xs text-caption text-error">
          {tErr(error)}
        </p>
      )}

      {menu.items.length > 0 && (
        <div className="mt-xl">
          <div className="mb-sm flex items-baseline justify-between">
            <h3 className="font-display font-semibold text-body-strong text-ink">
              {t('items_preview', { count: menu.items.length })}
            </h3>
            <button
              type="button"
              onClick={() => setMenuItems([])}
              className="font-semibold text-fine-print text-ink-muted-48 transition-colors duration-fast hover:text-error"
            >
              {t('clear_all')}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-card border border-hairline-soft">
            <table className="w-full divide-y divide-hairline-soft text-caption">
              <thead className="sticky top-0 bg-parchment text-fine-print text-ink-muted-48 uppercase tracking-wider">
                <tr>
                  <th className="px-sm py-xs text-left font-display font-semibold">{t('col_name')}</th>
                  <th className="px-sm py-xs text-left font-display font-semibold">{t('col_category')}</th>
                  <th className="px-sm py-xs text-right font-display font-semibold">{t('col_price')}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {menu.items.map((item, idx) => (
                  <ItemRow
                    // biome-ignore lint/suspicious/noArrayIndexKey: order matches user intent, no stable id yet
                    key={`${item.name}-${idx}`}
                    item={item}
                    onChange={(patch) => {
                      setMenuItems(
                        menu.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
                      );
                    }}
                    onRemove={() => removeItem(idx)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <WizardNavButtons onPrev={prev} onNext={handleNext} loading={generating} />
    </section>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  description,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
  badge: string | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'relative rounded-card border-2 p-md text-left transition-transform duration-fast active:scale-95',
        active
          ? 'border-coral bg-coral-tint shadow-hairline-ring'
          : 'border-hairline-soft bg-canvas hover:border-coral/40',
      ].join(' ')}
    >
      {badge && (
        <span className="absolute top-sm right-sm rounded-pill bg-tenant px-xs py-xxs font-display font-semibold text-fine-print text-tenant-on-primary uppercase">
          {badge}
        </span>
      )}
      <div className="font-display font-semibold text-body-strong text-ink">{title}</div>
      <div className="mt-xxs text-fine-print text-ink-muted-80">{description}</div>
    </button>
  );
}

function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: MenuItem;
  onChange: (patch: Partial<MenuItem>) => void;
  onRemove: () => void;
}) {
  return (
    <tr>
      <td className="px-sm py-xxs">
        <input
          type="text"
          value={item.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className={INPUT_CLASS}
          maxLength={120}
        />
      </td>
      <td className="px-sm py-xxs">
        <input
          type="text"
          value={item.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className={INPUT_CLASS}
          maxLength={80}
        />
      </td>
      <td className="px-sm py-xxs">
        <input
          type="number"
          value={item.priceUzs}
          min={0}
          step={1000}
          onChange={(e) => onChange({ priceUzs: Math.max(0, Number(e.target.value) || 0) })}
          className={`${INPUT_CLASS} text-right tabular`}
        />
      </td>
      <td className="px-sm py-xxs text-right">
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center justify-center rounded-pearl p-xxs text-ink-muted-48 transition-colors duration-fast hover:bg-error-soft hover:text-error"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

function parseCsvText(raw: string): MenuItem[] {
  const lines = raw
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headerLine = lines[0]!;
  const headers = headerLine.split(',').map((h) => h.trim().toLowerCase());

  const idxName = headers.indexOf('name');
  const idxCategory = headers.indexOf('category');
  const idxDesc = headers.indexOf('description');
  const idxPrice = headers.indexOf('price');

  if (idxName === -1 || idxPrice === -1) {
    throw new Error('csv_missing_columns');
  }

  const items: MenuItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const cols = splitCsvLine(line);
    const name = cols[idxName]?.trim() ?? '';
    const priceRaw = cols[idxPrice]?.trim() ?? '';
    const price = Number.parseInt(priceRaw.replace(/[^\d]/g, ''), 10);
    if (!name || !Number.isFinite(price)) continue;

    items.push({
      name,
      category:
        idxCategory !== -1 ? (cols[idxCategory]?.trim() ?? 'Uncategorized') : 'Uncategorized',
      description: idxDesc !== -1 ? (cols[idxDesc]?.trim() ?? '') : '',
      priceUzs: price,
    });
  }
  return items;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

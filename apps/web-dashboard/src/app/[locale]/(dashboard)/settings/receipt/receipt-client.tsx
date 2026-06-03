'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  type PaperWidth,
  type ReceiptFontSize,
  type ReceiptSettings,
  useSettingsHydrated,
  useSettingsStore,
} from '@/stores/settings';
import {
  Field,
  FieldGroup,
  inputClass,
  primaryBtnClass,
  type SegmentOption,
  SegmentedControl,
  SettingsCard,
  SettingsSkeleton,
  ToggleRow,
} from '../_components/settings-ui';

// ---------------------------------------------------------------------------
// Receipt preview (sample data — visual mock only)
// ---------------------------------------------------------------------------

const MOCK_LINES = [
  { name: 'Lavash', qty: 2, price: 60_000 },
  { name: 'Shashlik', qty: 1, price: 45_000 },
  { name: 'Choy (pot)', qty: 3, price: 15_000 },
] as const;

const MOCK_SUBTOTAL = MOCK_LINES.reduce((s, l) => s + l.qty * l.price, 0);
const MOCK_TAX = Math.round(MOCK_SUBTOTAL * 0.12);
const MOCK_TOTAL = MOCK_SUBTOTAL + MOCK_TAX;

const FONT_SIZE_MAP: Record<ReceiptFontSize, string> = {
  small: 'text-[10px]',
  normal: 'text-[11px]',
  large: 'text-[13px]',
};

function fmt(n: number) {
  return n.toLocaleString('uz-UZ');
}

function ReceiptPreview({ form }: { form: ReceiptSettings }) {
  const width = form.paperWidth === '58' ? '200px' : '280px';
  const dashes = '- '.repeat(form.paperWidth === '58' ? 17 : 24);
  const dateLabel = form.language === 'uz' ? 'Sana' : form.language === 'ru' ? 'Дата' : 'Date';
  const totalLabel = form.language === 'uz' ? 'JAMI' : form.language === 'ru' ? 'ИТОГО' : 'TOTAL';

  return (
    <div
      className={`font-mono ${FONT_SIZE_MAP[form.fontSize]} select-none`}
      style={{ width, background: '#fff', color: '#1d1d1f', padding: '14px 12px' }}
    >
      {form.showLogo && (
        <div
          className="mb-2 flex items-center justify-center rounded border border-dashed border-[#bbb]"
          style={{ height: '40px' }}
        >
          <span className="text-[9px] text-[#888]">LOGO</span>
        </div>
      )}

      <p className="mb-1 text-center font-semibold leading-tight">{form.header || 'MyPOS Restaurant'}</p>
      <p className="text-center text-[9px] text-[#888]">
        {dateLabel}: {new Date().toLocaleDateString()}
      </p>

      <p className="my-1.5 overflow-hidden text-center leading-[0] text-[#ccc]">{dashes}</p>

      {MOCK_LINES.map((line) => (
        <div key={line.name} className="flex justify-between gap-1">
          <span className="truncate">
            {line.name} x{line.qty}
          </span>
          <span className="flex-shrink-0 tabular-nums [font-feature-settings:'tnum']">
            {fmt(line.qty * line.price)}
          </span>
        </div>
      ))}

      <p className="my-1.5 overflow-hidden text-center leading-[0] text-[#ccc]">{dashes}</p>

      {form.showTax && (
        <div className="flex justify-between gap-1 text-[#555]">
          <span>QQS 12%</span>
          <span className="tabular-nums [font-feature-settings:'tnum']">{fmt(MOCK_TAX)}</span>
        </div>
      )}

      <div className="mt-0.5 flex justify-between gap-1 font-semibold">
        <span>{totalLabel}</span>
        <span className="tabular-nums [font-feature-settings:'tnum']">{fmt(MOCK_TOTAL)}</span>
      </div>

      {form.showQr && (
        <>
          <p className="my-1.5 overflow-hidden text-center leading-[0] text-[#ccc]">{dashes}</p>
          <div
            className="mx-auto mb-1 flex items-center justify-center rounded border border-dashed border-[#bbb]"
            style={{ width: '56px', height: '56px' }}
          >
            <span className="text-[8px] text-[#888]">QR</span>
          </div>
        </>
      )}

      <p className="mt-1.5 text-center text-[#555]">{form.footer || 'Tashrifingiz uchun rahmat!'}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client
// ---------------------------------------------------------------------------

export function ReceiptClient() {
  const hydrated = useSettingsHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <ReceiptForm />;
}

function ReceiptForm() {
  const t = useTranslations('settings');
  const receipt = useSettingsStore((s) => s.receipt);
  const setReceipt = useSettingsStore((s) => s.setReceipt);

  const [form, setForm] = useState<ReceiptSettings>(receipt);

  function patch(updates: Partial<ReceiptSettings>) {
    setForm((f) => ({ ...f, ...updates }));
  }
  function handleSave() {
    setReceipt(form);
    toast.success(t('saved'));
  }

  const fontOptions: readonly SegmentOption<ReceiptFontSize>[] = [
    { value: 'small', label: t('receipt.small') },
    { value: 'normal', label: t('receipt.normal') },
    { value: 'large', label: t('receipt.large') },
  ];
  const paperOptions: readonly SegmentOption<PaperWidth>[] = [
    { value: '58', label: t('paper_58') },
    { value: '80', label: t('paper_80') },
  ];
  const langOptions: readonly SegmentOption<ReceiptSettings['language']>[] = [
    { value: 'uz', label: 'UZ' },
    { value: 'ru', label: 'RU' },
    { value: 'en', label: 'EN' },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <SettingsCard
        title={t('receipt.title')}
        footer={
          <button type="button" onClick={handleSave} className={primaryBtnClass}>
            {t('save')}
          </button>
        }
      >
        <div className="space-y-5">
          <ToggleRow label={t('receipt.show_logo')} checked={form.showLogo} onChange={(v) => patch({ showLogo: v })} />

          {form.showLogo && (
            <Field label={t('receipt.logo_url')}>
              <input
                type="url"
                className={inputClass}
                value={form.logoUrl}
                onChange={(e) => patch({ logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
              />
            </Field>
          )}

          <Field label={t('receipt.header')}>
            <input
              type="text"
              className={inputClass}
              value={form.header}
              onChange={(e) => patch({ header: e.target.value })}
              placeholder="MyPOS Restaurant"
            />
          </Field>

          <Field label={t('receipt.footer')}>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={form.footer}
              onChange={(e) => patch({ footer: e.target.value })}
              placeholder="Tashrifingiz uchun rahmat!"
            />
          </Field>

          <FieldGroup label={t('receipt.font_size')}>
            <SegmentedControl options={fontOptions} value={form.fontSize} onChange={(v) => patch({ fontSize: v })} ariaLabel={t('receipt.font_size')} />
          </FieldGroup>

          <FieldGroup label={t('receipt.paper_width')}>
            <SegmentedControl options={paperOptions} value={form.paperWidth} onChange={(v) => patch({ paperWidth: v })} ariaLabel={t('receipt.paper_width')} />
          </FieldGroup>

          <FieldGroup label={t('receipt.language')}>
            <SegmentedControl options={langOptions} value={form.language} onChange={(v) => patch({ language: v })} ariaLabel={t('receipt.language')} />
          </FieldGroup>

          <div className="rounded-xl border border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)] px-4">
            <ToggleRow label={t('receipt.show_tax')} checked={form.showTax} onChange={(v) => patch({ showTax: v })} />
            <div className="border-t border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)]">
              <ToggleRow label={t('receipt.show_qr')} checked={form.showQr} onChange={(v) => patch({ showQr: v })} />
            </div>
          </div>
        </div>
      </SettingsCard>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <SettingsCard title={t('receipt.preview')}>
          <div className="flex justify-center rounded-xl bg-[#f5f5f0] p-5 dark:bg-[#0d1117]">
            <div className="rounded-[3px] shadow-[0_10px_30px_rgba(0,0,0,0.16)]">
              <ReceiptPreview form={form} />
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

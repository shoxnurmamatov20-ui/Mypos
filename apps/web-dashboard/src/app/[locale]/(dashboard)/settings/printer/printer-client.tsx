'use client';

import { Bluetooth, Usb, Wifi } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  type PaperWidth,
  type PrinterConnection,
  type PrinterSettings,
  useSettingsHydrated,
  useSettingsStore,
} from '@/stores/settings';
import {
  Field,
  FieldGroup,
  inputClass,
  primaryBtnClass,
  SegmentedControl,
  type SegmentOption,
  SettingsCard,
  SettingsSkeleton,
  Stepper,
  secondaryBtnClass,
  ToggleRow,
} from '../_components/settings-ui';

export function PrinterClient() {
  const hydrated = useSettingsHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <PrinterForm />;
}

function PrinterForm() {
  const t = useTranslations('settings');
  const printer = useSettingsStore((s) => s.printer);
  const setPrinter = useSettingsStore((s) => s.setPrinter);

  const [form, setForm] = useState<PrinterSettings>(printer);

  function patch(delta: Partial<PrinterSettings>) {
    setForm((prev) => ({ ...prev, ...delta }));
  }
  function handleSave() {
    setPrinter(form);
    toast.success(t('saved'));
  }

  const connectionOptions: readonly SegmentOption<PrinterConnection>[] = [
    { value: 'usb', label: t('printer.usb'), icon: Usb },
    { value: 'network', label: t('printer.network'), icon: Wifi },
    { value: 'bluetooth', label: t('printer.bluetooth'), icon: Bluetooth },
  ];
  const paperOptions: readonly SegmentOption<PaperWidth>[] = [
    { value: '58', label: t('paper_58') },
    { value: '80', label: t('paper_80') },
  ];

  return (
    <SettingsCard
      title={t('printer.title')}
      footer={
        <button type="button" className={primaryBtnClass} onClick={handleSave}>
          {t('save')}
        </button>
      }
    >
      <div className="space-y-6">
        <Field label={t('printer.name')}>
          <input
            type="text"
            className={inputClass}
            value={form.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="EPSON TM-T20"
          />
        </Field>

        <FieldGroup label={t('printer.connection')}>
          <SegmentedControl
            options={connectionOptions}
            value={form.connection}
            onChange={(v) => patch({ connection: v })}
            ariaLabel={t('printer.connection')}
          />
        </FieldGroup>

        {form.connection === 'network' && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label={t('printer.ip')}>
              <input
                type="text"
                className={inputClass}
                value={form.ip}
                onChange={(e) => patch({ ip: e.target.value })}
                placeholder="192.168.1.100"
              />
            </Field>
            <Field label={t('printer.port')}>
              <input
                type="text"
                className={`${inputClass} [font-feature-settings:'tnum']`}
                value={form.port}
                onChange={(e) => patch({ port: e.target.value })}
                placeholder="9100"
              />
            </Field>
          </div>
        )}

        <FieldGroup label={t('printer.paper_width')}>
          <SegmentedControl
            options={paperOptions}
            value={form.paperWidth}
            onChange={(v) => patch({ paperWidth: v })}
            ariaLabel={t('printer.paper_width')}
          />
        </FieldGroup>

        <FieldGroup label={t('printer.copies')}>
          <Stepper value={form.copies} min={1} max={5} onChange={(v) => patch({ copies: v })} />
        </FieldGroup>

        <div className="rounded-xl border border-[rgba(22,34,31,0.06)] dark:border-[rgba(255,255,255,0.05)] px-4">
          <ToggleRow
            label={t('printer.auto_print')}
            description={t('printer.auto_print_hint')}
            checked={form.autoPrint}
            onChange={(v) => patch({ autoPrint: v })}
          />
        </div>

        <div className="pt-1">
          <button
            type="button"
            className={secondaryBtnClass}
            onClick={() => toast.success(t('printer.test_sent'))}
          >
            {t('printer.test')}
          </button>
        </div>
      </div>
    </SettingsCard>
  );
}

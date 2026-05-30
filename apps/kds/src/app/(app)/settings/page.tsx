'use client';

import { Bell, Gauge, Monitor, Moon, RotateCcw, Sun, Volume2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import { type CardDensity, useKitchenSettings } from '@/lib/settings';
import { playChime } from '@/lib/sound';

export default function SettingsPage() {
  const settings = useKitchenSettings();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-[22px] font-bold text-[#16221f] dark:text-white">Sozlamalar</h1>
        <p className="mt-0.5 text-[13px] text-[#62716d] dark:text-[#94a3b8]">
          Ushbu oshxona ekrani uchun sozlamalar — faqat shu qurilmada saqlanadi
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Sound */}
        <Card>
          <CardHeader>
            <CardTitle hint="Yangi buyurtma kelganda ovozli signal">
              <span className="inline-flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-[#0f766e] dark:text-[#14b8a6]" />
                Ovoz
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <Switch
              checked={settings.soundEnabled}
              onChange={(v) => settings.set('soundEnabled', v)}
              label="Ovozli signal"
              description="Yangi buyurtmada qo‘ng‘iroq chaladi"
            />
            <div className={cn(!settings.soundEnabled && 'opacity-50')}>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-[#16221f] dark:text-white">
                  Ovoz balandligi
                </p>
                <span className="text-[12px] font-semibold tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                disabled={!settings.soundEnabled}
                value={Math.round(settings.soundVolume * 100)}
                onChange={(e) => settings.set('soundVolume', Number(e.target.value) / 100)}
                className="mt-2 w-full accent-[#0f766e] dark:accent-[#14b8a6]"
              />
              <button
                type="button"
                disabled={!settings.soundEnabled}
                onClick={() => playChime(settings.soundVolume)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] px-2.5 py-1.5 text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8] hover:border-[#0f766e] hover:text-[#0f766e] dark:hover:border-[#14b8a6] dark:hover:text-[#14b8a6] transition-colors disabled:opacity-50"
              >
                <Bell className="h-3.5 w-3.5" strokeWidth={2.2} />
                Sinab ko‘rish
              </button>
            </div>
            <Switch
              checked={settings.vibrationEnabled}
              onChange={(v) => settings.set('vibrationEnabled', v)}
              label="Tebranish"
              description="Qo‘llab-quvvatlovchi qurilmalarda teb­ranadi"
            />
          </div>
        </Card>

        {/* Urgency thresholds */}
        <Card>
          <CardHeader>
            <CardTitle hint="Buyurtma kartochkasi rangini belgilaydi">
              <span className="inline-flex items-center gap-2">
                <Gauge className="h-4 w-4 text-[#0f766e] dark:text-[#14b8a6]" />
                Shoshilinch belgilar
              </span>
            </CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <NumberStepper
              label="Sariq chegara"
              description="Shu daqiqadan keyin kartochka sarg‘ayadi"
              value={settings.warningThresholdMin}
              min={1}
              max={settings.urgentThresholdMin - 1}
              onChange={(v) => settings.set('warningThresholdMin', v)}
            />
            <NumberStepper
              label="Qizil chegara"
              description="Shu daqiqadan keyin kartochka qizaradi va pulslaydi"
              value={settings.urgentThresholdMin}
              min={settings.warningThresholdMin + 1}
              max={120}
              onChange={(v) => settings.set('urgentThresholdMin', v)}
            />
          </div>
        </Card>

        {/* Display */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle hint="Ekran ko‘rinishi va mavzu">
              <span className="inline-flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[#0f766e] dark:text-[#14b8a6]" />
                Ko‘rinish
              </span>
            </CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <p className="text-[13px] font-bold text-[#16221f] dark:text-white">
                Kartochka zichligi
              </p>
              <p className="mb-2 mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                Bir ekranda nechta buyurtma sig‘ishini belgilaydi
              </p>
              <SegmentedControl<CardDensity>
                value={settings.cardDensity}
                onChange={(v) => settings.set('cardDensity', v)}
                options={[
                  { value: 'comfortable', label: 'Keng' },
                  { value: 'compact', label: 'Ixcham' },
                ]}
              />
            </div>
            <div>
              <p className="text-[13px] font-bold text-[#16221f] dark:text-white">Mavzu</p>
              <p className="mb-2 mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                Yorug‘, tungi yoki tizim sozlamasiga moslashtirilgan
              </p>
              <SegmentedControl<string>
                value={mounted ? (theme ?? 'system') : 'system'}
                onChange={(v) => setTheme(v)}
                options={[
                  { value: 'light', label: 'Yorug‘', icon: Sun },
                  { value: 'dark', label: 'Tungi', icon: Moon },
                  { value: 'system', label: 'Tizim', icon: Monitor },
                ]}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => settings.reset()}
          className="inline-flex items-center gap-1.5 rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-3 py-2 text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8] hover:border-[#b42318] hover:text-[#b42318] dark:hover:text-[#f87171] transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.2} />
          Standart sozlamalarga qaytarish
        </button>
      </div>
    </div>
  );
}

/** −/＋ stepper for a bounded integer setting. */
function NumberStepper({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-[#16221f] dark:text-white">{label}</p>
        <p className="mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8]">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <StepperButton
          label="Kamaytirish"
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        >
          −
        </StepperButton>
        <span className="w-12 text-center text-[15px] font-bold tabular-nums text-[#16221f] dark:text-white">
          {value}
          <span className="text-[11px] font-normal text-[#62716d] dark:text-[#94a3b8]"> daq</span>
        </span>
        <StepperButton
          label="Oshirish"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        >
          ＋
        </StepperButton>
      </div>
    </div>
  );
}

function StepperButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] text-[16px] font-bold text-[#16221f] dark:text-white hover:border-[#0f766e] hover:text-[#0f766e] dark:hover:border-[#14b8a6] dark:hover:text-[#14b8a6] transition-colors disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

/** Pill segmented control — teal-active segment on a surface2 track. */
function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; icon?: typeof Sun }[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#eef4f3] dark:bg-[#1a2235] p-0.5">
      {options.map(({ value: optValue, label, icon: Icon }) => {
        const active = value === optValue;
        return (
          <button
            key={optValue}
            type="button"
            onClick={() => onChange(optValue)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition-colors',
              active
                ? 'bg-white dark:bg-[#0b1120] text-[#0f766e] dark:text-[#14b8a6] shadow-sm'
                : 'text-[#62716d] dark:text-[#94a3b8] hover:text-[#16221f] dark:hover:text-white',
            )}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={2.2} /> : null}
            {label}
          </button>
        );
      })}
    </div>
  );
}

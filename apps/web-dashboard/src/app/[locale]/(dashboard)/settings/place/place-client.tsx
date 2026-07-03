'use client';

import { cn } from '@mypos/ui';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  type DayHours,
  useSettingsHydrated,
  useSettingsStore,
  WEEKDAYS,
  type Weekday,
} from '@/stores/settings';
import {
  Field,
  inputClass,
  primaryBtnClass,
  SettingsCard,
  SettingsSkeleton,
  Toggle,
} from '../_components/settings-ui';

type PlaceForm = { name: string; address: string; phone: string; city: string; timezone: string };

const DEFAULT_DAY: DayHours = { open: '09:00', close: '23:00', closed: false };
const timeInputClass = cn(inputClass, 'w-32');

export function PlaceClient() {
  // Gate on hydration BEFORE the inner form mounts, so its useState
  // initialisers always read the rehydrated (persisted) store values.
  const hydrated = useSettingsHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <PlaceForm />;
}

function PlaceForm() {
  const t = useTranslations('settings');
  const place = useSettingsStore((s) => s.place);
  const setPlace = useSettingsStore((s) => s.setPlace);
  const setDayHours = useSettingsStore((s) => s.setDayHours);

  const [form, setForm] = useState<PlaceForm>({
    name: place.name,
    address: place.address,
    phone: place.phone,
    city: place.city,
    timezone: place.timezone,
  });
  const [hours, setHours] = useState<Record<Weekday, DayHours>>(() => {
    const map = {} as Record<Weekday, DayHours>;
    for (const day of WEEKDAYS) map[day] = place.hours[day] ?? DEFAULT_DAY;
    return map;
  });

  function patchForm(key: keyof PlaceForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function patchHours(day: Weekday, patch: Partial<DayHours>) {
    setHours((prev) => ({ ...prev, [day]: { ...(prev[day] ?? DEFAULT_DAY), ...patch } }));
  }

  function handleSave() {
    setPlace(form);
    for (const day of WEEKDAYS) setDayHours(day, hours[day] ?? DEFAULT_DAY);
    toast.success(t('saved'));
  }

  return (
    <div className="space-y-6">
      <SettingsCard title={t('place.info')}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('place.name')}>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => patchForm('name', e.target.value)}
            />
          </Field>
          <Field label={t('place.phone')}>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => patchForm('phone', e.target.value)}
            />
          </Field>
          <Field label={t('place.address')} className="sm:col-span-2">
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => patchForm('address', e.target.value)}
            />
          </Field>
          <Field label={t('place.city')}>
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => patchForm('city', e.target.value)}
            />
          </Field>
          <Field label={t('place.timezone')}>
            <input
              className={inputClass}
              value={form.timezone}
              onChange={(e) => patchForm('timezone', e.target.value)}
            />
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard title={t('place.hours')}>
        <div className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
          {WEEKDAYS.map((day) => {
            const dh = hours[day] ?? DEFAULT_DAY;
            return (
              <div key={day} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-24 shrink-0 text-sm font-medium text-[#16221f] dark:text-[#e2e8f0]">
                  {t(`place.days.${day}`)}
                </span>
                <input
                  type="time"
                  aria-label={t('place.open')}
                  className={timeInputClass}
                  value={dh.open}
                  disabled={dh.closed}
                  onChange={(e) => patchHours(day, { open: e.target.value })}
                />
                <input
                  type="time"
                  aria-label={t('place.close')}
                  className={timeInputClass}
                  value={dh.close}
                  disabled={dh.closed}
                  onChange={(e) => patchHours(day, { close: e.target.value })}
                />
                <div className="ml-auto flex items-center gap-2 text-sm text-[#62716d] dark:text-[#94a3b8]">
                  <Toggle
                    checked={dh.closed}
                    onChange={(next) => patchHours(day, { closed: next })}
                    ariaLabel={t('place.closed')}
                  />
                  <span>{t('place.closed')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <div className="flex justify-end">
        <button type="button" className={primaryBtnClass} onClick={handleSave}>
          {t('save')}
        </button>
      </div>
    </div>
  );
}

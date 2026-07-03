'use client';

import { Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { PlatformSettings } from '@/lib/api-helpers';
import { cn } from '@/lib/cn';
import { Field, SETTINGS_SELECT_CLASS, SettingsSection } from './settings-section';

type Plan = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
type Locale = 'uz' | 'ru' | 'en';
type Currency = 'UZS' | 'USD';

type GeneralFormState = {
  platform_name: string;
  support_email: string;
  support_phone: string;
  default_plan: Plan;
  trial_days: number;
  default_locale: Locale;
  default_currency: Currency;
};

const FALLBACK: GeneralFormState = {
  platform_name: 'MyPOS',
  support_email: 'support@mypos.uz',
  support_phone: '+998 71 200 00 00',
  default_plan: 'starter',
  trial_days: 14,
  default_locale: 'uz',
  default_currency: 'UZS',
};

/** Read the form state from a `PlatformSettings` payload (with safe fallbacks). */
function hydrate(settings: PlatformSettings): GeneralFormState {
  const asString = (v: unknown, dflt: string): string =>
    typeof v === 'string' && v.length > 0 ? v : dflt;
  const asNumber = (v: unknown, dflt: number): number => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v !== '') {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return dflt;
  };

  const plan = asString(settings.default_plan, FALLBACK.default_plan) as Plan;
  const locale = asString(settings.default_locale, FALLBACK.default_locale) as Locale;
  const currency = asString(settings.default_currency, FALLBACK.default_currency) as Currency;

  return {
    platform_name: asString(settings.platform_name, FALLBACK.platform_name),
    support_email: asString(settings.support_email, FALLBACK.support_email),
    support_phone: asString(settings.support_phone, FALLBACK.support_phone),
    default_plan: plan,
    trial_days: asNumber(settings.trial_days, FALLBACK.trial_days),
    default_locale: locale,
    default_currency: currency,
  };
}

type Props = {
  settings: PlatformSettings;
  isLoading?: boolean;
  onSave: (patch: Partial<PlatformSettings>) => Promise<void>;
};

/** General platform settings — 7 fields wired to `PlatformSettings`. */
export function GeneralSection({ settings, isLoading = false, onSave }: Props) {
  const t = useTranslations('settings_page');
  const tPlan = useTranslations('plans');

  const [form, setForm] = useState<GeneralFormState>(() => hydrate(settings));
  const [saving, setSaving] = useState(false);

  // Re-hydrate whenever the cached settings change (e.g. after refetch).
  useEffect(() => {
    setForm(hydrate(settings));
  }, [settings]);

  const set = <K extends keyof GeneralFormState>(key: K, value: GeneralFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        platform_name: form.platform_name,
        support_email: form.support_email,
        support_phone: form.support_phone,
        default_plan: form.default_plan,
        trial_days: form.trial_days,
        default_locale: form.default_locale,
        default_currency: form.default_currency,
      });
    } catch {
      // Toast already shown by the parent; just exit the saving state.
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <SectionSkeleton id="general" />;
  }

  return (
    <SettingsSection
      id="general"
      icon={Settings}
      title={t('section_general')}
      description={t('section_general_desc')}
      saving={saving}
      onSave={handleSave}
    >
      <Field label={t('field_platform_name')} htmlFor="platform-name" required>
        <Input
          id="platform-name"
          value={form.platform_name}
          onChange={(e) => set('platform_name', e.target.value)}
          autoComplete="off"
          className="w-full"
        />
      </Field>

      <Field
        label={t('field_support_email')}
        htmlFor="support-email"
        hint="Mijozlar javob qoldira oladigan email manzili"
      >
        <Input
          id="support-email"
          type="email"
          value={form.support_email}
          onChange={(e) => set('support_email', e.target.value)}
          autoComplete="email"
          className="w-full"
        />
      </Field>

      <Field label={t('field_support_phone')} htmlFor="support-phone">
        <Input
          id="support-phone"
          type="tel"
          value={form.support_phone}
          onChange={(e) => set('support_phone', e.target.value)}
          autoComplete="tel"
          className="w-full"
        />
      </Field>

      <Field
        label={t('field_default_plan')}
        htmlFor="default-plan"
        hint="Yangi tenantlar shu plan bilan ochiladi"
      >
        <select
          id="default-plan"
          value={form.default_plan}
          onChange={(e) => set('default_plan', e.target.value as Plan)}
          className={SETTINGS_SELECT_CLASS}
        >
          {(['free', 'starter', 'pro', 'business', 'enterprise'] as const).map((plan) => (
            <option key={plan} value={plan}>
              {tPlan(plan)}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label={t('field_default_trial_days')}
        htmlFor="default-trial"
        hint="0 — trialsiz. Maksimum 90 kun."
      >
        <Input
          id="default-trial"
          type="number"
          min={0}
          max={90}
          value={form.trial_days}
          onChange={(e) => set('trial_days', Math.max(0, Number.parseInt(e.target.value, 10) || 0))}
          className={cn('w-full sm:max-w-[160px] tabular-nums')}
        />
      </Field>

      <Field label={t('field_default_locale')} htmlFor="default-locale">
        <select
          id="default-locale"
          value={form.default_locale}
          onChange={(e) => set('default_locale', e.target.value as Locale)}
          className={SETTINGS_SELECT_CLASS}
        >
          <option value="uz">O&apos;zbekcha</option>
          <option value="ru">Русский</option>
          <option value="en">English</option>
        </select>
      </Field>

      <Field label={t('field_default_currency')} htmlFor="default-currency">
        <select
          id="default-currency"
          value={form.default_currency}
          onChange={(e) => set('default_currency', e.target.value as Currency)}
          className={SETTINGS_SELECT_CLASS}
        >
          <option value="UZS">UZS — so&apos;m</option>
          <option value="USD">USD — dollar</option>
        </select>
      </Field>
    </SettingsSection>
  );
}

/** Loading skeleton matching the section layout. */
function SectionSkeleton({ id }: { id: string }) {
  return (
    <div
      id={id}
      className="rounded-xl border p-4 md:p-5 border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 space-y-4 scroll-mt-20"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl animate-pulse bg-gray-200 dark:bg-gray-800" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-56 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: 5 }, (_, idx) => (
          <div key={idx} className="h-9 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
        ))}
      </div>
    </div>
  );
}

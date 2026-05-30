'use client';

import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import type { PlatformSettings } from '@/lib/api-helpers';
import { Field, SETTINGS_SELECT_CLASS, SettingsSection } from './settings-section';

type SeverityThreshold = 'error' | 'critical';

type NotificationsFormState = {
  emailEnabled: boolean;
  telegramEnabled: boolean;
  emailRecipient: string;
  telegramChat: string;
  threshold: SeverityThreshold;
};

const FALLBACK: NotificationsFormState = {
  emailEnabled: true,
  telegramEnabled: true,
  emailRecipient: 'alerts@mypos.uz',
  telegramChat: '@mypos_alerts',
  threshold: 'error',
};

/** Hydrate the form state from the `PlatformSettings` payload. */
function hydrate(settings: PlatformSettings): NotificationsFormState {
  const get = <T,>(key: string, dflt: T): T => {
    const v = settings[key];
    return (v as T | undefined) ?? dflt;
  };
  const threshold = get('notifications_threshold', FALLBACK.threshold) as SeverityThreshold;
  return {
    emailEnabled: Boolean(get('notifications_email_enabled', FALLBACK.emailEnabled)),
    telegramEnabled: Boolean(get('notifications_telegram_enabled', FALLBACK.telegramEnabled)),
    emailRecipient: String(get('notifications_email_recipient', FALLBACK.emailRecipient)),
    telegramChat: String(get('notifications_telegram_chat', FALLBACK.telegramChat)),
    threshold: threshold === 'critical' ? 'critical' : 'error',
  };
}

type Props = {
  settings: PlatformSettings;
  isLoading?: boolean;
  onSave: (patch: Partial<PlatformSettings>) => Promise<void>;
};

/** Notifications channel config — email + Telegram + severity threshold. */
export function NotificationsSection({ settings, isLoading = false, onSave }: Props) {
  const t = useTranslations('settings_page');

  const [form, setForm] = useState<NotificationsFormState>(() => hydrate(settings));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(hydrate(settings));
  }, [settings]);

  const set = <K extends keyof NotificationsFormState>(
    key: K,
    value: NotificationsFormState[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        notifications_email_enabled: form.emailEnabled,
        notifications_telegram_enabled: form.telegramEnabled,
        notifications_email_recipient: form.emailRecipient,
        notifications_telegram_chat: form.telegramChat,
        notifications_threshold: form.threshold,
      });
    } catch {
      // Toast already shown by the parent.
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        id="notifications"
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
          {Array.from({ length: 4 }, (_, idx) => (
            <div
              key={idx}
              className="h-9 rounded animate-pulse bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <SettingsSection
      id="notifications"
      icon={Bell}
      iconColor="text-amber-600 dark:text-amber-400"
      iconBg="bg-amber-50 dark:bg-amber-500/15"
      title={t('section_notifications')}
      description={t('section_notifications_desc')}
      saving={saving}
      onSave={handleSave}
    >
      <div className="space-y-3">
        <Switch
          checked={form.emailEnabled}
          onChange={(v) => set('emailEnabled', v)}
          label={t('notifications_email_channel')}
          description="Tizim ogohlantirishlari email orqali yuboriladi"
        />
        {form.emailEnabled ? (
          <Field
            label={t('field_support_email')}
            htmlFor="email-recipient"
            hint="Bir nechta manzilni vergul bilan ajrating"
          >
            <Input
              id="email-recipient"
              type="email"
              value={form.emailRecipient}
              onChange={(e) => set('emailRecipient', e.target.value)}
              autoComplete="email"
              className="w-full"
            />
          </Field>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-5">
        <Switch
          checked={form.telegramEnabled}
          onChange={(v) => set('telegramEnabled', v)}
          label={t('notifications_telegram_channel')}
          description="Telegram bot orqali tezkor xabarnoma"
        />
        {form.telegramEnabled ? (
          <Field
            label="Chat ID"
            htmlFor="telegram-chat"
            hint="@username yoki -1001234567890 ko'rinishida"
          >
            <Input
              id="telegram-chat"
              value={form.telegramChat}
              onChange={(e) => set('telegramChat', e.target.value)}
              autoComplete="off"
              className="w-full font-mono text-xs"
            />
          </Field>
        ) : null}
      </div>

      <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
        <Field
          label={t('notifications_severity_threshold')}
          htmlFor="threshold"
          hint="Quyi darajadagi xabarlar yuborilmaydi"
        >
          <select
            id="threshold"
            value={form.threshold}
            onChange={(e) => set('threshold', e.target.value as SeverityThreshold)}
            className={SETTINGS_SELECT_CLASS}
          >
            <option value="error">{t('severity_error')}</option>
            <option value="critical">{t('severity_critical')}</option>
          </select>
        </Field>
      </div>
    </SettingsSection>
  );
}

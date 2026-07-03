'use client';

import { Lock, Mail, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import type { PlatformSettings } from '@/lib/api-helpers';
import { cn } from '@/lib/cn';
import { Field, SettingsBanner, SettingsSection } from './settings-section';

type Props = {
  settings: PlatformSettings;
  isLoading?: boolean;
  onSent: () => void;
};

type EmailDisplay = {
  host: string;
  port: string;
  user: string;
  from: string;
};

const FALLBACK: EmailDisplay = {
  host: 'smtp.eu.mailgun.org',
  port: '587',
  user: 'postmaster@mg.mypos.uz',
  from: 'MyPOS <noreply@mypos.uz>',
};

/** Pull SMTP-display fields from the settings payload (read-only). */
function hydrate(settings: PlatformSettings): EmailDisplay {
  const get = (key: string, dflt: string): string => {
    const v = settings[key];
    return typeof v === 'string' && v.length > 0 ? v : dflt;
  };
  return {
    host: get('smtp_host', FALLBACK.host),
    port: get('smtp_port', FALLBACK.port),
    user: get('smtp_user', FALLBACK.user),
    from: get('smtp_from', FALLBACK.from),
  };
}

/**
 * Read-only SMTP info + a test-email button. Wired to the settings
 * query for the display values; the test button simulates a 500ms
 * delay until the backend endpoint ships (`POST /super-admin/settings/test-email`).
 */
export function EmailSection({ settings, isLoading = false, onSent }: Props) {
  const t = useTranslations('settings_page');
  const [display, setDisplay] = useState<EmailDisplay>(() => hydrate(settings));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setDisplay(hydrate(settings));
  }, [settings]);

  const handleTest = async () => {
    setSending(true);
    await new Promise((resolve) => window.setTimeout(resolve, 500));
    setSending(false);
    onSent();
  };

  return (
    <SettingsSection
      id="email"
      icon={Mail}
      iconColor="text-blue-600 dark:text-blue-400"
      iconBg="bg-blue-50 dark:bg-blue-500/15"
      title={t('section_email')}
      description={t('section_email_desc')}
      showSave={false}
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleTest}
            disabled={sending || isLoading}
            aria-busy={sending}
            className={cn(
              'inline-flex items-center gap-1.5 h-9 px-4 rounded-md border text-sm font-bold transition-colors duration-150',
              'border-blue-200 dark:border-blue-500/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300',
              'hover:bg-blue-100 dark:hover:bg-blue-500/20',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            )}
          >
            <Send
              className={cn('h-3.5 w-3.5', sending && 'animate-pulse')}
              strokeWidth={2.2}
              aria-hidden="true"
            />
            {sending ? 'Yuborilmoqda…' : t('test_email_button')}
          </button>
        </div>
      }
    >
      <SettingsBanner icon={Lock}>{t('smtp_configured_note')}</SettingsBanner>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 4 }, (_, idx) => (
            <div key={idx} className="h-9 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      ) : (
        <>
          <Field label={t('smtp_host')}>
            <Input value={display.host} disabled className="w-full font-mono text-xs" />
          </Field>
          <Field label={t('smtp_port')}>
            <Input
              value={display.port}
              disabled
              className="w-full sm:max-w-[160px] tabular-nums font-mono text-xs"
            />
          </Field>
          <Field label={t('smtp_user')}>
            <Input value={display.user} disabled className="w-full font-mono text-xs" />
          </Field>
          <Field label={t('smtp_from')}>
            <Input value={display.from} disabled className="w-full font-mono text-xs" />
          </Field>
        </>
      )}
    </SettingsSection>
  );
}

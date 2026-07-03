'use client';

import { CreditCard, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Field, SettingsBanner, SettingsSection } from './settings-section';

type ProviderKey = 'click' | 'payme' | 'uzum' | 'apelsin';

const PROVIDERS: ReadonlyArray<{
  key: ProviderKey;
  merchantId: string;
  color: string;
  bg: string;
}> = [
  {
    key: 'click',
    merchantId: '12345',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-500/15',
  },
  {
    key: 'payme',
    merchantId: '5f7b2e9a8c1d4b3a2c5e6f8a',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-500/15',
  },
  {
    key: 'uzum',
    merchantId: '987654',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-500/15',
  },
  {
    key: 'apelsin',
    merchantId: 'AP-654321',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/15',
  },
];

type Props = {
  isLoading?: boolean;
};

/**
 * Read-only payment-provider config. The backend doesn't yet expose a
 * per-provider settings endpoint; the section renders placeholder
 * merchant IDs from the static list and shows a warning banner so the
 * operator knows it's intentional rather than broken.
 */
export function PaymentsSection({ isLoading = false }: Props) {
  const t = useTranslations('settings_page');

  return (
    <SettingsSection
      id="payments"
      icon={CreditCard}
      iconColor="text-purple-600 dark:text-purple-400"
      iconBg="bg-purple-50 dark:bg-purple-500/15"
      title={t('section_payments')}
      description={t('section_payments_desc')}
      showSave={false}
    >
      <SettingsBanner icon={Lock} variant="warning">
        Bu sozlamalar v2-da mavjud bo&apos;ladi · {t('configured_via_env')}
      </SettingsBanner>

      {isLoading ? (
        <ul className="grid gap-3 sm:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }, (_, idx) => (
            <li
              key={idx}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/40 p-4 space-y-3"
            >
              <div className="h-7 w-32 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
              <div className="h-9 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
              <div className="h-9 rounded animate-pulse bg-gray-200 dark:bg-gray-800" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {PROVIDERS.map((provider) => (
            <li
              key={provider.key}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/40 p-4"
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className={cn('flex h-8 w-8 items-center justify-center rounded-md', provider.bg)}
                  aria-hidden="true"
                >
                  <CreditCard className={cn('h-4 w-4', provider.color)} strokeWidth={2.2} />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {t(`payment_provider_${provider.key}` as const)}
                </p>
              </div>
              <div className="space-y-3">
                <Field label={t('payment_merchant_id')}>
                  <Input
                    value={provider.merchantId}
                    disabled
                    className="w-full font-mono text-xs"
                  />
                </Field>
                <Field label={t('payment_secret')}>
                  <Input
                    type="password"
                    value="•••••••••••••••••••••"
                    disabled
                    className="font-mono w-full text-xs"
                  />
                </Field>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  );
}

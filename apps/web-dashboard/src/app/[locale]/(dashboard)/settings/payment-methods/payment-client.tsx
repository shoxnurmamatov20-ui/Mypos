'use client';

import { Banknote, CreditCard, Globe, type LucideIcon, Smartphone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { cn } from '@mypos/ui';
import {
  PAYMENT_METHODS,
  type PaymentMethodKey,
  useSettingsHydrated,
  useSettingsStore,
} from '@/stores/settings';
import {
  type SegmentOption,
  SegmentedControl,
  SettingsCard,
  SettingsSkeleton,
  Toggle,
} from '../_components/settings-ui';

const METHOD_ICON: Record<PaymentMethodKey, LucideIcon> = {
  cash: Banknote,
  card: CreditCard,
  payme: Smartphone,
  click: Smartphone,
  online: Globe,
};

const METHOD_TINT: Record<PaymentMethodKey, string> = {
  cash: 'text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/15',
  card: 'text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-500/15',
  payme: 'text-cyan-600 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/15',
  click: 'text-blue-600 bg-blue-50 dark:text-blue-300 dark:bg-blue-500/15',
  online: 'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/15',
};

export function PaymentClient() {
  const hydrated = useSettingsHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <PaymentForm />;
}

function PaymentForm() {
  const t = useTranslations('settings');
  const payment = useSettingsStore((s) => s.payment);
  const togglePaymentMethod = useSettingsStore((s) => s.togglePaymentMethod);
  const setPayment = useSettingsStore((s) => s.setPayment);

  const enabledMethods = PAYMENT_METHODS.filter((k) => payment.enabled[k] ?? false);

  function handleToggle(key: PaymentMethodKey, value: boolean) {
    togglePaymentMethod(key, value);
    if (!value && key === payment.defaultMethod) {
      const next = PAYMENT_METHODS.find((k) => k !== key && (payment.enabled[k] ?? false));
      if (next) setPayment({ defaultMethod: next });
    }
    toast.success(
      value
        ? t('payment.method_enabled', { method: t(`payment.${key}`) })
        : t('payment.method_disabled', { method: t(`payment.${key}`) }),
    );
  }

  const defaultOptions: readonly SegmentOption<PaymentMethodKey>[] = enabledMethods.map((k) => ({
    value: k,
    label: t(`payment.${k}`),
    icon: METHOD_ICON[k],
  }));
  const defaultValue: PaymentMethodKey = enabledMethods.includes(payment.defaultMethod)
    ? payment.defaultMethod
    : (enabledMethods[0] ?? 'cash');

  return (
    <div className="space-y-6">
      <SettingsCard title={t('payment.methods')}>
        <div className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
          {PAYMENT_METHODS.map((key) => {
            const Icon = METHOD_ICON[key];
            return (
              <div key={key} className="flex items-center gap-3 py-3">
                <span
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                    METHOD_TINT[key],
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <span className="flex-1 text-sm font-semibold text-[#16221f] dark:text-[#e2e8f0]">
                  {t(`payment.${key}`)}
                </span>
                <Toggle
                  checked={payment.enabled[key] ?? false}
                  onChange={(v) => handleToggle(key, v)}
                  ariaLabel={t(`payment.${key}`)}
                />
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title={t('payment.default_method')} description={t('payment.default_hint')}>
        {enabledMethods.length === 0 ? (
          <p className="text-sm text-[#62716d] dark:text-[#94a3b8]">{t('payment.no_methods_enabled')}</p>
        ) : (
          <SegmentedControl
            options={defaultOptions}
            value={defaultValue}
            onChange={(v) => {
              setPayment({ defaultMethod: v });
              toast.success(t('payment.default_saved'));
            }}
            ariaLabel={t('payment.default_method')}
          />
        )}
      </SettingsCard>
    </div>
  );
}

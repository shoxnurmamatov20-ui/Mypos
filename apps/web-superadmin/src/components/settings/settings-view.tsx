'use client';

import { ApiError } from '@mypos/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Toast, useToast } from '@/components/ui/toast';
import { fetchSettings, type PlatformSettings, updateSettings } from '@/lib/api-helpers';
import { EmailSection } from './email-section';
import { FeaturesSection } from './features-section';
import { GeneralSection } from './general-section';
import { NotificationsSection } from './notifications-section';
import { PaymentsSection } from './payments-section';
import { SettingsNav } from './settings-nav';

export const SETTINGS_KEY = ['super-admin', 'settings'] as const;

/**
 * Settings landing. Two-column layout — sticky 220px vertical nav on
 * the left (collapses to a horizontal chip strip on mobile/tablet),
 * scrollable section column on the right. Each section is wired to its
 * own save handler so a PATCH only updates that slice of the platform
 * settings (optimistic update + rollback on error).
 */
export function SettingsView() {
  const t = useTranslations('settings_page');
  const queryClient = useQueryClient();
  const { state, show, close } = useToast();

  const settingsQuery = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
  });

  const settings: PlatformSettings = settingsQuery.data ?? {};
  const isLoading = settingsQuery.isLoading;
  const error = settingsQuery.error;

  /** Build a section save handler that PATCHes a slice of the platform settings. */
  const buildSaveHandler =
    (sectionKey: string) =>
    async (patch: Partial<PlatformSettings>): Promise<void> => {
      try {
        // Optimistic update — merge patch into the cached settings.
        const previous = queryClient.getQueryData<PlatformSettings>(SETTINGS_KEY) ?? {};
        const next: PlatformSettings = { ...previous, ...patch };
        queryClient.setQueryData<PlatformSettings>(SETTINGS_KEY, next);

        const updated = await updateSettings(patch);
        queryClient.setQueryData<PlatformSettings>(SETTINGS_KEY, updated);
        show(t('saved_toast'));
      } catch (err) {
        // Roll back: refetch from the source of truth.
        queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
        const message =
          err instanceof ApiError
            ? ((err.body as { message?: string } | undefined)?.message ?? err.message)
            : (err as Error).message;
        show(message ?? `${sectionKey}: ${t('saved_toast')}`, 'error');
        throw err;
      }
    };

  const onTestEmailSent = () => show(t('test_email_sent'));

  const labels = {
    general: t('section_general'),
    features: t('section_features'),
    email: t('section_email'),
    payments: t('section_payments'),
    notifications: t('section_notifications'),
  } as const;

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-300/60 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 p-6 md:p-8 text-center space-y-3"
      >
        <div
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20"
          aria-hidden="true"
        >
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" strokeWidth={2} />
        </div>
        <div>
          <p className="text-base font-bold text-red-900 dark:text-red-200">
            Sozlamalarni yuklab bo&apos;lmadi
          </p>
          <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80 break-words">
            {error instanceof Error ? error.message : String(error)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => settingsQuery.refetch()}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-red-300 dark:border-red-500/40 bg-white dark:bg-gray-900 text-sm font-bold text-red-700 dark:text-red-300 transition-colors duration-150 hover:bg-red-100 dark:hover:bg-red-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
        >
          <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.2} aria-hidden="true" />
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-4 md:space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 md:gap-6">
        <SettingsNav labels={labels} />

        <div className="space-y-4 md:space-y-6 min-w-0">
          <GeneralSection
            settings={settings}
            isLoading={isLoading}
            onSave={buildSaveHandler('general')}
          />
          <FeaturesSection
            settings={settings}
            isLoading={isLoading}
            onSave={buildSaveHandler('features')}
          />
          <EmailSection settings={settings} isLoading={isLoading} onSent={onTestEmailSent} />
          <PaymentsSection isLoading={isLoading} />
          <NotificationsSection
            settings={settings}
            isLoading={isLoading}
            onSave={buildSaveHandler('notifications')}
          />
        </div>
      </div>

      <Toast open={state.open} message={state.message} variant={state.variant} onClose={close} />
    </section>
  );
}

/** Standalone mutation wrapper, exported in case sections want to use it directly. */
export function useSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: (data) => {
      queryClient.setQueryData<PlatformSettings>(SETTINGS_KEY, data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEY });
    },
  });
}

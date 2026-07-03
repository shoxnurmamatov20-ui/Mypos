'use client';

import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';
import { canManageSignage } from '@/stores/signage';
import { SettingsCard, SettingsSkeleton } from '../../settings/_components/settings-ui';

/**
 * Wraps role-restricted (🔒) signage surfaces (Devices, Playlists). Shows a
 * skeleton while auth loads, a restricted notice for disallowed roles, and the
 * children otherwise. Managers/owners/admins/super-admins pass (see canManageSignage).
 */
export function RestrictedGate({ children }: { children: ReactNode }) {
  const t = useTranslations('signage');
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const user = useAuthStore((s) => s.user);

  if (!isLoaded) return <SettingsSkeleton />;

  if (!canManageSignage(user)) {
    return (
      <SettingsCard>
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(22,34,31,0.06)] text-[#62716d] dark:bg-white/10 dark:text-[#94a3b8]">
            <Lock className="h-5 w-5" />
          </span>
          <p className="text-base font-semibold text-[#16221f] dark:text-white">
            {t('restricted.title')}
          </p>
          <p className="max-w-[34ch] text-sm text-[#62716d] dark:text-[#94a3b8]">
            {t('restricted.desc')}
          </p>
        </div>
      </SettingsCard>
    );
  }

  return <>{children}</>;
}

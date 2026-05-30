'use client';

import { Lock, ToggleLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Switch } from '@/components/ui/switch';
import type { PlatformSettings } from '@/lib/api-helpers';
import { SettingsBanner, SettingsSection } from './settings-section';

type FeatureKey =
  | 'ai'
  | 'telegram'
  | 'kiosk'
  | 'courier'
  | 'qr_menu'
  | 'courier_tracking'
  | 'force_2fa'
  | 'manual_approval';

type FeatureFlags = Record<FeatureKey, boolean>;

const FEATURES: readonly FeatureKey[] = [
  'ai',
  'telegram',
  'kiosk',
  'courier',
  'qr_menu',
  'courier_tracking',
  'force_2fa',
  'manual_approval',
];

const FALLBACK: FeatureFlags = {
  ai: true,
  telegram: true,
  kiosk: false,
  courier: true,
  qr_menu: true,
  courier_tracking: false,
  force_2fa: true,
  manual_approval: false,
};

/** Hydrate the local form from the settings.feature_flags slice (with defaults). */
function hydrate(settings: PlatformSettings): FeatureFlags {
  const raw = settings.feature_flags ?? {};
  const out: FeatureFlags = { ...FALLBACK };
  for (const key of FEATURES) {
    if (typeof raw[key] === 'boolean') out[key] = raw[key];
  }
  return out;
}

type Props = {
  settings: PlatformSettings;
  isLoading?: boolean;
  /** Reserved — features section is currently read-only until the backend lands. */
  onSave?: (patch: Partial<PlatformSettings>) => Promise<void>;
};

/**
 * Platform-wide feature flags. Backend endpoint isn't writeable yet —
 * the section renders the current values from the settings payload but
 * keeps every toggle disabled. A warning banner spells out the
 * "read-only until v2" state so the operator knows it's intentional.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function FeaturesSection({ settings, isLoading = false, onSave: _onSave }: Props) {
  const t = useTranslations('settings_page');

  const [flags, setFlags] = useState<FeatureFlags>(() => hydrate(settings));

  useEffect(() => {
    setFlags(hydrate(settings));
  }, [settings]);

  const enabledCount = Object.values(flags).filter(Boolean).length;

  return (
    <SettingsSection
      id="features"
      icon={ToggleLeft}
      iconColor="text-emerald-600 dark:text-emerald-400"
      iconBg="bg-emerald-50 dark:bg-emerald-500/15"
      title={t('section_features')}
      description={`${t('section_features_desc')} · ${enabledCount} / ${FEATURES.length} yoqilgan`}
      showSave={false}
    >
      <SettingsBanner icon={Lock} variant="warning">
        Bu sozlamalar v2-da mavjud bo&apos;ladi — yo&apos;l xaritasida ovoz bering →
      </SettingsBanner>

      {isLoading ? (
        <ul className="space-y-3" aria-busy="true">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="h-12 rounded animate-pulse bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </ul>
      ) : (
        <ul
          className="divide-y divide-gray-100 dark:divide-gray-800/60"
          role="list"
        >
          {FEATURES.map((feature) => (
            <li key={feature} className="py-3 px-1">
              <Switch
                checked={flags[feature]}
                onChange={() => {
                  /* read-only until the backend ships */
                }}
                disabled
                label={t(`feature_${feature}` as const)}
                description={t(`feature_${feature}_desc` as const)}
              />
            </li>
          ))}
        </ul>
      )}
    </SettingsSection>
  );
}

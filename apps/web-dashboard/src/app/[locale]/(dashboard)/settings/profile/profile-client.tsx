'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth';
import { useSettingsHydrated, useSettingsStore } from '@/stores/settings';
import {
  Field,
  inputClass,
  primaryBtnClass,
  SettingsCard,
  SettingsSkeleton,
} from '../_components/settings-ui';

export function ProfileClient() {
  const hydrated = useSettingsHydrated();
  if (!hydrated) return <SettingsSkeleton />;
  return <ProfileForm />;
}

function ProfileForm() {
  const t = useTranslations('settings');
  const user = useAuthStore((s) => s.user);
  const profile = useSettingsStore((s) => s.profile);
  const setProfile = useSettingsStore((s) => s.setProfile);

  const [displayName, setDisplayName] = useState<string>(profile.displayName || user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const [phone, setPhone] = useState(profile.phone);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // The auth user loads asynchronously (authApi.me). When it arrives and the
  // user has no saved display-name override yet, seed the field from it.
  useEffect(() => {
    if (!profile.displayName && user?.name) setDisplayName(user.name);
  }, [user?.name, profile.displayName]);

  const role = user?.is_super_admin === true ? 'super_admin' : (user?.roles?.[0] ?? 'manager');
  const avatarInitial = (displayName || user?.email || '?').charAt(0).toUpperCase();

  function handleSaveAccount(e: React.FormEvent) {
    e.preventDefault();
    setProfile({ displayName, avatarUrl, phone });
    toast.success(t('saved'));
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error(t('profile.password_too_short'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('profile.password_mismatch'));
      return;
    }
    // No backend endpoint for password change yet.
    toast.info(t('profile.password_pending'));
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  }

  return (
    <div className="space-y-6">
      <SettingsCard title={t('profile.account')}>
        <form onSubmit={handleSaveAccount} className="space-y-5">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 text-2xl font-semibold text-white select-none">
                {avatarInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-[#16221f] dark:text-white">
                {displayName || user?.name || user?.email || '—'}
              </p>
              <p className="text-[13px] text-[#62716d] dark:text-[#94a3b8]">{role}</p>
            </div>
          </div>

          <Field label={t('profile.email')}>
            <input className={inputClass} type="email" value={user?.email ?? '—'} disabled readOnly />
          </Field>
          <Field label={t('profile.role')}>
            <input className={inputClass} type="text" value={role} disabled readOnly />
          </Field>

          <Field label={t('profile.display_name')}>
            <input
              className={inputClass}
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>
          <Field label={t('profile.avatar_url')}>
            <input
              className={inputClass}
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://"
            />
          </Field>
          <Field label={t('profile.phone')}>
            <input
              className={inputClass}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          <div className="flex justify-end">
            <button type="submit" className={primaryBtnClass}>
              {t('save')}
            </button>
          </div>
        </form>
      </SettingsCard>

      <SettingsCard title={t('profile.password')}>
        <form onSubmit={handleChangePassword} className="space-y-5">
          <Field label={t('profile.current_password')}>
            <input
              className={inputClass}
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
          <Field label={t('profile.new_password')}>
            <input
              className={inputClass}
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>
          <Field label={t('profile.confirm_password')}>
            <input
              className={inputClass}
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </Field>

          <div className="flex justify-end">
            <button type="submit" className={primaryBtnClass}>
              {t('save')}
            </button>
          </div>
        </form>
      </SettingsCard>
    </div>
  );
}

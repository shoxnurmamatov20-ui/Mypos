'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { passwordStrength } from './_new-tenant-schema';

const STRENGTH_COLOR = [
  'bg-gray-200 dark:bg-gray-800',
  'bg-red-500',
  'bg-amber-500',
  'bg-blue-500',
  'bg-emerald-500',
] as const;

const STRENGTH_TEXT = [
  'text-[#62716d] dark:text-[#94a3b8]',
  'text-[#b42318] dark:text-red-400',
  'text-[#b7791f] dark:text-amber-400',
  'text-blue-600 dark:text-blue-400',
  'text-[#18794e] dark:text-emerald-400',
] as const;

type Props = {
  value: string;
};

export function PasswordStrengthMeter({ value }: Props) {
  const t = useTranslations('tenant_new');

  const labels = useMemo(
    () => [
      '',
      t('password_strength_weak'),
      t('password_strength_medium'),
      t('password_strength_strong'),
      t('password_strength_very_strong'),
    ],
    [t],
  );

  if (!value) return null;
  const score = passwordStrength(value);

  return (
    <div
      className="mt-2 flex items-center gap-2"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={4}
      aria-valuenow={score}
      aria-label={`Parol kuchi: ${labels[score]}`}
    >
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-200',
              i < score
                ? STRENGTH_COLOR[score] ?? 'bg-gray-200 dark:bg-gray-800'
                : 'bg-gray-200 dark:bg-gray-800',
            )}
          />
        ))}
      </div>
      <span
        className={cn(
          'w-24 shrink-0 text-right text-xs font-bold transition-colors',
          STRENGTH_TEXT[score],
        )}
      >
        {labels[score] ?? ''}
      </span>
    </div>
  );
}

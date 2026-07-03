'use client';

import type { LucideIcon } from 'lucide-react';
import { Bell, CreditCard, Mail, Settings as SettingsIcon, ToggleLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export type SettingsSectionId = 'general' | 'features' | 'email' | 'payments' | 'notifications';

type NavItem = {
  id: SettingsSectionId;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
};

/**
 * Settings nav. On desktop (`lg+`) renders as a 220px sticky vertical
 * rail with an `IntersectionObserver` driving the active state. On
 * mobile/tablet it collapses into a horizontally-scrollable chip strip
 * so the operator can jump between sections without scrolling away
 * from the form they're editing. The active item gets a left teal
 * underline (vertical bar on desktop, bottom bar on mobile).
 */
export function SettingsNav({ labels }: { labels: Record<SettingsSectionId, string> }) {
  const ITEMS: ReadonlyArray<NavItem> = [
    {
      id: 'general',
      label: labels.general,
      icon: SettingsIcon,
      color: 'text-teal-700 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-500/15',
    },
    {
      id: 'features',
      label: labels.features,
      icon: ToggleLeft,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/15',
    },
    {
      id: 'email',
      label: labels.email,
      icon: Mail,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-500/15',
    },
    {
      id: 'payments',
      label: labels.payments,
      icon: CreditCard,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-500/15',
    },
    {
      id: 'notifications',
      label: labels.notifications,
      icon: Bell,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/15',
    },
  ];

  const [activeId, setActiveId] = useState<SettingsSectionId>('general');

  // Track which section is in view via IntersectionObserver. The first
  // section with the largest visible area wins so the active state
  // stays stable while the user scrolls.
  useEffect(() => {
    const sections = ITEMS.map((it) => document.getElementById(it.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveId(visible[0].target.id as SettingsSectionId);
      },
      { rootMargin: '-80px 0px -40% 0px', threshold: [0.1, 0.3, 0.5, 0.7, 0.9] },
    );

    for (const el of sections) {
      observer.observe(el);
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onClick = (id: SettingsSectionId, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    <aside className="lg:sticky lg:top-[74px] lg:self-start lg:max-h-[calc(100vh-90px)] lg:overflow-y-auto">
      <nav
        aria-label="Sozlamalar bo'limlari"
        className={cn(
          'rounded-xl border bg-white dark:bg-gray-900 p-2',
          'border-gray-200 dark:border-gray-800',
          // Mobile: horizontal scroll strip; desktop: vertical column.
          'flex gap-1 overflow-x-auto lg:overflow-x-visible lg:flex-col lg:gap-0.5',
        )}
      >
        {ITEMS.map(({ id, label, icon: Icon, color, bg }) => {
          const isActive = activeId === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => onClick(id, e)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 min-h-[44px]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                isActive
                  ? 'bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white',
              )}
            >
              {/* Active indicator — vertical bar on desktop, bottom border on mobile */}
              {isActive ? (
                <>
                  <span
                    className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-teal-700 dark:bg-teal-400"
                    aria-hidden="true"
                  />
                  <span
                    className="lg:hidden absolute left-2 right-2 bottom-0.5 h-[2px] rounded-full bg-teal-700 dark:bg-teal-400"
                    aria-hidden="true"
                  />
                </>
              ) : null}
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-md shrink-0 transition-colors',
                  isActive ? bg : 'bg-gray-100 dark:bg-gray-800',
                )}
                aria-hidden="true"
              >
                <Icon className={cn('h-3.5 w-3.5', isActive ? color : '')} strokeWidth={2} />
              </span>
              <span className="truncate">{label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

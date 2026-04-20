'use client';

import {
  BarChart3,
  Heart,
  Home,
  type LucideIcon,
  Settings,
  ShoppingCart,
  Table as TableIcon,
  User,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { SidebarItem } from './sidebar-item';

interface NavLink {
  key: string;
  href: string;
  icon: LucideIcon;
  tbd?: boolean;
}

interface NavGroup {
  key: 'operations' | 'menu' | 'business' | 'settings';
  items: NavLink[];
}

function buildGroups(locale: string): NavGroup[] {
  const base = `/${locale}`;
  return [
    {
      key: 'operations',
      items: [
        { key: 'dashboard', href: base, icon: Home },
        { key: 'orders', href: `${base}/orders`, icon: ShoppingCart, tbd: true },
        { key: 'tables', href: `${base}/tables`, icon: TableIcon },
      ],
    },
    {
      key: 'menu',
      items: [
        { key: 'menu', href: `${base}/menu`, icon: UtensilsCrossed },
        { key: 'categories', href: `${base}/menu`, icon: UtensilsCrossed },
      ],
    },
    {
      key: 'business',
      items: [
        { key: 'reports', href: `${base}/reports`, icon: BarChart3, tbd: true },
        { key: 'employees', href: `${base}/employees`, icon: Users, tbd: true },
        { key: 'customers', href: `${base}/customers`, icon: Heart, tbd: true },
      ],
    },
    {
      key: 'settings',
      items: [
        { key: 'settings', href: `${base}/settings`, icon: Settings, tbd: true },
        { key: 'profile', href: `${base}/profile`, icon: User, tbd: true },
      ],
    },
  ];
}

function isItemActive(href: string, pathname: string, localeBase: string): boolean {
  if (href === localeBase) {
    return pathname === localeBase || pathname === `${localeBase}/`;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface SidebarProps {
  locale: string;
  onNavigate?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function Sidebar({ locale, onNavigate, onClose, showCloseButton = false }: SidebarProps) {
  const tNav = useTranslations('nav');
  const tGroups = useTranslations('nav.groups');
  const pathname = usePathname();
  const groups = buildGroups(locale);
  const localeBase = `/${locale}`;

  return (
    <aside className="flex h-full w-60 flex-col bg-neutral-900 text-neutral-100">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-neutral-800 px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 font-display text-sm font-bold text-white">
            M
          </span>
          <span className="font-display text-lg font-bold text-white">MyPOS</span>
        </div>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-6">
          {groups.map((group) => (
            <li key={group.key}>
              <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                {tGroups(group.key)}
              </h2>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={`${group.key}-${item.key}-${item.href}`}>
                    <SidebarItem
                      href={item.href}
                      label={tNav(item.key)}
                      icon={item.icon}
                      isActive={isItemActive(item.href, pathname, localeBase)}
                      tbd={item.tbd ?? false}
                      onNavigate={onNavigate ?? (() => undefined)}
                    />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-neutral-800 px-5 py-3 text-xs text-neutral-500">
        MyPOS v0.1 · 2026
      </div>
    </aside>
  );
}

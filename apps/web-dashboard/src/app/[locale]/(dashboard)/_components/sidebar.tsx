'use client';

import {
  ArrowLeftRight,
  Bell,
  Bike,
  Box,
  Briefcase,
  Building2,
  Calculator,
  ChartPie,
  ChefHat,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  ConciergeBell,
  CreditCard,
  FileSpreadsheet,
  Handshake,
  House,
  Landmark,
  Lock,
  LogOut,
  type LucideIcon,
  Menu as MenuIcon,
  Monitor,
  Package,
  PackageMinus,
  PackagePlus,
  ScrollText,
  Settings,
  Store,
  Tag,
  Tags,
  Timer,
  Trash2,
  Tv,
  UserCheck,
  UserCog,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Warehouse,
  X,
  XCircle,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@mypos/ui';
import { useAuthStore } from '@/stores/auth';

type NavLeaf = { id: string; href: string };

type NavSection = {
  id: string;
  icon: LucideIcon;
  href?: string;
  items?: readonly NavLeaf[];
};

const SECTIONS: readonly NavSection[] = [
  { id: 'bosh_sahifa', icon: House, href: 'overview' },
  {
    id: 'ombor',
    icon: Warehouse,
    items: [
      { id: 'incoming', href: 'inventory/incoming' },
      { id: 'consumption', href: 'inventory/consumption' },
      { id: 'stock_balance', href: 'inventory/stock' },
      { id: 'incoming_log', href: 'inventory/incoming-log' },
      { id: 'transfers', href: 'inventory/transfers' },
      { id: 'inventarizatsiya', href: 'inventory/audit' },
      { id: 'waste', href: 'inventory/waste' },
    ],
  },
  {
    id: 'hisobotlar',
    icon: ChartPie,
    items: [
      { id: 'z_report', href: 'reports/z-report' },
      { id: 'orders_report', href: 'reports/orders' },
      { id: 'tables_report', href: 'reports/tables' },
      { id: 'waiters_report', href: 'reports/waiters' },
      { id: 'courier_report', href: 'reports/courier' },
      { id: 'menu_items_report', href: 'reports/menu-items' },
      { id: 'cancelled_report', href: 'reports/cancelled' },
      { id: 'debtors_report', href: 'reports/debtors' },
      { id: 'cashflow_report', href: 'reports/cashflow' },
    ],
  },
  {
    id: 'foydalanuvchilar',
    icon: UsersRound,
    items: [
      { id: 'staff_cashier', href: 'staff/cashier' },
      { id: 'staff_waiter', href: 'staff/waiter' },
      { id: 'staff_courier', href: 'staff/courier' },
      { id: 'staff_monoblok', href: 'staff/monoblok' },
      { id: 'staff_cook', href: 'staff/cook' },
      { id: 'staff_manager', href: 'staff/manager' },
      { id: 'staff_warehouse', href: 'staff/warehouse' },
      { id: 'visits', href: 'visits' },
    ],
  },
  {
    id: 'sozlamalar',
    icon: Settings,
    items: [{ id: 'notifications_log', href: 'notifications/log' }],
  },
  {
    id: 'moliya',
    icon: Wallet,
    items: [{ id: 'payments', href: 'payments' }],
  },
  {
    id: 'nomenklatura',
    icon: Tags,
    items: [
      { id: 'menu_categories', href: 'menu/categories' },
      { id: 'menu_items', href: 'menu/items' },
    ],
  },
  { id: 'menyu_translyatsiya', icon: Tv, items: [] },
  {
    id: 'magazin',
    icon: Store,
    items: [
      { id: 'orders', href: 'orders' },
      { id: 'tables', href: 'tables' },
      { id: 'table_categories', href: 'tables/categories' },
    ],
  },
];

const LEAF_ICONS: Record<string, LucideIcon> = {
  // Ombor (warehouse) — 7 sub-items per founder spec 2026-05-28
  incoming: PackagePlus,
  consumption: PackageMinus,
  stock_balance: Package,
  incoming_log: ScrollText,
  transfers: ArrowLeftRight,
  inventarizatsiya: ClipboardCheck,
  waste: Trash2,
  // Hisobotlar (Reports) — 9 sub-items 2026-05-28
  z_report: Calculator,
  orders_report: ClipboardList,
  tables_report: Store,
  waiters_report: UsersRound,
  courier_report: Bike,
  menu_items_report: UtensilsCrossed,
  cancelled_report: XCircle,
  debtors_report: Handshake,
  cashflow_report: Landmark,
  // Foydalanuvchilar (Users) — 8 sub-items 2026-05-28
  staff_cashier: CreditCard,
  staff_waiter: ConciergeBell,
  staff_courier: Bike,
  staff_monoblok: Monitor,
  staff_cook: ChefHat,
  staff_manager: Briefcase,
  staff_warehouse: Warehouse,
  visits: UserCheck,
  // Other domains
  inventory_categories: Tag,
  ingredients: Box,
  reports: ChartPie,
  customers: UsersRound,
  employees: UserCog,
  shifts: Timer,
  departments: Building2,
  notifications_log: Bell,
  payments: CreditCard,
  menu_categories: Tag,
  menu_items: UtensilsCrossed,
  orders: ClipboardList,
  tables: Store,
  table_categories: Tag,
};
// Force-include unused icons to avoid Tailwind tree-shake (these may be used
// by a future "locked" overlay or new report types).
const _unusedIcons = { FileSpreadsheet, Lock };
void _unusedIcons;

const SECTION_ICON_COLOR: Record<string, string> = {
  bosh_sahifa: 'text-sky-500 dark:text-sky-400',
  ombor: 'text-amber-500 dark:text-amber-400',
  hisobotlar: 'text-violet-500 dark:text-violet-400',
  foydalanuvchilar: 'text-emerald-500 dark:text-emerald-400',
  sozlamalar: 'text-indigo-500 dark:text-indigo-400',
  moliya: 'text-green-500 dark:text-green-400',
  nomenklatura: 'text-pink-500 dark:text-pink-400',
  menyu_translyatsiya: 'text-cyan-500 dark:text-cyan-400',
  magazin: 'text-rose-500 dark:text-rose-400',
};

export function Sidebar() {
  const t = useTranslations('sidebar');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const [open, setOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const initial = (user?.name?.trim()?.charAt(0) ?? user?.email?.charAt(0) ?? 'M').toUpperCase();
  const role = user?.is_super_admin ? 'super_admin' : user?.roles?.[0] ?? 'manager';

  const sectionWithActivePath = useMemo(() => {
    for (const s of SECTIONS) {
      if (!s.items) continue;
      if (s.items.some((it) => pathname.startsWith(`/${locale}/${it.href}`))) return s.id;
    }
    return null;
  }, [pathname, locale]);

  const [openSection, setOpenSection] = useState<string | null>(sectionWithActivePath);

  useEffect(() => {
    if (sectionWithActivePath) setOpenSection(sectionWithActivePath);
  }, [sectionWithActivePath]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    await logout();
    const portal = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';
    if (typeof window !== 'undefined') {
      window.location.href = `${portal}/${locale}/logout`;
    }
  };

  const content = (
    <>
      {/* Compact header (himoya pattern) */}
      <div className="flex items-center gap-2.5 px-5 h-[58px] border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)]">
        <div className="h-7 w-7 flex-shrink-0 rounded-md bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center">
          <Store className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        <span className="flex-1 text-[15px] font-bold tracking-tight text-[#16221f] dark:text-white">
          MyPOS
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lg:hidden -m-1.5 p-1.5 text-[#62716d] hover:text-[#16221f] dark:text-[#94a3b8] dark:hover:text-white transition-colors"
          aria-label={tCommon('close')}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 [scrollbar-width:thin] [scrollbar-color:rgba(22,34,31,0.15)_transparent] dark:[scrollbar-color:rgba(255,255,255,0.12)_transparent]">
        <ul className="space-y-0.5">
          {SECTIONS.map((section) => {
            const label = t(section.id);
            const Icon = section.icon;
            const isAccordion = !!section.items;

            if (!isAccordion) {
              const fullHref = `/${locale}/${section.href}` as Route;
              const isActive = pathname === fullHref && openSection === null;
              return (
                <li key={section.id}>
                  <Link
                    href={fullHref}
                    prefetch
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-3 px-3 h-10 rounded-lg text-[13.5px] font-semibold tracking-tight transition-all duration-150 active:scale-[0.98]',
                      'outline-none focus:outline-none',
                      isActive
                        ? 'bg-[#e6faf5] text-[#0f766e] dark:bg-teal-500/15 dark:text-teal-300 shadow-[inset_0_0_0_1px_rgba(15,118,110,0.18)] dark:shadow-[inset_0_0_0_1px_rgba(20,184,166,0.18)]'
                        : 'text-[#16221f] hover:bg-[#eef4f3] dark:text-[#94a3b8] dark:hover:bg-[#1a2235] dark:hover:text-white',
                    )}
                  >
                    {isActive ? (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#0f766e] dark:bg-teal-400"
                      />
                    ) : null}
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110',
                        SECTION_ICON_COLOR[section.id] ?? 'text-[#62716d] dark:text-[#94a3b8]',
                      )}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                    <span className="flex-1">{label}</span>
                  </Link>
                </li>
              );
            }

            const items = section.items ?? [];
            const isOpen = openSection === section.id;

            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : section.id)}
                  aria-expanded={isOpen}
                  className={cn(
                    'group relative flex items-center gap-3 w-full px-3 h-10 rounded-lg text-[13.5px] font-semibold tracking-tight transition-all duration-150 active:scale-[0.98]',
                    'outline-none focus:outline-none',
                    isOpen
                      ? 'bg-[#e6faf5] text-[#0f766e] dark:bg-teal-500/15 dark:text-teal-300 shadow-[inset_0_0_0_1px_rgba(15,118,110,0.18)] dark:shadow-[inset_0_0_0_1px_rgba(20,184,166,0.18)]'
                      : 'text-[#16221f] hover:bg-[#eef4f3] dark:text-[#94a3b8] dark:hover:bg-[#1a2235] dark:hover:text-white',
                  )}
                >
                  {isOpen ? (
                    <span
                      aria-hidden
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#0f766e] dark:bg-teal-400"
                    />
                  ) : null}
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] flex-shrink-0 transition-transform group-hover:scale-110',
                      SECTION_ICON_COLOR[section.id] ?? 'text-[#62716d] dark:text-[#94a3b8]',
                    )}
                    strokeWidth={isOpen ? 2.4 : 2}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  <ChevronRight
                    className={cn(
                      'h-[14px] w-[14px] flex-shrink-0 transition-transform duration-200 ease-out',
                      isOpen
                        ? 'rotate-90 text-[#0f766e] dark:text-teal-300'
                        : 'text-[#62716d] dark:text-[#94a3b8]',
                    )}
                    strokeWidth={2.2}
                  />
                </button>

                <div
                  className={cn(
                    'grid transition-[grid-template-rows] duration-200 ease-out',
                    isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="pl-4 pr-1 pt-1 pb-0.5">
                      <ul className="relative space-y-px border-l border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] pl-3">
                        {items.length === 0 ? (
                          <li className="px-3 py-2 text-[12px] text-[#62716d] dark:text-[#94a3b8] italic">
                            —
                          </li>
                        ) : (
                          items.map((it) => {
                            const fullHref = `/${locale}/${it.href}` as Route;
                            const isActive =
                              pathname === fullHref || pathname.startsWith(`${fullHref}/`);
                            const ItemIcon = LEAF_ICONS[it.id] ?? Tag;
                            return (
                              <li key={it.id}>
                                <Link
                                  href={fullHref}
                                  prefetch
                                  aria-current={isActive ? 'page' : undefined}
                                  className={cn(
                                    'group relative flex items-center gap-2.5 px-3 h-8 rounded-md text-[12.5px] font-medium tracking-tight transition-all duration-150 active:scale-[0.98]',
                                    'outline-none focus:outline-none',
                                    isActive
                                      ? 'bg-[#e6faf5] text-[#0f766e] dark:bg-teal-500/15 dark:text-teal-300 font-semibold'
                                      : 'text-[#62716d] hover:bg-[#eef4f3] hover:text-[#16221f] dark:text-[#94a3b8] dark:hover:bg-[#1a2235] dark:hover:text-white',
                                  )}
                                >
                                  {isActive ? (
                                    <span
                                      aria-hidden
                                      className="absolute -left-[13px] top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r-full bg-[#0f766e] dark:bg-teal-400"
                                    />
                                  ) : null}
                                  <ItemIcon
                                    className={cn(
                                      'h-[14px] w-[14px] flex-shrink-0 transition-transform group-hover:scale-110',
                                      SECTION_ICON_COLOR[section.id] ?? 'text-[#62716d] dark:text-[#94a3b8]',
                                    )}
                                    strokeWidth={isActive ? 2.4 : 2}
                                  />
                                  <span>{t(it.id)}</span>
                                </Link>
                              </li>
                            );
                          })
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] p-3">
        {user ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="relative h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 ring-2 ring-white dark:ring-[#0b1120] flex items-center justify-center text-white text-sm font-bold tracking-tight">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold tracking-tight text-[#16221f] dark:text-white truncate">
                {user.name || user.email}
              </p>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#62716d] dark:text-[#94a3b8] truncate">
                {role}
              </p>
            </div>
          </div>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex items-center gap-3 w-full px-3 h-9 rounded-lg text-[13px] font-semibold tracking-tight text-[#62716d] dark:text-[#94a3b8] hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-300 transition-colors active:scale-[0.98] outline-none focus:outline-none"
        >
          <LogOut className="h-[15px] w-[15px]" strokeWidth={2} />
          <span>{tCommon('logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-30 bg-white dark:bg-[#0b1120] border-b border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] flex items-center gap-3 px-4 h-14">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[#62716d] hover:text-[#16221f] dark:text-[#94a3b8] dark:hover:text-white -ml-1.5 p-1.5 rounded-md hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] transition-colors"
          aria-label={tCommon('menu')}
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center flex-shrink-0">
            <Store className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="text-sm font-bold tracking-tight text-[#16221f] dark:text-white truncate">
            MyPOS
          </p>
        </div>
      </header>

      {/* Mobile backdrop */}
      {open ? (
        <button
          type="button"
          aria-label={tCommon('close')}
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-[#16221f]/40 dark:bg-[#0b1120]/70 backdrop-blur-sm"
        />
      ) : null}

      {/* Desktop sidebar — matches page bg (white / #0b1120) + himoya borders */}
      <aside
        className="hidden lg:flex lg:w-[260px] lg:flex-col lg:min-h-screen lg:border-r lg:border-[rgba(22,34,31,0.09)] dark:lg:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#0b1120]"
        aria-label="Primary"
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          'lg:hidden fixed top-0 bottom-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white dark:bg-[#0b1120] border-r border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] flex flex-col transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {content}
      </aside>
    </>
  );
}

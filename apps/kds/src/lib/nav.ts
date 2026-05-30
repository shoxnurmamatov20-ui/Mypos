import type { LucideIcon } from 'lucide-react';
import { History, LayoutGrid, Settings } from 'lucide-react';

/**
 * The Kitchen panel's entire navigation surface — three sections, all
 * of them about running the line. There is deliberately nothing else
 * here: no tenants, no billing, no admin. A cook opens this app to
 * work tickets, review what went out, and tune their station.
 */

export type KitchenNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export type KitchenNavGroup = {
  /** Tiny uppercase header rendered above the group's items. */
  label: string;
  items: readonly KitchenNavItem[];
};

export const KITCHEN_NAV: readonly KitchenNavGroup[] = [
  {
    label: 'Oshxona',
    items: [
      { href: '/board', label: 'Buyurtmalar', icon: LayoutGrid },
      { href: '/history', label: 'Tarix', icon: History },
    ],
  },
  {
    label: 'Tizim',
    items: [{ href: '/settings', label: 'Sozlamalar', icon: Settings }],
  },
];

/** Resolve a pathname to its page label for the topbar breadcrumb. */
export function pageLabelFor(pathname: string): string {
  for (const group of KITCHEN_NAV) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return item.label;
      }
    }
  }
  return 'Oshxona';
}

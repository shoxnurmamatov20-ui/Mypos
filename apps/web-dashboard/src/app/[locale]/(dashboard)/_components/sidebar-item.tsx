'use client';

import { cn } from '@mypos/ui';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface SidebarItemProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  tbd?: boolean;
  onNavigate?: () => void;
}

export function SidebarItem({
  href,
  label,
  icon: Icon,
  isActive,
  tbd = false,
  onNavigate,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
        isActive
          ? 'bg-brand-500/15 text-white'
          : 'text-neutral-400 hover:bg-neutral-800 hover:text-white',
        tbd && !isActive && 'opacity-60',
      )}
    >
      <Icon
        className={cn(
          'h-4 w-4 shrink-0 transition',
          isActive ? 'text-brand-400' : 'text-neutral-500 group-hover:text-neutral-200',
        )}
        aria-hidden
      />
      <span className="flex-1 truncate">{label}</span>
      {tbd && (
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">
          TBD
        </span>
      )}
    </Link>
  );
}

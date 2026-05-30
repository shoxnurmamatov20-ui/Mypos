'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  Eye,
  LogIn,
  MoreVertical,
  Pencil,
  PauseCircle,
  PlayCircle,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import type { TenantStatus } from '@/types/super-admin';

export type TenantAction =
  | 'view'
  | 'edit'
  | 'suspend'
  | 'resume'
  | 'impersonate'
  | 'delete';

type Props = {
  status: TenantStatus;
  onAction: (action: TenantAction) => void;
};

type MenuItem = {
  id: TenantAction;
  icon: LucideIcon;
  labelKey: string;
  destructive?: boolean;
};

const BASE_ITEMS: MenuItem[] = [
  { id: 'view', icon: Eye, labelKey: 'action_view' },
  { id: 'edit', icon: Pencil, labelKey: 'action_edit' },
  { id: 'impersonate', icon: LogIn, labelKey: 'action_impersonate' },
];

export function TenantActionMenu({ status, onAction }: Props) {
  const t = useTranslations('tenants_page');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Suspend/resume swap depending on status.
  const isSuspended = status === 'suspended';
  const items: MenuItem[] = [
    ...BASE_ITEMS,
    isSuspended
      ? { id: 'resume', icon: PlayCircle, labelKey: 'action_resume' }
      : { id: 'suspend', icon: PauseCircle, labelKey: 'action_suspend' },
    { id: 'delete', icon: Trash2, labelKey: 'action_delete', destructive: true },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Amallar"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md text-[#62716d] dark:text-[#94a3b8] transition-colors active:scale-95',
          'hover:bg-[#eef4f3] dark:hover:bg-[#1a2235] hover:text-[#16221f] dark:hover:text-white',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e] dark:focus-visible:ring-[#14b8a6] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#111827]',
        )}
      >
        <MoreVertical className="h-4 w-4" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 z-30 mt-1 w-48 origin-top-right overflow-hidden rounded-[10px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-1 shadow-[0_4px_20px_rgba(18,34,31,0.08)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            onClick={(event) => event.stopPropagation()}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpen(false);
                    onAction(item.id);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-semibold transition-colors',
                    item.destructive
                      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'text-[#16221f] dark:text-[#e2e8f0] hover:bg-[#eef4f3] dark:hover:bg-[#1a2235]',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{t(item.labelKey)}</span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

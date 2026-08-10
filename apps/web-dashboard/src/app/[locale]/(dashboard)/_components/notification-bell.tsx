'use client';

import { type NotificationLog, notificationsApi } from '@mypos/api-client';
import { cn } from '@mypos/ui';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api';

/**
 * Topbar notification bell — wired to `/api/v1/notifications`.
 *
 * The previous version rendered three hardcoded Uzbek strings ("Pomidor kam
 * qoldi", "187K so'm to'lov", "3 yangi") and a permanently-lit red dot, which on
 * a production panel reads as real data. The chrome is unchanged; only the
 * source is. The dot now appears only when something is genuinely unread.
 */
const UNREAD_STATUSES = new Set(['queued', 'sent', 'delivered']);

const DOT_TONE: Record<string, string> = {
  failed: 'bg-rose-500',
  unread: 'bg-teal-600 dark:bg-teal-400',
  read: 'bg-[#cbd5e1] dark:bg-[#475569]',
};

function relativeTime(iso: string, locale: string): string {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffMs = then - Date.now();
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const minute = 60_000;
  const hour = 60 * minute;
  if (abs < hour) return rtf.format(Math.round(diffMs / minute), 'minute');
  if (abs < 24 * hour) return rtf.format(Math.round(diffMs / hour), 'hour');
  return rtf.format(Math.round(diffMs / (24 * hour)), 'day');
}

export function NotificationBell() {
  const t = useTranslations('top_bar');
  const tCommon = useTranslations('common');
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'uz';
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notifications-bell'],
    queryFn: () => notificationsApi.list(apiClient, { per_page: 6 }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const items: NotificationLog[] = data?.data ?? [];
  const unread = items.filter((n) => UNREAD_STATUSES.has(n.status)).length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('notifications')}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-[#62716d] transition-colors outline-none hover:bg-[#eef4f3] hover:text-[#16221f] focus:outline-none dark:text-[#94a3b8] dark:hover:bg-[#1a2235] dark:hover:text-white"
      >
        <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute top-2 right-2 inline-flex h-[7px] w-[7px] rounded-full bg-rose-500 ring-2 ring-white dark:ring-[#0b1120]"
          />
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t('notifications')}
          className="absolute right-0 z-40 mt-2 w-[300px] overflow-hidden rounded-xl border border-[rgba(22,34,31,0.09)] bg-white shadow-xl shadow-black/5 dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827] dark:shadow-black/30"
        >
          <div className="flex items-center justify-between border-b border-[rgba(22,34,31,0.06)] px-4 py-3 dark:border-[rgba(255,255,255,0.05)]">
            <p className="text-[13px] font-semibold text-[#16221f] dark:text-white">
              {t('notifications')}
            </p>
            {unread > 0 ? (
              <span className="text-[11px] font-medium text-[#62716d] tabular-nums dark:text-[#94a3b8]">
                {t('notifications_unread', { count: unread })}
              </span>
            ) : null}
          </div>

          <div className="max-h-[280px] overflow-y-auto py-1">
            {isLoading ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-[#62716d] dark:text-[#94a3b8]">
                {tCommon('loading')}
              </p>
            ) : isError ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-[#62716d] dark:text-[#94a3b8]">
                {tCommon('error')}
              </p>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-[#62716d] dark:text-[#94a3b8]">
                {t('notifications_empty')}
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-[#f5f8f7] dark:hover:bg-[#0b1120]"
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 flex-shrink-0 rounded-full',
                      DOT_TONE[
                        n.status === 'failed'
                          ? 'failed'
                          : UNREAD_STATUSES.has(n.status)
                            ? 'unread'
                            : 'read'
                      ],
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-[#16221f] dark:text-white">
                      {n.subject || n.body}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                      {relativeTime(n.created_at, locale)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[rgba(22,34,31,0.06)] px-4 py-2 dark:border-[rgba(255,255,255,0.05)]">
            <Link
              href={`/${locale}/notifications/log` as Route}
              onClick={() => setOpen(false)}
              className="block w-full text-center text-[12px] font-semibold text-[#0f766e] hover:underline dark:text-teal-400"
            >
              {t('notifications_view_all')}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

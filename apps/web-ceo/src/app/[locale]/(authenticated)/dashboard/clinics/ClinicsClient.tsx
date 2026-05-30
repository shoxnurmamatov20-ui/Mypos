'use client';

import { AlertTriangle, ArrowRight, Inbox, Star, Stethoscope, Users } from 'lucide-react';
import type { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { type Clinic, type ClinicsResponse, ceoFetch } from '@/lib/api';
import { cn } from '@/lib/cn';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

export function ClinicsClient({ locale }: { locale: string }) {
  const t = useTranslations('clinics');
  const [items, setItems] = useState<Clinic[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    ceoFetch<ClinicsResponse>('/api/v1/ceo/clinics')
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((e) => {
        if (cancelled) return;
        const status = (e as { status?: number }).status ?? 0;
        if (status === 401 || status === 403) {
          window.location.href = `${PORTAL_URL}/${locale}/login`;
          return;
        }
        setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return (
    <div className="space-y-3.5">
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        action={
          items ? (
            <span className="inline-flex items-center rounded-md border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-2.5 h-8 text-[12px] font-bold tabular-nums text-[#16221f] dark:text-white">
              {t('count', { count: items.length })}
            </span>
          ) : undefined
        }
      />

      {error ? (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
          {error}
        </div>
      ) : items === null ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-[200px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] py-16 text-[#62716d] dark:text-[#94a3b8]">
          <Inbox className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
          <p className="text-[13px]">{t('empty')}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((c) => (
            <ClinicCard key={c.id} clinic={c} locale={locale} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClinicCard({
  clinic: c,
  locale,
  t,
}: {
  clinic: Clinic;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const detailUrl = `/${locale}/dashboard/clinics/${c.id}` as Route;

  return (
    <article className="flex flex-col rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-[16px_18px] transition-colors">
      <div className="flex items-start gap-3">
        {c.logo_url ? (
          <Image
            src={c.logo_url}
            alt={c.name}
            width={44}
            height={44}
            className="h-11 w-11 rounded-[10px] object-cover flex-shrink-0"
            unoptimized
          />
        ) : (
          <div className="h-11 w-11 rounded-[10px] bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0">
            {c.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-bold text-[#16221f] dark:text-white truncate">
            {c.name}
          </h3>
          {c.region ? (
            <p className="mt-0.5 text-[11px] text-[#62716d] dark:text-[#94a3b8] truncate">
              {c.region}
            </p>
          ) : null}
          <div className="mt-1.5">
            <Badge variant={c.is_active ? 'success' : 'secondary'}>
              {c.is_active ? t('active') : t('inactive')}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5">
        <MiniStat
          icon={<Users className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_doctors')}
          value={c.doctors_count.toString()}
        />
        <MiniStat
          icon={<Star className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_rating')}
          value={c.feedback.avg_rating ? c.feedback.avg_rating.toFixed(1) : '—'}
        />
        <MiniStat
          icon={<Stethoscope className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_feedback')}
          value={c.feedback.total.toString()}
        />
        <MiniStat
          icon={<AlertTriangle className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_complaints_open')}
          value={c.complaints.open.toString()}
          tone={c.complaints.urgent > 0 ? 'danger' : 'default'}
        />
      </div>

      <Link
        href={detailUrl}
        className={cn(
          'mt-3.5 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg text-[13px] font-semibold transition-colors active:scale-95',
          'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
          'dark:bg-emerald-950/50 dark:text-emerald-300 dark:hover:bg-emerald-900/50',
        )}
      >
        {t('details')}
        <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </Link>
    </article>
  );
}

function MiniStat({
  icon,
  label,
  value,
  tone = 'default',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <div className="rounded-[10px] bg-[#f8fafc] dark:bg-[#1a2235] p-2.5">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
        {icon}
        <span className="truncate">{label}</span>
      </p>
      <p
        className={cn(
          'mt-1 text-[15px] font-black tabular-nums',
          tone === 'danger' ? 'text-[#b42318] dark:text-red-300' : 'text-[#16221f] dark:text-white',
        )}
      >
        {value}
      </p>
    </div>
  );
}

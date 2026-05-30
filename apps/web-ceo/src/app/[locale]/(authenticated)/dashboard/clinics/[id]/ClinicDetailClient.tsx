'use client';

import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  Inbox,
  MessageSquare,
  ShieldAlert,
  Star,
  Users,
} from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { ApiError, type ClinicDetail, type ClinicDetailResponse, ceoFetch } from '@/lib/api';
import { DepartmentsSection, DoctorsSection, RecentFeedbackSection } from './_components/sections';
import { StatTile } from './_components/stat-tile';

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:3000/panel/portal';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: ClinicDetail };

export function ClinicDetailClient({ locale, id }: { locale: string; id: string }) {
  const t = useTranslations('clinics');
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    ceoFetch<ClinicDetailResponse>(`/api/v1/ceo/clinics/${encodeURIComponent(id)}`)
      .then((res) => {
        if (!cancelled) setState({ kind: 'ready', data: res.data });
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof ApiError) {
          if (e.status === 401 || e.status === 403) {
            window.location.href = `${PORTAL_URL}/${locale}/login`;
            return;
          }
          if (e.status === 404) {
            setState({ kind: 'not_found' });
            return;
          }
        }
        setState({ kind: 'error', message: String(e) });
      });
    return () => {
      cancelled = true;
    };
  }, [id, locale]);

  const backHref = `/${locale}/dashboard/clinics` as Route;

  return (
    <div className="space-y-3.5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#62716d] dark:text-[#94a3b8] hover:text-[#16221f] dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
        {t('back_to_list')}
      </Link>

      {state.kind === 'loading' ? <LoadingSkeleton /> : null}
      {state.kind === 'not_found' ? <NotFoundPanel /> : null}
      {state.kind === 'error' ? <ErrorPanel message={state.message} /> : null}
      {state.kind === 'ready' ? <Ready data={state.data} locale={locale} /> : null}
    </div>
  );
}

function Ready({ data, locale }: { data: ClinicDetail; locale: string }) {
  const t = useTranslations('clinics');
  const s = data.stats;

  return (
    <>
      <PageHeader
        title={data.name}
        subtitle={data.region ?? data.address ?? undefined}
        action={
          <Badge variant={data.is_active ? 'success' : 'secondary'}>
            {data.is_active ? t('active') : t('inactive')}
          </Badge>
        }
      />

      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
        <StatTile
          icon={<Building2 className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_departments')}
          value={s.departments_count.toString()}
        />
        <StatTile
          icon={<Users className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_doctors')}
          value={s.doctors_count.toString()}
        />
        <StatTile
          icon={<MessageSquare className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_feedback')}
          value={s.feedback_total.toString()}
        />
        <StatTile
          icon={<Star className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_rating')}
          value={s.avg_rating ? s.avg_rating.toFixed(1) : '—'}
        />
        <StatTile
          icon={<BadgeCheck className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_verified')}
          value={s.verified_count.toString()}
        />
        <StatTile
          icon={<AlertTriangle className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_complaints_open')}
          value={s.open_complaints.toString()}
          tone={s.open_complaints > 0 ? 'warning' : 'default'}
        />
        <StatTile
          icon={<ShieldAlert className="h-3 w-3" strokeWidth={2.2} />}
          label={t('stat_complaints_urgent')}
          value={s.urgent_complaints.toString()}
          tone={s.urgent_complaints > 0 ? 'danger' : 'default'}
        />
      </div>

      <DepartmentsSection departments={data.departments} />
      <DoctorsSection doctors={data.doctors} />
      <RecentFeedbackSection feedback={data.recent_feedback} locale={locale} />
    </>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3.5">
      <div className="h-[60px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse" />
      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-7">
        {['d', 'r', 'f', 'a', 'v', 'o', 'u'].map((k) => (
          <div
            key={`skel-${k}`}
            className="h-[78px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse"
          />
        ))}
      </div>
      <div className="h-[180px] rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-[#f8fafc] dark:bg-[#111827] animate-pulse" />
    </div>
  );
}

function NotFoundPanel() {
  const t = useTranslations('clinics');
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] py-16 text-[#62716d] dark:text-[#94a3b8]">
      <Inbox className="w-8 h-8 mb-2 opacity-60" strokeWidth={1.5} />
      <p className="text-[13px]">{t('not_found')}</p>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 text-[13px] text-[#b42318] dark:text-red-300">
      {message}
    </div>
  );
}

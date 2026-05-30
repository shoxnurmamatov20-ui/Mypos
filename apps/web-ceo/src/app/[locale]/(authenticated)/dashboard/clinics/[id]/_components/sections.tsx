'use client';

import { CheckCircle2, Star, Stethoscope } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import type { ClinicDepartment, ClinicDoctor, ClinicFeedback } from '@/lib/api';
import { cn } from '@/lib/cn';

const SENTIMENT_VARIANT: Record<string, 'success' | 'secondary' | 'destructive'> = {
  positive: 'success',
  neutral: 'secondary',
  negative: 'destructive',
};

export function DepartmentsSection({ departments }: { departments: ClinicDepartment[] }) {
  const t = useTranslations('clinics');
  if (departments.length === 0) return null;
  return (
    <section className="rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-5">
      <h2 className="text-[14px] font-bold text-[#16221f] dark:text-white mb-3">
        {t('section_departments')}
      </h2>
      <ul className="divide-y divide-[rgba(22,34,31,0.06)] dark:divide-[rgba(255,255,255,0.05)]">
        {departments.map((d) => (
          <li key={d.id} className="flex items-center justify-between py-2.5">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#16221f] dark:text-white truncate">
                {d.name}
              </p>
              <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8] tabular-nums">
                {t('doctors_count', { count: d.doctors_count })}
              </p>
            </div>
            <Badge variant={d.is_active ? 'success' : 'secondary'}>
              {d.is_active ? t('active') : t('inactive')}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function DoctorsSection({ doctors }: { doctors: ClinicDoctor[] }) {
  const t = useTranslations('clinics');
  if (doctors.length === 0) return null;
  return (
    <section className="rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-5">
      <h2 className="text-[14px] font-bold text-[#16221f] dark:text-white mb-3">
        {t('section_doctors')}
      </h2>
      <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {doctors.map((d) => (
          <div
            key={d.id}
            className="flex items-start gap-3 rounded-[10px] bg-[#f8fafc] dark:bg-[#1a2235] p-3"
          >
            {d.photo_url ? (
              <Image
                src={d.photo_url}
                alt={d.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                unoptimized
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0">
                {d.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#16221f] dark:text-white truncate">
                {d.name}
              </p>
              {d.specialty ? (
                <p className="text-[11px] text-[#62716d] dark:text-[#94a3b8] truncate">
                  {d.specialty}
                </p>
              ) : null}
              {d.department ? (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-950/50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  <Stethoscope className="h-2.5 w-2.5" strokeWidth={2.5} />
                  <span className="truncate">{d.department.name}</span>
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stars({ value }: { value: number | null }) {
  const rating = value ?? 0;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            'h-3.5 w-3.5',
            n <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-[#cbd5e1] dark:text-[#334155]',
          )}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string | null, locale: string) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function RecentFeedbackSection({
  feedback,
  locale,
}: {
  feedback: ClinicFeedback[];
  locale: string;
}) {
  const t = useTranslations('clinics');
  if (feedback.length === 0) return null;
  return (
    <section className="rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] p-5">
      <h2 className="text-[14px] font-bold text-[#16221f] dark:text-white mb-3">
        {t('section_recent_feedback')}
      </h2>
      <ul className="space-y-3">
        {feedback.map((f) => {
          const sentimentVariant = (f.sentiment && SENTIMENT_VARIANT[f.sentiment]) || 'secondary';
          const sentimentLabel = f.sentiment
            ? t(`sentiment.${f.sentiment as 'positive' | 'neutral' | 'negative'}`)
            : null;
          return (
            <li key={f.id} className="rounded-[10px] bg-[#f8fafc] dark:bg-[#1a2235] p-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Stars value={f.rating} />
                {sentimentLabel ? <Badge variant={sentimentVariant}>{sentimentLabel}</Badge> : null}
                {f.is_verified ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />
                    {t('verified_badge')}
                  </span>
                ) : null}
                <span className="ml-auto text-[11px] tabular-nums text-[#62716d] dark:text-[#94a3b8]">
                  {formatDate(f.submitted_at, locale)}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-[#16221f] dark:text-[#e2e8f0] leading-relaxed">
                {f.comment ?? (
                  <span className="italic text-[#62716d] dark:text-[#94a3b8]">
                    {t('no_comment')}
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

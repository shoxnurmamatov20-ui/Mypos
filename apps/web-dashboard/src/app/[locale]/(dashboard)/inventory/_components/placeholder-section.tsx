'use client';

import { ArrowRight, type LucideIcon, Sparkles } from 'lucide-react';

type Accent = 'teal' | 'amber' | 'green' | 'violet' | 'blue' | 'indigo' | 'rose' | 'pink' | 'sky';

const ACCENT: Record<
  Accent,
  { iconBg: string; iconColor: string; chipBg: string; chipText: string }
> = {
  teal: {
    iconBg: 'bg-[rgba(15,118,110,0.10)]',
    iconColor: 'text-[#0f766e]',
    chipBg: 'bg-teal-50 dark:bg-teal-500/15',
    chipText: 'text-teal-700 dark:text-teal-300',
  },
  amber: {
    iconBg: 'bg-[rgba(183,121,31,0.10)]',
    iconColor: 'text-[#b7791f]',
    chipBg: 'bg-amber-50 dark:bg-amber-500/15',
    chipText: 'text-amber-700 dark:text-amber-300',
  },
  green: {
    iconBg: 'bg-[rgba(24,121,78,0.10)]',
    iconColor: 'text-[#18794e]',
    chipBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    chipText: 'text-emerald-700 dark:text-emerald-300',
  },
  violet: {
    iconBg: 'bg-[rgba(124,58,237,0.10)]',
    iconColor: 'text-[#7c3aed]',
    chipBg: 'bg-violet-50 dark:bg-violet-500/15',
    chipText: 'text-violet-700 dark:text-violet-300',
  },
  blue: {
    iconBg: 'bg-[rgba(37,99,235,0.10)]',
    iconColor: 'text-[#2563eb]',
    chipBg: 'bg-blue-50 dark:bg-blue-500/15',
    chipText: 'text-blue-700 dark:text-blue-300',
  },
  indigo: {
    iconBg: 'bg-[rgba(99,102,241,0.10)]',
    iconColor: 'text-[#6366f1]',
    chipBg: 'bg-indigo-50 dark:bg-indigo-500/15',
    chipText: 'text-indigo-700 dark:text-indigo-300',
  },
  rose: {
    iconBg: 'bg-[rgba(244,63,94,0.10)]',
    iconColor: 'text-[#e11d48]',
    chipBg: 'bg-rose-50 dark:bg-rose-500/15',
    chipText: 'text-rose-700 dark:text-rose-300',
  },
  pink: {
    iconBg: 'bg-[rgba(219,39,119,0.10)]',
    iconColor: 'text-[#db2777]',
    chipBg: 'bg-pink-50 dark:bg-pink-500/15',
    chipText: 'text-pink-700 dark:text-pink-300',
  },
  sky: {
    iconBg: 'bg-[rgba(14,165,233,0.10)]',
    iconColor: 'text-[#0284c7]',
    chipBg: 'bg-sky-50 dark:bg-sky-500/15',
    chipText: 'text-sky-700 dark:text-sky-300',
  },
};

type Stat = { label: string; value: string; tone?: 'good' | 'bad' | 'flat' };

type Props = {
  title: string;
  description: string;
  icon: LucideIcon;
  accent: Accent;
  stats?: Stat[];
  comingSoonLabel?: string;
  actionLabel?: string;
};

const TONE_CLASS: Record<NonNullable<Stat['tone']>, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  bad: 'text-rose-600 dark:text-rose-400',
  flat: 'text-[#62716d] dark:text-[#94a3b8]',
};

/**
 * Inventory section placeholder card — same himoya look as the rest of the
 * dashboard. Used by the 7 Ombor sub-pages until real CRUD is built.
 */
export function PlaceholderSection({
  title,
  description,
  icon: Icon,
  accent,
  stats = [],
  comingSoonLabel = 'Tez kunda',
  actionLabel = 'Talab yuborish',
}: Props) {
  const a = ACCENT[accent];

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`grid h-12 w-12 place-items-center rounded-[12px] flex-shrink-0 ${a.iconBg}`}
          >
            <Icon className={`h-6 w-6 ${a.iconColor}`} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#16221f] dark:text-white leading-tight">
                {title}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-[0.06em] ${a.chipBg} ${a.chipText}`}
              >
                <Sparkles className="h-3 w-3" strokeWidth={2.4} />
                {comingSoonLabel}
              </span>
            </div>
            <p className="mt-1 text-[13px] text-[#62716d] dark:text-[#94a3b8] max-w-2xl">
              {description}
            </p>
          </div>
        </div>
      </div>

      {/* Stats strip (optional) */}
      {stats.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-[12px] border border-[rgba(22,34,31,0.09)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111827] px-4 py-3"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#62716d] dark:text-[#94a3b8]">
                {s.label}
              </p>
              <p
                className={`mt-1 text-[22px] font-black tabular-nums leading-none ${s.tone ? TONE_CLASS[s.tone] : 'text-[#16221f] dark:text-white'}`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Coming soon canvas */}
      <div className="relative overflow-hidden rounded-[18px] border border-dashed border-[rgba(22,34,31,0.15)] dark:border-[rgba(255,255,255,0.10)] bg-white dark:bg-[#111827]">
        {/* Subtle accent glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 50% 0%, rgba(20,184,166,0.10), transparent 70%)',
          }}
        />

        <div className="relative px-6 py-14 sm:px-10 sm:py-20 text-center">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-[14px] ${a.iconBg}`}>
            <Icon className={`h-8 w-8 ${a.iconColor}`} strokeWidth={1.8} />
          </div>
          <h2 className="mt-4 text-[18px] font-bold tracking-tight text-[#16221f] dark:text-white">
            {title}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-[13px] text-[#62716d] dark:text-[#94a3b8]">
            {description}
          </p>
          <p className="mx-auto mt-3 max-w-md text-[12px] text-[#62716d] dark:text-[#94a3b8] italic">
            Modul ishlab chiqilmoqda — keyingi releasda foydalanish mumkin bo'ladi.
          </p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#0f766e] hover:bg-[#0d5e58] dark:bg-teal-500 dark:hover:bg-teal-400 px-4 py-2 text-[13px] font-semibold text-white transition-colors outline-none focus:outline-none"
          >
            {actionLabel}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
}

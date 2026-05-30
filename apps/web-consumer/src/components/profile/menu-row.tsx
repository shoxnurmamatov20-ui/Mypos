'use client';

import { ChevronRight } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

type CommonProps = {
  emoji: string;
  label: string;
  /** Optional one-line hint, e.g. address street. */
  hint?: string;
  /** Trailing slot — overrides the default chevron. */
  trailing?: ReactNode;
};

type LinkRowProps = CommonProps & {
  href: Route;
};

type ButtonRowProps = CommonProps & {
  onClick: () => void;
  /** Tailwind colour class, e.g. `text-danger`. Defaults to `text-neutral-900`. */
  tone?: 'default' | 'danger';
};

const ROW_CLASS =
  'flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none';

export function MenuRowLink({ emoji, label, hint, href, trailing }: LinkRowProps) {
  return (
    <Link href={href} className={ROW_CLASS}>
      <RowBody emoji={emoji} label={label} hint={hint} />
      {trailing ?? <ChevronRight className="h-5 w-5 text-neutral-400" aria-hidden="true" />}
    </Link>
  );
}

export function MenuRowButton({
  emoji,
  label,
  hint,
  onClick,
  tone = 'default',
  trailing,
}: ButtonRowProps) {
  const labelClass =
    tone === 'danger' ? 'font-bold text-danger' : 'font-semibold text-neutral-900';
  return (
    <button type="button" onClick={onClick} className={ROW_CLASS}>
      <span className="text-2xl" aria-hidden="true">
        {emoji}
      </span>
      <span className="flex-1">
        <span className={`block ${labelClass}`}>{label}</span>
        {hint ? <span className="block text-xs text-neutral-500">{hint}</span> : null}
      </span>
      {trailing ?? <ChevronRight className="h-5 w-5 text-neutral-400" aria-hidden="true" />}
    </button>
  );
}

type RowBodyProps = {
  emoji: string;
  label: string;
  hint?: string;
};

function RowBody({ emoji, label, hint }: RowBodyProps) {
  return (
    <>
      <span className="text-2xl" aria-hidden="true">
        {emoji}
      </span>
      <span className="flex-1">
        <span className="block font-semibold text-neutral-900">{label}</span>
        {hint ? <span className="block text-xs text-neutral-500">{hint}</span> : null}
      </span>
    </>
  );
}

'use client';

import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { SeverityBadge } from '@/components/dashboard/badges';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/cn';
import type { AuditLogRecord } from '@/lib/api-helpers';
import type { AuditSeverity } from '@/types/super-admin';

type Props = {
  entry: AuditLogRecord | null;
  onClose: () => void;
};

/** Translate API 5-level severity to the 4-level visual badge. */
function displaySeverity(s: AuditLogRecord['severity']): AuditSeverity {
  return s === 'debug' ? 'info' : s;
}

/**
 * Full audit entry detail. Metadata is rendered as syntax-highlighted
 * JSON using a tiny regex-driven highlighter; we keep this in-line so
 * the bundle stays dependency-free while remaining readable on both
 * light and dark surfaces.
 */
export function AuditDetailModal({ entry, onClose }: Props) {
  const t = useTranslations('audit_page');
  const tCommon = useTranslations('dashboard.severity');

  const metadataHtml = useMemo(() => {
    if (!entry?.metadata) return null;
    const json = JSON.stringify(entry.metadata, null, 2);
    return highlightJson(json);
  }, [entry]);

  if (!entry) return null;

  const sev = displaySeverity(entry.severity);

  return (
    <Modal
      open={Boolean(entry)}
      onClose={onClose}
      title={t('modal_title')}
      description={entry.action}
      size="lg"
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <SeverityBadge severity={sev} label={tCommon(sev)} />
          <code className="inline-block rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 px-2 py-1 font-mono text-[11px] text-gray-800 dark:text-gray-200 break-all">
            {entry.action}
          </code>
        </div>

        <dl className="grid gap-x-4 gap-y-4 grid-cols-1 sm:grid-cols-2">
          <DetailRow
            label={t('modal_timestamp')}
            value={format(new Date(entry.created_at), 'yyyy-MM-dd HH:mm:ss')}
            mono
          />
          <DetailRow label={t('modal_actor')} value={entry.actor_label ?? '—'} />
          <DetailRow
            label={t('modal_subject')}
            value={
              entry.subject_label
                ? `${entry.subject_type ?? '?'}: ${entry.subject_label}`
                : '—'
            }
          />
          <DetailRow label={t('modal_tenant')} value={entry.tenant_id ?? '—'} mono />
          <DetailRow label={t('modal_ip')} value={entry.ip_address ?? '—'} mono />
          <DetailRow
            label={t('modal_user_agent')}
            value={entry.user_agent ?? '—'}
            mono
            truncate
          />
        </dl>

        {metadataHtml ? (
          <section aria-labelledby="audit-metadata-heading" className="space-y-2">
            <p
              id="audit-metadata-heading"
              className="text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400"
            >
              {t('metadata_title')}
            </p>
            <pre
              className="max-h-72 overflow-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-3.5 font-mono text-[11.5px] leading-relaxed text-gray-800 dark:text-gray-200 tabular-nums"
              dangerouslySetInnerHTML={{ __html: metadataHtml }}
            />
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

type DetailRowProps = {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
};

function DetailRow({ label, value, mono = false, truncate = false }: DetailRowProps) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.05em] text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-1 text-sm text-gray-900 dark:text-white leading-relaxed',
          mono && 'font-mono text-[12px] tabular-nums',
          truncate ? 'truncate' : 'break-words',
        )}
        title={truncate ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Minimal JSON syntax highlighter — escapes HTML then wraps tokens in
 * `<span>`s with inline `color` styles. Picks mid-tone hexes that read
 * cleanly on both light (gray-50) and dark (gray-950) backgrounds.
 */
function highlightJson(input: string): string {
  const escaped = input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (match, str: string | undefined, colon: string | undefined, lit: string | undefined, num: string | undefined) => {
      if (str !== undefined) {
        // Keys (when followed by ':') are emerald-700, string values are red-600.
        const cls = colon ? '#047857' : '#dc2626';
        return `<span style="color:${cls}">${str}</span>${colon ?? ''}`;
      }
      if (lit !== undefined) {
        return `<span style="color:#d97706">${lit}</span>`;
      }
      if (num !== undefined) {
        return `<span style="color:#2563eb">${num}</span>`;
      }
      return match;
    },
  );
}

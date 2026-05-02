'use client';

import { motion } from 'framer-motion';
import {
  Bell,
  Broadcast,
  CookingPot,
  CreditCard,
  type Icon,
  QrCode,
  TrendUp,
} from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

const CHART_BARS = [38, 58, 44, 76, 64, 88, 54, 96, 71, 83, 68, 100];
const TABLES = [
  { label: 'A1', state: 'paid' },
  { label: 'A2', state: 'open' },
  { label: 'A3', state: 'ready' },
  { label: 'B1', state: 'open' },
  { label: 'B2', state: 'paid' },
  { label: 'B3', state: 'ready' },
  { label: 'C1', state: 'open' },
  { label: 'C2', state: 'paid' },
];

type Order = {
  id: string;
  name: string;
  statusKey: 'status_ready' | 'status_cooking' | 'status_new';
  status: 'ready' | 'preparing' | 'pending';
};

const ORDERS: Order[] = [
  { id: '#1247', name: 'Toshkent oshi x2', statusKey: 'status_ready', status: 'ready' },
  { id: '#1248', name: 'Margherita pizza', statusKey: 'status_cooking', status: 'preparing' },
  { id: '#1249', name: 'Burger Combo x3', statusKey: 'status_new', status: 'pending' },
];

const STATUS_CLASSES: Record<Order['status'], string> = {
  ready: 'bg-[#DFF8EE] text-[#147A4D]',
  preparing: 'bg-coral-tint text-coral',
  pending: 'bg-white/[0.08] text-white/[0.62]',
};

const TABLE_CLASSES: Record<string, string> = {
  paid: 'border-[#50D1AA]/[0.45] bg-[#50D1AA]/[0.16] text-[#B8F5DF]',
  open: 'border-white/[0.12] bg-white/[0.07] text-white/70',
  ready: 'border-coral/50 bg-coral/[0.16] text-coral-on-dark',
};

export function HeroDashboard() {
  const t = useTranslations('hero');

  return (
    <div className="relative">
      <FloatingSignal />

      <div className="overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#171B19]/[0.88] shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur">
        <div className="flex items-center justify-between border-b border-white/10 px-md py-sm">
          <div className="flex items-center gap-xs">
            <span className="h-3 w-3 rounded-pill bg-coral" />
            <span className="h-3 w-3 rounded-pill bg-[#F2C94C]" />
            <span className="h-3 w-3 rounded-pill bg-[#50D1AA]" />
          </div>
          <div className="hidden rounded-pill border border-white/10 bg-white/[0.06] px-sm py-xxs font-mono text-fine-print text-white/[0.48] sm:block">
            live.mypos.uz/dashboard
          </div>
          <div className="inline-flex items-center gap-xxs rounded-pill bg-[#50D1AA]/[0.14] px-sm py-xxs text-fine-print text-[#B8F5DF]">
            <Broadcast size={14} weight="light" aria-hidden="true" />
            {t('dashboard_live')}
          </div>
        </div>

        <div className="grid gap-md p-md lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-md">
            <Panel>
              <div className="flex items-start justify-between gap-md">
                <div>
                  <p className="text-fine-print text-white/[0.48]">
                    {t('dashboard_revenue_today')}
                  </p>
                  <p className="tabular mt-xxs font-display text-[36px] font-semibold leading-none text-white">
                    12 450 000
                  </p>
                </div>
                <span className="inline-flex items-center gap-xxs rounded-pill bg-[#50D1AA]/[0.14] px-sm py-xxs text-caption-strong text-[#B8F5DF]">
                  <TrendUp size={16} weight="light" aria-hidden="true" />
                  +24%
                </span>
              </div>

              <div className="mt-md flex h-28 items-end gap-xxs">
                {CHART_BARS.map((height, i) => (
                  <motion.div
                    // biome-ignore lint/suspicious/noArrayIndexKey: decorative chart bars
                    key={`${height}-${i}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.8, delay: 0.2 + i * 0.04 }}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-coral to-[#F6B15F]"
                  />
                ))}
              </div>
            </Panel>

            <Panel>
              <div className="mb-sm flex items-center justify-between">
                <div>
                  <p className="text-caption-strong text-white">{t('dashboard_table_map')}</p>
                  <p className="text-fine-print text-white/[0.44]">{t('dashboard_active_zones')}</p>
                </div>
                <QrCode size={20} weight="light" className="text-coral-on-dark" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-4 gap-xs">
                {TABLES.map((table) => (
                  <div
                    key={table.label}
                    className={`rounded-card border px-xs py-sm text-center font-mono text-caption-strong ${TABLE_CLASSES[table.state]}`}
                  >
                    {table.label}
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="space-y-md">
            <div className="grid gap-md sm:grid-cols-2">
              <Metric icon={CookingPot} label={t('dashboard_kds_queue')} value="18" tone="coral" />
              <Metric icon={CreditCard} label={t('dashboard_payments')} value="96%" tone="mint" />
            </div>

            <Panel>
              <div className="mb-sm flex items-center justify-between">
                <div>
                  <p className="text-caption-strong text-white">{t('floating_orders')}</p>
                  <p className="text-fine-print text-white/[0.44]">847 {t('floating_today')}</p>
                </div>
                <Bell size={20} weight="light" className="text-coral-on-dark" aria-hidden="true" />
              </div>

              <div className="space-y-xs">
                {ORDERS.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-xs rounded-card border border-white/[0.08] bg-white/[0.04] p-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-fine-print text-white/[0.42]">{order.id}</p>
                      <p className="truncate text-caption-strong text-white">{order.name}</p>
                    </div>
                    <span
                      className={`rounded-pill px-xs py-xxs text-fine-print ${STATUS_CLASSES[order.status]}`}
                    >
                      {t(order.statusKey)}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>

            <div className="rounded-card border border-coral/[0.24] bg-coral/[0.12] p-md">
              <p className="text-caption-strong text-coral-on-dark">{t('floating_revenue')}</p>
              <div className="mt-sm flex items-end justify-between gap-sm">
                <p className="tabular font-display text-display-sm font-semibold text-white">
                  +34%
                </p>
                <p className="max-w-[170px] text-right text-fine-print text-white/[0.52]">
                  {t('dashboard_control_room')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-white/10 bg-white/[0.055] p-md">{children}</div>
  );
}

function Metric({
  icon: IconComp,
  label,
  value,
  tone,
}: {
  icon: Icon;
  label: string;
  value: string;
  tone: 'coral' | 'mint';
}) {
  const toneClass =
    tone === 'coral'
      ? 'border-coral/[0.24] bg-coral/[0.12] text-coral-on-dark'
      : 'border-[#50D1AA]/[0.32] bg-[#50D1AA]/[0.14] text-[#B8F5DF]';

  return (
    <div className={`rounded-card border p-md ${toneClass}`}>
      <div className="flex items-center gap-xs">
        <IconComp size={18} weight="light" aria-hidden="true" />
        <p className="text-fine-print uppercase tracking-wider">{label}</p>
      </div>
      <p className="tabular mt-sm font-display text-display-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function FloatingSignal() {
  return (
    <div
      aria-hidden="true"
      className="absolute -top-6 -left-6 hidden h-32 w-32 rounded-full bg-coral/30 blur-3xl lg:block"
    />
  );
}

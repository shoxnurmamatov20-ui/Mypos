'use client';

import { motion } from 'framer-motion';
import { Bell, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';

const CHART_BARS = [40, 65, 45, 80, 55, 90, 70, 95, 60, 85, 75, 100];

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
  ready: 'bg-success-soft text-success-text',
  preparing: 'bg-coral-tint text-coral',
  pending: 'bg-parchment text-ink-muted-80',
};

/**
 * Apple-style product render — canvas card, hairline ring,
 * mock browser chrome at top, single dashboard preview body.
 * Wraps the entire surface in shadow-product (set by parent).
 */
export function HeroDashboard() {
  const t = useTranslations('hero');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="relative"
    >
      <FloatingCard
        position="top"
        animateY={[0, -10, 0]}
        delay={0}
        icon={<TrendingUp className="h-5 w-5 text-coral" />}
        label={t('floating_revenue')}
        value="+34%"
      />
      <FloatingCard
        position="bottom"
        animateY={[0, 10, 0]}
        delay={1}
        icon={<Bell className="h-5 w-5 text-coral" />}
        label={t('floating_orders')}
        value={`847 ${t('floating_today')}`}
      />

      <div className="overflow-hidden rounded-card bg-canvas shadow-hairline-ring">
        {/* Mock browser chrome */}
        <div className="flex items-center gap-xs border-b border-hairline-soft bg-parchment px-md py-xs">
          <div className="flex gap-xxs">
            <span className="h-3 w-3 rounded-pill bg-[#e0e0e0]" />
            <span className="h-3 w-3 rounded-pill bg-[#e0e0e0]" />
            <span className="h-3 w-3 rounded-pill bg-[#e0e0e0]" />
          </div>
          <div className="ml-xxs flex-1 rounded-md bg-canvas px-sm py-xxs font-mono text-fine-print text-ink-muted-48">
            dashboard.mypos.uz
          </div>
        </div>

        <div className="space-y-md p-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-fine-print text-ink-muted-48">{t('dashboard_revenue_today')}</p>
              <p className="tabular text-display-md text-ink font-display font-semibold">
                12 450 000
              </p>
            </div>
            <span className="rounded-pill bg-success-soft px-sm py-xxs text-fine-print text-success-text font-display font-semibold">
              +24%
            </span>
          </div>

          <div className="flex h-32 items-end gap-xxs">
            {CHART_BARS.map((h, i) => (
              <motion.div
                // biome-ignore lint/suspicious/noArrayIndexKey: static decorative chart bars
                key={`bar-${i}-${h}`}
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.05 }}
                className="flex-1 rounded-t-sm bg-coral"
              />
            ))}
          </div>

          <div className="space-y-xxs border-t border-hairline-soft pt-xs">
            {ORDERS.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-md p-xs hover:bg-parchment"
              >
                <div className="flex items-center gap-sm">
                  <span className="font-mono text-fine-print text-ink-muted-48">{order.id}</span>
                  <span className="text-caption text-ink">{order.name}</span>
                </div>
                <span
                  className={`rounded-pill px-xs py-xxs text-fine-print font-display font-semibold ${STATUS_CLASSES[order.status]}`}
                >
                  {t(order.statusKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type FloatingCardProps = {
  position: 'top' | 'bottom';
  animateY: number[];
  delay: number;
  icon: React.ReactNode;
  label: string;
  value: string;
};

function FloatingCard({ position, animateY, delay, icon, label, value }: FloatingCardProps) {
  const positionClass =
    position === 'top' ? '-top-4 -left-4 lg:-left-8' : '-bottom-4 -right-4 lg:-right-8';

  return (
    <motion.div
      animate={{ y: animateY }}
      transition={{
        duration: position === 'top' ? 4 : 5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={`absolute z-10 rounded-card bg-canvas p-sm shadow-hairline-ring ${positionClass}`}
    >
      <div className="flex items-center gap-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-pearl bg-coral-tint">
          {icon}
        </div>
        <div>
          <p className="text-fine-print text-ink-muted-48">{label}</p>
          <p className="tabular text-body-strong text-ink font-display font-semibold">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

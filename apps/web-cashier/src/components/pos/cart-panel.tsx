'use client';

import { Check, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { OrderType } from '@/lib/api';
import { cn } from '@/lib/cn';
import { formatMoney, pickName } from '@/lib/format';
import { cartSubtotal, cartTax, cartTotal, lineSubtotal, useCartStore } from '@/stores/cart';

const ORDER_TYPES: { id: OrderType; key: 'dine_in' | 'takeaway' | 'delivery' }[] = [
  { id: 'dine_in', key: 'dine_in' },
  { id: 'takeaway', key: 'takeaway' },
  { id: 'delivery', key: 'delivery' },
];

/** The order-building panel: lines, qty steppers, discount, totals, charge. */
export function CartPanel() {
  const t = useTranslations('pos');
  const locale = useLocale();
  const { lines, discount, orderType } = useCartStore();
  const { increment, decrement, remove, setDiscount, setOrderType, clear } = useCartStore();
  const [placed, setPlaced] = useState(false);

  const subtotal = cartSubtotal(lines);
  const tax = cartTax(lines, discount);
  const total = cartTotal(lines, discount);
  const empty = lines.length === 0;

  const charge = () => {
    if (empty) return;
    // Backend wiring lands with the staff orders endpoint; for now the
    // register confirms locally and resets — the flow is identical.
    setPlaced(true);
    window.setTimeout(() => {
      clear();
      setPlaced(false);
    }, 1600);
  };

  return (
    <div className="flex flex-col rounded-xl border border-[rgba(22,34,31,0.09)] bg-white lg:sticky lg:top-[74px] dark:border-[rgba(255,255,255,0.07)] dark:bg-[#111827]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[rgba(22,34,31,0.07)] px-4 py-3 dark:border-[rgba(255,255,255,0.06)]">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-[#16221f] dark:text-white">
          <ShoppingCart className="h-4 w-4 text-[#0f766e] dark:text-[#5ed6c9]" />
          {t('cart_title')}
          {!empty ? (
            <span className="tnum rounded-full bg-[#eef4f3] px-1.5 text-[11px] text-[#0f766e] dark:bg-[#1a2235] dark:text-[#5ed6c9]">
              {lines.reduce((n, l) => n + l.qty, 0)}
            </span>
          ) : null}
        </h2>
        {!empty ? (
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-[12px] font-medium text-[#62716d] hover:text-red-600 dark:text-[#94a3b8]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t('clear_cart')}
          </button>
        ) : null}
      </div>

      {/* Lines */}
      <div className="max-h-[44vh] min-h-[120px] overflow-y-auto px-4 py-3">
        {empty ? (
          <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
            <ShoppingCart className="h-8 w-8 text-gray-300 dark:text-gray-700" />
            <p className="text-sm font-medium text-[#62716d] dark:text-[#94a3b8]">
              {t('cart_empty')}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">{t('cart_empty_hint')}</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#16221f] dark:text-white">
                    {pickName(line.name, locale)}
                  </p>
                  <p className="tnum text-[11px] text-[#62716d] dark:text-[#94a3b8]">
                    {formatMoney(lineSubtotal(line))}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <StepButton onClick={() => decrement(line.id)} ariaLabel="-">
                    <Minus className="h-3 w-3" strokeWidth={3} />
                  </StepButton>
                  <span className="tnum w-6 text-center text-[13px] font-bold text-[#16221f] dark:text-white">
                    {line.qty}
                  </span>
                  <StepButton onClick={() => increment(line.id)} ariaLabel="+">
                    <Plus className="h-3 w-3" strokeWidth={3} />
                  </StepButton>
                </div>
                <button
                  type="button"
                  onClick={() => remove(line.id)}
                  aria-label={t('remove')}
                  className="text-gray-300 hover:text-red-500 dark:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Order type + totals + charge */}
      <div className="space-y-3 border-t border-[rgba(22,34,31,0.07)] px-4 py-3 dark:border-[rgba(255,255,255,0.06)]">
        <div className="grid grid-cols-3 gap-1">
          {ORDER_TYPES.map(({ id, key }) => (
            <button
              key={id}
              type="button"
              onClick={() => setOrderType(id)}
              className={cn(
                'rounded-md py-1.5 text-[11px] font-semibold transition-colors',
                orderType === id
                  ? 'bg-[#0f766e] text-white'
                  : 'bg-[#eef4f3] text-[#62716d] hover:text-[#16221f] dark:bg-[#1a2235] dark:text-[#94a3b8] dark:hover:text-white',
              )}
            >
              {t(key)}
            </button>
          ))}
        </div>

        <div className="space-y-1.5 text-[13px]">
          <Row label={t('subtotal')} value={formatMoney(subtotal)} />
          <div className="flex items-center justify-between">
            <span className="text-[#62716d] dark:text-[#94a3b8]">{t('discount')}</span>
            <input
              type="number"
              min={0}
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0"
              className="tnum w-24 rounded-md border border-[rgba(22,34,31,0.12)] bg-white px-2 py-1 text-right text-[13px] text-[#16221f] outline-none focus:border-[#0f766e] dark:border-[rgba(255,255,255,0.1)] dark:bg-[#0b1120] dark:text-white"
            />
          </div>
          <Row label={t('tax')} value={formatMoney(tax)} muted />
          <div className="mt-1 flex items-center justify-between border-t border-[rgba(22,34,31,0.07)] pt-2 dark:border-[rgba(255,255,255,0.06)]">
            <span className="text-sm font-bold text-[#16221f] dark:text-white">{t('total')}</span>
            <span className="tnum text-xl font-bold text-[#0f766e] dark:text-[#5ed6c9]">
              {formatMoney(total)}
            </span>
          </div>
        </div>

        <Button
          size="lg"
          variant={placed ? 'secondary' : 'primary'}
          disabled={empty}
          onClick={charge}
          className="h-14 w-full text-[15px]"
        >
          {placed ? (
            <>
              <Check className="h-5 w-5" /> {t('order_placed')}
            </>
          ) : (
            t('charge_amount', { amount: formatMoney(total) })
          )}
        </Button>
      </div>
    </div>
  );
}

function StepButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="flex h-6 w-6 items-center justify-center rounded-md bg-[#eef4f3] text-[#0f766e] transition-colors hover:bg-[#0f766e] hover:text-white active:scale-95 dark:bg-[#1a2235] dark:text-[#5ed6c9]"
    >
      {children}
    </button>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#62716d] dark:text-[#94a3b8]">{label}</span>
      <span
        className={cn(
          'tnum',
          muted
            ? 'text-[#62716d] dark:text-[#94a3b8]'
            : 'font-semibold text-[#16221f] dark:text-white',
        )}
      >
        {value}
      </span>
    </div>
  );
}

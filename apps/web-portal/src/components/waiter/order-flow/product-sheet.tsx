'use client';

import { ArrowLeft, Minus, PencilSimple, Plus } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { formatUzs } from '@/lib/waiter-data';
import type { FlowMenuItem } from './menu-step';

/**
 * Product detail (screenshot 4.png). A full-screen sheet over the menu grid:
 * hero photo, quantity stepper next to the live line price, an optional note
 * ("Izoh"), and a single "Savatga qo'shish" action.
 */
export function ProductSheet({
  item,
  initialQty,
  initialComment,
  onBack,
  onAdd,
}: {
  item: FlowMenuItem;
  initialQty: number;
  initialComment: string;
  onBack: () => void;
  onAdd: (qty: number, comment: string) => void;
}) {
  const t = useTranslations('waiter');
  const [qty, setQty] = useState(Math.max(1, initialQty));
  const [comment, setComment] = useState(initialComment);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="animate-fade-in fixed inset-0 z-40 flex flex-col overflow-y-auto bg-canvas">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex h-14 items-center bg-canvas px-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t('common.back')}
          className="grid h-10 w-10 place-items-center rounded-full text-ink transition-transform active:scale-90"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Hero */}
      {item.image ? (
        // biome-ignore lint/performance/noImgElement: tenant-hosted dish photos are external URLs, not bundled assets
        <img src={item.image} alt={item.name} className="aspect-[16/10] w-full object-cover" />
      ) : (
        <div className="grid aspect-[16/10] w-full place-items-center bg-gradient-to-br from-parchment to-tenant-tint text-[80px]">
          <span aria-hidden>{item.emoji ?? '🍽️'}</span>
        </div>
      )}

      <div className="mx-auto w-full max-w-[560px] flex-1 space-y-5 px-5 py-5">
        <h1 className="font-display text-tagline text-ink">{item.name}</h1>

        {/* Quantity + price + edit */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              aria-label="−"
              className="grid h-9 w-9 place-items-center rounded-full bg-parchment text-ink transition-transform active:scale-90"
            >
              <Minus className="h-4 w-4" weight="bold" />
            </button>
            <span className="min-w-[24px] text-center text-body-strong text-ink tabular-nums">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((n) => Math.min(99, n + 1))}
              aria-label="+"
              className="grid h-9 w-9 place-items-center rounded-full bg-tenant text-tenant-on-primary transition-transform active:scale-90"
            >
              <Plus className="h-4 w-4" weight="bold" />
            </button>
          </div>
          <span className="text-body-strong tabular-nums text-ink">{formatUzs(item.price)}</span>
          <button
            type="button"
            onClick={() => noteRef.current?.focus()}
            aria-label={t('product.comment')}
            className="ml-auto grid h-9 w-9 place-items-center rounded-full text-ink-muted-48 transition-colors hover:text-tenant"
          >
            <PencilSimple className="h-[18px] w-[18px]" />
          </button>
        </div>

        {/* Note */}
        <div className="space-y-1.5">
          <label htmlFor="izoh" className="text-fine-print font-semibold text-ink-muted-80">
            {t('product.comment')}
          </label>
          <textarea
            id="izoh"
            ref={noteRef}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t('product.commentPlaceholder')}
            rows={2}
            className="w-full resize-none rounded-lg border border-hairline-soft bg-canvas px-3.5 py-2.5 text-body text-ink outline-none transition-colors placeholder:text-ink-muted-48 focus:border-tenant"
          />
        </div>
      </div>

      {/* Add action */}
      <div className="sticky bottom-0 border-t border-hairline-soft bg-canvas/85 px-5 pb-[calc(14px+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl backdrop-saturate-150">
        <button
          type="button"
          onClick={() => onAdd(qty, comment.trim())}
          className="mx-auto flex w-full max-w-[560px] items-center justify-center gap-2 rounded-pill bg-tenant py-3.5 text-caption-strong text-tenant-on-primary transition-transform active:scale-95"
        >
          <span>{t('product.addToCart')}</span>
          <span className="tabular-nums opacity-90">· {formatUzs(item.price * qty)}</span>
        </button>
      </div>
    </div>
  );
}

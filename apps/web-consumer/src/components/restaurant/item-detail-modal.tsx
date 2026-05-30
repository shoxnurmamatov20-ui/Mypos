'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { type MockMenuItem, getItemBgClass } from '@/data/menus';
import { formatSom } from '@/lib/format';
import { useCartStore } from '@/stores/cart';

type ItemDetailModalProps = {
  item: MockMenuItem | null;
  restaurantSlug: string;
  restaurantName: string;
  locale: 'uz' | 'ru' | 'en';
  onClose: () => void;
};

/**
 * Item detail bottom-sheet on mobile, centred dialog on desktop.
 *
 * The component is always mounted on the page; the AnimatePresence
 * branch handles enter/exit. Quantity + notes reset on every new
 * `item` so the dialog never leaks state between dishes.
 */
export function ItemDetailModal({
  item,
  restaurantSlug,
  restaurantName,
  locale,
  onClose,
}: ItemDetailModalProps) {
  const t = useTranslations('item_detail_modal');
  const addItem = useCartStore((s) => s.addItem);

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset whenever a new item opens. We key on `item?.id` so closing +
  // re-opening the same dish keeps the previous draft for the session.
  useEffect(() => {
    if (item) {
      setQuantity(1);
      setNotes('');
    }
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while the modal is open + close on Esc.
  useEffect(() => {
    if (!item) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [item, onClose]);

  function handleAdd() {
    if (!item) return;
    addItem(
      {
        id: item.id,
        restaurantSlug,
        name: item.name[locale],
        priceMinor: item.priceMinor,
        quantity,
        notes: notes.trim() ? notes.trim() : undefined,
        emoji: item.emoji,
        bgColor: getItemBgClass(item.bgColor),
      },
      restaurantName,
    );
    onClose();
  }

  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          key="item-modal"
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-modal-title"
        >
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative mx-auto flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:my-auto sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div
              className={`relative flex h-48 items-center justify-center ${getItemBgClass(item.bgColor)}`}
            >
              <span className="text-9xl" aria-hidden="true">
                {item.emoji}
              </span>

              <div className="absolute left-3 top-3 flex flex-col gap-1.5">
                {item.isPopular ? (
                  <span className="inline-flex items-center rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                    {t('popular')}
                  </span>
                ) : null}
                {item.isNew ? (
                  <span className="inline-flex items-center rounded-full bg-mint-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                    {t('new')}
                  </span>
                ) : null}
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label={t('close')}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-neutral-700 backdrop-blur transition hover:bg-white"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
              <div className="flex flex-col gap-2">
                <h2
                  id="item-modal-title"
                  className="font-display text-2xl font-extrabold text-neutral-900"
                >
                  {item.name[locale]}
                </h2>
                {item.description[locale] ? (
                  <p className="text-base text-neutral-500">{item.description[locale]}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span aria-hidden="true">🕐</span>
                <span>
                  {t('preparation')}: {item.preparationMinutes} {t('preparation_minutes')}
                </span>
              </div>

              <div className="border-t border-neutral-100" />

              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-bold text-neutral-900">{t('quantity')}</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label={t('decrease')}
                    disabled={quantity <= 1}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Minus className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <span className="w-8 text-center text-2xl font-extrabold tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                    aria-label={t('increase')}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 transition hover:bg-neutral-200"
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="item-notes"
                  className="text-sm font-semibold text-neutral-700"
                >
                  {t('notes_label')}
                </label>
                <textarea
                  id="item-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notes_placeholder')}
                  rows={3}
                  maxLength={240}
                  className="min-h-[72px] resize-none rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="border-t border-neutral-100 bg-white p-4">
              <button
                type="button"
                onClick={handleAdd}
                className="flex h-14 w-full items-center justify-between rounded-2xl bg-brand-500 px-5 text-white shadow-sm transition hover:bg-brand-600 active:scale-[0.99]"
              >
                <span className="text-base font-bold">{t('add_to_cart')}</span>
                <span className="text-base font-extrabold tabular-nums">
                  {formatSom(item.priceMinor * quantity)}
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

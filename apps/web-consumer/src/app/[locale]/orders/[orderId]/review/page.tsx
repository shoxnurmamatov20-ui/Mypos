'use client';

import { publicApi } from '@mypos/api-client';
import { CheckCircle, Star } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { apiClient } from '@/lib/api';

type SubmittedReview = {
  order_id: string;
  rating: number;
  food_rating: number;
  delivery_rating: number;
};

export default function ReviewPage() {
  const t = useTranslations('review');
  const router = useRouter();
  const locale = useLocale();
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const orderId = params?.orderId ?? '';
  const trackingToken = searchParams.get('token') ?? undefined;

  const [rating, setRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState<SubmittedReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      await publicApi.orders.submitReview(apiClient, {
        order_id: orderId,
        rating,
        food_rating: foodRating || rating,
        delivery_rating: deliveryRating || rating,
        ...(comment ? { comment } : {}),
        ...(trackingToken ? { tracking_token: trackingToken } : {}),
      });
      setSubmitted({
        order_id: orderId,
        rating,
        food_rating: foodRating || rating,
        delivery_rating: deliveryRating || rating,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-emerald-500" />
        <h1 className="mt-4 font-display text-2xl font-bold text-neutral-900">
          {t('thanks_title')}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{t('thanks_body')}</p>
        <div className="mt-6 inline-flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-7 w-7 ${n <= submitted.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
            />
          ))}
        </div>
        <Link
          href={`/${locale}/restaurants` as Route}
          className="mt-8 inline-flex items-center rounded-full bg-brand-primary px-6 py-3 font-bold text-white transition active:scale-95"
        >
          {t('continue')}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-neutral-900">{t('title')}</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {t('subtitle', { order: orderId.slice(0, 8) })}
        </p>
      </header>

      {/* Overall rating */}
      <section className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 text-center">
        <p className="text-sm font-semibold text-neutral-600 mb-3">{t('overall')}</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className="transition active:scale-90"
              aria-label={`${n} stars`}
            >
              <Star
                className={`h-10 w-10 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
              />
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <RatingCard label={t('food')} value={foodRating} onChange={setFoodRating} />
        <RatingCard label={t('delivery')} value={deliveryRating} onChange={setDeliveryRating} />
      </div>

      <section className="mb-6">
        <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('comment')}</label>
        <textarea
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('comment_placeholder')}
          className="w-full rounded-2xl border-2 border-neutral-200 bg-white p-3 text-sm placeholder:text-neutral-400 focus:border-brand-primary focus:outline-none"
        />
      </section>

      {error ? (
        <div className="mb-3 rounded-2xl bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="flex-1 rounded-full border-2 border-neutral-200 bg-white py-3 font-bold text-neutral-900 transition active:scale-95 disabled:opacity-50"
        >
          {t('skip')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={rating === 0 || loading}
          className="flex-1 rounded-full bg-brand-primary py-3 font-bold text-white transition active:scale-95 disabled:opacity-50"
        >
          {loading ? '...' : t('submit')}
        </button>
      </div>
    </div>
  );
}

function RatingCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 text-center">
      <p className="text-xs font-semibold text-neutral-600 mb-2">{label}</p>
      <div className="flex justify-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${n} stars for ${label}`}
          >
            <Star
              className={`h-5 w-5 transition ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-neutral-300'}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import { Calendar, CheckCircle, CircleNotch } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type FormData = {
  name: string;
  phone: string;
  email: string;
  restaurant: string;
  industry: string;
  date: string;
  time: string;
  notes: string;
};

const TIMES = ['10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'] as const;
const INDUSTRIES = ['cafe', 'restaurant', 'fastfood', 'bar', 'other'] as const;

const INPUT_CLASS =
  'w-full rounded-card border border-hairline-soft bg-canvas px-md py-xs text-body text-ink transition focus:shadow-focus focus:outline-none';

export function DemoForm({ locale: _locale }: { locale: string }) {
  const t = useTranslations('demo_form');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0]!;

  const [data, setData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    restaurant: '',
    industry: 'restaurant',
    date: minDate,
    time: '14:00',
    notes: '',
  });

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-card border border-hairline-soft bg-success-soft p-[80px] text-center shadow-hairline-ring"
      >
        <div className="mx-auto inline-flex h-20 w-20 items-center justify-center rounded-pill bg-success">
          <CheckCircle size={40} weight="fill" className="text-white" aria-hidden="true" />
        </div>
        <h2 className="mt-md font-display font-semibold text-display-sm text-ink">
          {t('success_title')}
        </h2>
        <p className="mt-sm text-body text-ink-muted-80">{t('success_message')}</p>
        <p className="mt-xs text-caption text-ink-muted-48">{t('success_note')}</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-md rounded-card border border-hairline-soft bg-canvas p-xl shadow-hairline-ring"
    >
      <div className="grid gap-sm sm:grid-cols-2">
        <div>
          <label htmlFor="demo-name" className="mb-xxs block font-display font-semibold text-caption-strong text-ink">
            {t('name_label')} *
          </label>
          <input
            id="demo-name"
            type="text"
            required
            value={data.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={t('name_placeholder')}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="demo-phone" className="mb-xxs block font-display font-semibold text-caption-strong text-ink">
            {t('phone_label')} *
          </label>
          <input
            id="demo-phone"
            type="tel"
            required
            value={data.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="+998 90 123 45 67"
            className={INPUT_CLASS}
          />
        </div>
      </div>

      <div>
        <label htmlFor="demo-email" className="mb-xxs block font-display font-semibold text-caption-strong text-ink">
          {t('email_label')}
        </label>
        <input
          id="demo-email"
          type="email"
          value={data.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="info@restoran.uz"
          className={INPUT_CLASS}
        />
      </div>

      <div className="grid gap-sm sm:grid-cols-2">
        <div>
          <label
            htmlFor="demo-restaurant"
            className="mb-xxs block font-display font-semibold text-caption-strong text-ink"
          >
            {t('restaurant_label')} *
          </label>
          <input
            id="demo-restaurant"
            type="text"
            required
            value={data.restaurant}
            onChange={(e) => update('restaurant', e.target.value)}
            placeholder={t('restaurant_placeholder')}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label
            htmlFor="demo-industry"
            className="mb-xxs block font-display font-semibold text-caption-strong text-ink"
          >
            {t('industry_label')}
          </label>
          <select
            id="demo-industry"
            value={data.industry}
            onChange={(e) => update('industry', e.target.value)}
            className={INPUT_CLASS}
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {t(`industry_${ind}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-sm sm:grid-cols-2">
        <div>
          <label htmlFor="demo-date" className="mb-xxs block font-display font-semibold text-caption-strong text-ink">
            {t('date_label')} *
          </label>
          <input
            id="demo-date"
            type="date"
            required
            min={minDate}
            value={data.date}
            onChange={(e) => update('date', e.target.value)}
            className={INPUT_CLASS}
          />
        </div>
        <div>
          <label htmlFor="demo-time" className="mb-xxs block font-display font-semibold text-caption-strong text-ink">
            {t('time_label')} *
          </label>
          <select
            id="demo-time"
            required
            value={data.time}
            onChange={(e) => update('time', e.target.value)}
            className={INPUT_CLASS}
          >
            {TIMES.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="demo-notes" className="mb-xxs block font-display font-semibold text-caption-strong text-ink">
          {t('notes_label')}
        </label>
        <textarea
          id="demo-notes"
          rows={3}
          value={data.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder={t('notes_placeholder')}
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-xs rounded-pill bg-tenant px-lg py-sm font-display font-semibold text-body-strong text-tenant-on-primary transition-transform duration-fast active:scale-95 disabled:opacity-60"
      >
        {submitting ? (
          <CircleNotch size={20} weight="bold" className="animate-spin" aria-hidden="true" />
        ) : (
          <>
            <Calendar size={20} weight="duotone" aria-hidden="true" />
            {t('submit')}
          </>
        )}
      </button>

      <p className="text-center text-fine-print text-ink-muted-48">{t('disclaimer')}</p>
    </motion.form>
  );
}

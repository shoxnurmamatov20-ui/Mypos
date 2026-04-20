'use client';

import { Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function ContactForm() {
  const t = useTranslations('contact_page.form');
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-mint-200 bg-mint-50 p-8 text-center"
      >
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint-500 text-white">
          <Send className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mt-4 font-display text-lg font-semibold text-mint-900">{t('success')}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('name')} id="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={t('name_placeholder')}
            className={inputClass}
          />
        </Field>
        <Field label={t('email')} id="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder={t('email_placeholder')}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('phone')} id="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder={t('phone_placeholder')}
            className={inputClass}
          />
        </Field>
        <Field label={t('restaurant')} id="restaurant">
          <input
            id="restaurant"
            name="restaurant"
            type="text"
            placeholder={t('restaurant_placeholder')}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label={t('message')} id="message">
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder={t('message_placeholder')}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3 font-display text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {t('submit')}
      </button>

      <p className="text-center text-xs text-neutral-500">{t('note')}</p>
    </form>
  );
}

const inputClass =
  'w-full rounded-lg border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-400 transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="block text-sm font-medium text-neutral-700">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

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
        className="rounded-card border border-hairline-soft bg-success-soft p-xl text-center"
      >
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-pill bg-success text-white">
          <Send className="h-5 w-5" aria-hidden="true" />
        </div>
        <p className="mt-md font-display font-semibold text-title text-success-text">
          {t('success')}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-md rounded-card border border-hairline-soft bg-canvas p-lg shadow-hairline-ring sm:p-xl"
    >
      <div className="grid gap-sm sm:grid-cols-2">
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
      <div className="grid gap-sm sm:grid-cols-2">
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
        className="inline-flex w-full items-center justify-center gap-xs rounded-pill bg-tenant px-lg py-xs font-display font-semibold text-caption-strong text-tenant-on-primary transition-transform duration-fast active:scale-95"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {t('submit')}
      </button>

      <p className="text-center text-fine-print text-ink-muted-48">{t('note')}</p>
    </form>
  );
}

const inputClass =
  'w-full rounded-card border border-hairline-soft bg-canvas px-md py-xs text-body text-ink placeholder:text-ink-muted-48 transition focus:shadow-focus focus:outline-none';

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
      <span className="block font-display font-semibold text-caption-strong text-ink">
        {label}
      </span>
      <div className="mt-xxs">{children}</div>
    </label>
  );
}

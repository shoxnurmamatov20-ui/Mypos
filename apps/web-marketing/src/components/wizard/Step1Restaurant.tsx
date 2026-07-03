'use client';

import { ImageSquare, X } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
  CUISINE_TYPES,
  type CuisineType,
  slugifyRestaurantName,
  step1Schema,
} from '@/lib/wizard-schemas';
import { useWizardStore } from '@/lib/wizard-store';
import { WizardNavButtons } from './WizardNavButtons';

const INPUT_CLASS =
  'w-full rounded-card border border-hairline-soft bg-canvas px-md py-xs text-body text-ink transition focus:shadow-focus focus:outline-none';

const LOGO_MAX_BYTES = 1_500_000;
const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export function Step1Restaurant() {
  const t = useTranslations('onboarding.step1');
  const tErr = useTranslations('onboarding.errors');

  const restaurant = useWizardStore((s) => s.restaurant);
  const setRestaurant = useWizardStore((s) => s.setRestaurant);
  const next = useWizardStore((s) => s.next);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState<boolean>(restaurant.slug.length > 0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: avoiding feedback loop on slug
  useEffect(() => {
    if (!slugTouched && restaurant.name) {
      const suggested = slugifyRestaurantName(restaurant.name);
      if (suggested !== restaurant.slug) {
        setRestaurant({ slug: suggested });
      }
    }
  }, [restaurant.name, slugTouched, setRestaurant]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      setErrors((p) => ({ ...p, logo: 'logo_unsupported_type' }));
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      setErrors((p) => ({ ...p, logo: 'logo_too_large' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRestaurant({ logoDataUrl: reader.result as string });
      setErrors((p) => {
        const { logo: _logo, ...rest } = p;
        return rest;
      });
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    setRestaurant({ logoDataUrl: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleNext() {
    const result = step1Schema.safeParse(restaurant);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    next();
  }

  return (
    <section
      aria-labelledby="step1-title"
      className="rounded-card border border-hairline-soft bg-canvas p-lg shadow-hairline-ring sm:p-xl"
    >
      <h2 id="step1-title" className="font-display font-semibold text-display-sm text-ink">
        {t('title')}
      </h2>
      <p className="mt-xs text-caption text-ink-muted-80">{t('subtitle')}</p>

      <div className="mt-xl grid gap-md">
        <Field
          label={t('name_label')}
          id="r-name"
          required
          error={errors.name && tErr(errors.name)}
        >
          <input
            id="r-name"
            type="text"
            autoComplete="organization"
            value={restaurant.name}
            onChange={(e) => setRestaurant({ name: e.target.value })}
            placeholder={t('name_placeholder')}
            className={INPUT_CLASS}
            maxLength={120}
          />
        </Field>

        <Field
          label={t('slug_label')}
          hint={t('slug_hint', { domain: 'mypos.uz' })}
          id="r-slug"
          required
          error={errors.slug && tErr(errors.slug)}
        >
          <div className="flex items-stretch overflow-hidden rounded-card border border-hairline-soft bg-canvas focus-within:shadow-focus">
            <input
              id="r-slug"
              type="text"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={restaurant.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setRestaurant({
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                });
              }}
              className="flex-1 border-0 bg-transparent px-md py-xs text-body text-ink outline-none"
              maxLength={32}
              placeholder="my-cafe"
            />
            <span className="flex items-center bg-parchment px-sm font-mono text-caption text-ink-muted-48">
              .mypos.uz
            </span>
          </div>
        </Field>

        <Field label={t('cuisine_label')} id="r-cuisine" required>
          <select
            id="r-cuisine"
            value={restaurant.cuisine}
            onChange={(e) => setRestaurant({ cuisine: e.target.value as CuisineType })}
            className={INPUT_CLASS}
          >
            {CUISINE_TYPES.map((c) => (
              <option key={c} value={c}>
                {t(`cuisines.${c}`)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-md sm:grid-cols-2">
          <Field
            label={t('city_label')}
            id="r-city"
            required
            error={errors.city && tErr('field_required')}
          >
            <input
              id="r-city"
              type="text"
              autoComplete="address-level2"
              value={restaurant.city}
              onChange={(e) => setRestaurant({ city: e.target.value })}
              placeholder={t('city_placeholder')}
              className={INPUT_CLASS}
              maxLength={80}
            />
          </Field>
          <Field
            label={t('address_label')}
            id="r-address"
            required
            error={errors.address && tErr('field_required')}
          >
            <input
              id="r-address"
              type="text"
              autoComplete="street-address"
              value={restaurant.address}
              onChange={(e) => setRestaurant({ address: e.target.value })}
              placeholder={t('address_placeholder')}
              className={INPUT_CLASS}
              maxLength={255}
            />
          </Field>
        </div>

        <div className="grid gap-md sm:grid-cols-2">
          <Field
            label={t('phone_label')}
            id="r-phone"
            required
            error={errors.phone && tErr(errors.phone)}
          >
            <input
              id="r-phone"
              type="tel"
              autoComplete="tel"
              value={restaurant.phone}
              onChange={(e) => setRestaurant({ phone: e.target.value })}
              placeholder="+998 90 123 45 67"
              className={INPUT_CLASS}
            />
          </Field>
          <Field
            label={t('email_label')}
            id="r-email"
            required
            error={errors.email && tErr(errors.email)}
          >
            <input
              id="r-email"
              type="email"
              autoComplete="email"
              value={restaurant.email}
              onChange={(e) => setRestaurant({ email: e.target.value })}
              placeholder="info@restoran.uz"
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <Field
          label={t('logo_label')}
          id="r-logo"
          hint={t('logo_hint')}
          error={errors.logo && tErr(errors.logo)}
        >
          <div className="flex items-center gap-md">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-card border border-hairline-soft bg-parchment">
              {restaurant.logoDataUrl ? (
                // biome-ignore lint/performance/noImgElement: data URL preview, no Next/Image
                // biome-ignore lint/a11y/useAltText: decorative preview
                <img src={restaurant.logoDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageSquare
                  size={32}
                  weight="duotone"
                  className="text-ink-muted-48"
                  aria-hidden="true"
                />
              )}
            </div>
            <div className="flex items-center gap-xs">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-pill border border-hairline-soft bg-canvas px-md py-xs font-display font-semibold text-caption-strong text-ink transition-transform duration-fast active:scale-95 hover:border-coral/40 hover:text-coral"
              >
                {restaurant.logoDataUrl ? t('logo_replace') : t('logo_upload')}
              </button>
              {restaurant.logoDataUrl && (
                <button
                  type="button"
                  onClick={clearLogo}
                  className="inline-flex items-center gap-xxs rounded-pill px-sm py-xs font-semibold text-caption text-ink-muted-48 transition-colors duration-fast hover:text-error"
                >
                  <X size={16} weight="bold" aria-hidden="true" />
                  {t('logo_remove')}
                </button>
              )}
              <input
                ref={fileInputRef}
                id="r-logo"
                type="file"
                accept={ACCEPTED_LOGO_TYPES.join(',')}
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
          </div>
        </Field>
      </div>

      <WizardNavButtons hideBack onNext={handleNext} />
    </section>
  );
}

function Field({
  label,
  id,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-xxs block font-display font-semibold text-caption-strong text-ink"
      >
        {label}
        {required && <span className="ml-xxs text-error">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-xxs text-fine-print text-ink-muted-48">{hint}</p>}
      {error && (
        <p role="alert" className="mt-xxs text-fine-print text-error">
          {error}
        </p>
      )}
    </div>
  );
}

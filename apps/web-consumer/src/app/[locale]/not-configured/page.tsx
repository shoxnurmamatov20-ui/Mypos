import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { getTranslations, setRequestLocale } from 'next-intl/server';

/**
 * Fallback page rendered when a custom domain hits us but the backend
 * couldn't resolve it to a verified tenant. Reasons:
 *
 *   - DNS is set, but the merchant hasn't completed verification.
 *   - The merchant disabled the storefront.
 *   - The domain was once active but the tenant was deleted/suspended.
 *
 * The middleware *rewrites* (not redirects) here so the visitor's URL
 * bar still shows the host they typed — that's important for trust:
 * we don't want to look like we're hijacking the domain.
 *
 * Lives under `[locale]/` so it inherits the standard root layout.
 * The middleware injects a default locale (`uz`) when rewriting.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'brand' });
  return {
    title: t('not_configured_title'),
    description: t('not_configured_body'),
    robots: { index: false, follow: false },
  };
}

export default async function NotConfiguredPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'brand' });
  const headersList = await headers();
  const host = headersList.get('host') ?? '';

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">
        <div aria-hidden="true" className="mb-6 text-5xl text-neutral-400">
          ※
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-neutral-900">
          {t('not_configured_title')}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-neutral-600">
          {t('not_configured_body')}
        </p>
        {host && <p className="mt-6 break-all text-sm font-mono text-neutral-400">{host}</p>}
        <p className="mt-8 border-t border-neutral-200 pt-6 text-sm text-neutral-400">
          {t('powered_by')}{' '}
          <a href="https://mypos.uz" className="font-semibold text-brand-primary hover:underline">
            MyPOS
          </a>
        </p>
      </div>
    </main>
  );
}

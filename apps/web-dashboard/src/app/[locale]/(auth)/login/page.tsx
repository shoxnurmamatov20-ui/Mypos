import { getTranslations } from 'next-intl/server';
import { LoginForm } from './_components/login-form';

export async function generateMetadata() {
  const t = await getTranslations('auth.login');
  return {
    title: t('page_title'),
  };
}

export default async function LoginPage() {
  const t = await getTranslations('auth.login');

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-mint-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-brand-500">MyPOS</h1>
          <p className="mt-2 text-sm text-neutral-600">{t('subtitle')}</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-xl border border-neutral-200">
          <h2 className="mb-6 text-2xl font-semibold text-neutral-900">{t('title')}</h2>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-xs text-neutral-500">
          &copy; 2026 MyPOS. {t('footer')}
        </p>
      </div>
    </main>
  );
}

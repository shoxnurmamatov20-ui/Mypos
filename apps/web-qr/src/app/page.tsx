import { translate } from '@/lib/i18n';

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-6xl">📱</div>
        <h1 className="font-display text-3xl font-bold text-brand-500">
          {translate('uz', 'app.landing.title')}
        </h1>
        <p className="mt-3 text-neutral-600">{translate('uz', 'app.landing.subtitle')}</p>
      </div>
    </main>
  );
}

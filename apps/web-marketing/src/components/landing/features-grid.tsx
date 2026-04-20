import {
  BarChart3,
  ChefHat,
  MessageCircle,
  QrCode,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

type FeatureKey = 'pos' | 'kds' | 'qr_menu' | 'analytics' | 'ai' | 'telegram';

const ICONS: Record<FeatureKey, { icon: LucideIcon; iconClass: string; tintClass: string }> = {
  pos: {
    icon: ShoppingBag,
    iconClass: 'text-brand-600',
    tintClass: 'bg-brand-50 border-brand-100',
  },
  kds: {
    icon: ChefHat,
    iconClass: 'text-gold-700',
    tintClass: 'bg-gold-50 border-gold-100',
  },
  qr_menu: {
    icon: QrCode,
    iconClass: 'text-mint-700',
    tintClass: 'bg-mint-50 border-mint-100',
  },
  analytics: {
    icon: BarChart3,
    iconClass: 'text-neutral-700',
    tintClass: 'bg-neutral-50 border-neutral-200',
  },
  ai: {
    icon: Sparkles,
    iconClass: 'text-purple-700',
    tintClass: 'bg-purple-50 border-purple-100',
  },
  telegram: {
    icon: MessageCircle,
    iconClass: 'text-info',
    tintClass: 'bg-blue-50 border-blue-100',
  },
};

const ORDER: FeatureKey[] = ['pos', 'kds', 'qr_menu', 'analytics', 'ai', 'telegram'];

export function FeaturesGrid() {
  const t = useTranslations('features');

  return (
    <section id="features" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            {t('section_label')}
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {t('title')}
          </h2>
          <p className="mt-4 text-base text-neutral-600 sm:text-lg">{t('subtitle')}</p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ORDER.map((key) => {
            const meta = ICONS[key];
            const Icon = meta.icon;
            return (
              <li
                key={key}
                className="group relative rounded-2xl border border-neutral-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lg"
              >
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${meta.tintClass}`}
                  aria-hidden="true"
                >
                  <Icon className={`h-6 w-6 ${meta.iconClass}`} />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-neutral-900">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                  {t(`items.${key}.desc`)}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

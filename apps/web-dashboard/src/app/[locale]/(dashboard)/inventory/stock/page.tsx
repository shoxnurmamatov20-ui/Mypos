import { getTranslations } from 'next-intl/server';
import { StockBalanceView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('inventory');
  return { title: `${t('stock_balance.title')} — MyPOS` };
}

export default async function StockBalancePage() {
  const t = await getTranslations('inventory');
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#16221f] dark:text-white leading-tight">
          {t('stock_balance.title')}
        </h1>
        <p className="mt-1 text-[13px] text-[#62716d] dark:text-[#94a3b8] max-w-2xl">
          {t('stock_balance.description')}
        </p>
      </header>
      <StockBalanceView />
    </div>
  );
}

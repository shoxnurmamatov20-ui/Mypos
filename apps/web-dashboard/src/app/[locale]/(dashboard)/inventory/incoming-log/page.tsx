import { getTranslations } from 'next-intl/server';
import { IncomingLogView } from './_view';

export async function generateMetadata() {
  const t = await getTranslations('inventory');
  return { title: `${t('incoming_log.title')} — MyPOS` };
}

export default async function IncomingLogPage() {
  const t = await getTranslations('inventory');
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-[20px] sm:text-[22px] font-bold tracking-tight text-[#16221f] dark:text-white leading-tight">
          {t('incoming_log.title')}
        </h1>
        <p className="mt-1 text-[13px] text-[#62716d] dark:text-[#94a3b8] max-w-2xl">
          {t('incoming_log.description')}
        </p>
      </header>
      <IncomingLogView />
    </div>
  );
}

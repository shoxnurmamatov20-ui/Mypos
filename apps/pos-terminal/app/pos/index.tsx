import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { tablesApi } from '@mypos/api-client';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { PosHeader } from '@/components/PosHeader';
import { TablesPanel } from '@/components/TablesPanel';
import { MenuPanel } from '@/components/MenuPanel';
import { CartPanel } from '@/components/CartPanel';

export default function PosScreen() {
  const { i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const tableId = useCartStore((s) => s.tableId);

  const locale = resolveLocale(i18n.language);

  const tablesQuery = useQuery({
    queryKey: ['pos', 'tables'],
    queryFn: () => tablesApi.tables.list(apiClient),
  });

  const selectedTable =
    tableId !== null
      ? (tablesQuery.data?.data.find((t) => t.id === tableId) ?? null)
      : null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-50">
      <PosHeader
        user={user}
        table={selectedTable}
        onLogout={() => {
          void logout();
        }}
      />
      <View className="flex-1 flex-row">
        <TablesPanel />
        <MenuPanel locale={locale} />
        <CartPanel locale={locale} />
      </View>
    </SafeAreaView>
  );
}

function resolveLocale(language: string | undefined): 'uz' | 'ru' | 'en' {
  if (language === 'ru' || language === 'en') return language;
  return 'uz';
}

// apps/pos-terminal/app/pos/index.tsx
import { useState, useCallback } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '@mypos/api-client';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useReverbChannel } from '@/hooks/useReverbChannel';
import { PosHeader } from '@/components/PosHeader';
import { TablesPanel } from '@/components/TablesPanel';
import { MenuPanel } from '@/components/MenuPanel';
import { CartPanel } from '@/components/CartPanel';
import { ActiveOrdersPanel } from '@/components/ActiveOrdersPanel';

export default function PosScreen() {
  const { i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const tableId = useCartStore((s) => s.tableId);
  const [mode, setMode] = useState<'pos' | 'orders'>('pos');
  const queryClient = useQueryClient();

  const locale = resolveLocale(i18n.language);

  const tenantSlug = user?.tenant?.slug ?? 'pos';

  const handleReverbEvent = useCallback(
    (event: string, _data: unknown) => {
      const lower = event.toLowerCase();
      if (lower.includes('order')) {
        void queryClient.invalidateQueries({ queryKey: ['pos', 'active-orders'] });
      }
      if (lower.includes('table')) {
        void queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
      }
    },
    [queryClient],
  );

  const { isConnected } = useReverbChannel({
    channel: `pos.${tenantSlug}`,
    onEvent: handleReverbEvent,
    enabled: user !== null,
  });

  const tablesQuery = useQuery({
    queryKey: ['pos', 'tables'],
    queryFn: () => tablesApi.tables.list(apiClient),
  });

  const selectedTable =
    tableId !== null
      ? (tablesQuery.data?.data.find((t) => t.id === tableId) ?? null)
      : null;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-900">
      <PosHeader
        user={user}
        table={selectedTable}
        mode={mode}
        onModeChange={setMode}
        isConnected={isConnected}
        onLogout={() => {
          void logout();
        }}
      />
      {mode === 'pos' ? (
        <View className="flex-1 flex-row">
          <TablesPanel />
          <MenuPanel locale={locale} />
          <CartPanel locale={locale} />
        </View>
      ) : (
        <View className="flex-1 flex-row">
          <TablesPanel />
          <ActiveOrdersPanel locale={locale} />
        </View>
      )}
    </SafeAreaView>
  );
}

function resolveLocale(language: string | undefined): 'uz' | 'ru' | 'en' {
  if (language === 'ru' || language === 'en') return language;
  return 'uz';
}

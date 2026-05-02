// apps/pos-terminal/src/components/TablesPanel.tsx
import { View, Text, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { tablesApi } from '@mypos/api-client';
import { apiClient } from '@/lib/api';
import { useCartStore } from '@/stores/cart';
import { TableCard } from './TableCard';

export function TablesPanel() {
  const { t } = useTranslation();
  const selectedTableId = useCartStore((s) => s.tableId);
  const selectTable = useCartStore((s) => s.selectTable);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['pos', 'tables'],
    queryFn: () => tablesApi.tables.list(apiClient),
  });

  return (
    <View className="h-full w-[280px] border-r border-neutral-700 bg-neutral-800">
      <View className="h-14 flex-row items-center justify-between border-b border-neutral-700 bg-neutral-900 px-4">
        <Text className="text-lg font-bold text-neutral-50">
          {t('pos.tables')}
        </Text>
        {isFetching ? (
          <ActivityIndicator size="small" color="#EA7C69" />
        ) : (
          <Pressable
            onPress={() => refetch()}
            className="h-9 w-9 items-center justify-center rounded-lg active:bg-neutral-700"
          >
            <Text className="text-lg text-neutral-400">{'↻'}</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EA7C69" />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-base text-danger">
            {t('errors.load_tables')}
          </Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-3 h-11 items-center justify-center rounded-lg bg-brand-500 px-5 active:bg-brand-600"
          >
            <Text className="font-semibold text-white">{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : !data || data.data.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-neutral-500">
            {t('pos.no_tables')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerClassName="gap-2 p-3"
          className="bg-neutral-800"
        >
          {data.data.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              isSelected={selectedTableId === table.id}
              onPress={() => selectTable(table.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

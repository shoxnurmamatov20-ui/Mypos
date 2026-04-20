import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Table, TableStatus } from '@mypos/api-client';

type TableCardProps = {
  table: Table;
  isSelected: boolean;
  onPress: () => void;
};

const statusColor: Record<TableStatus, string> = {
  available: 'bg-mint-100 border-mint-500',
  occupied: 'bg-red-50 border-danger',
  reserved: 'bg-gold-50 border-warning',
  disabled: 'bg-neutral-100 border-neutral-400',
};

const statusDot: Record<TableStatus, string> = {
  available: 'bg-mint-500',
  occupied: 'bg-danger',
  reserved: 'bg-warning',
  disabled: 'bg-neutral-400',
};

export function TableCard({ table, isSelected, onPress }: TableCardProps) {
  const { t } = useTranslation();
  const bg = statusColor[table.status];
  const dot = statusDot[table.status];

  const ringClass = isSelected
    ? 'border-brand-500 bg-brand-50'
    : bg;

  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[92px] rounded-xl border-2 p-3 active:opacity-80 ${ringClass}`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-bold text-neutral-900">
          {table.name}
        </Text>
        <View className={`h-3 w-3 rounded-full ${dot}`} />
      </View>
      <Text className="mt-1 text-sm text-neutral-600">
        {table.capacity} {t('pos.seats')}
      </Text>
      <Text className="mt-1 text-xs font-medium text-neutral-500">
        {t(`table_status.${table.status}`)}
      </Text>
    </Pressable>
  );
}

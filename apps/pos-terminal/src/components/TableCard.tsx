// apps/pos-terminal/src/components/TableCard.tsx
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Table, TableStatus } from '@mypos/api-client';

type TableCardProps = {
  table: Table;
  isSelected: boolean;
  onPress: () => void;
};

const statusBorder: Record<TableStatus, string> = {
  available: 'border-mint-500',
  occupied: 'border-danger',
  reserved: 'border-warning',
  disabled: 'border-neutral-600',
};

const statusDot: Record<TableStatus, string> = {
  available: 'bg-mint-500',
  occupied: 'bg-danger',
  reserved: 'bg-warning',
  disabled: 'bg-neutral-500',
};

const statusText: Record<TableStatus, string> = {
  available: 'text-mint-500',
  occupied: 'text-danger',
  reserved: 'text-warning',
  disabled: 'text-neutral-500',
};

export function TableCard({ table, isSelected, onPress }: TableCardProps) {
  const { t } = useTranslation();
  const border = isSelected ? 'border-brand-500' : statusBorder[table.status];
  const dot = statusDot[table.status];
  const textColor = statusText[table.status];

  return (
    <Pressable
      onPress={onPress}
      className={`min-h-[100px] rounded-xl border-2 bg-neutral-700 p-3 active:bg-neutral-600 ${border} ${
        isSelected ? 'bg-neutral-700' : ''
      }`}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-xl font-bold text-neutral-50">{table.name}</Text>
        <View className={`h-[10px] w-[10px] rounded-full ${dot}`} />
      </View>
      <Text className="mt-2 text-sm text-neutral-400">
        {table.capacity} {t('pos.seats')}
      </Text>
      <Text className={`mt-1 text-xs font-medium ${textColor}`}>
        {t(`table_status.${table.status}`)}
      </Text>
    </Pressable>
  );
}

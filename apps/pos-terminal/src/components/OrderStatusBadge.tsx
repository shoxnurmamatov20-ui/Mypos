// apps/pos-terminal/src/components/OrderStatusBadge.tsx
import { View, Text } from 'react-native';
import type { OrderStatus } from '@mypos/api-client';

type Props = { status: OrderStatus };

type BadgeStyle = {
  container: string;
  text: string;
};

const STATUS_STYLES: Partial<Record<OrderStatus, BadgeStyle>> = {
  pending: {
    container: 'bg-yellow-500/20 border border-yellow-500/40',
    text: 'text-yellow-400',
  },
  preparing: {
    container: 'bg-blue-500/20 border border-blue-500/40',
    text: 'text-blue-400',
  },
  ready: {
    container: 'bg-mint-500/20 border border-mint-500/40',
    text: 'text-mint-400',
  },
  served: {
    container: 'bg-purple-500/20 border border-purple-500/40',
    text: 'text-purple-400',
  },
  completed: {
    container: 'bg-neutral-600/40 border border-neutral-500/40',
    text: 'text-neutral-400',
  },
  cancelled: {
    container: 'bg-red-900/30 border border-danger/40',
    text: 'text-danger',
  },
};

const DEFAULT_STYLE: BadgeStyle = {
  container: 'bg-neutral-700 border border-neutral-600',
  text: 'text-neutral-400',
};

const STATUS_LABELS: Partial<Record<OrderStatus, string>> = {
  pending: 'Kutilmoqda',
  preparing: 'Tayyorlanmoqda',
  ready: 'Tayyor',
  served: 'Berildi',
  completed: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
};

export function OrderStatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status] ?? DEFAULT_STYLE;
  const label = STATUS_LABELS[status] ?? status;

  return (
    <View className={`self-start rounded-full px-3 py-1 ${style.container}`}>
      <Text className={`text-xs font-semibold ${style.text}`}>{label}</Text>
    </View>
  );
}

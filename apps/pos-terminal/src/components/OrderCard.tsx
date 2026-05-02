// apps/pos-terminal/src/components/OrderCard.tsx
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import type { Order, OrderStatus } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { OrderStatusBadge } from './OrderStatusBadge';

type Props = {
  order: Order;
  locale: 'uz' | 'ru' | 'en';
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  isUpdating: boolean;
};

type ActionButton = {
  label: string;
  nextStatus: OrderStatus;
  className: string;
  textClassName: string;
};

const NEXT_ACTION: Partial<Record<OrderStatus, ActionButton>> = {
  pending: {
    label: 'Tayyorlash →',
    nextStatus: 'preparing',
    className: 'bg-blue-500/20 border border-blue-500/40',
    textClassName: 'text-blue-400',
  },
  preparing: {
    label: 'Tayyor ✓',
    nextStatus: 'ready',
    className: 'bg-mint-500/20 border border-mint-500/40',
    textClassName: 'text-mint-400',
  },
  ready: {
    label: 'Berildi ✓',
    nextStatus: 'served',
    className: 'bg-purple-500/20 border border-purple-500/40',
    textClassName: 'text-purple-400',
  },
  served: {
    label: 'Yakunlash',
    nextStatus: 'completed',
    className: 'bg-neutral-600 border border-neutral-500',
    textClassName: 'text-neutral-300',
  },
};

const FINAL_STATUSES = new Set<OrderStatus>(['completed', 'cancelled', 'refunded']);

const MAX_VISIBLE_ITEMS = 3;

export function OrderCard({ order, locale, onStatusUpdate, isUpdating }: Props) {
  const action = NEXT_ACTION[order.status];
  const isFinal = FINAL_STATUSES.has(order.status);
  const visibleItems = order.items.slice(0, MAX_VISIBLE_ITEMS);
  const hiddenCount = order.items.length - MAX_VISIBLE_ITEMS;
  const total = formatUZS(order.amounts.total, locale);

  return (
    <View className="w-full rounded-xl border border-neutral-700 bg-neutral-800 p-4">
      {/* Header row */}
      <View className="flex-row items-start justify-between">
        <View className="flex-1 gap-0.5">
          <Text className="text-lg font-bold text-neutral-50">
            #{order.order_no}
          </Text>
          {order.table ? (
            <Text className="text-sm text-neutral-400">
              Stol: {order.table.name}
            </Text>
          ) : null}
        </View>
        <OrderStatusBadge status={order.status} />
      </View>

      {/* Items list */}
      <View className="mt-3 gap-1">
        {visibleItems.map((item) => (
          <Text key={item.id} className="text-sm text-neutral-300">
            {item.quantity}x {item.name}
          </Text>
        ))}
        {hiddenCount > 0 && (
          <Text className="text-sm text-neutral-500">
            + {hiddenCount} ta ko&apos;proq
          </Text>
        )}
      </View>

      {/* Footer row */}
      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-brand-400">{total}</Text>

        {!isFinal && (
          <View className="flex-row gap-2">
            {/* Cancel button */}
            <Pressable
              onPress={() => onStatusUpdate(order.id, 'cancelled')}
              disabled={isUpdating}
              className="h-8 items-center justify-center rounded-lg border border-danger/30 bg-red-900/20 px-3 active:opacity-70"
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#FF6B6B" />
              ) : (
                <Text className="text-xs text-danger">{'✕'} Bekor</Text>
              )}
            </Pressable>

            {/* Primary action button */}
            {action ? (
              <Pressable
                onPress={() => onStatusUpdate(order.id, action.nextStatus)}
                disabled={isUpdating}
                className={`h-10 items-center justify-center rounded-lg px-4 active:opacity-70 ${action.className}`}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#94a3b8" />
                ) : (
                  <Text className={`text-sm font-semibold ${action.textClassName}`}>
                    {action.label}
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

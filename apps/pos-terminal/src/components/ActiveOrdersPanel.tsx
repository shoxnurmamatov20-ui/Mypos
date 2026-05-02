// apps/pos-terminal/src/components/ActiveOrdersPanel.tsx
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@mypos/api-client';
import type { Order, OrderStatus } from '@mypos/api-client';
import { apiClient } from '@/lib/api';
import { OrderCard } from './OrderCard';

type Props = { locale: 'uz' | 'ru' | 'en' };

type FilterOption = {
  label: string;
  value: OrderStatus | null;
};

const FILTER_OPTIONS: FilterOption[] = [
  { label: 'Hammasi', value: null },
  { label: 'Kutilmoqda', value: 'pending' },
  { label: 'Tayyorlanmoqda', value: 'preparing' },
  { label: 'Tayyor', value: 'ready' },
  { label: 'Berildi', value: 'served' },
];

const QUERY_KEY = ['pos', 'active-orders'] as const;

export function ActiveOrdersPanel({ locale }: Props) {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<OrderStatus | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => ordersApi.list(apiClient, { active_only: true, per_page: 50 }),
    refetchInterval: 15_000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateStatus(apiClient, orderId, { status }),
    onMutate: ({ orderId }) => {
      setUpdatingOrderId(orderId);
    },
    onSettled: () => {
      setUpdatingOrderId(null);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const handleStatusUpdate = (orderId: string, status: OrderStatus) => {
    statusMutation.mutate({ orderId, status });
  };

  const allOrders: Order[] = data?.data ?? [];
  const filteredOrders =
    activeFilter === null
      ? allOrders
      : allOrders.filter((o) => o.status === activeFilter);

  return (
    <View className="flex-1 bg-neutral-900">
      {/* Header bar */}
      <View className="h-14 flex-row items-center justify-between border-b border-neutral-700 bg-neutral-800 px-6">
        <Text className="text-lg font-bold text-neutral-50">
          Faol Buyurtmalar
        </Text>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="flex-row gap-2 items-center"
          className="mx-4 flex-1"
        >
          {FILTER_OPTIONS.map((opt) => {
            const isActive = activeFilter === opt.value;
            return (
              <Pressable
                key={String(opt.value)}
                onPress={() => setActiveFilter(opt.value)}
                className={`h-8 items-center justify-center rounded-full px-3 ${
                  isActive ? 'bg-brand-500' : 'bg-neutral-700 active:bg-neutral-600'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isActive ? 'text-white' : 'text-neutral-400'
                  }`}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Refresh button */}
        <Pressable
          onPress={() => void refetch()}
          disabled={isFetching}
          className="h-8 w-8 items-center justify-center"
        >
          {isFetching ? (
            <ActivityIndicator size="small" color="#EA7C69" />
          ) : (
            <Text className="text-lg text-neutral-400">{'↻'}</Text>
          )}
        </Pressable>
      </View>

      {/* Body */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EA7C69" />
        </View>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState hasFilter={activeFilter !== null} />
      ) : (
        <ScrollView contentContainerClassName="p-4 gap-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              locale={locale}
              onStatusUpdate={handleStatusUpdate}
              isUpdating={updatingOrderId === order.id}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <View className="w-full max-w-sm items-center rounded-xl bg-neutral-800 p-8">
        <Text className="text-5xl">{'📋'}</Text>
        <Text className="mt-3 text-center text-lg text-neutral-500">
          Faol buyurtmalar yo&apos;q
        </Text>
        {hasFilter && (
          <Text className="mt-1 text-center text-sm text-neutral-600">
            Filtrni o&apos;zgartiring
          </Text>
        )}
      </View>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center p-4">
      <Text className="text-center text-base text-danger">
        Buyurtmalarni yuklab bo&apos;lmadi
      </Text>
      <Pressable
        onPress={onRetry}
        className="mt-4 rounded-lg bg-neutral-700 px-6 py-3 active:bg-neutral-600"
      >
        <Text className="font-semibold text-neutral-200">Qayta urinish</Text>
      </Pressable>
    </View>
  );
}

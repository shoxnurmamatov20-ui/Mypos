import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, ordersApi } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { apiClient } from '@/lib/api';
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from '@/stores/cart';
import { CartItemRow } from './CartItemRow';

type CartPanelProps = {
  locale: 'uz' | 'ru' | 'en';
};

export function CartPanel({ locale }: CartPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const tableId = useCartStore((s) => s.tableId);
  const items = useCartStore((s) => s.items);
  const notes = useCartStore((s) => s.notes);
  const setNotes = useCartStore((s) => s.setNotes);
  const incrementItem = useCartStore((s) => s.incrementItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const clear = useCartStore((s) => s.clear);
  const subtotal = useCartStore(selectCartSubtotal);
  const count = useCartStore(selectCartCount);
  const [localError, setLocalError] = useState<string | null>(null);

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!tableId) {
        throw new Error('select_table_first');
      }
      if (items.length === 0) {
        throw new Error('cart_empty');
      }
      return ordersApi.create(apiClient, {
        type: 'dine_in',
        table_id: tableId,
        notes: notes || undefined,
        items: items.map((item) => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      });
    },
    onSuccess: () => {
      clear();
      setLocalError(null);
      void queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
      Alert.alert(t('pos.order_placed'));
    },
    onError: (err) => {
      if (err instanceof Error && err.message === 'select_table_first') {
        setLocalError(t('errors.select_table_first'));
        return;
      }
      if (err instanceof Error && err.message === 'cart_empty') {
        setLocalError(t('errors.cart_empty'));
        return;
      }
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setLocalError(body?.message ?? t('errors.place_order'));
        return;
      }
      setLocalError(t('errors.network'));
    },
  });

  const isDisabled =
    placeOrder.isPending || items.length === 0 || !tableId;

  return (
    <View className="h-full w-[350px] border-l border-neutral-200 bg-white">
      <View className="h-14 flex-row items-center justify-between border-b border-neutral-200 px-4">
        <Text className="text-xl font-bold text-neutral-900">
          {t('cart.title')}
        </Text>
        {count > 0 && (
          <Text className="text-sm text-neutral-500">
            {t('cart.item_count', { count })}
          </Text>
        )}
      </View>

      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-lg font-semibold text-neutral-700">
            {t('cart.empty')}
          </Text>
          <Text className="mt-1 text-center text-sm text-neutral-500">
            {t('cart.empty_hint')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-3 p-3">
          {items.map((item) => (
            <CartItemRow
              key={item.menuItemId}
              item={item}
              locale={locale}
              onIncrement={() => incrementItem(item.menuItemId)}
              onDecrement={() => decrementItem(item.menuItemId)}
              onRemove={() => removeItem(item.menuItemId)}
            />
          ))}

          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t('cart.notes_placeholder')}
            placeholderTextColor="#94A3B8"
            multiline
            className="min-h-[60px] rounded-xl border border-neutral-300 bg-neutral-50 p-3 text-base text-neutral-900"
          />
        </ScrollView>
      )}

      <View className="gap-3 border-t border-neutral-200 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base text-neutral-500">
            {t('pos.subtotal')}
          </Text>
          <Text className="text-xl font-bold text-neutral-900">
            {formatUZS(subtotal, locale)}
          </Text>
        </View>

        {localError && (
          <View className="rounded-lg bg-red-50 p-3">
            <Text className="text-sm text-danger">{localError}</Text>
          </View>
        )}

        <Pressable
          disabled={isDisabled}
          onPress={() => placeOrder.mutate()}
          className={`h-16 items-center justify-center rounded-xl ${
            isDisabled ? 'bg-neutral-300' : 'bg-brand-500 active:bg-brand-600'
          }`}
        >
          {placeOrder.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-lg font-bold text-white">
              {t('pos.place_order')}
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

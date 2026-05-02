// apps/pos-terminal/src/components/CartPanel.tsx
import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError, ordersApi, type Customer } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { apiClient } from '@/lib/api';
import {
  selectCartCount,
  selectCartSubtotal,
  useCartStore,
} from '@/stores/cart';
import { CartItemRow } from './CartItemRow';
import { PaymentModal } from './PaymentModal';
import { CustomerSearchModal } from './CustomerSearchModal';
import { ReceiptModal } from './ReceiptModal';

type CartPanelProps = {
  locale: 'uz' | 'ru' | 'en';
};

export function CartPanel({ locale }: CartPanelProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const tableId = useCartStore((s) => s.tableId);
  const customerId = useCartStore((s) => s.customerId);
  const setCustomer = useCartStore((s) => s.setCustomer);
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
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

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
        customer_id: customerId ?? undefined,
        notes: notes || undefined,
        items: items.map((item) => ({
          menu_item_id: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      });
    },
    onSuccess: (response) => {
      setLocalError(null);
      setOrderId(response.data.id);
      setShowPayment(true);
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

  const isDisabled = placeOrder.isPending || items.length === 0 || !tableId;
  const subtotalFormatted = formatUZS(subtotal, locale);

  return (
    <View className="h-full w-[380px] border-l border-neutral-700 bg-neutral-800">
      {/* Header */}
      <View className="h-14 flex-row items-center justify-between border-b border-neutral-700 bg-neutral-900 px-4">
        <Text className="text-lg font-bold text-neutral-50">
          {t('cart.title')}
        </Text>
        {count > 0 && (
          <View className="rounded-full bg-brand-500 px-3 py-1">
            <Text className="text-sm font-bold text-white">{count}</Text>
          </View>
        )}
      </View>

      {/* Customer row */}
      <Pressable
        onPress={() => setShowCustomerSearch(true)}
        className="flex-row items-center justify-between border-b border-neutral-700 bg-neutral-900/50 px-4 py-2 active:bg-neutral-700/50"
      >
        {customerId === null ? (
          <Text className="text-sm text-neutral-400">
            {t('cart.attach_customer')}
          </Text>
        ) : (
          <Text className="text-sm text-green-400">
            {t('cart.customer_attached')}
          </Text>
        )}
      </Pressable>

      {/* Empty state */}
      {items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-center text-lg font-semibold text-neutral-500">
            {t('cart.empty')}
          </Text>
          <Text className="mt-1 text-center text-sm text-neutral-600">
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
            placeholderTextColor="#64748B"
            multiline
            className="min-h-[60px] rounded-xl border border-neutral-600 bg-neutral-700 p-3 text-base text-neutral-50"
          />
        </ScrollView>
      )}

      {/* Footer */}
      <View className="gap-3 border-t border-neutral-700 bg-neutral-900 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base text-neutral-400">
            {t('pos.subtotal')}
          </Text>
          <Text className="text-2xl font-bold text-neutral-50">
            {subtotalFormatted}
          </Text>
        </View>

        {localError && (
          <View className="rounded-lg border border-danger/40 bg-red-900/30 p-3">
            <Text className="text-sm text-danger">{localError}</Text>
          </View>
        )}

        <Pressable
          disabled={isDisabled}
          onPress={() => placeOrder.mutate()}
          className={`h-[72px] items-center justify-center rounded-xl ${
            isDisabled
              ? 'border border-neutral-600 bg-neutral-700'
              : 'bg-brand-500 active:bg-brand-600'
          }`}
        >
          {placeOrder.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text
              className={`text-xl font-bold ${
                isDisabled ? 'text-neutral-500' : 'text-white'
              }`}
            >
              {isDisabled
                ? t('payment.place_and_pay')
                : `${t('payment.place_and_pay')} • ${subtotalFormatted}`}
            </Text>
          )}
        </Pressable>
      </View>

      <PaymentModal
        visible={showPayment}
        orderId={orderId ?? ''}
        total={subtotal}
        locale={locale}
        onSuccess={() => {
          setShowPayment(false);
          // Show receipt before clearing cart so cashier can share/print it.
          setShowReceipt(true);
        }}
        onClose={() => {
          setShowPayment(false);
          setOrderId(null);
          // Order already placed — do not clear cart so cashier can retry payment
        }}
      />

      <CustomerSearchModal
        visible={showCustomerSearch}
        locale={locale}
        currentCustomerId={customerId}
        onSelect={(customer: Customer | null) => {
          setCustomer(customer?.id ?? null);
          setShowCustomerSearch(false);
        }}
        onClose={() => setShowCustomerSearch(false)}
      />

      <ReceiptModal
        visible={showReceipt}
        orderId={orderId}
        locale={locale}
        onClose={() => {
          setShowReceipt(false);
          setOrderId(null);
          clear();
          void queryClient.invalidateQueries({ queryKey: ['pos', 'tables'] });
          void queryClient.invalidateQueries({ queryKey: ['pos', 'active-orders'] });
        }}
      />
    </View>
  );
}

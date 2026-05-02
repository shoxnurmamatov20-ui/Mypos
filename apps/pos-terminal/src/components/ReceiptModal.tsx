// apps/pos-terminal/src/components/ReceiptModal.tsx
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { ordersApi, type Order } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReceiptModalProps = {
  visible: boolean;
  orderId: string | null;
  locale: 'uz' | 'ru' | 'en';
  onClose: () => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatReceiptDate(isoString: string | null): string {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const day = String(d.getDate()).padStart(2, '0');
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const month = months[d.getMonth()] ?? '';
  const year = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

function generateReceiptText(order: Order, tenantName: string): string {
  const line = '===========================';
  const dash = '---------------------------';
  const date = order.placed_at
    ? new Date(order.placed_at).toLocaleDateString('uz-UZ')
    : '—';

  const itemLines = order.items
    .map((item) => `${item.quantity}x ${item.name}: ${item.subtotal_amount.toLocaleString()} so'm`)
    .join('\n');

  return [
    'MyPOS',
    tenantName,
    line,
    `Buyurtma: #${order.order_no}`,
    `Sana: ${date}`,
    dash,
    itemLines,
    dash,
    `Jami: ${order.amounts.total.toLocaleString()} so'm`,
    line,
    "Tashrifingiz uchun rahmat!",
  ].join('\n');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

type ReceiptBodyProps = {
  order: Order;
  tenantName: string;
  locale: 'uz' | 'ru' | 'en';
};

function ReceiptBody({ order, tenantName, locale }: ReceiptBodyProps) {
  return (
    <ScrollView
      contentContainerClassName="px-6 py-4 gap-1"
      showsVerticalScrollIndicator={false}
    >
      {/* Brand */}
      <Text className="text-center text-2xl font-bold text-brand-500">
        MyPOS
      </Text>
      <Text className="text-center text-sm text-neutral-400">{tenantName}</Text>
      <Text className="mt-1 text-center text-xs text-neutral-500">
        {formatReceiptDate(order.placed_at)}
      </Text>

      {/* Order meta */}
      <View className="my-3 border-t border-dashed border-neutral-700" />
      <Text className="text-center font-mono text-sm text-neutral-300">
        # {order.order_no}
      </Text>
      {order.table != null && (
        <Text className="text-center text-xs text-neutral-400">
          Stol: {order.table.name}
        </Text>
      )}

      {/* Items */}
      <View className="my-3 border-t border-dashed border-neutral-700" />
      {order.items.map((item) => (
        <View key={item.id} className="flex-row justify-between py-0.5">
          <Text className="flex-1 text-sm text-neutral-300">
            {item.quantity}x {item.name}
          </Text>
          <Text className="text-sm text-neutral-300">
            {formatUZS(item.subtotal_amount, locale)}
          </Text>
        </View>
      ))}

      {/* Totals */}
      <View className="my-3 border-t border-dashed border-neutral-700" />
      <View className="flex-row justify-between">
        <Text className="text-sm text-neutral-400">Subtotal</Text>
        <Text className="text-sm text-neutral-400">
          {formatUZS(order.amounts.subtotal, locale)}
        </Text>
      </View>
      <View className="mt-1 flex-row justify-between">
        <Text className="text-lg font-bold text-neutral-50">JAMI</Text>
        <Text className="text-lg font-bold text-brand-400">
          {formatUZS(order.amounts.total, locale)}
        </Text>
      </View>

      {/* Payment status */}
      <Text className="mt-2 text-center text-xs text-mint-400">
        {`To'lov: ${order.payment_status}`}
      </Text>

      {/* Footer note */}
      <Text className="mt-3 text-center text-xs italic text-neutral-500">
        Tashrifingiz uchun rahmat!
      </Text>
    </ScrollView>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReceiptModal({
  visible,
  orderId,
  locale,
  onClose,
}: ReceiptModalProps) {
  const user = useAuthStore((s) => s.user);
  const tenantName = user?.tenant?.name ?? 'MyPOS';

  const { data, isLoading } = useQuery({
    queryKey: ['receipt', orderId],
    queryFn: () => ordersApi.show(apiClient, orderId as string),
    enabled: visible && orderId !== null,
  });

  const order = data?.data ?? null;

  const handleShare = () => {
    if (!order) return;
    const text = generateReceiptText(order, tenantName);
    void Share.share({ message: text });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/70 p-8">
        <View className="w-full max-w-md overflow-hidden rounded-2xl bg-neutral-800">

          {/* Header */}
          <View className="flex-row items-center justify-between bg-neutral-900 px-6 py-4">
            <Text className="text-xl font-bold text-neutral-50">Chek</Text>
            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-700 active:bg-neutral-600"
              accessibilityLabel="Yopish"
            >
              <Text className="text-base font-bold text-neutral-300">✕</Text>
            </Pressable>
          </View>

          {/* Body */}
          <View className="max-h-[480px] bg-neutral-800">
            {isLoading ? (
              <View className="h-48 items-center justify-center">
                <ActivityIndicator color="#EA7C69" size="large" />
              </View>
            ) : order !== null ? (
              <ReceiptBody order={order} tenantName={tenantName} locale={locale} />
            ) : (
              <View className="h-48 items-center justify-center px-6">
                <Text className="text-center text-sm text-neutral-500">
                  Chekni yuklab bo'lmadi
                </Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View className="flex-row gap-3 bg-neutral-900 px-6 py-4">
            <Pressable
              onPress={handleShare}
              disabled={order === null}
              className="h-12 flex-1 items-center justify-center rounded-xl bg-neutral-700 active:bg-neutral-600 disabled:opacity-40"
              accessibilityLabel="Ulashish"
            >
              <Text className="font-semibold text-neutral-50">
                Ulashish
              </Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              className="h-12 flex-1 items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600"
              accessibilityLabel="Yangi buyurtma"
            >
              <Text className="font-semibold text-white">
                Yangi buyurtma
              </Text>
            </Pressable>
          </View>

        </View>
      </View>
    </Modal>
  );
}

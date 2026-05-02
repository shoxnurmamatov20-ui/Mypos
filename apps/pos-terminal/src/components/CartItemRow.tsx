// apps/pos-terminal/src/components/CartItemRow.tsx
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { formatUZS } from '@mypos/utils';
import type { CartItem } from '@/stores/cart';

type CartItemRowProps = {
  item: CartItem;
  locale: 'uz' | 'ru' | 'en';
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

export function CartItemRow({
  item,
  locale,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemRowProps) {
  const { t } = useTranslation();
  const lineTotal = formatUZS(item.price * item.quantity, locale);
  const unitPrice = formatUZS(item.price, locale);

  return (
    <View className="gap-2 rounded-xl border border-neutral-600 bg-neutral-700 p-3">
      {/* Top row: name + unit price + remove */}
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-neutral-50"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-400">{unitPrice}</Text>
        </View>
        <Pressable
          onPress={onRemove}
          accessibilityLabel={t('cart.remove')}
          className="h-9 w-9 items-center justify-center rounded-lg border border-neutral-500 bg-neutral-600 active:bg-red-900/50"
        >
          <Text className="text-lg text-neutral-400">×</Text>
        </Pressable>
      </View>

      {/* Bottom row: qty controls + line total */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onDecrement}
            accessibilityLabel={t('cart.decrement')}
            className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-600 active:bg-neutral-500"
          >
            <Text className="text-xl font-bold text-neutral-50">−</Text>
          </Pressable>
          <Text className="min-w-[36px] text-center text-lg font-bold text-neutral-50">
            {item.quantity}
          </Text>
          <Pressable
            onPress={onIncrement}
            accessibilityLabel={t('cart.increment')}
            className="h-10 w-10 items-center justify-center rounded-lg border border-brand-500/50 bg-brand-500/20 active:bg-brand-500/40"
          >
            <Text className="text-xl font-bold text-brand-400">+</Text>
          </Pressable>
        </View>
        <Text className="text-base font-bold text-neutral-50">{lineTotal}</Text>
      </View>
    </View>
  );
}

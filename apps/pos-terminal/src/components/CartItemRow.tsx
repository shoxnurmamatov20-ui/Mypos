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
    <View className="gap-2 rounded-xl border border-neutral-200 bg-white p-3">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text
            className="text-base font-semibold text-neutral-900"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-500">{unitPrice}</Text>
        </View>
        <Pressable
          onPress={onRemove}
          accessibilityLabel={t('cart.remove')}
          className="h-9 w-9 items-center justify-center rounded-lg bg-red-50 active:bg-red-100"
        >
          <Text className="text-lg text-danger">×</Text>
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Pressable
            onPress={onDecrement}
            accessibilityLabel={t('cart.decrement')}
            className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 active:bg-neutral-200"
          >
            <Text className="text-xl font-bold text-neutral-900">−</Text>
          </Pressable>
          <Text className="min-w-[32px] text-center text-lg font-semibold text-neutral-900">
            {item.quantity}
          </Text>
          <Pressable
            onPress={onIncrement}
            accessibilityLabel={t('cart.increment')}
            className="h-10 w-10 items-center justify-center rounded-lg bg-brand-100 active:bg-brand-200"
          >
            <Text className="text-xl font-bold text-brand-700">+</Text>
          </Pressable>
        </View>
        <Text className="text-base font-bold text-neutral-900">
          {lineTotal}
        </Text>
      </View>
    </View>
  );
}

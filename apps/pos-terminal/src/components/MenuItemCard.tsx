// apps/pos-terminal/src/components/MenuItemCard.tsx
import { View, Text, Pressable } from 'react-native';
import type { MenuItem } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';

type MenuItemCardProps = {
  item: MenuItem;
  locale: 'uz' | 'ru' | 'en';
  onPress: () => void;
};

export function MenuItemCard({ item, locale, onPress }: MenuItemCardProps) {
  const name = item.name[locale] ?? item.name.uz;
  const price = formatUZS(item.price.effective_amount, locale);
  const isOutOfStock =
    item.stock_tracked &&
    item.current_stock !== null &&
    item.current_stock <= 0;
  const isDisabled = isOutOfStock || !item.is_active;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`min-h-[120px] flex-1 basis-[48%] rounded-xl border border-neutral-700 bg-neutral-800 p-4 active:border-neutral-600 active:bg-neutral-700 ${
        isDisabled ? 'opacity-40' : ''
      }`}
    >
      <View className="flex-1 justify-between">
        <View>
          <Text
            className="text-base font-semibold text-neutral-50"
            numberOfLines={2}
          >
            {name}
          </Text>
          {item.is_new && (
            <View className="mt-2 self-start rounded-full border border-brand-500/40 bg-brand-500/20 px-2 py-0.5">
              <Text className="text-xs font-bold text-brand-400">NEW</Text>
            </View>
          )}
          {isOutOfStock && (
            <Text className="mt-1 text-xs text-neutral-500">
              Tugagan
            </Text>
          )}
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-brand-400">{price}</Text>
          {!isDisabled && (
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-brand-500 active:bg-brand-600">
              <Text className="text-xl font-bold text-white">+</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

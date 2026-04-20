import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';

type MenuItemCardProps = {
  item: MenuItem;
  locale: 'uz' | 'ru' | 'en';
  onPress: () => void;
};

export function MenuItemCard({ item, locale, onPress }: MenuItemCardProps) {
  const { t: _t } = useTranslation();
  const name = item.name[locale] ?? item.name.uz;
  const price = formatUZS(item.price.effective_amount, locale);
  const isOutOfStock =
    item.stock_tracked &&
    item.current_stock !== null &&
    item.current_stock <= 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={isOutOfStock || !item.is_active}
      className={`min-h-[120px] flex-1 basis-[48%] rounded-xl border border-neutral-200 bg-white p-4 active:bg-neutral-50 ${
        isOutOfStock || !item.is_active ? 'opacity-50' : ''
      }`}
    >
      <View className="flex-1 justify-between">
        <View>
          <Text
            className="text-base font-semibold text-neutral-900"
            numberOfLines={2}
          >
            {name}
          </Text>
          {item.is_new && (
            <View className="mt-2 self-start rounded-full bg-brand-100 px-2 py-0.5">
              <Text className="text-xs font-medium text-brand-700">NEW</Text>
            </View>
          )}
        </View>
        <Text className="mt-2 text-lg font-bold text-brand-500">{price}</Text>
      </View>
    </Pressable>
  );
}

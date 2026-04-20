import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { menuApi, type MenuItem } from '@mypos/api-client';
import { apiClient } from '@/lib/api';
import { useCartStore } from '@/stores/cart';
import { MenuItemCard } from './MenuItemCard';

type MenuPanelProps = {
  locale: 'uz' | 'ru' | 'en';
};

const ALL_KEY = '__all__';

export function MenuPanel({ locale }: MenuPanelProps) {
  const { t } = useTranslation();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(ALL_KEY);
  const [query, setQuery] = useState('');
  const addItem = useCartStore((s) => s.addItem);

  const categoriesQuery = useQuery({
    queryKey: ['pos', 'menu-categories'],
    queryFn: () =>
      menuApi.categories.list(apiClient, { active_only: true }),
  });

  const itemsQuery = useQuery({
    queryKey: [
      'pos',
      'menu-items',
      activeCategoryId === ALL_KEY ? null : activeCategoryId,
      query || null,
    ],
    queryFn: () =>
      menuApi.items.list(apiClient, {
        category_id:
          activeCategoryId === ALL_KEY ? undefined : activeCategoryId,
        q: query || undefined,
        active_only: true,
        per_page: 100,
      }),
  });

  const items = useMemo(() => itemsQuery.data?.data ?? [], [itemsQuery.data]);

  const handleAdd = (item: MenuItem) => {
    addItem(item, locale);
  };

  return (
    <View className="h-full flex-1 bg-neutral-50">
      <View className="h-14 flex-row items-center gap-3 border-b border-neutral-200 bg-white px-4">
        <Text className="text-xl font-bold text-neutral-900">
          {t('pos.menu')}
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('pos.search_menu')}
          placeholderTextColor="#94A3B8"
          className="ml-4 h-10 flex-1 rounded-lg border border-neutral-300 bg-neutral-50 px-3 text-base text-neutral-900"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4 py-3"
        className="max-h-14 grow-0 bg-white"
      >
        <CategoryChip
          label={t('pos.all_categories')}
          isActive={activeCategoryId === ALL_KEY}
          onPress={() => setActiveCategoryId(ALL_KEY)}
        />
        {categoriesQuery.data?.data.map((category) => (
          <CategoryChip
            key={category.id}
            label={category.name[locale] ?? category.name.uz}
            isActive={activeCategoryId === category.id}
            onPress={() => setActiveCategoryId(category.id)}
          />
        ))}
      </ScrollView>

      {itemsQuery.isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#EA7C69" />
        </View>
      ) : itemsQuery.isError ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-base text-danger">
            {t('errors.load_menu')}
          </Text>
          <Pressable
            onPress={() => itemsQuery.refetch()}
            className="mt-3 h-11 items-center justify-center rounded-lg bg-brand-500 px-5"
          >
            <Text className="font-semibold text-white">{t('common.retry')}</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-neutral-500">
            {t('pos.no_items')}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-4">
          <View className="flex-row flex-wrap gap-3">
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                locale={locale}
                onPress={() => handleAdd(item)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function CategoryChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-10 items-center justify-center rounded-full border px-4 ${
        isActive
          ? 'border-brand-500 bg-brand-500'
          : 'border-neutral-300 bg-white'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          isActive ? 'text-white' : 'text-neutral-700'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// apps/pos-terminal/src/components/MenuPanel.tsx
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
import { ItemDetailModal } from './ItemDetailModal';

type MenuPanelProps = {
  locale: 'uz' | 'ru' | 'en';
};

const ALL_KEY = '__all__';

export function MenuPanel({ locale }: MenuPanelProps) {
  const { t } = useTranslation();
  const [activeCategoryId, setActiveCategoryId] = useState<string>(ALL_KEY);
  const [query, setQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const setItemNotes = useCartStore((s) => s.setItemNotes);

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

  const handleItemPress = (item: MenuItem) => {
    setSelectedItem(item);
  };

  const handleDetailAdd = (item: MenuItem, quantity: number, notes: string) => {
    for (let i = 0; i < quantity; i++) {
      addItem(item, locale);
    }
    if (notes.trim()) {
      setItemNotes(item.id, notes);
    }
    setSelectedItem(null);
  };

  return (
    <View className="h-full flex-1 bg-neutral-900">
      {/* Header bar */}
      <View className="h-14 flex-row items-center gap-4 border-b border-neutral-700 bg-neutral-800 px-4">
        <Text className="w-[60px] text-lg font-bold text-neutral-50">
          {t('pos.menu')}
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('pos.search_menu')}
          placeholderTextColor="#64748B"
          className="h-10 flex-1 rounded-lg border border-neutral-600 bg-neutral-700 px-4 text-base text-neutral-50"
        />
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4 py-3"
        className="max-h-14 grow-0 border-b border-neutral-700 bg-neutral-800"
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

      {/* Items grid */}
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
            className="mt-3 h-11 items-center justify-center rounded-lg bg-brand-500 px-5 active:bg-brand-600"
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
        <ScrollView contentContainerClassName="p-3">
          <View className="flex-row flex-wrap gap-3">
            {items.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                locale={locale}
                onPress={() => handleItemPress(item)}
              />
            ))}
          </View>
        </ScrollView>
      )}

      <ItemDetailModal
        item={selectedItem}
        locale={locale}
        onAdd={handleDetailAdd}
        onClose={() => setSelectedItem(null)}
      />
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
      className={`h-9 items-center justify-center rounded-full border px-4 ${
        isActive
          ? 'border-brand-500 bg-brand-500'
          : 'border-neutral-600 bg-neutral-700'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          isActive ? 'text-white' : 'text-neutral-300'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// apps/pos-terminal/src/components/ItemDetailModal.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';

export type ItemDetailModalProps = {
  item: MenuItem | null;
  locale: 'uz' | 'ru' | 'en';
  onAdd: (item: MenuItem, quantity: number, notes: string) => void;
  onClose: () => void;
};

export function ItemDetailModal({
  item,
  locale,
  onAdd,
  onClose,
}: ItemDetailModalProps) {
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Reset state whenever the modal opens with a new item
  useEffect(() => {
    if (item !== null) {
      setQuantity(1);
      setNotes('');
    }
  }, [item]);

  const handleDecrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity((q) => q + 1);
  }, []);

  const handleAdd = useCallback(() => {
    if (!item) return;
    onAdd(item, quantity, notes);
    setQuantity(1);
    setNotes('');
  }, [item, quantity, notes, onAdd]);

  const handleClose = useCallback(() => {
    setQuantity(1);
    setNotes('');
    onClose();
  }, [onClose]);

  const itemName = item ? (item.name[locale] ?? item.name.uz) : '';
  const unitPrice = item?.price.effective_amount ?? 0;
  const lineTotal = unitPrice * quantity;

  return (
    <Modal
      visible={item !== null}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-12">
        <View className="w-full max-w-lg overflow-hidden rounded-2xl bg-neutral-800">

          {/* Header */}
          <View className="flex-row items-start justify-between bg-neutral-900 px-6 py-5">
            <View className="mr-4 flex-1">
              <Text
                className="flex-wrap text-2xl font-bold text-neutral-50"
                numberOfLines={2}
              >
                {itemName}
              </Text>
              <Text className="mt-1 text-xl font-bold text-brand-400">
                {formatUZS(unitPrice, locale)}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-700 active:bg-neutral-600"
            >
              <Text className="text-base font-bold text-neutral-50">✕</Text>
            </Pressable>
          </View>

          {/* Body */}
          <ScrollView
            contentContainerClassName="gap-5 p-6"
            keyboardShouldPersistTaps="handled"
          >
            {/* Quantity row */}
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-medium text-neutral-400">
                {t('pos.item_detail.quantity')}
              </Text>
              <View className="flex-row items-center gap-4">
                <Pressable
                  onPress={handleDecrement}
                  disabled={quantity <= 1}
                  className={`h-12 w-12 items-center justify-center rounded-xl bg-neutral-700 active:bg-neutral-600 ${
                    quantity <= 1 ? 'opacity-40' : ''
                  }`}
                >
                  <Text className="text-2xl font-bold text-neutral-50">−</Text>
                </Pressable>

                <Text className="min-w-[48px] text-center text-2xl font-bold text-neutral-50">
                  {quantity}
                </Text>

                <Pressable
                  onPress={handleIncrement}
                  className="h-12 w-12 items-center justify-center rounded-xl bg-neutral-700 active:bg-neutral-600"
                >
                  <Text className="text-2xl font-bold text-neutral-50">+</Text>
                </Pressable>
              </View>
            </View>

            {/* Notes row */}
            <View>
              <Text className="mb-2 text-sm font-medium text-neutral-400">
                {t('pos.item_detail.notes_label')}
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t('pos.item_detail.notes_placeholder')}
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                className="rounded-xl border border-neutral-600 bg-neutral-700 p-4 text-base text-neutral-50"
                style={{ minHeight: 80, textAlignVertical: 'top' }}
              />
            </View>

            {/* Line total */}
            <View className="flex-row items-center justify-between border-t border-neutral-700 pt-4">
              <Text className="text-base text-neutral-400">
                {t('pos.item_detail.total_label')}
              </Text>
              <Text className="text-2xl font-bold text-brand-400">
                {formatUZS(lineTotal, locale)}
              </Text>
            </View>

            {/* Add button */}
            <Pressable
              onPress={handleAdd}
              className="mt-2 h-14 items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600"
            >
              <Text className="text-lg font-bold text-white">
                {t('pos.item_detail.add_to_cart')}
              </Text>
            </Pressable>
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
}

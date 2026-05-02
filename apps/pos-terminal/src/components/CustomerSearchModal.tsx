// apps/pos-terminal/src/components/CustomerSearchModal.tsx
import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { customersApi, type Customer, type LoyaltyTier } from '@mypos/api-client';
import { apiClient } from '@/lib/api';

export type CustomerSearchModalProps = {
  visible: boolean;
  locale: 'uz' | 'ru' | 'en';
  currentCustomerId: string | null;
  onSelect: (customer: Customer | null) => void;
  onClose: () => void;
};

const TIER_COLORS: Record<LoyaltyTier, string> = {
  bronze: 'text-orange-400',
  silver: 'text-neutral-300',
  gold: 'text-yellow-400',
  platinum: 'text-purple-400',
};

function CustomerRow({
  customer,
  isSelected,
  onPress,
}: {
  customer: Customer;
  isSelected: boolean;
  onPress: () => void;
}) {
  const tier = customer.loyalty_account?.tier;
  const firstLetter = customer.full_name.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 border-b border-neutral-700 px-4 py-3 active:bg-neutral-700"
    >
      {/* Avatar */}
      <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-700">
        <Text className="text-lg font-bold text-neutral-300">{firstLetter}</Text>
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="font-semibold text-neutral-50">{customer.full_name}</Text>
        <Text className="text-sm text-neutral-400">{customer.phone}</Text>
      </View>

      {/* Tier badge */}
      {tier !== undefined && tier !== null && (
        <Text className={`text-xs font-semibold uppercase ${TIER_COLORS[tier]}`}>
          {tier}
        </Text>
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <Text className="ml-1 text-base font-bold text-brand-400">✓</Text>
      )}
    </Pressable>
  );
}

export function CustomerSearchModal({
  visible,
  locale: _locale,
  currentCustomerId,
  onSelect,
  onClose,
}: CustomerSearchModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const customersQuery = useQuery({
    queryKey: ['pos', 'customers', query],
    queryFn: () =>
      customersApi.list(apiClient, { q: query, per_page: 10 }),
    enabled: query.length >= 2,
  });

  const customers = customersQuery.data?.data ?? [];

  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const handleSelect = (customer: Customer | null) => {
    setQuery('');
    onSelect(customer);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View className="flex-1 items-center justify-center bg-black/70 px-8 py-12">
        <View
          className="w-full max-w-xl overflow-hidden rounded-2xl bg-neutral-800"
          style={{ maxHeight: '80%' }}
        >

          {/* Header */}
          <View className="flex-row items-center justify-between bg-neutral-900 px-6 py-4">
            <Text className="text-xl font-bold text-neutral-50">
              {t('pos.customer_search.title')}
            </Text>
            <Pressable
              onPress={handleClose}
              className="h-10 w-10 items-center justify-center rounded-lg bg-neutral-700 active:bg-neutral-600"
            >
              <Text className="text-base font-bold text-neutral-50">✕</Text>
            </Pressable>
          </View>

          {/* Search input */}
          <View className="border-b border-neutral-700 bg-neutral-800 px-4 py-3">
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('pos.customer_search.placeholder')}
              placeholderTextColor="#64748B"
              autoFocus
              keyboardType="default"
              className="h-12 rounded-xl border border-neutral-600 bg-neutral-700 px-4 text-base text-neutral-50"
            />
          </View>

          {/* No-customer quick action */}
          {currentCustomerId === null && (
            <Pressable
              onPress={() => handleSelect(null)}
              className="mx-4 mt-3 h-10 items-center justify-center rounded-lg bg-neutral-700 px-4 active:bg-neutral-600"
            >
              <Text className="text-sm text-neutral-300">
                {t('pos.customer_search.skip')}
              </Text>
            </Pressable>
          )}

          {/* Results */}
          <ScrollView
            className="flex-1"
            keyboardShouldPersistTaps="handled"
          >
            {query.length < 2 ? (
              <Text className="mt-8 text-center text-neutral-500">
                {t('pos.customer_search.hint')}
              </Text>
            ) : customersQuery.isLoading ? (
              <View className="mt-8 items-center">
                <ActivityIndicator size="small" color="#EA7C69" />
              </View>
            ) : customers.length === 0 ? (
              <Text className="mt-8 text-center text-neutral-500">
                {t('pos.customer_search.no_results')}
              </Text>
            ) : (
              customers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  isSelected={customer.id === currentCustomerId}
                  onPress={() => handleSelect(customer)}
                />
              ))
            )}
          </ScrollView>

          {/* Footer: remove customer */}
          {currentCustomerId !== null && (
            <View className="bg-neutral-900 px-4 py-3">
              <Pressable
                onPress={() => handleSelect(null)}
                className="h-10 items-center justify-center rounded-lg border border-red-700/40 bg-red-900/30 active:bg-red-900/50"
              >
                <Text className="text-sm font-semibold text-red-400">
                  {t('pos.customer_search.remove')}
                </Text>
              </Pressable>
            </View>
          )}

        </View>
      </View>
    </Modal>
  );
}

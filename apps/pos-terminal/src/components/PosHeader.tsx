import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AuthUser, Table } from '@mypos/api-client';

type PosHeaderProps = {
  user: AuthUser | null;
  table: Table | null;
  onLogout: () => void;
};

export function PosHeader({ user, table, onLogout }: PosHeaderProps) {
  const { t } = useTranslation();
  const tenantName = user?.tenant?.name ?? 'MyPOS';

  return (
    <View className="h-16 flex-row items-center justify-between border-b border-neutral-200 bg-white px-6">
      <View className="flex-row items-center gap-6">
        <Text className="text-2xl font-bold text-brand-500">MyPOS</Text>
        <Text className="text-base text-neutral-500">{tenantName}</Text>
      </View>

      <View className="flex-row items-center gap-4">
        <View className="rounded-lg bg-neutral-100 px-4 py-2">
          <Text className="text-sm text-neutral-500">
            {t('pos.selected_table')}
          </Text>
          <Text className="text-base font-semibold text-neutral-900">
            {table ? table.name : t('pos.no_table')}
          </Text>
        </View>

        <View className="rounded-lg bg-neutral-100 px-4 py-2">
          <Text className="text-sm text-neutral-500">
            {t('login.welcome')}
          </Text>
          <Text className="text-base font-semibold text-neutral-900">
            {user?.name ?? '—'}
          </Text>
        </View>

        <Pressable
          onPress={onLogout}
          className="h-12 items-center justify-center rounded-lg bg-neutral-800 px-5 active:bg-neutral-900"
        >
          <Text className="text-base font-semibold text-white">
            {t('pos.logout')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

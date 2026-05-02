// apps/pos-terminal/src/components/PosHeader.tsx
import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AuthUser, Table } from '@mypos/api-client';

type PosHeaderProps = {
  user: AuthUser | null;
  table: Table | null;
  mode: 'pos' | 'orders';
  onModeChange: (mode: 'pos' | 'orders') => void;
  onLogout: () => void;
  isConnected?: boolean;
};

function useClock(): string {
  const [time, setTime] = useState<string>(() => {
    const now = new Date();
    return formatTime(now);
  });

  useEffect(() => {
    const id = setInterval(() => {
      setTime(formatTime(new Date()));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return time;
}

function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function PosHeader({
  user,
  table,
  mode,
  onModeChange,
  onLogout,
  isConnected = false,
}: PosHeaderProps) {
  const { t } = useTranslation();
  const time = useClock();
  const tenantName = user?.tenant?.name ?? 'MyPOS';

  return (
    <View className="h-16 flex-row items-center justify-between border-b border-neutral-700 bg-neutral-900 px-6">
      {/* Left: brand + tenant + connection dot */}
      <View className="flex-row items-center gap-4">
        <Text className="text-2xl font-bold text-brand-500">MyPOS</Text>
        <View className="h-6 w-px bg-neutral-700" />
        <Text className="text-base text-neutral-400">{tenantName}</Text>
        <View
          className={`h-2 w-2 rounded-full ${isConnected ? 'bg-mint-500' : 'bg-neutral-600'}`}
          accessibilityLabel={isConnected ? 'Real-time ulangan' : 'Ulanmagan'}
        />
      </View>

      {/* Center-left: mode switcher + Center-right: clock */}
      <View className="flex-row items-center gap-6">
        {/* Mode switcher */}
        <View className="flex-row gap-1 rounded-xl bg-neutral-700 p-1">
          <Pressable
            onPress={() => onModeChange('pos')}
            className={`h-9 items-center justify-center rounded-lg px-4 ${
              mode === 'pos' ? 'bg-brand-500' : 'active:bg-neutral-600'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                mode === 'pos' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              POS
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onModeChange('orders')}
            className={`h-9 items-center justify-center rounded-lg px-4 ${
              mode === 'orders' ? 'bg-brand-500' : 'active:bg-neutral-600'
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                mode === 'orders' ? 'text-white' : 'text-neutral-400'
              }`}
            >
              Buyurtmalar
            </Text>
          </Pressable>
        </View>

        {/* Clock */}
        <Text className="font-mono text-xl text-neutral-50">{time}</Text>
      </View>

      {/* Right: badges + logout */}
      <View className="flex-row items-center gap-3">
        <View className="rounded-lg bg-neutral-700 px-4 py-2">
          <Text className="text-xs text-neutral-500">
            {t('pos.selected_table')}
          </Text>
          <Text className="text-sm font-semibold text-neutral-50">
            {table ? table.name : t('pos.no_table')}
          </Text>
        </View>

        <View className="rounded-lg bg-neutral-700 px-4 py-2">
          <Text className="text-xs text-neutral-500">
            {t('login.welcome')}
          </Text>
          <Text className="text-sm font-semibold text-neutral-50">
            {user?.name ?? '—'}
          </Text>
        </View>

        <Pressable
          onPress={onLogout}
          className="h-12 items-center justify-center rounded-lg border border-neutral-600 bg-neutral-700 px-5 active:bg-neutral-600"
        >
          <Text className="text-base font-semibold text-neutral-300">
            {t('pos.logout')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

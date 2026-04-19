import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  return (
    <View className="flex-1 items-center justify-center bg-neutral-50 p-8">
      <Text className="text-6xl font-bold text-brand-500">MyPOS</Text>
      <Text className="mt-4 text-2xl text-neutral-600">{t('home.subtitle')}</Text>
    </View>
  );
}

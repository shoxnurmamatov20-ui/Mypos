import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import '../global.css';
import '../src/i18n';

export default function RootLayout() {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

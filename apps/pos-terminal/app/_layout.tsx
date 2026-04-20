import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import '../global.css';
import '../src/i18n';
import { useAuthStore } from '@/stores/auth';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const user = useAuthStore((state) => state.user);
  const isBootstrapped = useAuthStore((state) => state.isBootstrapped);
  const loadStoredSession = useAuthStore((state) => state.loadStoredSession);

  useEffect(() => {
    void loadStoredSession();
  }, [loadStoredSession]);

  useEffect(() => {
    if (!isBootstrapped) return;
    const first = segments[0];
    const isOnLogin = first === 'login';
    const isOnPos = first === 'pos';

    if (!user && !isOnLogin) {
      router.replace('/login');
      return;
    }
    if (user && (isOnLogin || (!isOnPos && first !== undefined))) {
      router.replace('/pos');
      return;
    }
    if (user && first === undefined) {
      router.replace('/pos');
    }
  }, [user, isBootstrapped, segments, router]);

  if (!isBootstrapped) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50">
        <ActivityIndicator size="large" color="#EA7C69" />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <SafeAreaProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="pos" />
          </Stack>
        </AuthGate>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

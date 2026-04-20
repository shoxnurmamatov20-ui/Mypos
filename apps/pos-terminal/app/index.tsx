import { View, ActivityIndicator } from 'react-native';

/**
 * Root index — never displayed to users. AuthGate in _layout.tsx
 * redirects to /pos or /login based on the session.
 */
export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-neutral-50">
      <ActivityIndicator size="large" color="#EA7C69" />
    </View>
  );
}

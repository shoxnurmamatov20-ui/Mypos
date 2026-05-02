// apps/pos-terminal/app/login.tsx
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@mypos/api-client';
import { useAuthStore } from '@/stores/auth';

const LoginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(1),
});

type LoginFormData = z.infer<typeof LoginSchema>;

function BrandDecoration() {
  const dots = [
    '#EA7C69', '#50D1AA', '#F59E0B',
    '#50D1AA', '#EA7C69', '#94A3B8',
    '#F59E0B', '#94A3B8', '#EA7C69',
  ];
  return (
    <View className="mt-10 flex-row flex-wrap gap-3" style={{ width: 120 }}>
      {dots.map((color, i) => (
        <View
          key={i}
          style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: color, opacity: 0.7 }}
        />
      ))}
    </View>
  );
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, formState } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: 'owner@demo.mypos.uz',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await login(data.identifier, data.password);
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { message?: string } | undefined;
        setSubmitError(body?.message ?? t('errors.generic'));
      } else {
        setSubmitError(t('errors.network'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 flex-row items-center justify-center p-8"
      >
        {/* Left: Brand section */}
        <View className="hidden flex-1 items-start justify-center pr-16 lg:flex">
          <Text className="text-6xl font-bold text-brand-500">MyPOS</Text>
          <Text className="mt-3 text-xl text-neutral-400">
            Restaurant Operating System
          </Text>
          <BrandDecoration />
        </View>

        {/* Right: Login card */}
        <View className="w-full max-w-md rounded-3xl bg-neutral-800 p-10">
          {/* Mobile-only brand */}
          <View className="mb-6 items-center lg:hidden">
            <Text className="text-5xl font-bold text-brand-500">MyPOS</Text>
            <Text className="mt-2 text-base text-neutral-400">
              Restaurant Operating System
            </Text>
          </View>

          <Text className="text-2xl font-bold text-neutral-50">
            {t('login.title')}
          </Text>
          <Text className="mt-1 text-base text-neutral-400">
            {t('login.subtitle')}
          </Text>

          <View className="mt-8 gap-5">
            <Controller
              control={control}
              name="identifier"
              render={({ field: { value, onChange, onBlur } }) => (
                <View>
                  <Text className="mb-2 text-base font-medium text-neutral-300">
                    {t('login.identifier')}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('login.identifier_placeholder')}
                    placeholderTextColor="#64748B"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    className="h-14 rounded-xl border border-neutral-600 bg-neutral-700 px-4 text-lg text-neutral-50"
                  />
                  {formState.errors.identifier && (
                    <Text className="mt-1 text-sm text-danger">
                      {t('login.error')}
                    </Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <View>
                  <Text className="mb-2 text-base font-medium text-neutral-300">
                    {t('login.password')}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('login.password_placeholder')}
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="h-14 rounded-xl border border-neutral-600 bg-neutral-700 px-4 text-lg text-neutral-50"
                  />
                  {formState.errors.password && (
                    <Text className="mt-1 text-sm text-danger">
                      {t('login.error')}
                    </Text>
                  )}
                </View>
              )}
            />

            {submitError && (
              <View className="rounded-xl border border-danger/40 bg-red-900/30 p-4">
                <Text className="text-base text-danger">{submitError}</Text>
              </View>
            )}

            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="h-16 items-center justify-center rounded-xl bg-brand-500 active:bg-brand-600 disabled:opacity-60"
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-xl font-bold text-white">
                  {t('login.submit')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

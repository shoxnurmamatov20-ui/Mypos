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
    <SafeAreaView className="flex-1 bg-neutral-100">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center p-8"
      >
        <View className="w-full max-w-lg rounded-3xl bg-white p-10 shadow-lg">
          <View className="items-center">
            <Text className="text-5xl font-bold text-brand-500">MyPOS</Text>
            <Text className="mt-2 text-lg text-neutral-600">
              {t('login.subtitle')}
            </Text>
            <Text className="mt-6 text-2xl font-semibold text-neutral-900">
              {t('login.title')}
            </Text>
          </View>

          <View className="mt-8 gap-5">
            <Controller
              control={control}
              name="identifier"
              render={({ field: { value, onChange, onBlur } }) => (
                <View>
                  <Text className="mb-2 text-base font-medium text-neutral-700">
                    {t('login.identifier')}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('login.identifier_placeholder')}
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    className="h-14 rounded-xl border border-neutral-300 bg-neutral-50 px-4 text-lg text-neutral-900"
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
                  <Text className="mb-2 text-base font-medium text-neutral-700">
                    {t('login.password')}
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={t('login.password_placeholder')}
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="h-14 rounded-xl border border-neutral-300 bg-neutral-50 px-4 text-lg text-neutral-900"
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
              <View className="rounded-xl bg-red-50 p-4">
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
                <Text className="text-xl font-semibold text-white">
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

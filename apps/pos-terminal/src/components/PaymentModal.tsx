// apps/pos-terminal/src/components/PaymentModal.tsx
import { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { ApiError, paymentsApi } from '@mypos/api-client';
import type { PaymentProvider } from '@mypos/api-client';
import { formatUZS } from '@mypos/utils';
import { apiClient } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PaymentModalProps = {
  visible: boolean;
  orderId: string;
  total: number; // minor units (UZS so'm)
  locale: 'uz' | 'ru' | 'en';
  onSuccess: () => void;
  onClose: () => void;
};

type Method = Extract<PaymentProvider, 'cash' | 'card' | 'click' | 'payme'>;

type MethodConfig = {
  id: Method;
  icon: string;
  labelKey: string;
};

const METHODS: MethodConfig[] = [
  { id: 'cash', icon: '💵', labelKey: 'payment.method_cash' },
  { id: 'card', icon: '💳', labelKey: 'payment.method_card' },
  { id: 'click', icon: '📱', labelKey: 'payment.method_click' },
  { id: 'payme', icon: '📲', labelKey: 'payment.method_payme' },
];

const NUMPAD_KEYS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '00', '0', '⌫'] as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

type NumpadProps = {
  cashInput: string;
  total: number;
  locale: 'uz' | 'ru' | 'en';
  onKey: (key: string) => void;
};

function CashNumpad({ cashInput, total, locale, onKey }: NumpadProps) {
  const { t } = useTranslation();
  const cashReceived = parseInt(cashInput || '0', 10);
  const change = cashReceived - total;
  const displayValue = cashReceived === 0 ? '0' : formatUZS(cashReceived, locale);

  return (
    <View className="flex-1">
      {/* Display */}
      <View className="mb-4 rounded-xl bg-neutral-900 p-4">
        <Text className="mb-1 text-sm text-neutral-500">
          {t('payment.cash_received_label')}
        </Text>
        <Text className="text-right text-4xl font-bold text-neutral-50">
          {displayValue}
        </Text>
        {cashReceived > 0 && change >= 0 && (
          <Text className="mt-1 text-right text-lg font-semibold text-green-400">
            {t('payment.change_label')}: {formatUZS(change, locale)}
          </Text>
        )}
      </View>

      {/* Grid */}
      <View className="flex-row flex-wrap gap-2">
        {NUMPAD_KEYS.map((key) => (
          <Pressable
            key={key}
            onPress={() => onKey(key)}
            className={`h-16 items-center justify-center rounded-xl ${
              key === '⌫' ? 'bg-neutral-600' : 'bg-neutral-700 active:bg-neutral-600'
            }`}
            style={{ width: '30.5%' }}
          >
            <Text className="text-2xl font-bold text-neutral-50">{key}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

type SummaryProps = {
  total: number;
  cashReceived: number;
  locale: 'uz' | 'ru' | 'en';
  isPending: boolean;
  onPay: () => void;
};

function CashSummary({ total, cashReceived, locale, isPending, onPay }: SummaryProps) {
  const { t } = useTranslation();
  const change = cashReceived - total;
  const canPay = cashReceived >= total && !isPending;

  return (
    <View className="w-56 justify-between">
      {/* Order total */}
      <View>
        <Text className="mb-1 text-sm text-neutral-500">
          {t('payment.order_total_label')}
        </Text>
        <Text className="text-3xl font-bold text-neutral-50">
          {formatUZS(total, locale)}
        </Text>

        <View className="my-4 h-px bg-neutral-700" />

        <Text className="mb-1 text-sm text-neutral-500">
          {t('payment.cash_received_label')}
        </Text>
        <Text className="text-xl text-neutral-300">
          {formatUZS(cashReceived, locale)}
        </Text>

        <Text className="mb-1 mt-3 text-sm text-neutral-500">
          {t('payment.change_label')}
        </Text>
        <Text className="text-xl font-semibold text-green-400">
          {formatUZS(Math.max(0, change), locale)}
        </Text>
      </View>

      {/* Pay button */}
      <Pressable
        onPress={onPay}
        disabled={!canPay}
        className={`h-16 items-center justify-center rounded-xl ${
          canPay
            ? 'bg-green-600 active:bg-green-700'
            : 'border border-neutral-600 bg-neutral-700'
        }`}
      >
        {isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text
            className={`text-xl font-bold ${canPay ? 'text-white' : 'text-neutral-500'}`}
          >
            {t('payment.pay_button')}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

type SimplePayProps = {
  icon: string;
  prompt: string;
  total: number;
  locale: 'uz' | 'ru' | 'en';
  isPending: boolean;
  confirmLabel: string;
  onConfirm: () => void;
};

function SimplePayPanel({
  icon,
  prompt,
  total,
  locale,
  isPending,
  confirmLabel,
  onConfirm,
}: SimplePayProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6 py-8">
      <Text className="text-8xl">{icon}</Text>
      <Text className="text-center text-xl text-neutral-300">{prompt}</Text>
      <Text className="text-4xl font-bold text-neutral-50">
        {formatUZS(total, locale)}
      </Text>
      <Pressable
        onPress={onConfirm}
        disabled={isPending}
        className={`mt-4 h-16 w-full items-center justify-center rounded-xl ${
          isPending
            ? 'border border-neutral-600 bg-neutral-700'
            : 'bg-green-600 active:bg-green-700'
        }`}
      >
        {isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-xl font-bold text-white">{confirmLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PaymentModal({
  visible,
  orderId,
  total,
  locale,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<Method>('cash');
  const [cashInput, setCashInput] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cashReceived = parseInt(cashInput || '0', 10);

  const handleNumpadKey = useCallback((key: string) => {
    setCashInput((prev) => {
      if (key === '⌫') return prev.slice(0, -1);
      if (prev.length >= 12) return prev;
      if (key === '00') return prev === '' ? prev : prev + '00';
      return prev + key;
    });
  }, []);

  const resetState = useCallback(() => {
    setSelectedMethod('cash');
    setCashInput('');
    setError(null);
    setIsPending(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isPending) return;
    resetState();
    onClose();
  }, [isPending, onClose, resetState]);

  const executePayment = useCallback(
    async (provider: Method) => {
      setIsPending(true);
      setError(null);
      try {
        const intentRes = await paymentsApi.createIntent(apiClient, {
          order_id: orderId,
          provider,
        });
        await paymentsApi.captureCash(apiClient, intentRes.data.payment.id);
        resetState();
        onSuccess();
      } catch (err) {
        if (err instanceof ApiError) {
          const body = err.body as { message?: string } | undefined;
          setError(body?.message ?? t('payment.error_payment'));
        } else {
          setError(t('errors.network'));
        }
      } finally {
        setIsPending(false);
      }
    },
    [orderId, onSuccess, resetState, t],
  );

  const methodConfig = METHODS.find((m) => m.id === selectedMethod) ?? METHODS[0]!;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View className="flex-1 items-center justify-center bg-black/70 p-8">
        <View className="w-full max-w-2xl overflow-hidden rounded-2xl bg-neutral-800">

          {/* Header */}
          <View className="flex-row items-center justify-between bg-neutral-900 px-6 py-4">
            <Text className="text-2xl font-bold text-neutral-50">
              {t('payment.title')}
            </Text>
            <Text className="text-2xl font-bold text-brand-400">
              {t('payment.total_label')}: {formatUZS(total, locale)}
            </Text>
            {!isPending && (
              <Pressable
                onPress={handleClose}
                className="rounded-lg bg-neutral-700 px-4 py-2"
              >
                <Text className="text-xl text-neutral-300">
                  {t('payment.close')}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Error banner */}
          {error !== null && (
            <View className="border-b border-red-800 bg-red-900/40 px-6 py-3">
              <Text className="text-sm text-red-400">{error}</Text>
            </View>
          )}

          {/* Method selector */}
          <View className="flex-row gap-3 bg-neutral-900 px-4 pb-4 pt-3">
            {METHODS.map((method) => {
              const active = selectedMethod === method.id;
              return (
                <Pressable
                  key={method.id}
                  onPress={() => {
                    setSelectedMethod(method.id);
                    setError(null);
                  }}
                  disabled={isPending}
                  className={`h-16 flex-1 items-center justify-center rounded-xl border-2 gap-1 ${
                    active
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-neutral-600 bg-neutral-700'
                  }`}
                >
                  <Text className="text-lg">{method.icon}</Text>
                  <Text
                    className={`text-xs font-semibold ${
                      active ? 'text-white' : 'text-neutral-300'
                    }`}
                  >
                    {t(method.labelKey)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Content */}
          <View className="p-4">
            {selectedMethod === 'cash' && (
              <View className="flex-row gap-6">
                <CashNumpad
                  cashInput={cashInput}
                  total={total}
                  locale={locale}
                  onKey={handleNumpadKey}
                />
                <CashSummary
                  total={total}
                  cashReceived={cashReceived}
                  locale={locale}
                  isPending={isPending}
                  onPay={() => void executePayment('cash')}
                />
              </View>
            )}

            {selectedMethod === 'card' && (
              <SimplePayPanel
                icon="💳"
                prompt={t('payment.card_prompt')}
                total={total}
                locale={locale}
                isPending={isPending}
                confirmLabel={t('payment.pay_button')}
                onConfirm={() => void executePayment('card')}
              />
            )}

            {(selectedMethod === 'click' || selectedMethod === 'payme') && (
              <SimplePayPanel
                icon={methodConfig.icon}
                prompt={t('payment.qr_generating')}
                total={total}
                locale={locale}
                isPending={isPending}
                confirmLabel={t('payment.confirm_button')}
                onConfirm={() => void executePayment(selectedMethod)}
              />
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}

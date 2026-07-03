import type { MyPosApiClient } from './client';
import type { PaginatedResponse, ResourceResponse } from './menu';

export type PaymentProvider = 'cash' | 'card' | 'click' | 'payme' | 'uzum' | 'apelsin';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type Payment = {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_transaction_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  failure_reason: string | null;
  idempotency_key: string | null;
  authorized_at: string | null;
  captured_at: string | null;
  refunded_at: string | null;
  failed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreatePaymentIntentInput = {
  order_id: string;
  provider: PaymentProvider;
  options?: Record<string, unknown>;
};

export type CreatePaymentIntentResponse = {
  data: {
    payment: Payment;
    payment_url: string | null;
    transaction_id: string | null;
  };
};

export type RefundPaymentInput = {
  amount: number;
};

export type ListPaymentsParams = {
  status?: PaymentStatus;
  provider?: PaymentProvider;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
};

const toQueryString = (
  params?: Record<string, string | number | boolean | undefined | null>,
): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

export const paymentsApi = {
  /** Paginated payment list for the manager panel (GET /api/v1/payments). */
  list: (client: MyPosApiClient, params?: ListPaymentsParams) =>
    client.get<PaginatedResponse<Payment>>(`/api/v1/payments${toQueryString(params)}`),
  createIntent: (client: MyPosApiClient, input: CreatePaymentIntentInput) =>
    client.post<CreatePaymentIntentResponse>('/api/v1/payments', input),
  get: (client: MyPosApiClient, id: string) =>
    client.get<ResourceResponse<Payment>>(`/api/v1/payments/${id}`),
  captureCash: (client: MyPosApiClient, id: string) =>
    client.post<ResourceResponse<Payment>>(`/api/v1/payments/${id}/capture`),
  refund: (client: MyPosApiClient, id: string, input: RefundPaymentInput) =>
    client.post<ResourceResponse<Payment>>(`/api/v1/payments/${id}/refund`, input),
};

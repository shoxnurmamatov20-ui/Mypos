import type { MyPosApiClient } from './client';
import type { CollectionResponse, ResourceResponse } from './menu';

export type NotificationChannel = 'email' | 'sms' | 'push' | 'telegram' | 'in_app';

export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'delivered' | 'read';

export type NotificationTemplate =
  | 'order_placed'
  | 'order_ready'
  | 'order_cancelled'
  | 'low_stock_alert'
  | 'shift_reminder'
  | 'welcome_message';

export type NotificationLog = {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  template: NotificationTemplate | string;
  subject: string | null;
  body: string;
  status: NotificationStatus;
  provider_message_id: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NotificationPreference = {
  id: string;
  user_uuid: string;
  channel: NotificationChannel;
  template: NotificationTemplate | string | null;
  enabled: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type ListNotificationsParams = {
  channel?: NotificationChannel;
  status?: NotificationStatus;
  per_page?: number;
};

export type UpdatePreferenceInput = {
  channel: NotificationChannel;
  template?: NotificationTemplate | string | null;
  enabled: boolean;
};

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

export const notificationsApi = {
  list: (client: MyPosApiClient, params?: ListNotificationsParams) => {
    const qs = buildQueryString(params);
    return client.get<CollectionResponse<NotificationLog>>(`/api/v1/notifications${qs}`);
  },
  markAsRead: (client: MyPosApiClient, id: string) =>
    client.patch<ResourceResponse<NotificationLog>>(`/api/v1/notifications/${id}/read`),
  getPreferences: (client: MyPosApiClient) =>
    client.get<CollectionResponse<NotificationPreference>>('/api/v1/notifications/preferences'),
  updatePreference: (client: MyPosApiClient, id: string, input: UpdatePreferenceInput) =>
    client.patch<ResourceResponse<NotificationPreference>>(
      `/api/v1/notifications/preferences/${id}`,
      input,
    ),
};

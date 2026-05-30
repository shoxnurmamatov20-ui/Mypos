'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { subscribeToDashboard, type DashboardHandlers } from '@/lib/echo';
import { useAuthStore } from '@/stores/auth';
import { getStoredToken } from '@/lib/api';

interface Options extends DashboardHandlers {
  /** Override automatic toast notifications. Defaults to true. */
  enableToasts?: boolean;
  /** Override automatic React-Query invalidation. Defaults to true. */
  enableInvalidation?: boolean;
}

/**
 * Subscribe to the tenant dashboard Reverb channel.
 *
 * - Auto-invalidates the relevant React-Query keys on each event so existing
 *   tables refresh without a manual reload.
 * - Auto-toasts user-facing alerts (low stock, new order, payment, review).
 * - Cleans up the channel subscription on unmount or tenant change.
 *
 * Returns nothing — the side effects (toast + cache invalidation) are the
 * whole point.
 */
export function useDashboardRealtime(options: Options = {}) {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const tenantId = user?.tenant?.id ?? null;
  const { enableToasts = true, enableInvalidation = true, ...userHandlers } = options;

  useEffect(() => {
    if (!tenantId) return;
    const token = getStoredToken();
    if (!token) return;

    const handlers: DashboardHandlers = {
      onOrderPlaced: (payload) => {
        if (enableInvalidation) {
          qc.invalidateQueries({ queryKey: ['orders'] });
          qc.invalidateQueries({ queryKey: ['stats'] });
        }
        if (enableToasts) toast.success('Yangi buyurtma');
        userHandlers.onOrderPlaced?.(payload);
      },
      onPaymentCaptured: (payload) => {
        if (enableInvalidation) {
          qc.invalidateQueries({ queryKey: ['orders'] });
          qc.invalidateQueries({ queryKey: ['payments'] });
        }
        if (enableToasts) toast.success("To'lov qabul qilindi");
        userHandlers.onPaymentCaptured?.(payload);
      },
      onLowStockAlert: (payload) => {
        if (enableInvalidation) {
          qc.invalidateQueries({ queryKey: ['ingredients'] });
          qc.invalidateQueries({ queryKey: ['low-stock'] });
        }
        if (enableToasts) toast.warning(`Kam qoldiq: ${payload.current}/${payload.min}`);
        userHandlers.onLowStockAlert?.(payload);
      },
      onShiftEvent: (payload) => {
        if (enableInvalidation) qc.invalidateQueries({ queryKey: ['shifts'] });
        userHandlers.onShiftEvent?.(payload);
      },
      onReviewPosted: (payload) => {
        if (enableInvalidation) qc.invalidateQueries({ queryKey: ['reviews'] });
        if (enableToasts) toast.info(`Yangi sharh: ${payload.rating}/5`);
        userHandlers.onReviewPosted?.(payload);
      },
    };

    const unsubscribe = subscribeToDashboard(tenantId, token, handlers);
    return unsubscribe;
  }, [tenantId, qc, enableToasts, enableInvalidation, userHandlers]);
}

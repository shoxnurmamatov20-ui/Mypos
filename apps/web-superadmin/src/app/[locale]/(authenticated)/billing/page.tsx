import { BillingView } from '@/components/billing/billing-view';

/**
 * Billing landing — server entry point. The heavy lifting (charts,
 * filtering, derived stats) lives in the client component since it
 * needs interactive controls and Recharts. Server work is limited to
 * routing and the eventual `await apiClient.billing.summary()` call
 * once the backend lands.
 */
export default function BillingPage() {
  return <BillingView />;
}

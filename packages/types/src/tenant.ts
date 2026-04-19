import type { UUID, ISO8601, Locale, Currency } from './common';

export type TenantPlan = 'free' | 'starter' | 'pro' | 'business' | 'enterprise';
export type TenantStatus = 'active' | 'suspended' | 'trialing' | 'cancelled';

export type Tenant = {
  id: UUID;
  slug: string;
  name: string;
  plan: TenantPlan;
  status: TenantStatus;
  defaultLocale: Locale;
  defaultCurrency: Currency;
  timezone: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};

export type TenantRole =
  | 'super_admin'      // MyPOS platform ops
  | 'owner'            // Tenant owner (multi-location)
  | 'manager'          // Single-location manager
  | 'cashier'
  | 'waiter'
  | 'chef'
  | 'courier'
  | 'customer';

export type TenantMembership = {
  userId: UUID;
  tenantId: UUID;
  role: TenantRole;
  joinedAt: ISO8601;
};

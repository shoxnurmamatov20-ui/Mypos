import type { UUID, ISO8601, Locale } from './common';

export type Customer = {
  id: UUID;
  tenantId: UUID;
  phone: string;
  email?: string;
  firstName: string;
  lastName?: string;
  birthday?: string;
  locale: Locale;
  loyaltyPoints: number;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export type LoyaltyAccount = {
  id: UUID;
  customerId: UUID;
  programId: UUID;
  tier: LoyaltyTier;
  pointsBalance: number;
  lifetimePoints: number;
};

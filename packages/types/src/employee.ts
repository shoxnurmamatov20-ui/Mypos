import type { UUID, ISO8601 } from './common';
import type { TenantRole } from './tenant';

export type Employee = {
  id: UUID;
  tenantId: UUID;
  userId: UUID;
  fullName: string;
  phone: string;
  email?: string;
  role: TenantRole;
  position: string;
  isActive: boolean;
  hiredAt: ISO8601;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};

export type Shift = {
  id: UUID;
  employeeId: UUID;
  startAt: ISO8601;
  endAt?: ISO8601;
  status: 'scheduled' | 'open' | 'closed';
};

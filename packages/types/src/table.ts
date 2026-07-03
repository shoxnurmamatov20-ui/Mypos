import type { ISO8601, UUID } from './common';

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'disabled';

export type Table = {
  id: UUID;
  locationId: UUID;
  name: string;
  capacity: number;
  categoryId?: UUID;
  status: TableStatus;
  qrCode?: string;
  createdAt: ISO8601;
  updatedAt: ISO8601;
};

export type TableCategory = {
  id: UUID;
  locationId: UUID;
  name: string;
  sortOrder: number;
};

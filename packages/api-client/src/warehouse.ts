import type { MyPosApiClient } from './client';
import type { Ingredient } from './inventory';
import type { CollectionResponse, PaginatedResponse, ResourceResponse } from './menu';

// ---------------------------------------------------------------------------
// Enums (matches App\Domain\Warehouse\Enums\*)
// ---------------------------------------------------------------------------

export type IncomingStatus = 'draft' | 'posted' | 'cancelled';
export type WasteReason = 'expired' | 'damaged' | 'lost' | 'theft' | 'other';
export type WasteStatus = 'draft' | 'posted';
export type AuditStatus = 'in_progress' | 'completed' | 'cancelled';
export type TransferStatus = 'draft' | 'sent' | 'received' | 'cancelled';

// ---------------------------------------------------------------------------
// Shared shapes — every document resource embeds a tiny user blob for creator /
// conductor (Laravel resolves via whenLoaded so the field is omitted when the
// relation is not eager-loaded — hence optional).
// ---------------------------------------------------------------------------

export type WarehouseUserStub = {
  id: number;
  name: string;
};

// ---------------------------------------------------------------------------
// Warehouse
// ---------------------------------------------------------------------------
// NOTE: `tenant_id` is not surfaced by WarehouseResource — it's implicit via
// the tenant scope. Marked optional so callers that know it (super-admin
// audit views) can still pass it through.

export type Warehouse = {
  id: string;
  tenant_id?: string;
  name: string;
  address: string | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateWarehouseInput = {
  name: string;
  address?: string | null;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
  notes?: string | null;
};

export type UpdateWarehouseInput = Partial<CreateWarehouseInput>;

export type ListWarehousesParams = {
  q?: string;
  active_only?: boolean;
  per_page?: number;
  page?: number;
};

// ---------------------------------------------------------------------------
// Incoming Document (Kirim hujjati)
// ---------------------------------------------------------------------------

export type IncomingDocumentItem = {
  id: string;
  incoming_document_id: string;
  ingredient_id: string;
  /** Eager-loaded — only present when items.ingredient is loaded. */
  ingredient?: Ingredient;
  /** Decimal(12,3) cast to float by the resource. */
  quantity: number;
  /** Minor units (integer). */
  unit_price: number;
  /** Minor units (integer). */
  total_price: number;
  expiry_date: string | null;
  batch_number: string | null;
  notes: string | null;
};

export type IncomingDocument = {
  id: string;
  tenant_id?: string;
  warehouse_id: string;
  warehouse?: Warehouse;
  doc_no: string;
  doc_date: string;
  supplier_name: string | null;
  supplier_inn: string | null;
  total_amount: number;
  currency: string;
  status: IncomingStatus;
  status_label: string | null;
  notes: string | null;
  created_by: number | null;
  creator?: WarehouseUserStub | null;
  items?: IncomingDocumentItem[];
  items_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateIncomingDocumentItemInput = {
  ingredient_id: string;
  quantity: number;
  unit_price?: number;
  expiry_date?: string | null;
  batch_number?: string | null;
  notes?: string | null;
};

export type CreateIncomingDocumentInput = {
  warehouse_id: string;
  doc_date?: string | null;
  supplier_name?: string | null;
  supplier_inn?: string | null;
  currency?: string;
  status?: IncomingStatus;
  notes?: string | null;
  items: CreateIncomingDocumentItemInput[];
};

export type ListIncomingDocumentsParams = {
  warehouse_id?: string;
  status?: IncomingStatus;
  date_from?: string;
  date_to?: string;
  q?: string;
  per_page?: number;
  page?: number;
};

// ---------------------------------------------------------------------------
// Waste Document (Chiqim / brak hujjati)
// ---------------------------------------------------------------------------

export type WasteDocumentItem = {
  id: string;
  waste_document_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  quantity: number;
  /** Minor units (integer). */
  unit_cost: number;
  /** Minor units (integer). */
  total_cost: number;
  notes: string | null;
};

export type WasteDocument = {
  id: string;
  tenant_id?: string;
  warehouse_id: string;
  warehouse?: Warehouse;
  doc_no: string;
  doc_date: string;
  reason: WasteReason;
  reason_label: string | null;
  total_cost: number;
  status: WasteStatus;
  status_label: string | null;
  notes: string | null;
  created_by: number | null;
  creator?: WarehouseUserStub | null;
  items?: WasteDocumentItem[];
  items_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateWasteDocumentItemInput = {
  ingredient_id: string;
  quantity: number;
  unit_cost?: number;
  notes?: string | null;
};

export type CreateWasteDocumentInput = {
  warehouse_id: string;
  doc_date?: string | null;
  reason: WasteReason;
  status?: WasteStatus;
  notes?: string | null;
  items: CreateWasteDocumentItemInput[];
};

export type ListWasteDocumentsParams = {
  warehouse_id?: string;
  status?: WasteStatus;
  reason?: WasteReason;
  date_from?: string;
  date_to?: string;
  q?: string;
  per_page?: number;
  page?: number;
};

// ---------------------------------------------------------------------------
// Audit Session (Inventarizatsiya)
// ---------------------------------------------------------------------------

export type AuditSessionItem = {
  id: string;
  audit_session_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  expected_quantity: number;
  actual_quantity: number | null;
  discrepancy: number;
  notes: string | null;
};

export type AuditSession = {
  id: string;
  tenant_id?: string;
  warehouse_id: string;
  warehouse?: Warehouse;
  doc_no: string;
  started_at: string;
  completed_at: string | null;
  conducted_by: number | null;
  conductor?: WarehouseUserStub | null;
  status: AuditStatus;
  status_label: string | null;
  discrepancy_count: number;
  notes: string | null;
  items?: AuditSessionItem[];
  items_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateAuditSessionInput = {
  warehouse_id: string;
  notes?: string | null;
};

export type UpdateAuditSessionItemInput = {
  id: string;
  actual_quantity: number;
  notes?: string | null;
};

export type UpdateAuditSessionInput = {
  notes?: string | null;
  items?: UpdateAuditSessionItemInput[];
};

export type ListAuditSessionsParams = {
  warehouse_id?: string;
  status?: AuditStatus;
  per_page?: number;
  page?: number;
};

// ---------------------------------------------------------------------------
// Transfer Document (Ko'chirish hujjati)
// ---------------------------------------------------------------------------

export type TransferDocumentItem = {
  id: string;
  transfer_document_id: string;
  ingredient_id: string;
  ingredient?: Ingredient;
  quantity: number;
  notes: string | null;
};

export type TransferDocument = {
  id: string;
  tenant_id?: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  from_warehouse?: Warehouse;
  to_warehouse?: Warehouse;
  doc_no: string;
  doc_date: string;
  status: TransferStatus;
  status_label: string | null;
  notes: string | null;
  created_by: number | null;
  creator?: WarehouseUserStub | null;
  items?: TransferDocumentItem[];
  items_count?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateTransferDocumentItemInput = {
  ingredient_id: string;
  quantity: number;
  notes?: string | null;
};

export type CreateTransferDocumentInput = {
  from_warehouse_id: string;
  to_warehouse_id: string;
  doc_date?: string | null;
  status?: TransferStatus;
  notes?: string | null;
  items: CreateTransferDocumentItemInput[];
};

export type ListTransferDocumentsParams = {
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  status?: TransferStatus;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
};

// ---------------------------------------------------------------------------
// Query string helper — drops empty values, encodes the rest.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API objects — one per resource. Matches departments.ts / menu.ts patterns.
// ---------------------------------------------------------------------------

export const warehousesApi = {
  list(client: MyPosApiClient, params: ListWarehousesParams = {}) {
    return client.get<PaginatedResponse<Warehouse> | CollectionResponse<Warehouse>>(
      `/api/v1/warehouses${toQueryString(params)}`,
    );
  },

  get(client: MyPosApiClient, id: string) {
    return client.get<ResourceResponse<Warehouse>>(`/api/v1/warehouses/${id}`);
  },

  create(client: MyPosApiClient, input: CreateWarehouseInput) {
    return client.post<ResourceResponse<Warehouse>>('/api/v1/warehouses', input);
  },

  update(client: MyPosApiClient, id: string, input: UpdateWarehouseInput) {
    return client.patch<ResourceResponse<Warehouse>>(`/api/v1/warehouses/${id}`, input);
  },

  delete(client: MyPosApiClient, id: string) {
    return client.delete<{ data: { message: string } }>(`/api/v1/warehouses/${id}`);
  },
};

export const incomingDocumentsApi = {
  list(client: MyPosApiClient, params: ListIncomingDocumentsParams = {}) {
    return client.get<PaginatedResponse<IncomingDocument>>(
      `/api/v1/incoming-documents${toQueryString(params)}`,
    );
  },

  get(client: MyPosApiClient, id: string) {
    return client.get<ResourceResponse<IncomingDocument>>(`/api/v1/incoming-documents/${id}`);
  },

  create(client: MyPosApiClient, input: CreateIncomingDocumentInput) {
    return client.post<ResourceResponse<IncomingDocument>>('/api/v1/incoming-documents', input);
  },

  delete(client: MyPosApiClient, id: string) {
    return client.delete<{ data: { message: string } }>(`/api/v1/incoming-documents/${id}`);
  },
};

export const wasteDocumentsApi = {
  list(client: MyPosApiClient, params: ListWasteDocumentsParams = {}) {
    return client.get<PaginatedResponse<WasteDocument>>(
      `/api/v1/waste-documents${toQueryString(params)}`,
    );
  },

  get(client: MyPosApiClient, id: string) {
    return client.get<ResourceResponse<WasteDocument>>(`/api/v1/waste-documents/${id}`);
  },

  create(client: MyPosApiClient, input: CreateWasteDocumentInput) {
    return client.post<ResourceResponse<WasteDocument>>('/api/v1/waste-documents', input);
  },

  delete(client: MyPosApiClient, id: string) {
    return client.delete<{ data: { message: string } }>(`/api/v1/waste-documents/${id}`);
  },
};

export const auditSessionsApi = {
  list(client: MyPosApiClient, params: ListAuditSessionsParams = {}) {
    return client.get<PaginatedResponse<AuditSession>>(
      `/api/v1/audit-sessions${toQueryString(params)}`,
    );
  },

  get(client: MyPosApiClient, id: string) {
    return client.get<ResourceResponse<AuditSession>>(`/api/v1/audit-sessions/${id}`);
  },

  create(client: MyPosApiClient, input: CreateAuditSessionInput) {
    return client.post<ResourceResponse<AuditSession>>('/api/v1/audit-sessions', input);
  },

  update(client: MyPosApiClient, id: string, input: UpdateAuditSessionInput) {
    return client.patch<ResourceResponse<AuditSession>>(`/api/v1/audit-sessions/${id}`, input);
  },

  /**
   * Finalizes the audit: applies stock adjustments derived from each item's
   * discrepancy and flips the session to `completed`. Backend audits this via
   * AuditSessionPolicy::complete().
   */
  complete(client: MyPosApiClient, id: string) {
    return client.post<ResourceResponse<AuditSession>>(`/api/v1/audit-sessions/${id}/complete`);
  },

  delete(client: MyPosApiClient, id: string) {
    return client.delete<{ data: { message: string } }>(`/api/v1/audit-sessions/${id}`);
  },
};

export const transferDocumentsApi = {
  list(client: MyPosApiClient, params: ListTransferDocumentsParams = {}) {
    return client.get<PaginatedResponse<TransferDocument>>(
      `/api/v1/transfer-documents${toQueryString(params)}`,
    );
  },

  get(client: MyPosApiClient, id: string) {
    return client.get<ResourceResponse<TransferDocument>>(`/api/v1/transfer-documents/${id}`);
  },

  create(client: MyPosApiClient, input: CreateTransferDocumentInput) {
    return client.post<ResourceResponse<TransferDocument>>('/api/v1/transfer-documents', input);
  },

  delete(client: MyPosApiClient, id: string) {
    return client.delete<{ data: { message: string } }>(`/api/v1/transfer-documents/${id}`);
  },
};

import type { MyPosApiClient } from './client';
import type { CollectionResponse, ResourceResponse } from './menu';

export type EmployeeStatus = 'active' | 'on_leave' | 'terminated';
export type ShiftStatus = 'scheduled' | 'open' | 'closed' | 'missed';
export type ClockSource = 'manual' | 'pos' | 'mobile' | 'kiosk';

export type EmployeePosition = 'owner' | 'manager' | 'cashier' | 'waiter' | 'chef' | 'courier';

export type EmployeeUserSummary = {
  uuid: string;
  name: string;
  email: string;
  phone: string | null;
  locale: string;
  avatar_url: string | null;
};

export type EmployeeStatusBadge = {
  value: EmployeeStatus;
  label: string;
  color: string;
};

export type EmployeePositionBadge = {
  value: string;
  label: string;
};

export type EmployeeDocument = {
  type: string;
  url: string;
  uploaded_at: string;
};

export type ShiftStatusBadge = {
  value: ShiftStatus;
  label: string;
  color: string;
};

export type Shift = {
  id: string;
  employee_id: string;
  employee?: {
    id: string;
    employee_code: string;
    position: string;
    name: string | null;
  } | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  status: ShiftStatusBadge;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Employee = {
  id: string;
  employee_code: string;
  user: EmployeeUserSummary | null;
  position: EmployeePositionBadge;
  hire_date: string | null;
  status: EmployeeStatusBadge;
  base_salary: number | null;
  hourly_rate: number | null;
  terminated_at: string | null;
  notes: string | null;
  emergency_contact: string | null;
  documents: EmployeeDocument[];
  latest_shift: Shift | null;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateEmployeeInput = {
  user_data: {
    name: string;
    email: string;
    phone?: string | null;
    password: string;
    locale?: 'uz' | 'ru' | 'en';
  };
  employee_code?: string | null;
  position: EmployeePosition;
  hire_date: string;
  base_salary?: number | null;
  hourly_rate?: number | null;
  status?: EmployeeStatus;
  notes?: string | null;
  emergency_contact?: string | null;
  documents?: EmployeeDocument[];
};

export type UpdateEmployeeInput = {
  employee_code?: string;
  position?: EmployeePosition;
  hire_date?: string;
  base_salary?: number | null;
  hourly_rate?: number | null;
  status?: EmployeeStatus;
  terminated_at?: string | null;
  notes?: string | null;
  emergency_contact?: string | null;
  documents?: EmployeeDocument[] | null;
  user_data?: {
    name?: string;
    phone?: string | null;
    locale?: 'uz' | 'ru' | 'en';
  };
};

export type ListEmployeesParams = {
  status?: EmployeeStatus;
  position?: EmployeePosition;
  q?: string;
  per_page?: number;
  page?: number;
};

export type ScheduleShiftInput = {
  employee_id: string;
  scheduled_start: string;
  scheduled_end: string;
  status?: ShiftStatus;
  notes?: string | null;
};

export type ListShiftsParams = {
  employee_id?: string;
  status?: ShiftStatus;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
};

export type ClockInput = {
  employee_id: string;
  shift_id?: string | null;
  source?: ClockSource;
  metadata?: Record<string, unknown> | null;
};

const buildQueryString = (params: Record<string, unknown> | undefined): string => {
  if (!params) return '';
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
};

export const employeesApi = {
  list: (client: MyPosApiClient, params?: ListEmployeesParams) => {
    const qs = buildQueryString(params);
    return client.get<CollectionResponse<Employee>>(`/api/v1/employees${qs}`);
  },
  show: (client: MyPosApiClient, id: string) =>
    client.get<ResourceResponse<Employee>>(`/api/v1/employees/${id}`),
  create: (client: MyPosApiClient, input: CreateEmployeeInput) =>
    client.post<ResourceResponse<Employee>>('/api/v1/employees', input),
  update: (client: MyPosApiClient, id: string, input: UpdateEmployeeInput) =>
    client.patch<ResourceResponse<Employee>>(`/api/v1/employees/${id}`, input),
  delete: (client: MyPosApiClient, id: string) =>
    client.delete<{ data: { message: string } }>(`/api/v1/employees/${id}`),
};

export const shiftsApi = {
  list: (client: MyPosApiClient, params?: ListShiftsParams) => {
    const qs = buildQueryString(params);
    return client.get<CollectionResponse<Shift>>(`/api/v1/shifts${qs}`);
  },
  schedule: (client: MyPosApiClient, input: ScheduleShiftInput) =>
    client.post<ResourceResponse<Shift>>('/api/v1/shifts', input),
  cancel: (client: MyPosApiClient, id: string) =>
    client.delete<{ data: { message: string } }>(`/api/v1/shifts/${id}`),
};

export const clockApi = {
  clockIn: (client: MyPosApiClient, input: ClockInput) =>
    client.post<ResourceResponse<Shift>>('/api/v1/clock/in', input),
  clockOut: (client: MyPosApiClient, input: ClockInput) =>
    client.post<ResourceResponse<Shift>>('/api/v1/clock/out', input),
};

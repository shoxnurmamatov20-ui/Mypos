/**
 * Common types used across domains.
 */

export type UUID = string;
export type ISO8601 = string;
export type Locale = 'uz' | 'ru' | 'en';
export type Currency = 'UZS' | 'USD' | 'EUR' | 'RUB' | 'KZT' | 'TRY';

export type Pagination = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
  errors?: ApiError[];
};

export type ApiError = {
  code: string;
  message: string;
  field?: string;
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: Pagination;
};

export type Translated<T extends Record<Locale, string> = Record<Locale, string>> = T;

export type MoneyAmount = {
  amount: number;
  currency: Currency;
};

export type Address = {
  street: string;
  city: string;
  region?: string;
  postalCode?: string;
  country: string;
  lat?: number;
  lng?: number;
};

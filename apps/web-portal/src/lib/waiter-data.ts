/**
 * Waiter panel demo data.
 *
 * The backend waiter-facing endpoints are still being built, so — exactly
 * like `web-superadmin` does with its dashboard fixtures — the panel
 * renders from these typed fixtures for now. Swap `getWaiterData()` for a
 * React Query read once `/api/v1/waiter/*` ships; the component contracts
 * below already match the intended shape.
 */

export type TableStatus = 'free' | 'seated' | 'bill' | 'reserved';
export type OrderStatus = 'open' | 'sent' | 'ready' | 'served' | 'paid';

export interface WaiterTable {
  id: string;
  /** Display label, e.g. "12-stol". */
  label: string;
  seats: number;
  zone: string;
  status: TableStatus;
  guests?: number;
  /** Human-readable occupancy duration, e.g. "24 daqiqa". */
  occupiedFor?: string;
  /** Current running bill in so'm. */
  total?: number;
  orderId?: string;
}

export interface WaiterOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface WaiterOrder {
  id: string;
  table: string;
  status: OrderStatus;
  guests: number;
  openedAt: string;
  items: WaiterOrderItem[];
  total: number;
}

export interface MenuItem {
  name: string;
  price: number;
  available: boolean;
  popular?: boolean;
}

export interface MenuCategory {
  name: string;
  items: readonly MenuItem[];
}

export interface ShiftActivity {
  at: string;
  text: string;
}

export interface ShiftStats {
  startedAt: string;
  tablesServed: number;
  ordersCount: number;
  salesTotal: number;
  tipsTotal: number;
  activeTables: number;
  activity: readonly ShiftActivity[];
}

export interface WaiterData {
  tables: readonly WaiterTable[];
  orders: readonly WaiterOrder[];
  menu: readonly MenuCategory[];
  shift: ShiftStats;
}

const TABLES: readonly WaiterTable[] = [
  { id: 't1', label: '1-stol', seats: 2, zone: 'Asosiy zal', status: 'free' },
  { id: 't2', label: '2-stol', seats: 4, zone: 'Asosiy zal', status: 'seated', guests: 3, occupiedFor: '24 daqiqa', total: 118_000, orderId: '#1042' },
  { id: 't3', label: '3-stol', seats: 4, zone: 'Asosiy zal', status: 'free' },
  { id: 't4', label: '4-stol', seats: 6, zone: 'Asosiy zal', status: 'bill', guests: 5, occupiedFor: '1 soat 12 daqiqa', total: 216_000, orderId: '#1039' },
  { id: 't5', label: '5-stol', seats: 2, zone: 'Terassa', status: 'seated', guests: 2, occupiedFor: '8 daqiqa', total: 72_000, orderId: '#1045' },
  { id: 't6', label: '6-stol', seats: 4, zone: 'Terassa', status: 'reserved' },
  { id: 't7', label: '7-stol', seats: 8, zone: 'VIP', status: 'seated', guests: 7, occupiedFor: '41 daqiqa', total: 449_000, orderId: '#1041' },
  { id: 't8', label: '8-stol', seats: 2, zone: 'Terassa', status: 'free' },
];

const ORDERS: readonly WaiterOrder[] = [
  {
    id: '#1045', table: '5-stol', status: 'open', guests: 2, openedAt: '14:38',
    items: [
      { name: 'Lavash', qty: 2, price: 21_000 },
      { name: 'Coca-Cola', qty: 2, price: 15_000 },
    ],
    total: 72_000,
  },
  {
    id: '#1042', table: '2-stol', status: 'sent', guests: 3, openedAt: '14:20',
    items: [
      { name: 'Osh', qty: 2, price: 38_000 },
      { name: 'Achichuq salat', qty: 1, price: 18_000 },
      { name: 'Choy (choynak)', qty: 2, price: 12_000 },
    ],
    total: 118_000,
  },
  {
    id: '#1041', table: '7-stol', status: 'ready', guests: 7, openedAt: '13:55',
    items: [
      { name: 'Shashlik assorti', qty: 3, price: 95_000 },
      { name: 'Norin', qty: 2, price: 42_000 },
      { name: 'Choy (choynak)', qty: 4, price: 12_000 },
      { name: 'Tort (boʻlak)', qty: 1, price: 32_000 },
    ],
    total: 449_000,
  },
  {
    id: '#1039', table: '4-stol', status: 'served', guests: 5, openedAt: '13:10',
    items: [
      { name: 'Lagʻmon', qty: 3, price: 34_000 },
      { name: 'Manti (6 dona)', qty: 2, price: 36_000 },
      { name: 'Ayron', qty: 3, price: 14_000 },
    ],
    total: 216_000,
  },
  {
    id: '#1038', table: '1-stol', status: 'paid', guests: 2, openedAt: '12:40',
    items: [
      { name: 'Somsa', qty: 4, price: 12_000 },
      { name: 'Choy (choynak)', qty: 2, price: 12_000 },
    ],
    total: 72_000,
  },
];

const MENU: readonly MenuCategory[] = [
  {
    name: 'Issiq taomlar',
    items: [
      { name: 'Osh', price: 38_000, available: true, popular: true },
      { name: 'Lagʻmon', price: 34_000, available: true },
      { name: 'Norin', price: 42_000, available: true, popular: true },
      { name: 'Manti (6 dona)', price: 36_000, available: true },
      { name: 'Shashlik assorti', price: 95_000, available: true, popular: true },
      { name: 'Dimlama', price: 44_000, available: false },
    ],
  },
  {
    name: 'Salatlar',
    items: [
      { name: 'Achichuq salat', price: 18_000, available: true },
      { name: 'Sezar', price: 45_000, available: true },
      { name: 'Vinegret', price: 22_000, available: true },
    ],
  },
  {
    name: 'Ichimliklar',
    items: [
      { name: 'Choy (choynak)', price: 12_000, available: true },
      { name: 'Coca-Cola', price: 15_000, available: true },
      { name: 'Ayron', price: 14_000, available: true },
      { name: 'Tabiiy sharbat', price: 25_000, available: true, popular: true },
    ],
  },
  {
    name: 'Shirinliklar',
    items: [
      { name: 'Tort (boʻlak)', price: 32_000, available: true },
      { name: 'Muzqaymoq', price: 20_000, available: true },
      { name: 'Chak-chak', price: 24_000, available: false },
    ],
  },
];

const SHIFT: ShiftStats = {
  startedAt: '09:00',
  tablesServed: 14,
  ordersCount: 28,
  salesTotal: 4_860_000,
  tipsTotal: 412_000,
  activeTables: 4,
  activity: [
    { at: '14:38', text: '5-stol ochildi — yangi buyurtma' },
    { at: '14:20', text: '#1042 oshxonaga yuborildi' },
    { at: '13:55', text: '7-stol buyurtmasi tayyor' },
    { at: '13:10', text: '#1039 mehmonlarga berildi' },
    { at: '12:40', text: '#1038 toʻlov qabul qilindi' },
  ],
};

/** Single entry point — returns the full demo dataset. */
export function getWaiterData(): WaiterData {
  return { tables: TABLES, orders: ORDERS, menu: MENU, shift: SHIFT };
}

/** Compact so'm formatter for stat tiles — "4.9M soʻm", "412K soʻm". */
export function formatSomShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M soʻm`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}K soʻm`;
  return `${amount} soʻm`;
}

/** Format a so'm amount with thin-space thousand separators. */
export function formatSom(amount: number): string {
  return `${amount.toLocaleString('ru-RU').replace(/ /g, ' ')} soʻm`;
}

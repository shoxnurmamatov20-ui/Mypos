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
  /** Bare table number shown on the zone grid tile (e.g. "4"). */
  number?: string;
  seats: number;
  zone: string;
  status: TableStatus;
  guests?: number;
  /** Human-readable occupancy duration, e.g. "24 daqiqa". */
  occupiedFor?: string;
  /** Current running bill in so'm. */
  total?: number;
  orderId?: string;
  /** True when the open order on this table belongs to the current waiter. */
  mine?: boolean;
  /** Name of whoever opened the table (waiter/guest label). */
  occupantName?: string;
  /** When the table was opened, "HH:MM". */
  openedAt?: string;
  /** Total number of ordered line-items on the open bill. */
  itemsCount?: number;
}

export interface WaiterOrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface WaiterOrder {
  id: string;
  /** Backend UUID — present only on live rows; fixtures omit it. */
  apiId?: string;
  table: string;
  status: OrderStatus;
  guests: number;
  openedAt: string;
  items: WaiterOrderItem[];
  total: number;
}

export interface MenuItem {
  /** Backend UUID — present only on live rows; fixtures omit it. */
  id?: string;
  name: string;
  price: number;
  available: boolean;
  popular?: boolean;
  /** Dish photo (backend `image_url`); fixtures fall back to an emoji tile. */
  image?: string;
  /** Decorative emoji used when no photo is available. */
  emoji?: string;
  /** Short description shown on the product detail screen. */
  description?: string;
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

/** The five zones the reference restaurant ("Joy") uses, in display order. */
export const WAITER_ZONES: readonly string[] = [
  'ZAL',
  'TASHQARI',
  'KABINA',
  'LUX KABINA',
  'BANKET KABINA',
];

type Occupancy = Partial<
  Pick<
    WaiterTable,
    | 'status'
    | 'guests'
    | 'occupiedFor'
    | 'total'
    | 'orderId'
    | 'mine'
    | 'occupantName'
    | 'openedAt'
    | 'itemsCount'
  >
>;

/** Builds `count` numbered tables for one zone, overlaying any occupancy. */
function zoneTables(
  zone: string,
  count: number,
  seats: number,
  occupied: Record<number, Occupancy>,
): WaiterTable[] {
  return Array.from({ length: count }, (_unused, index) => {
    const number = index + 1;
    const occ = occupied[number];
    return {
      id: `${zone.toLowerCase().replace(/\s+/g, '-')}-${number}`,
      label: `${number}-stol`,
      number: String(number),
      seats,
      zone,
      status: 'free',
      ...occ,
    } satisfies WaiterTable;
  });
}

const TABLES: readonly WaiterTable[] = [
  ...zoneTables('ZAL', 18, 4, {
    1: {
      status: 'seated',
      occupantName: 'ILHOM',
      openedAt: '18:05',
      total: 214_000,
      itemsCount: 4,
    },
    2: {
      status: 'seated',
      mine: true,
      occupantName: 'FAZLIDDIN',
      openedAt: '12:31',
      guests: 6,
      total: 1_033_760,
      itemsCount: 7,
    },
    3: { status: 'seated', occupantName: 'laylo', openedAt: '18:21', total: 88_000, itemsCount: 2 },
    13: {
      status: 'seated',
      occupantName: 'GULM',
      openedAt: '13:51',
      total: 176_000,
      itemsCount: 3,
    },
  }),
  ...zoneTables('TASHQARI', 8, 4, {
    2: {
      status: 'seated',
      occupantName: 'AXROR',
      openedAt: '19:02',
      total: 132_000,
      itemsCount: 3,
    },
  }),
  ...zoneTables('KABINA', 6, 6, {
    1: {
      status: 'seated',
      mine: true,
      occupantName: 'FAZLIDDIN',
      openedAt: '17:40',
      guests: 4,
      total: 399_840,
      itemsCount: 3,
    },
  }),
  ...zoneTables('LUX KABINA', 4, 8, {}),
  ...zoneTables('BANKET KABINA', 2, 20, {}),
];

const ORDERS: readonly WaiterOrder[] = [
  {
    id: '#1045',
    table: '5-stol',
    status: 'open',
    guests: 2,
    openedAt: '14:38',
    items: [
      { name: 'Lavash', qty: 2, price: 21_000 },
      { name: 'Coca-Cola', qty: 2, price: 15_000 },
    ],
    total: 72_000,
  },
  {
    id: '#1042',
    table: '2-stol',
    status: 'sent',
    guests: 3,
    openedAt: '14:20',
    items: [
      { name: 'Osh', qty: 2, price: 38_000 },
      { name: 'Achichuq salat', qty: 1, price: 18_000 },
      { name: 'Choy (choynak)', qty: 2, price: 12_000 },
    ],
    total: 118_000,
  },
  {
    id: '#1041',
    table: '7-stol',
    status: 'ready',
    guests: 7,
    openedAt: '13:55',
    items: [
      { name: 'Shashlik assorti', qty: 3, price: 95_000 },
      { name: 'Norin', qty: 2, price: 42_000 },
      { name: 'Choy (choynak)', qty: 4, price: 12_000 },
      { name: 'Tort (boʻlak)', qty: 1, price: 32_000 },
    ],
    total: 449_000,
  },
  {
    id: '#1039',
    table: '4-stol',
    status: 'served',
    guests: 5,
    openedAt: '13:10',
    items: [
      { name: 'Lagʻmon', qty: 3, price: 34_000 },
      { name: 'Manti (6 dona)', qty: 2, price: 36_000 },
      { name: 'Ayron', qty: 3, price: 14_000 },
    ],
    total: 216_000,
  },
  {
    id: '#1038',
    table: '1-stol',
    status: 'paid',
    guests: 2,
    openedAt: '12:40',
    items: [
      { name: 'Somsa', qty: 4, price: 12_000 },
      { name: 'Choy (choynak)', qty: 2, price: 12_000 },
    ],
    total: 72_000,
  },
];

const MENU: readonly MenuCategory[] = [
  {
    name: 'Birinchi ovqatlar',
    items: [
      { name: 'Bostirma', price: 45_000, available: true, emoji: '🍲', popular: true },
      { name: 'Qaynatma mol gusht', price: 30_000, available: true, emoji: '🥘' },
      { name: 'Qaynatma quy gusht', price: 35_000, available: true, emoji: '🍜' },
      { name: 'Tiftel', price: 30_000, available: true, emoji: '🍛' },
      { name: 'Mastava', price: 28_000, available: true, emoji: '🥣' },
      { name: 'Shorva', price: 26_000, available: false, emoji: '🍲' },
    ],
  },
  {
    name: 'Ikkinchi ovqat',
    items: [
      { name: 'Osh', price: 38_000, available: true, emoji: '🍚', popular: true },
      { name: 'Lagʻmon', price: 34_000, available: true, emoji: '🍜' },
      { name: 'Norin', price: 42_000, available: true, emoji: '🍝', popular: true },
      { name: 'Manti (6 dona)', price: 36_000, available: true, emoji: '🥟' },
      { name: 'Dimlama', price: 44_000, available: false, emoji: '🥘' },
    ],
  },
  {
    name: 'Salat',
    items: [
      { name: 'Aliviya', price: 35_000, available: true, emoji: '🥗', popular: true },
      { name: 'Achichuq salat', price: 18_000, available: true, emoji: '🍅' },
      { name: 'Sezar', price: 45_000, available: true, emoji: '🥬' },
      { name: 'Vinegret', price: 22_000, available: true, emoji: '🥗' },
    ],
  },
  {
    name: 'Shashlik',
    items: [
      { name: 'Shashlik assorti', price: 95_000, available: true, emoji: '🍢', popular: true },
      { name: 'Mol gushti shashlik', price: 32_000, available: true, emoji: '🍖' },
      { name: 'Jigar shashlik', price: 28_000, available: true, emoji: '🍢' },
      { name: 'Tovuq shashlik', price: 26_000, available: true, emoji: '🍗' },
    ],
  },
  {
    name: 'Choy',
    items: [
      { name: 'Choy (choynak)', price: 12_000, available: true, emoji: '🍵' },
      { name: 'Coca-Cola', price: 15_000, available: true, emoji: '🥤' },
      { name: 'Ayron', price: 14_000, available: true, emoji: '🥛' },
      { name: 'Tabiiy sharbat', price: 25_000, available: true, emoji: '🧃', popular: true },
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

/** Plain grouped number, no unit — the red running-total on home/table tiles. */
export function formatNum(amount: number): string {
  return amount.toLocaleString('ru-RU').replace(/ /g, ' ');
}

/** "45 000 uzs" — the unit label the reference waiter app prints on prices. */
export function formatUzs(amount: number): string {
  return `${formatNum(amount)} uzs`;
}

/** Format a so'm amount with thin-space thousand separators. */
export function formatSom(amount: number): string {
  return `${amount.toLocaleString('ru-RU').replace(/ /g, ' ')} soʻm`;
}

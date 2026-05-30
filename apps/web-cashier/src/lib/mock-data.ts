/**
 * Offline fixtures. Every React Query hook in the views falls back to these
 * when the Laravel API is unreachable, so the cashier panel is fully
 * demonstrable in local dev before the backend is seeded.
 */
import type {
  CashierUser,
  MenuCategory,
  MenuItem,
  OrderSummary,
  PaymentRow,
  RecentShift,
  ShiftInfo,
  ShiftStats,
} from './api';

export const MOCK_USER: CashierUser = {
  id: 'mock-cashier',
  name: 'Demo Kassir',
  email: 'cashier1@demo.mypos.uz',
  role: 'cashier',
  locale: 'uz',
  tenant_name: 'Demo Restoran',
};

export const MOCK_CATEGORIES: MenuCategory[] = [
  { id: 'c1', name: { uz: 'Issiq taomlar', ru: 'Горячие блюда', en: 'Hot dishes', kz: 'Ыстық тағамдар' } },
  { id: 'c2', name: { uz: 'Salatlar', ru: 'Салаты', en: 'Salads', kz: 'Салаттар' } },
  { id: 'c3', name: { uz: 'Ichimliklar', ru: 'Напитки', en: 'Drinks', kz: 'Сусындар' } },
  { id: 'c4', name: { uz: 'Shirinliklar', ru: 'Десерты', en: 'Desserts', kz: 'Десерттер' } },
  { id: 'c5', name: { uz: 'Fast food', ru: 'Фастфуд', en: 'Fast food', kz: 'Фастфуд' } },
];

export const MOCK_ITEMS: MenuItem[] = [
  { id: 'i1', category_id: 'c1', name: { uz: "Osh (1 kishilik)", ru: 'Плов (1 порция)', en: 'Plov (1 serving)', kz: 'Палау' }, price: 38000, image_url: null, is_available: true },
  { id: 'i2', category_id: 'c1', name: { uz: 'Lag‘mon', ru: 'Лагман', en: 'Lagman', kz: 'Лағман' }, price: 35000, image_url: null, is_available: true },
  { id: 'i3', category_id: 'c1', name: { uz: 'Manti (5 dona)', ru: 'Манты (5 шт)', en: 'Manti (5 pcs)', kz: 'Манты' }, price: 42000, image_url: null, is_available: true },
  { id: 'i4', category_id: 'c1', name: { uz: 'Shashlik (qo‘y)', ru: 'Шашлык (баранина)', en: 'Lamb skewer', kz: 'Шашлық' }, price: 28000, image_url: null, is_available: true },
  { id: 'i5', category_id: 'c1', name: { uz: 'Norin', ru: 'Норин', en: 'Norin', kz: 'Норын' }, price: 40000, image_url: null, is_available: false },
  { id: 'i6', category_id: 'c2', name: { uz: 'Achichuk', ru: 'Ачичук', en: 'Achichuk salad', kz: 'Ашшы-шшы' }, price: 15000, image_url: null, is_available: true },
  { id: 'i7', category_id: 'c2', name: { uz: 'Sezar salat', ru: 'Салат Цезарь', en: 'Caesar salad', kz: 'Цезарь салаты' }, price: 32000, image_url: null, is_available: true },
  { id: 'i8', category_id: 'c2', name: { uz: 'Vinegret', ru: 'Винегрет', en: 'Vinaigrette', kz: 'Винегрет' }, price: 18000, image_url: null, is_available: true },
  { id: 'i9', category_id: 'c3', name: { uz: 'Choy (choynak)', ru: 'Чай (чайник)', en: 'Tea (pot)', kz: 'Шай' }, price: 8000, image_url: null, is_available: true },
  { id: 'i10', category_id: 'c3', name: { uz: 'Coca-Cola 0.5', ru: 'Coca-Cola 0.5', en: 'Coca-Cola 0.5', kz: 'Coca-Cola 0.5' }, price: 12000, image_url: null, is_available: true },
  { id: 'i11', category_id: 'c3', name: { uz: 'Ayron', ru: 'Айран', en: 'Ayran', kz: 'Айран' }, price: 9000, image_url: null, is_available: true },
  { id: 'i12', category_id: 'c3', name: { uz: 'Qahva (espresso)', ru: 'Кофе (эспрессо)', en: 'Coffee (espresso)', kz: 'Кофе' }, price: 16000, image_url: null, is_available: true },
  { id: 'i13', category_id: 'c4', name: { uz: 'Medovik', ru: 'Медовик', en: 'Honey cake', kz: 'Медовик' }, price: 22000, image_url: null, is_available: true },
  { id: 'i14', category_id: 'c4', name: { uz: 'Muzqaymoq', ru: 'Мороженое', en: 'Ice cream', kz: 'Балмұздақ' }, price: 14000, image_url: null, is_available: true },
  { id: 'i15', category_id: 'c5', name: { uz: 'Lavash (tovuq)', ru: 'Лаваш (курица)', en: 'Chicken lavash', kz: 'Лаваш' }, price: 30000, image_url: null, is_available: true },
  { id: 'i16', category_id: 'c5', name: { uz: 'Burger', ru: 'Бургер', en: 'Burger', kz: 'Бургер' }, price: 34000, image_url: null, is_available: true },
  { id: 'i17', category_id: 'c5', name: { uz: 'Hot-dog', ru: 'Хот-дог', en: 'Hot dog', kz: 'Хот-дог' }, price: 20000, image_url: null, is_available: true },
  { id: 'i18', category_id: 'c5', name: { uz: 'Free (kartoshka fri)', ru: 'Картофель фри', en: 'French fries', kz: 'Фри' }, price: 16000, image_url: null, is_available: true },
];

function minutesAgoIso(min: number): string {
  return new Date(Date.now() - min * 60000).toISOString();
}

export const MOCK_ORDERS: OrderSummary[] = [
  { id: 'o1', order_no: 'B-1042', type: 'dine_in', status: 'pending', payment_status: 'unpaid', items_count: 3, guest_count: 2, table_name: 'Stol 4', total: 113000, placed_at: minutesAgoIso(6) },
  { id: 'o2', order_no: 'B-1041', type: 'dine_in', status: 'preparing', payment_status: 'unpaid', items_count: 5, guest_count: 4, table_name: 'Stol 9', total: 196000, placed_at: minutesAgoIso(14) },
  { id: 'o3', order_no: 'B-1040', type: 'takeaway', status: 'ready', payment_status: 'paid', items_count: 2, guest_count: null, table_name: null, total: 64000, placed_at: minutesAgoIso(19) },
  { id: 'o4', order_no: 'B-1039', type: 'delivery', status: 'preparing', payment_status: 'paid', items_count: 4, guest_count: null, table_name: null, total: 142000, placed_at: minutesAgoIso(27) },
  { id: 'o5', order_no: 'B-1038', type: 'dine_in', status: 'completed', payment_status: 'paid', items_count: 6, guest_count: 3, table_name: 'Stol 2', total: 228000, placed_at: minutesAgoIso(58) },
  { id: 'o6', order_no: 'B-1037', type: 'takeaway', status: 'completed', payment_status: 'paid', items_count: 1, guest_count: null, table_name: null, total: 30000, placed_at: minutesAgoIso(72) },
];

export const MOCK_PAYMENTS: PaymentRow[] = [
  { id: 'p1', order_no: 'B-1040', method: 'card', status: 'paid', amount: 64000, created_at: minutesAgoIso(18) },
  { id: 'p2', order_no: 'B-1039', method: 'click', status: 'paid', amount: 142000, created_at: minutesAgoIso(25) },
  { id: 'p3', order_no: 'B-1038', method: 'cash', status: 'paid', amount: 228000, created_at: minutesAgoIso(55) },
  { id: 'p4', order_no: 'B-1037', method: 'cash', status: 'paid', amount: 30000, created_at: minutesAgoIso(70) },
  { id: 'p5', order_no: 'B-1036', method: 'payme', status: 'paid', amount: 88000, created_at: minutesAgoIso(96) },
  { id: 'p6', order_no: 'B-1035', method: 'cash', status: 'refunded', amount: 42000, created_at: minutesAgoIso(120) },
];

export const MOCK_SHIFT: ShiftInfo = {
  id: 's-current',
  status: 'open',
  started_at: minutesAgoIso(255),
  ended_at: null,
  worked_minutes: 255,
  break_minutes: 30,
  on_break: false,
  break_started_at: null,
};

export const MOCK_SHIFT_STATS: ShiftStats = {
  orders_count: 24,
  revenue: 2_640_000,
  avg_order: 110_000,
  tips: 84_000,
};

export const MOCK_RECENT_SHIFTS: RecentShift[] = [
  { id: 'rs1', date: minutesAgoIso(60 * 26), status: 'closed', worked_minutes: 480 },
  { id: 'rs2', date: minutesAgoIso(60 * 50), status: 'closed', worked_minutes: 510 },
  { id: 'rs3', date: minutesAgoIso(60 * 74), status: 'closed', worked_minutes: 465 },
  { id: 'rs4', date: minutesAgoIso(60 * 98), status: 'missed', worked_minutes: 0 },
];

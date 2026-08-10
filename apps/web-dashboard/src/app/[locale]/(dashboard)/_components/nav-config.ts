import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  Bike,
  Box,
  Briefcase,
  Building2,
  Calculator,
  ChartPie,
  ChefHat,
  ClipboardCheck,
  ClipboardList,
  ConciergeBell,
  CreditCard,
  Handshake,
  House,
  Landmark,
  ListVideo,
  type LucideIcon,
  Megaphone,
  Monitor,
  Package,
  PackageMinus,
  PackagePlus,
  Printer,
  ReceiptText,
  Scale,
  ScrollText,
  Settings,
  ShoppingBag,
  Soup,
  Store,
  Tag,
  Tags,
  Timer,
  Trash2,
  Tv,
  UserCheck,
  UserCog,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Warehouse,
  XCircle,
} from 'lucide-react';

/**
 * Navigation tree — data only, extracted from sidebar.tsx so the component
 * stays inside the 400-line rule and the IA is reviewable on its own.
 *
 * There is deliberately NO per-section colour map here. The previous version
 * assigned nine different hues (sky/amber/violet/emerald/indigo/green/pink/
 * cyan/rose) to the section glyphs, which put nine accents on screen at once and
 * broke CLAUDE.md §11's single-accent rule. Glyphs now inherit `currentColor`,
 * so the only coloured thing in the rail is the row you are actually on.
 */
export type NavLeaf = { id: string; href: string; locked?: boolean };

export type NavSection = {
  id: string;
  icon: LucideIcon;
  href?: string;
  items?: readonly NavLeaf[];
};

export const SECTIONS: readonly NavSection[] = [
  { id: 'bosh_sahifa', icon: House, href: 'overview' },
  {
    id: 'ombor',
    icon: Warehouse,
    items: [
      { id: 'incoming', href: 'inventory/incoming' },
      { id: 'consumption', href: 'inventory/consumption' },
      { id: 'stock_balance', href: 'inventory/stock' },
      { id: 'incoming_log', href: 'inventory/incoming-log' },
      { id: 'transfers', href: 'inventory/transfers' },
      { id: 'inventarizatsiya', href: 'inventory/audit' },
      { id: 'waste', href: 'inventory/waste' },
    ],
  },
  {
    id: 'hisobotlar',
    icon: ChartPie,
    items: [
      { id: 'z_report', href: 'reports/z-report' },
      { id: 'orders_report', href: 'reports/orders' },
      { id: 'tables_report', href: 'reports/tables' },
      { id: 'waiters_report', href: 'reports/waiters' },
      { id: 'courier_report', href: 'reports/courier' },
      { id: 'menu_items_report', href: 'reports/menu-items' },
      { id: 'cancelled_report', href: 'reports/cancelled' },
      { id: 'debtors_report', href: 'reports/debtors' },
      { id: 'cashflow_report', href: 'reports/cashflow' },
    ],
  },
  {
    id: 'foydalanuvchilar',
    icon: UsersRound,
    items: [
      { id: 'staff_cashier', href: 'staff/cashier' },
      { id: 'staff_waiter', href: 'staff/waiter' },
      { id: 'staff_courier', href: 'staff/courier' },
      { id: 'staff_monoblok', href: 'staff/monoblok' },
      { id: 'staff_cook', href: 'staff/cook' },
      { id: 'staff_manager', href: 'staff/manager' },
      { id: 'staff_warehouse', href: 'staff/warehouse' },
      { id: 'visits', href: 'visits' },
    ],
  },
  {
    id: 'sozlamalar',
    icon: Settings,
    items: [
      { id: 'settings_customers', href: 'customers' },
      { id: 'settings_place', href: 'settings/place' },
      { id: 'settings_payment_methods', href: 'settings/payment-methods' },
      { id: 'settings_units', href: 'units' },
      { id: 'settings_profile', href: 'settings/profile' },
      { id: 'settings_printer', href: 'settings/printer' },
      { id: 'settings_receipt', href: 'settings/receipt' },
    ],
  },
  {
    id: 'moliya',
    icon: Wallet,
    items: [
      { id: 'finance_overview', href: 'finance' },
      { id: 'finance_operations', href: 'finance/operations' },
      { id: 'finance_income_categories', href: 'finance/income-categories' },
      { id: 'finance_expense_categories', href: 'finance/expense-categories' },
      { id: 'payments', href: 'payments' },
    ],
  },
  {
    id: 'nomenklatura',
    icon: Tags,
    items: [
      { id: 'nom_dishes', href: 'menu/items' },
      { id: 'nom_raw', href: 'inventory/ingredients' },
      { id: 'nom_semi', href: 'nomenklatura/semi-finished' },
      { id: 'nom_dish_categories', href: 'menu/categories' },
      { id: 'nom_raw_categories', href: 'inventory/categories' },
      { id: 'nom_semi_categories', href: 'nomenklatura/semi-finished-categories' },
      { id: 'nom_sales_categories', href: 'nomenklatura/sales-categories' },
    ],
  },
  {
    id: 'menyu_translyatsiya',
    icon: Tv,
    items: [
      { id: 'broadcast_devices', href: 'signage/devices', locked: true },
      { id: 'broadcast_playlists', href: 'signage/playlists', locked: true },
      { id: 'broadcast_banners', href: 'signage/banners' },
    ],
  },
  {
    id: 'magazin',
    icon: Store,
    items: [
      { id: 'orders', href: 'orders' },
      { id: 'tables', href: 'tables' },
      { id: 'table_categories', href: 'tables/categories' },
    ],
  },
];

/**
 * Nav groups.
 *
 * Nine flat sections is a wall — the eye has nothing to anchor on. Grouping
 * under quiet captions is what makes the super-admin rail scannable, and macOS
 * sidebars use exactly this device (small caps header, no divider line).
 *
 * `null` is the uncaptioned lead group: the home row sits above the first
 * caption, the way "Boshqaruv paneli" does in the admin rail.
 *
 * Sections keep their existing order inside each group, so the only movement is
 * between groups.
 */
export type NavGroup = { labelId: string | null; sectionIds: readonly string[] };

export const NAV_GROUPS: readonly NavGroup[] = [
  { labelId: null, sectionIds: ['bosh_sahifa'] },
  {
    labelId: 'group_operations',
    sectionIds: ['magazin', 'ombor', 'nomenklatura', 'menyu_translyatsiya'],
  },
  { labelId: 'group_finance', sectionIds: ['moliya', 'hisobotlar'] },
  { labelId: 'group_admin', sectionIds: ['foydalanuvchilar', 'sozlamalar'] },
];

/** Section lookup so the rail can render groups without re-scanning SECTIONS. */
export const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]));

export const LEAF_ICONS: Record<string, LucideIcon> = {
  // Ombor (warehouse) — 7 sub-items per founder spec 2026-05-28
  incoming: PackagePlus,
  consumption: PackageMinus,
  stock_balance: Package,
  incoming_log: ScrollText,
  transfers: ArrowLeftRight,
  inventarizatsiya: ClipboardCheck,
  waste: Trash2,
  // Hisobotlar (Reports) — 9 sub-items 2026-05-28
  z_report: Calculator,
  orders_report: ClipboardList,
  tables_report: Store,
  waiters_report: UsersRound,
  courier_report: Bike,
  menu_items_report: UtensilsCrossed,
  cancelled_report: XCircle,
  debtors_report: Handshake,
  cashflow_report: Landmark,
  // Foydalanuvchilar (Users) — 8 sub-items 2026-05-28
  staff_cashier: CreditCard,
  staff_waiter: ConciergeBell,
  staff_courier: Bike,
  staff_monoblok: Monitor,
  staff_cook: ChefHat,
  staff_manager: Briefcase,
  staff_warehouse: Warehouse,
  visits: UserCheck,
  // Other domains
  inventory_categories: Tag,
  ingredients: Box,
  reports: ChartPie,
  customers: UsersRound,
  employees: UserCog,
  shifts: Timer,
  departments: Building2,
  notifications_log: Bell,
  settings_customers: UsersRound,
  settings_place: Building2,
  settings_payment_methods: CreditCard,
  settings_units: Scale,
  settings_profile: UserCog,
  settings_printer: Printer,
  settings_receipt: ReceiptText,
  finance_overview: ChartPie,
  finance_operations: ArrowLeftRight,
  finance_income_categories: ArrowDownLeft,
  finance_expense_categories: ArrowUpRight,
  payments: CreditCard,
  // Nomenklatura — 7 items per founder spec 2026-05-31
  nom_dishes: UtensilsCrossed,
  nom_raw: Box,
  nom_semi: Soup,
  nom_dish_categories: Tag,
  nom_raw_categories: Tag,
  nom_semi_categories: Tag,
  nom_sales_categories: ShoppingBag,
  menu_categories: Tag,
  menu_items: UtensilsCrossed,
  // Menyu-translyatsiya (digital signage) — founder spec 2026-05-31
  broadcast_devices: Monitor,
  broadcast_playlists: ListVideo,
  broadcast_banners: Megaphone,
  orders: ClipboardList,
  tables: Store,
  table_categories: Tag,
};

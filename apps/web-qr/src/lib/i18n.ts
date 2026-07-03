/**
 * Lightweight i18n for QR-menu PWA.
 *
 * The tenant's `default_locale` (from the public API) drives the UI locale,
 * so there's no URL prefix or middleware. Keys use `domain.key` convention.
 */

export type Locale = 'uz' | 'ru' | 'en';

type StringsMap = Record<string, string>;

const uz: StringsMap = {
  'app.landing.title': 'QR Menyu',
  'app.landing.subtitle': "Stolda QR kodni skanerlab menyuni ko'ring",
  'menu.empty': "Menyu bo'sh",
  'menu.loading': 'Yuklanmoqda...',
  'menu.error': 'Menyu yuklanmadi',
  'menu.table': 'Stol',
  'menu.allCategories': 'Barchasi',
  'menu.noItems': "Bu bo'limda mahsulot yo'q",
  'cart.empty': "Savat bo'sh",
  'cart.title': 'Savat',
  'cart.subtotal': 'Jami',
  'cart.clear': 'Tozalash',
  'cart.close': 'Yopish',
  'cart.openLabel': 'Savat',
  'cart.item.remove': "O'chirish",
  'cart.notesPlaceholder': 'Izoh (ixtiyoriy)',
  'cart.place': 'Buyurtma berish',
  'cart.placing': 'Yuborilmoqda...',
  'cart.noTable': 'Stol tanlanmagan — QR kodni skanerlang',
  'order.success.title': 'Buyurtma qabul qilindi',
  'order.success.number': 'Buyurtma raqami',
  'order.success.back': 'Menyuga qaytish',
  'order.error': 'Buyurtma yuborilmadi',
  'item.add': "Qo'shish",
  'item.added': "Qo'shildi",
  'search.placeholder': 'Taom qidirish...',
  'filter.title': 'Filtr',
  'filter.vegan': 'Vegan',
  'filter.vegetarian': 'Vegeteryan',
  'filter.glutenFree': 'Glutensiz',
  'filter.lactoseFree': 'Laktozasiz',
  'filter.spicy': 'Achchiq',
  'filter.halal': 'Halol',
  'filter.clear': 'Tozalash',
  'filter.active': 'Faol filtrlar',
  'lang.label': 'Til',
};

const ru: StringsMap = {
  'app.landing.title': 'QR Меню',
  'app.landing.subtitle': 'Отсканируйте QR-код на столе, чтобы увидеть меню',
  'menu.empty': 'Меню пусто',
  'menu.loading': 'Загрузка...',
  'menu.error': 'Не удалось загрузить меню',
  'menu.table': 'Стол',
  'menu.allCategories': 'Все',
  'menu.noItems': 'В этой категории нет блюд',
  'cart.empty': 'Корзина пуста',
  'cart.title': 'Корзина',
  'cart.subtotal': 'Итого',
  'cart.clear': 'Очистить',
  'cart.close': 'Закрыть',
  'cart.openLabel': 'Корзина',
  'cart.item.remove': 'Удалить',
  'cart.notesPlaceholder': 'Комментарий (необязательно)',
  'cart.place': 'Оформить заказ',
  'cart.placing': 'Отправка...',
  'cart.noTable': 'Стол не выбран — отсканируйте QR-код',
  'order.success.title': 'Заказ принят',
  'order.success.number': 'Номер заказа',
  'order.success.back': 'Вернуться к меню',
  'order.error': 'Не удалось отправить заказ',
  'item.add': 'Добавить',
  'item.added': 'Добавлено',
  'search.placeholder': 'Поиск блюда...',
  'filter.title': 'Фильтры',
  'filter.vegan': 'Веган',
  'filter.vegetarian': 'Вегетарианское',
  'filter.glutenFree': 'Без глютена',
  'filter.lactoseFree': 'Без лактозы',
  'filter.spicy': 'Острое',
  'filter.halal': 'Халяль',
  'filter.clear': 'Сбросить',
  'filter.active': 'Активные фильтры',
  'lang.label': 'Язык',
};

const en: StringsMap = {
  'app.landing.title': 'QR Menu',
  'app.landing.subtitle': 'Scan the QR code at your table to view the menu',
  'menu.empty': 'Menu is empty',
  'menu.loading': 'Loading...',
  'menu.error': 'Failed to load menu',
  'menu.table': 'Table',
  'menu.allCategories': 'All',
  'menu.noItems': 'No items in this category',
  'cart.empty': 'Your cart is empty',
  'cart.title': 'Cart',
  'cart.subtotal': 'Subtotal',
  'cart.clear': 'Clear',
  'cart.close': 'Close',
  'cart.openLabel': 'Cart',
  'cart.item.remove': 'Remove',
  'cart.notesPlaceholder': 'Notes (optional)',
  'cart.place': 'Place order',
  'cart.placing': 'Sending...',
  'cart.noTable': 'No table selected — scan the QR code',
  'order.success.title': 'Order placed',
  'order.success.number': 'Order number',
  'order.success.back': 'Back to menu',
  'order.error': 'Failed to place order',
  'item.add': 'Add',
  'item.added': 'Added',
  'search.placeholder': 'Search dishes...',
  'filter.title': 'Filters',
  'filter.vegan': 'Vegan',
  'filter.vegetarian': 'Vegetarian',
  'filter.glutenFree': 'Gluten-free',
  'filter.lactoseFree': 'Lactose-free',
  'filter.spicy': 'Spicy',
  'filter.halal': 'Halal',
  'filter.clear': 'Clear',
  'filter.active': 'Active filters',
  'lang.label': 'Language',
};

const strings: Record<Locale, StringsMap> = { uz, ru, en };

export function normalizeLocale(value: string | null | undefined): Locale {
  if (value === 'ru' || value === 'en' || value === 'uz') return value;
  return 'uz';
}

export function translate(locale: Locale, key: string): string {
  const pack = strings[locale] ?? strings.uz;
  return pack[key] ?? strings.uz[key] ?? key;
}

/** Helper for translating tenant-provided multi-locale strings. */
export function pickTranslation(
  source: Record<string, string> | null | undefined,
  locale: Locale,
): string {
  if (!source) return '';
  return source[locale] ?? source.uz ?? source.en ?? Object.values(source)[0] ?? '';
}

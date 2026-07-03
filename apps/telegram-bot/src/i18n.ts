import type { Lang } from './types.js';

/**
 * Flat key/value dictionary (dot-path keys). Values are strings that may
 * contain `{placeholders}` — `t()` substitutes them from the `vars` map.
 *
 * Keep strings short; split multi-paragraph copy into multiple keys.
 */
type Dict = Record<string, string>;

const uz: Dict = {
  welcome: 'Assalomu alaykum! MyPOS demo restoran botiga xush kelibsiz.',
  'main_menu.menu': 'Menyu',
  'main_menu.cart': 'Savat ({count})',
  'main_menu.orders': 'Buyurtmalarim',
  'main_menu.language': 'Til: {lang}',
  'main_menu.help': 'Yordam',
  'menu.pick_category': 'Kategoriyani tanlang:',
  'menu.pick_item': 'Taomni tanlang:',
  'menu.empty': "Hozircha menyu bo'sh.",
  'menu.add_to_cart': "Savatga qo'shish",
  'menu.back': 'Orqaga',
  'cart.title': 'Savatingiz',
  'cart.empty': "Savatingiz bo'sh.",
  'cart.line': '{i}) {name} x {qty} — {total}',
  'cart.total': 'Jami: {total}',
  'cart.checkout': 'Buyurtma berish',
  'cart.clear': 'Savatni tozalash',
  'orders.title': 'Sizning buyurtmalaringiz',
  'orders.empty': 'Hali buyurtmalaringiz yoq.',
  'orders.line': '#{no} — {status} — {total}',
  'checkout.ask_mode': 'Qayerda tanavvul qilasiz?',
  'checkout.mode_dine_in': 'Restoranda',
  'checkout.mode_delivery': 'Yetkazib berish',
  'checkout.ask_table': 'Stol raqamini yuboring:',
  'checkout.ask_phone': 'Telefon raqamingizni yuboring (+998...):',
  'checkout.ask_address': 'Manzilni yuboring:',
  'checkout.summary': 'Buyurtma xulosasi:\n{body}\n\nJami: {total}',
  'checkout.confirm': 'Tasdiqlash',
  'checkout.cancel': 'Bekor qilish',
  'checkout.placed': 'Buyurtma qabul qilindi! Raqam: {order_no}',
  'status.update': 'Buyurtma #{order_no} — yangi holat: {status}',
  'language.choose': 'Tilni tanlang:',
  'language.changed': 'Til ozgartirildi.',
  'help.text':
    'Buyruqlar:\n/start — botni qayta ishga tushirish\n/menu — menyu\n/savat — savat\n/buyurtmalarim — buyurtmalar\n/til — tilni tanlash\n/help — yordam',
  'errors.generic': 'Kechirasiz, xatolik yuz berdi. Qayta urinib koring.',
  'errors.network': 'Tarmoq bilan bogliq xatolik. Internet ulanishini tekshiring.',
  'errors.menu_unavailable': 'Menyu hozircha mavjud emas.',
  'errors.invalid_phone': 'Telefon raqami notogri. Masalan: +998901234567',
  'errors.invalid_table': 'Stol raqami notogri.',
  'common.yes': 'Ha',
  'common.no': 'Yoq',
};

const ru: Dict = {
  welcome: 'Здравствуйте! Добро пожаловать в бот демо-ресторана MyPOS.',
  'main_menu.menu': 'Меню',
  'main_menu.cart': 'Корзина ({count})',
  'main_menu.orders': 'Мои заказы',
  'main_menu.language': 'Язык: {lang}',
  'main_menu.help': 'Помощь',
  'menu.pick_category': 'Выберите категорию:',
  'menu.pick_item': 'Выберите блюдо:',
  'menu.empty': 'Меню пока пустое.',
  'menu.add_to_cart': 'Добавить в корзину',
  'menu.back': 'Назад',
  'cart.title': 'Ваша корзина',
  'cart.empty': 'Корзина пуста.',
  'cart.line': '{i}) {name} x {qty} — {total}',
  'cart.total': 'Итого: {total}',
  'cart.checkout': 'Оформить заказ',
  'cart.clear': 'Очистить корзину',
  'orders.title': 'Ваши заказы',
  'orders.empty': 'У вас пока нет заказов.',
  'orders.line': '#{no} — {status} — {total}',
  'checkout.ask_mode': 'Где вы будете есть?',
  'checkout.mode_dine_in': 'В ресторане',
  'checkout.mode_delivery': 'Доставка',
  'checkout.ask_table': 'Отправьте номер стола:',
  'checkout.ask_phone': 'Отправьте номер телефона (+998...):',
  'checkout.ask_address': 'Отправьте адрес доставки:',
  'checkout.summary': 'Ваш заказ:\n{body}\n\nИтого: {total}',
  'checkout.confirm': 'Подтвердить',
  'checkout.cancel': 'Отмена',
  'checkout.placed': 'Заказ принят! Номер: {order_no}',
  'status.update': 'Заказ #{order_no} — новый статус: {status}',
  'language.choose': 'Выберите язык:',
  'language.changed': 'Язык изменён.',
  'help.text':
    'Команды:\n/start — перезапустить бота\n/menu — меню\n/savat — корзина\n/buyurtmalarim — заказы\n/til — язык\n/help — помощь',
  'errors.generic': 'Произошла ошибка. Попробуйте позже.',
  'errors.network': 'Ошибка сети. Проверьте интернет.',
  'errors.menu_unavailable': 'Меню сейчас недоступно.',
  'errors.invalid_phone': 'Неверный номер телефона. Пример: +998901234567',
  'errors.invalid_table': 'Неверный номер стола.',
  'common.yes': 'Да',
  'common.no': 'Нет',
};

const en: Dict = {
  welcome: 'Hello! Welcome to the MyPOS demo restaurant bot.',
  'main_menu.menu': 'Menu',
  'main_menu.cart': 'Cart ({count})',
  'main_menu.orders': 'My orders',
  'main_menu.language': 'Language: {lang}',
  'main_menu.help': 'Help',
  'menu.pick_category': 'Pick a category:',
  'menu.pick_item': 'Pick an item:',
  'menu.empty': 'Menu is empty for now.',
  'menu.add_to_cart': 'Add to cart',
  'menu.back': 'Back',
  'cart.title': 'Your cart',
  'cart.empty': 'Your cart is empty.',
  'cart.line': '{i}) {name} x {qty} — {total}',
  'cart.total': 'Total: {total}',
  'cart.checkout': 'Checkout',
  'cart.clear': 'Clear cart',
  'orders.title': 'Your orders',
  'orders.empty': 'No orders yet.',
  'orders.line': '#{no} — {status} — {total}',
  'checkout.ask_mode': 'Where will you eat?',
  'checkout.mode_dine_in': 'Dine-in',
  'checkout.mode_delivery': 'Delivery',
  'checkout.ask_table': 'Send the table number:',
  'checkout.ask_phone': 'Send your phone number (+998...):',
  'checkout.ask_address': 'Send the delivery address:',
  'checkout.summary': 'Order summary:\n{body}\n\nTotal: {total}',
  'checkout.confirm': 'Confirm',
  'checkout.cancel': 'Cancel',
  'checkout.placed': 'Order placed! No: {order_no}',
  'status.update': 'Order #{order_no} — new status: {status}',
  'language.choose': 'Choose a language:',
  'language.changed': 'Language changed.',
  'help.text':
    'Commands:\n/start — restart\n/menu — menu\n/savat — cart\n/buyurtmalarim — orders\n/til — language\n/help — help',
  'errors.generic': 'Sorry, something went wrong. Please try again.',
  'errors.network': 'Network error. Check your connection.',
  'errors.menu_unavailable': 'Menu is not available right now.',
  'errors.invalid_phone': 'Invalid phone. Example: +998901234567',
  'errors.invalid_table': 'Invalid table number.',
  'common.yes': 'Yes',
  'common.no': 'No',
};

const DICTS: Record<Lang, Dict> = { uz, ru, en };

export function t(key: string, lang: Lang = 'uz', vars?: Record<string, string | number>): string {
  const dict = DICTS[lang];
  const fallback = DICTS.uz[key] ?? key;
  const template = dict[key] ?? fallback;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_m, name: string) => {
    const v = vars[name];
    return v === undefined ? `{${name}}` : String(v);
  });
}

export const SUPPORTED_LANGS: readonly Lang[] = ['uz', 'ru', 'en'] as const;

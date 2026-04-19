export { uzMessages } from './uz';
export { ruMessages } from './ru';
export { enMessages } from './en';

export type Locale = 'uz' | 'ru' | 'en';

export const locales: Locale[] = ['uz', 'ru', 'en'];
export const defaultLocale: Locale = 'uz';

export const localeLabels: Record<Locale, string> = {
  uz: "O'zbekcha",
  ru: 'Русский',
  en: 'English',
};

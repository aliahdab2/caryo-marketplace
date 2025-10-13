export const locales = ['en', 'ar'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  ar: 'rtl',
};

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleDirection(locale: Locale): 'ltr' | 'rtl' {
  return localeDirections[locale];
}

export function getLocaleName(locale: Locale): string {
  return localeNames[locale];
}

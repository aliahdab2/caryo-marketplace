"use client";

import { useLanguage } from "@/components/EnhancedLanguageProvider";
import { SupportedLanguage, LANGUAGES } from "@/utils/i18nExports";
import { MdLanguage } from "react-icons/md";

export default function NavbarLanguageSwitcher() {
  const { locale, changeLanguage } = useLanguage();

  // Get the opposite language
  const oppositeLanguage: SupportedLanguage = locale === LANGUAGES.EN ? LANGUAGES.AR : LANGUAGES.EN;
  const oppositeLanguageLabel = oppositeLanguage === LANGUAGES.EN ? 'EN' : 'AR';

  const handleLanguageSwitch = async () => {
    await changeLanguage(oppositeLanguage);
  };

  return (
    <button
      onClick={handleLanguageSwitch}
      className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] max-w-[85px] h-14"
      aria-label={`Switch to ${oppositeLanguage === LANGUAGES.EN ? 'English' : 'العربية'}`}
      title={`Switch to ${oppositeLanguage === LANGUAGES.EN ? 'English' : 'العربية'}`}
    >
      <MdLanguage className="h-5 w-5 mb-1 flex-shrink-0" />
      <span className="text-xs leading-tight font-medium">{oppositeLanguageLabel}</span>
    </button>
  );
}

"use client";

import { useTranslation } from "react-i18next";
import { MdLanguage } from "react-icons/md";

export default function NavbarLanguageSwitcher() {
  const { i18n } = useTranslation();
  
  // Get the opposite language
  const currentLang = i18n.language;
  const oppositeLanguage = currentLang === 'en' ? 'ar' : 'en';
  const oppositeLanguageLabel = oppositeLanguage === 'en' ? 'EN' : 'AR';

  const handleLanguageSwitch = async () => {
    try {
      // Use i18next's built-in changeLanguage - it handles persistence automatically
      await i18n.changeLanguage(oppositeLanguage);
    } catch (error) {
      console.error('Failed to switch language:', error);
    }
  };

  return (
    <button
      onClick={handleLanguageSwitch}
      className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 flex flex-col items-center justify-center px-3 py-2.5 rounded-md transition-colors min-w-[70px] max-w-[85px] h-14"
      aria-label={`Switch to ${oppositeLanguage === 'en' ? 'English' : 'العربية'}`}
      title={`Switch to ${oppositeLanguage === 'en' ? 'English' : 'العربية'}`}
    >
      <MdLanguage className="h-5 w-5 mb-1 flex-shrink-0" />
      <span className="text-xs leading-tight font-medium">{oppositeLanguageLabel}</span>
    </button>
  );
}
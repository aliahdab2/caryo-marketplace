"use client";

import { useLanguageSwitching } from '@/hooks/useLanguageSwitching';
import { MdLanguage } from "react-icons/md";

export default function NavbarLanguageSwitcher() {
  const { oppositeLanguage, switchLanguage } = useLanguageSwitching();
  const oppositeLanguageLabel = oppositeLanguage === 'en' ? 'EN' : 'AR';

  const handleLanguageSwitch = () => {
    switchLanguage(oppositeLanguage);
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
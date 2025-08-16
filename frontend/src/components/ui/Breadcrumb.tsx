"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { MdChevronRight, MdArrowBack } from "react-icons/md";

export type BreadcrumbItem = {
  label: string;
  href?: string;
  translationKey?: string;
  translationNamespace?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export default function Breadcrumb({ items, className = "" }: BreadcrumbProps) {
  const { t } = useTranslation();

  const getLabel = (item: BreadcrumbItem): string => {
    if (item.translationKey) {
      const ns = item.translationNamespace;
      return ns ? t(item.translationKey, { ns }) : t(item.translationKey);
    }
    return item.label;
  };

  return (
    <nav className={`mb-6 ${className}`} aria-label="Breadcrumb">
      <ol className="flex items-center text-sm text-gray-600 dark:text-gray-400 overflow-x-auto whitespace-nowrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isFirst = index === 0;
          const label = getLabel(item);
          const hideOnMobile = items.length > 2 && index > 0 && index < items.length - 1;
          return (
            <li 
              key={`${item.label}-${index}`} 
              className={`flex items-center ${hideOnMobile ? 'hidden md:flex' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {index > 0 && (
                <MdChevronRight className="mx-1.5 text-gray-400 rtl:rotate-180" size={16} />
              )}
              {!isLast && item.href ? (
                <Link 
                  href={item.href} 
                  className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors group"
                  title={label}
                >
                  {isFirst && (
                    <MdArrowBack className="w-4 h-4 opacity-70 group-hover:opacity-100 rtl:rotate-180" />
                  )}
                  <span className="truncate max-w-[120px] md:max-w-none">{label}</span>
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-white font-medium truncate cursor-default" title={label}>{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export const createDashboardBreadcrumb = (current: BreadcrumbItem): BreadcrumbItem[] => [
  {
    label: "Dashboard",
    href: "/dashboard",
    translationKey: "dashboard",
    translationNamespace: "dashboard",
  },
  current,
];

export const createSavedAlertsBreadcrumb = (): BreadcrumbItem[] => [
  {
    label: "Dashboard",
    href: "/dashboard",
    translationKey: "dashboard",
    translationNamespace: "dashboard",
  },
  {
    label: "Saved Alerts",
    translationKey: "search:savedAlerts",
    translationNamespace: "search",
  },
];



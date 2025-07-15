"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Listing } from '@/types/listings';
import { buildBrandSearchUrl, buildModelSearchUrl, NAVIGATION_ROUTES } from '@/utils/navigationUtils';

interface BreadcrumbNavigationProps {
  listing: Listing & {
    brandNameEn?: string;
    brandNameAr?: string;
    modelNameEn?: string;
    modelNameAr?: string;
  };
}

interface BreadcrumbItem {
  label: string;
  href: string;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ listing }) => {
  const { t, i18n } = useTranslation('listings');
  const locale = i18n.language;
  const isArabic = locale === 'ar';

  // Memoize breadcrumbs to prevent unnecessary recalculations
  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    const items: BreadcrumbItem[] = [
      { 
        label: t('allCars'),
        href: NAVIGATION_ROUTES.SEARCH
      }
    ];

    // Always use English names for slug creation, but display names based on locale
    const brandNameEn = listing.brandNameEn;
    const modelNameEn = listing.modelNameEn;
    const brandNameDisplay = locale === 'ar' ? listing.brandNameAr : listing.brandNameEn;
    const modelNameDisplay = locale === 'ar' ? listing.modelNameAr : listing.modelNameEn;
    
    if (brandNameEn && brandNameDisplay) {
      items.push({
        label: brandNameDisplay, // Display in current language
        href: buildBrandSearchUrl(brandNameEn) // But use English for URL slug
      });

      // Only add model breadcrumb if we have both brand and model
      if (modelNameEn && modelNameDisplay) {
        items.push({
          label: modelNameDisplay, // Display in current language
          href: buildModelSearchUrl(brandNameEn, modelNameEn) // But use English for URL slug
        });
      }
    }

    return items;
  }, [listing.brandNameEn, listing.brandNameAr, listing.modelNameEn, listing.modelNameAr, locale, t]);

  return (
    <nav 
      className="flex items-center space-x-1 rtl:space-x-reverse text-sm text-gray-600 dark:text-gray-400 mb-4 overflow-x-auto"
      aria-label={t('breadcrumbNavigation', { defaultValue: 'Breadcrumb navigation' })}
    >
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.href}>
          {index > 0 && (
            <svg 
              className={`flex-shrink-0 w-4 h-4 text-gray-400 ${isArabic ? 'rotate-180' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          )}
          <Link 
            href={breadcrumb.href}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate whitespace-nowrap"
            aria-label={index === breadcrumbs.length - 1 ? 
              t('currentPage', { defaultValue: 'Current page: {{label}}', label: breadcrumb.label }) :
              t('navigateTo', { defaultValue: 'Navigate to {{label}}', label: breadcrumb.label })
            }
          >
            {breadcrumb.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;

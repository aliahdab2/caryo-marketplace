"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Listing } from '@/types/listings';
import { buildHierarchicalBrandFilter } from '@/utils/brandFilters';

interface BreadcrumbNavigationProps {
  listing: Listing & {
    brandNameEn?: string;
    brandNameAr?: string;
    modelNameEn?: string;
    modelNameAr?: string;
  };
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ listing }) => {
  const { t, i18n } = useTranslation('listings');
  const locale = i18n.language;
  const isArabic = locale === 'ar';

  const breadcrumbs = [
    { 
      label: t('allCars'),
      href: '/listings' 
    }
  ];

  // Use the proper brand and model fields based on locale
  const brandName = locale === 'ar' ? listing.brandNameAr : listing.brandNameEn;
  const modelName = locale === 'ar' ? listing.modelNameAr : listing.modelNameEn;
  
  if (brandName) {
    breadcrumbs.push({
      label: brandName,
      href: `/listings?brand=${encodeURIComponent(brandName)}`
    });
  }

  if (modelName) {
    // Use hierarchical brand filtering syntax
    const hierarchicalBrand = buildHierarchicalBrandFilter(brandName || '', modelName);
    breadcrumbs.push({
      label: modelName,
      href: `/listings?brand=${encodeURIComponent(hierarchicalBrand)}`
    });
  }

  return (
    <nav className="flex items-center space-x-1 rtl:space-x-reverse text-sm text-gray-600 dark:text-gray-400 mb-4 overflow-x-auto">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg 
              className={`flex-shrink-0 w-4 h-4 text-gray-400 ${isArabic ? 'rotate-180' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
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
          >
            {breadcrumb.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;

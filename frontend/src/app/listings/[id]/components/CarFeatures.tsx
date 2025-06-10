"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Listing } from '@/types/listings';

interface CarFeaturesProps {
  listing: Listing;
}

const CarFeatures: React.FC<CarFeaturesProps> = ({ listing }) => {
  const { t } = useTranslation('listings');
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  
  const features = listing.features || [];
  const hasFeatures = features.length > 0;
  const displayFeatures = showAllFeatures ? features : features.slice(0, 6);
  const hasMoreFeatures = features.length > 6;

  // Sample feature categories for better organization
  const categorizeFeatures = (features: string[]) => {
    const categories = {
      safety: [] as string[],
      comfort: [] as string[],
      technology: [] as string[],
      performance: [] as string[],
      other: [] as string[]
    };

    features.forEach(feature => {
      const lowerFeature = feature.toLowerCase();
      if (lowerFeature.includes('airbag') || lowerFeature.includes('brake') || lowerFeature.includes('safety') || lowerFeature.includes('abs')) {
        categories.safety.push(feature);
      } else if (lowerFeature.includes('seat') || lowerFeature.includes('climate') || lowerFeature.includes('air condition') || lowerFeature.includes('leather')) {
        categories.comfort.push(feature);
      } else if (lowerFeature.includes('gps') || lowerFeature.includes('bluetooth') || lowerFeature.includes('navigation') || lowerFeature.includes('usb') || lowerFeature.includes('camera')) {
        categories.technology.push(feature);
      } else if (lowerFeature.includes('turbo') || lowerFeature.includes('engine') || lowerFeature.includes('sport') || lowerFeature.includes('performance')) {
        categories.performance.push(feature);
      } else {
        categories.other.push(feature);
      }
    });

    return categories;
  };

  const categorizedFeatures = categorizeFeatures(features);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'safety':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'comfort':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'technology':
        return (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'performance':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const renderFeatureSection = (title: string, features: string[], category: string) => {
    if (features.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="flex items-center text-base font-semibold text-gray-900 dark:text-white mb-3">
          {getCategoryIcon(category)}
          <span className="ml-2 rtl:mr-2 rtl:ml-0">{title}</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <svg className="w-4 h-4 text-green-500 mr-3 rtl:ml-3 rtl:mr-0 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!hasFeatures) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {t('features')}
        </h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-base">{t('noFeaturesListed')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-white">
        {t('features')}
        <span className="ml-2 text-base font-normal text-gray-500 dark:text-gray-400">
          ({features.length})
        </span>
      </h2>
      
      {showAllFeatures ? (
        // Categorized view when showing all features
        <div className="space-y-6">
          {renderFeatureSection(t('safetyFeatures'), categorizedFeatures.safety, 'safety')}
          {renderFeatureSection(t('comfortFeatures'), categorizedFeatures.comfort, 'comfort')}
          {renderFeatureSection(t('technologyFeatures'), categorizedFeatures.technology, 'technology')}
          {renderFeatureSection(t('performanceFeatures'), categorizedFeatures.performance, 'performance')}
          {renderFeatureSection(t('otherFeatures'), categorizedFeatures.other, 'other')}
        </div>
      ) : (
        // Simple list view for initial display
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {displayFeatures.map((feature, index) => (
            <div key={index} className="flex items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <svg className="w-4 h-4 text-green-500 mr-3 rtl:ml-3 rtl:mr-0 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
            </div>
          ))}
        </div>
      )}

      {hasMoreFeatures && (
        <div className="text-center border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={() => setShowAllFeatures(!showAllFeatures)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium text-sm"
          >
            {showAllFeatures ? (
              <>
                <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                {t('showLess')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {t('showMore')} ({features.length - 6} {t('more')})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CarFeatures;

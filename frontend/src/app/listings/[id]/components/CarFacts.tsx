"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Listing } from '@/types/listings';
import { 
  Tag, 
  CalendarDays, 
  Fuel, 
  Cog, 
  Gauge, 
  Paintbrush, 
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface CarFactsProps {
  listing: Listing;
}

const CarFacts: React.FC<CarFactsProps> = ({ listing }) => {
  const { t } = useTranslation('listings');
  const [showLessFacts, setShowLessFacts] = useState(false);

  const allFacts = [
    // Model Year - from API
    ...(listing.year ? [{
      label: t('modelYear'),
      value: listing.year.toString(),
      icon: <CalendarDays className="w-5 h-5 text-blue-600" />
    }] : []),
    
    // Mileage - from API
    ...(listing.mileage ? [{
      label: t('mileage'),
      value: `${listing.mileage.toLocaleString()} km`,
      icon: <Gauge className="w-5 h-5 text-blue-600" />
    }] : []),
    
    // Brand & Model - from API
    ...((listing.brandNameEn || listing.brand) && (listing.modelNameEn || listing.model) ? [{
      label: t('brand') + ' & ' + t('model'),
      value: `${listing.brandNameEn || listing.brand} ${listing.modelNameEn || listing.model}`,
      icon: <Tag className="w-5 h-5 text-blue-600" />
    }] : []),
    
    // Exterior Color - from API (if available)
    ...(listing.exteriorColor ? [{
      label: t('color'),
      value: listing.exteriorColor,
      icon: <Paintbrush className="w-5 h-5 text-blue-600" />
    }] : []),
    
    // Fuel Type - from API (if available)
    ...(listing.fuelType ? [{
      label: t('fuelType'),
      value: listing.fuelType,
      icon: <Fuel className="w-5 h-5 text-blue-600" />
    }] : []),
    
    // Transmission - from API (if available)
    ...(listing.transmission ? [{
      label: t('transmission'),
      value: listing.transmission,
      icon: <Cog className="w-5 h-5 text-blue-600" />
    }] : [])
    
    // Note: Other fields like carType, drivetrain, horsepower, engineSize, firstRegistration 
    // are not available from the current API response, so they've been removed
  ];

  const displayedFacts = showLessFacts ? allFacts.slice(0, 4) : allFacts;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-gray-900 dark:text-white">
        {t('facts')}
      </h2>
      
      {allFacts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>{t('noFactsAvailable')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {displayedFacts.map((fact, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {fact.icon}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {fact.label}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {fact.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allFacts.length > 4 && (
            <button
              onClick={() => setShowLessFacts(!showLessFacts)}
              className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
            >
              {showLessFacts ? (
                <>
                  <ChevronDown className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                  {t('showMoreFacts')}
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" />
                  {t('showLessFacts')}
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default CarFacts;

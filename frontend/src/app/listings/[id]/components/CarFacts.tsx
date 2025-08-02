"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CarListing } from '@/services/publicApi';
import { 
  CalendarDays, 
  Fuel, 
  Cog, 
  Gauge, 
  ChevronUp,
  ChevronDown,
  Tag,
  MapPin,
  Car
} from 'lucide-react';

interface CarFactsProps {
  listing: CarListing;
}

const CarFacts: React.FC<CarFactsProps> = ({ listing }) => {
  const { t } = useTranslation('listings');
  const [showAllFacts, setShowAllFacts] = useState(false);

  const allFacts = [
    // Fuel Type - from API (if available) - "Bränsle"
    ...(listing.fuelType ? [{
      label: t('fuelType'),
      value: listing.fuelType,
      icon: <Fuel className="w-4 h-4 text-gray-600" />
    }] : []),
    
    // Transmission - from API (if available) - "Växellåda"
    ...(listing.transmission ? [{
      label: t('transmission'),
      value: listing.transmission,
      icon: <Cog className="w-4 h-4 text-gray-600" />
    }] : []),
    
    // Mileage - from API - "Miltal"
    ...(listing.mileage ? [{
      label: t('mileage'),
      value: `${listing.mileage.toLocaleString()}`,
      icon: <Gauge className="w-4 h-4 text-gray-600" />
    }] : []),
    
    // Model Year - from API - "Modellår"
    ...(listing.modelYear ? [{
      label: t('modelYear'),
      value: listing.modelYear.toString(),
      icon: <CalendarDays className="w-4 h-4 text-gray-600" />
    }] : []),
    
    // Car Type - commented out as condition doesn't exist in CarListing
    // ...(listing.condition ? [{
    //   label: t('carType'),
    //   value: listing.condition === 'new' ? t('new') : listing.condition === 'used' ? t('used') : listing.condition,
    //   icon: <Car className="w-4 h-4 text-gray-600" />
    // }] : []),
    
    // Engine Size - "Motorstorlek" (if available from API)
    // Note: This field might not be available in current API
    
    // Registration Date - "Datum i trafik" (if available from API)
    // Note: This field might not be available in current API
    
    // Power/Horsepower - "Hästkrafter" (if available from API)
    // Note: This field might not be available in current API
    
    // Exterior Color - commented out as exteriorColor doesn't exist in CarListing
    // ...(listing.exteriorColor ? [{
    //   label: t('color'),
    //   value: listing.exteriorColor,
    //   icon: <Palette className="w-4 h-4 text-gray-600" />
    // }] : []),
    
    // Brand - from API
    ...(listing.brandNameEn ? [{
      label: t('brand'),
      value: listing.brandNameEn,
      icon: <Tag className="w-4 h-4 text-gray-600" />
    }] : []),
    
    // Model - from API
    ...(listing.modelNameEn ? [{
      label: t('model'),
      value: listing.modelNameEn,
      icon: <Car className="w-4 h-4 text-gray-600" />
    }] : []),
    
    // Location - from API
    ...(listing.governorateNameEn ? [{
      label: t('location'),
      value: listing.governorateNameEn,
      icon: <MapPin className="w-4 h-4 text-gray-600" />
    }] : [])
  ];

  // Show first 6 facts by default, then toggle to show all
  const displayedFacts = showAllFacts ? allFacts : allFacts.slice(0, 6);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">
        {t('facts')}
      </h2>
      
      {allFacts.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">{t('noFactsAvailable')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 mb-6">
            {displayedFacts.map((fact, index) => (
              <div 
                key={index}
                className="flex items-start gap-3"
              >
                <div className="flex-shrink-0 mt-1">
                  {fact.icon}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 leading-tight">
                    {fact.label}
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {fact.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {allFacts.length > 6 && (
            <div className="flex justify-center">
              <button
                onClick={() => setShowAllFacts(!showAllFacts)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                {showAllFacts ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {t('showLessFacts')}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {t('showMoreFacts')}
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CarFacts;

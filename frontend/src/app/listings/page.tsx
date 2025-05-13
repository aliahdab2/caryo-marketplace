"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

// This is a placeholder component that will be updated with real data
// when the backend integration is complete
export default function ListingsPage() {
  const { t } = useTranslation('common');
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState([]);

  // Simulating data fetch - this will be replaced with actual API call
  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      // Mock data for demonstration
      const mockListings = Array.from({ length: 12 }, (_, i) => ({
        id: `car-${i+1}`,
        title: `Car Model ${i+1}`,
        price: Math.floor(10000 + Math.random() * 90000),
        year: Math.floor(2010 + Math.random() * 13),
        mileage: Math.floor(10000 + Math.random() * 100000),
        location: i % 2 === 0 ? 'Dubai' : 'Abu Dhabi',
        image: `/images/vehicles/car${(i % 5) + 1}.jpg`,
      }));
      
      setListings(mockListings);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [category]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {category 
            ? t('listings.categoryHeading', { category: category }) 
            : t('header.listings')}
        </h1>
        <p className="text-gray-600 mt-2">
          {t('listings.pageDescription')}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>{t('common.loading')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing: any) => (
            <div 
              key={listing.id} 
              className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <div className="w-full h-48 bg-gray-200"></div>
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-lg">{listing.title}</h2>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(listing.price)}
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>{t('common.year')}: {listing.year}</span>
                    <span>{t('common.mileage')}: {listing.mileage.toLocaleString()} km</span>
                  </div>
                  <div className="mt-1">
                    <span>{t('common.location')}: {listing.location}</span>
                  </div>
                </div>
                <button 
                  onClick={() => window.location.href = `/listings/${listing.id}`}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
                >
                  {t('home.viewDetails')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

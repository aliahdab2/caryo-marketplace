"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ListingDetailPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const router = useRouter();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<any>(null);

  // Simulating data fetch - this will be replaced with actual API call
  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => {
      // Mock data for demonstration
      const mockListing = {
        id: id,
        title: `Car Model ${id}`,
        description: 'This is a detailed description of the vehicle. It includes information about the condition, features, and history of the car.',
        price: Math.floor(10000 + Math.random() * 90000),
        year: Math.floor(2010 + Math.random() * 13),
        mileage: Math.floor(10000 + Math.random() * 100000),
        location: 'Dubai',
        features: [
          'Bluetooth Connectivity',
          'Backup Camera',
          'Sunroof',
          'Navigation System',
          'Leather Seats'
        ],
        sellerInfo: {
          name: 'Car Dealership LLC',
          phone: '+971 50 123 4567',
          email: 'contact@dealership.com'
        },
        images: Array(5).fill('/images/vehicles/car1.jpg')
      };
      
      setListing(mockListing);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{t('listings.notFound')}</h2>
          <p className="mt-4">{t('listings.notFoundDescription')}</p>
          <button 
            onClick={() => router.push('/listings')}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <button 
        onClick={() => router.back()}
        className="mb-6 flex items-center text-blue-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        {t('common.back')}
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-gray-200 h-80 rounded-lg mb-4"></div>
          
          <div className="grid grid-cols-5 gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-gray-200 h-16 rounded cursor-pointer"></div>
            ))}
          </div>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{listing.title}</h1>
            <p className="text-2xl text-blue-600 font-bold mt-2">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'AED' }).format(listing.price)}
            </p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('listings.description')}</h2>
            <p className="text-gray-700">{listing.description}</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{t('listings.features')}</h2>
            <ul className="grid grid-cols-2 gap-y-2">
              {listing.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 shadow-sm sticky top-6">
            <h3 className="text-xl font-semibold mb-4">{t('listings.specifications')}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('common.year')}:</span>
                <span className="font-medium">{listing.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('common.mileage')}:</span>
                <span className="font-medium">{listing.mileage.toLocaleString()} km</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t('common.location')}:</span>
                <span className="font-medium">{listing.location}</span>
              </div>
            </div>
            
            <hr className="my-4" />
            
            <h3 className="text-xl font-semibold mb-4">{t('listings.contactSeller')}</h3>
            <div className="space-y-3">
              <p className="font-medium">{listing.sellerInfo.name}</p>
              <p>
                <span className="font-medium">{t('listings.phone')}:</span> {listing.sellerInfo.phone}
              </p>
              <p>
                <span className="font-medium">{t('listings.email')}:</span> {listing.sellerInfo.email}
              </p>
            </div>
            
            <div className="mt-6 space-y-3">
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">
                {t('listings.contactNow')}
              </button>
              <button className="w-full bg-white border border-blue-600 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50">
                {t('listings.schedule')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

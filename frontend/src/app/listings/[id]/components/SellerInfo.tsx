"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../../utils/localization';
import { Listing } from '@/types/listings';

interface SellerInfoProps {
  listing: Listing;
}

const SellerInfo: React.FC<SellerInfoProps> = ({ listing }) => {
  const { t, i18n } = useTranslation('listings');

  const isDealer = listing.seller?.type === 'dealer';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <div className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
          <svg className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {isDealer ? t('dealer') : t('privateSeller')}
        </h3>
        
        <div className="flex items-start space-x-4 rtl:space-x-reverse mb-4">
          {/* Seller Avatar */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              {isDealer ? (
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
          </div>

          <div className="flex-grow">
            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
              {listing.seller?.name || t('sellerNotSpecified')}
            </h4>
            
            {isDealer && (
              <div className="flex items-center mt-1">
                <svg className="w-4 h-4 text-green-500 mr-1 rtl:ml-1 rtl:mr-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {t('verifiedDealer')}
                </span>
              </div>
            )}
            
            <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {t('memberSince')} {listing.createdAt ? formatDate(listing.createdAt, i18n.language, { year: 'numeric', month: 'long' }) : t('recently')}
              </span>
            </div>

            <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
              <svg className="w-4 h-4 mr-1 rtl:ml-1 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>
                {listing.governorate?.nameEn || listing.location?.city || t('locationNotSpecified')}
              </span>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-green-600 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
              {t('typicallyRespondsIn')} {isDealer ? t('within1Hour') : t('within24Hours')}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
            <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {t('sendMessage')}
          </button>

          <button className="w-full bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
            <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {t('callNow')}
          </button>

          {isDealer && (
            <button className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center">
              <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t('scheduleTestDrive')}
            </button>
          )}
        </div>

        {/* Additional Dealer Info */}
        {isDealer && (
          <div className="mt-4 pt-4 border-t dark:border-gray-600">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">
              {t('aboutThisDealer')}
            </h5>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('licensedDealer')}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('warrantyAvailable')}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0 text-green-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('financingOptions')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerInfo;

"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../../../utils/localization";

interface ListingExpiryProps {
  listingId: string;
  expiryDate: string;
  status: string;
  onRenew: (id: string, duration: number) => void;
}

export default function ListingExpiry({ 
  listingId, 
  expiryDate, 
  status, 
  onRenew 
}: ListingExpiryProps) {
  const { t, i18n } = useTranslation('common');
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState(30); // Default 30 days
  
  // Calculate days remaining until expiry
  const calculateDaysRemaining = () => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  
  const daysRemaining = calculateDaysRemaining();
  
  // Get status class for styling
  const getStatusClass = () => {
    if (status === 'expired') {
      return 'text-red-600 dark:text-red-400';
    } else if (daysRemaining <= 7) {
      return 'text-amber-600 dark:text-amber-400';
    } else {
      return 'text-green-600 dark:text-green-400';
    }
  };
  
  // Get message based on status
  const getStatusMessage = () => {
    if (status === 'expired') {
      return t('listings.listingExpired');
    } else if (daysRemaining <= 7) {
      return t('listings.expiresIn', { days: daysRemaining });
    } else {
      return t('listings.validUntil', { date: formatDate(new Date(expiryDate), i18n.language, {dateStyle: 'medium'}) });
    }
  };
  
  // Handle renewal submission
  const handleRenewal = () => {
    onRenew(listingId, renewalDuration);
    setIsRenewalModalOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className={`text-sm font-medium ${getStatusClass()}`}>
        {getStatusMessage()}
      </div>
      
      {/* Show renewal button for expired listings or those expiring soon */}
      {(status === 'expired' || daysRemaining <= 7) && (
        <button
          onClick={() => setIsRenewalModalOpen(true)}
          className="text-sm text-primary hover:underline"
        >
          {status === 'expired' ? t('listings.renewNow') : t('listings.extendListing')}
        </button>
      )}
      
      {/* Renewal Modal */}
      {isRenewalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">{t('listings.renewListing')}</h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {status === 'expired' 
                ? t('listings.expiredRenewalDesc') 
                : t('listings.renewalDesc')}
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('listings.renewalDuration')}
              </label>
              <select
                value={renewalDuration}
                onChange={(e) => setRenewalDuration(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              >
                <option value={30}>{t('listings.30days')}</option>
                <option value={60}>{t('listings.60days')}</option>
                <option value={90}>{t('listings.90days')}</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsRenewalModalOpen(false)}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRenewal}
                className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                {t('listings.renewListing')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

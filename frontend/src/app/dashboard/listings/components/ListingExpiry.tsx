"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../../../utils/localization";

type ListingStatus = 'active' | 'expired' | 'pending';

interface ListingExpiryProps {
  listingId: string;
  expiryDate: string;
  status: ListingStatus;
  onRenew: (id: string, duration: number) => void;
}

/**
 * ListingExpiry component displays expiration information and renewal options
 * for a listing based on its expiry date and status.
 */
export default function ListingExpiry({ 
  listingId, 
  expiryDate, 
  status, 
  onRenew 
}: ListingExpiryProps) {
  const { t, i18n } = useTranslation('common');
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const [renewalDuration, setRenewalDuration] = useState(30); // Default 30 days
  
  // Calculate days remaining until expiry - memoized to avoid unnecessary recalculations
  const daysRemaining = useMemo(() => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [expiryDate]);
  
  // Get status class for styling - memoized based on status and days remaining
  const statusClass = useMemo(() => {
    if (status === 'expired') {
      return 'text-red-600 dark:text-red-400';
    } else if (daysRemaining <= 7) {
      return 'text-amber-600 dark:text-amber-400';
    } else {
      return 'text-green-600 dark:text-green-400';
    }
  }, [status, daysRemaining]);
  
  // Get message based on status - memoized for performance
  const statusMessage = useMemo(() => {
    if (status === 'expired') {
      return t('listings.listingExpired');
    } else if (daysRemaining <= 7) {
      return t('listings.expiresIn', { days: daysRemaining });
    } else {
      return t('listings.validUntil', { 
        date: formatDate(new Date(expiryDate), i18n.language, {dateStyle: 'medium'}) 
      });
    }
  }, [status, daysRemaining, expiryDate, t, i18n.language]);
  
  // Handle renewal submission
  const handleRenewal = () => {
    onRenew(listingId, renewalDuration);
    setIsRenewalModalOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className={`text-sm font-medium ${statusClass}`}>
        {statusMessage}
      </div>
      
      {/* Show renewal button for expired listings or those expiring soon */}
      {(status === 'expired' || daysRemaining <= 7) && (
        <button
          onClick={() => setIsRenewalModalOpen(true)}
          className="text-sm text-primary hover:underline flex items-center transition-all"
          aria-label={status === 'expired' ? t('listings.renewNow') : t('listings.extendListing')}
        >
          {status === 'expired' ? t('listings.renewNow') : t('listings.extendListing')}
        </button>
      )}
      
      {/* Renewal Modal */}
      {isRenewalModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="renewal-modal-title">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 id="renewal-modal-title" className="text-xl font-semibold mb-4">{t('listings.renewListing')}</h3>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {status === 'expired' 
                ? t('listings.expiredRenewalDesc') 
                : t('listings.renewalDesc')}
            </p>
            
            <div className="mb-4">
              <label htmlFor="renewal-duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('listings.renewalDuration')}
              </label>
              <select
                id="renewal-duration"
                value={renewalDuration}
                onChange={(e) => setRenewalDuration(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              >
                <option value={30}>{t('listings.30days')}</option>
                <option value={60}>{t('listings.60days')}</option>
                <option value={90}>{t('listings.90days')}</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsRenewalModalOpen(false)}
                className="py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleRenewal}
                className="py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow"
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

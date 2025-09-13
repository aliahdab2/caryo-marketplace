"use client";

import { useState, useCallback } from 'react';
import { getAuthHeaders } from '@/utils/auth';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import { useTranslation } from 'react-i18next';

export const useSync = (onSyncComplete?: () => void) => {
  const { showSuccess, showError } = useToastHelpers();
  const { t } = useTranslation(['datamanagement']);

  const [syncingCarQuery, setSyncingCarQuery] = useState(false);
  const [syncingSyrianCars, setSyncingSyrianCars] = useState(false);

  // Utility function for API URL
  const getApiUrl = useCallback(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', []);

  // Sync CarQuery
  const syncCarQuery = useCallback(async () => {
    try {
      setSyncingCarQuery(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${getApiUrl()}/api/admin/data/load-carquery`, {
        method: 'POST',
        headers
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess(result.message);
        onSyncComplete?.();
        return true;
      } else {
        showError(result.message);
        return false;
      }
    } catch (error) {
      console.error('CarQuery sync error:', error);
      showError(t('datamanagement:syncError'));
      return false;
    } finally {
      setSyncingCarQuery(false);
    }
  }, [getApiUrl, showSuccess, showError, t, onSyncComplete]);

  // Sync SyrianCars
  const syncSyrianCars = useCallback(async () => {
    try {
      setSyncingSyrianCars(true);
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${getApiUrl()}/api/admin/data/load-syriacars`, {
        method: 'POST',
        headers
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess(result.message);
        onSyncComplete?.();
        return true;
      } else {
        showError(result.message);
        return false;
      }
    } catch (error) {
      console.error('SyrianCars sync error:', error);
      showError(t('datamanagement:syncError'));
      return false;
    } finally {
      setSyncingSyrianCars(false);
    }
  }, [getApiUrl, showSuccess, showError, t, onSyncComplete]);

  return {
    syncingCarQuery,
    syncingSyrianCars,
    syncCarQuery,
    syncSyrianCars
  };
};

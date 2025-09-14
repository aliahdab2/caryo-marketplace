"use client";

import { useState, useCallback, useEffect } from 'react';
import { getAuthHeaders } from '@/utils/auth';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import { useTranslation } from 'react-i18next';
import { CarBrand, CarModel, DataStatistics, SyncStatus, ImportResult, UpdateBrandData, UpdateModelData, CreateBrandData, CreateModelData } from '../types';

export const useDataManagement = () => {
  const { showSuccess, showError } = useToastHelpers();
  const { t } = useTranslation(['datamanagement']);

  // State
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DataStatistics | null>(null);
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);

  // Utility function for API URL
  const getApiUrl = useCallback(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', []);

  // Helper for authenticated API requests
  const makeAuthenticatedRequest = useCallback(async ( 
    endpoint: string, 
    method: string = 'GET', 
    body?: object | FormData, 
    customHeaders?: Record<string, string>
  ): Promise<Response> => {
    const headers = await getAuthHeaders();
    
    const options: RequestInit = {
      method,
      headers: {
        ...headers,
        ...customHeaders,
        // Content-Type will be set by browser for FormData, otherwise JSON
        ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' })
      },
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
      credentials: 'include' // Important for NextAuth.js cookies
    };
    
    const url = `${getApiUrl()}${endpoint}`;
    console.log(`Sending ${method} request to ${url} with headers:`, options.headers);
    return fetch(url, options);
  }, [getApiUrl]);

  // Function to fetch and update sync status
  const fetchAndSetSyncStatus = useCallback(async () => {
    try {
      const [syrianCarsRes, carQueryRes] = await Promise.all([
        makeAuthenticatedRequest('/api/admin/data/sync-status/SyrianCars'),
        makeAuthenticatedRequest('/api/admin/data/sync-status/CarQueryAPI'),
      ]);

      const newSyncStatus: SyncStatus = {};
      
      if (syrianCarsRes.ok) {
        const data = await syrianCarsRes.json();
        if (data.success && data.data) {
          newSyncStatus.syriancars = data.data;
        } else {
          console.error('Failed to load SyrianCars sync status:', data.message);
        }
      } else {
        console.error('Failed to fetch SyrianCars sync status:', syrianCarsRes.status, syrianCarsRes.statusText);
      }

      if (carQueryRes.ok) {
        const data = await carQueryRes.json();
        if (data.success && data.data) {
          newSyncStatus.carquery = data.data;
        } else {
          console.error('Failed to load CarQueryAPI sync status:', data.message);
        }
      } else {
        console.error('Failed to fetch CarQueryAPI sync status:', carQueryRes.status, carQueryRes.statusText);
      }
      
      setSyncStatus(newSyncStatus);
      console.log("Updated sync status:", newSyncStatus);
      return newSyncStatus;
    } catch (error) {
      console.error('Error fetching sync status:', error);
      return {};
    }
  }, [makeAuthenticatedRequest]);

  // Simple: fetch all models (both active and inactive for admin review)
  const fetchAllModels = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/car-models?page=0&size=1000&sortBy=name');
      if (response.ok) {
        const data = await response.json();
        const models = data.data?.content || [];
        setModels(models);
      } else {
        console.error('Failed to load models:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  }, [makeAuthenticatedRequest]);

  // Load all data (without automatic sync status fetching)
  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [brandsRes, statsRes, _syncStatusData] = await Promise.all([
        makeAuthenticatedRequest('/api/admin/car-brands?size=1000'),
        makeAuthenticatedRequest('/api/admin/data/statistics'),
        fetchAndSetSyncStatus(), // Load sync status on page refresh
      ]);

      // Fetch models separately (it sets the state internally)
      await fetchAllModels();

      let brandsData: CarBrand[] = [];
      if (brandsRes.ok) {
        const brandsResponse = await brandsRes.json();
        brandsData = brandsResponse.data?.content || []; // Extract from paginated response
        console.log('Loaded brands:', brandsData);
        setBrands(brandsData);
      } else {
        console.error('Failed to load brands:', brandsRes.status, brandsRes.statusText);
        if (brandsRes.status === 401 || brandsRes.status === 403) {
          throw new Error('Authentication required. Please log in again.');
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('Loaded statistics:', statsData);
        setStatistics(statsData.data || statsData);
      } else {
        console.error('Failed to load statistics:', statsRes.status, statsRes.statusText);
        if (statsRes.status === 401 || statsRes.status === 403) {
          throw new Error('Authentication required. Please log in again.');
        }
        // Set default statistics if admin endpoint fails
        setStatistics({
          totalBrands: brandsData.length,
          activeBrands: brandsData.filter(b => b.status === 'ACTIVE').length,
          totalModels: 0, // Will be updated when models load
          activeModels: 0 // Will be updated when models load
        });
      }

    } catch (error) {
      console.error('Error loading data:', error);

      // Handle authentication errors specifically
      if (error instanceof Error && error.message === 'Authentication required. Please log in again.') {
        showError(t('datamanagement:authError') || 'Authentication required. Please log in again.');
      } else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        showError(t('datamanagement:connectionError') || 'Unable to connect to server. Please check your connection.');
      } else {
        showError(t('datamanagement:loadError') || 'Failed to load data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [showError, t, makeAuthenticatedRequest, fetchAllModels, fetchAndSetSyncStatus]);

  // Manual sync status fetching (no automatic polling)
  const refreshSyncStatus = useCallback(async () => {
    console.log("Manually refreshing sync status...");
    await fetchAndSetSyncStatus();
  }, [fetchAndSetSyncStatus]);

  // Sync SyrianCars data
  const syncSyrianCarsData = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/data/load-syriacars', 'POST');

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showSuccess(result.message || t('datamanagement:syncSyrianCarsSuccess'));
          await fetchAndSetSyncStatus(); // Refresh status immediately
          return true;
        } else {
          showError(result.message || t('datamanagement:syncSyrianCarsError'));
          return false;
        }
      } else {
        const errorData = await response.json();
        showError(errorData.message || t('datamanagement:syncSyrianCarsError'));
        return false;
      }
    } catch (error) {
      console.error('Error syncing SyrianCars data:', error);
      showError(t('datamanagement:syncSyrianCarsError'));
      return false;
    }
  }, [makeAuthenticatedRequest, showSuccess, showError, t, fetchAndSetSyncStatus]);

  // Sync CarQuery API data
  const syncCarQueryData = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/data/load-carquery', 'POST');

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          showSuccess(result.message || t('datamanagement:syncCarQuerySuccess'));
          await fetchAndSetSyncStatus(); // Refresh status immediately
          return true;
        } else {
          showError(result.message || t('datamanagement:syncCarQueryError'));
          return false;
        }
      } else {
        const errorData = await response.json();
        showError(errorData.message || t('datamanagement:syncCarQueryError'));
        return false;
      }
    } catch (error) {
      console.error('Error syncing CarQuery API data:', error);
      showError(t('datamanagement:syncCarQueryError'));
      return false;
    }
  }, [makeAuthenticatedRequest, showSuccess, showError, t, fetchAndSetSyncStatus]);

  // Export functionality
  const exportExcel = useCallback(async () => {
    try {
      const response = await makeAuthenticatedRequest('/api/admin/data/export-excel', 'GET', undefined, {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'caryo-car-data-export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess(t('datamanagement:exportSuccess'));
      return true;
    } catch (error) {
      console.error('Export error:', error);
      showError(t('datamanagement:exportError'));
      return false;
    }
  }, [showSuccess, showError, t, makeAuthenticatedRequest]);

  // Import functionality
  const importExcel = useCallback(async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await makeAuthenticatedRequest('/api/admin/data/import-excel', 'POST', formData);

      const result: ImportResult = await response.json();
      
      if (result.success) {
        showSuccess(result.message);
        await loadData(); // Reload data
        return true;
      } else {
        showError(result.message);
        return false;
      }
    } catch (error) {
      console.error('Import error:', error);
      showError(t('datamanagement:importError'));
      return false;
    }
  }, [showSuccess, showError, t, loadData, makeAuthenticatedRequest]);

  // Update brand
  const updateBrand = useCallback(async (brandId: number, data: UpdateBrandData) => {
    try {
      const response = await makeAuthenticatedRequest(
        `/api/reference-data/brands/${brandId}`,
        'PUT',
        data
      );

      if (response.ok) {
        showSuccess(t('datamanagement:updateSuccess'));
        await loadData();
        return true;
      } else {
        const errorData = await response.json();
        showError(errorData.message || t('datamanagement:updateError'));
        return false;
      }
    } catch (error) {
      console.error('Brand update error:', error);
      showError(t('datamanagement:updateError'));
      return false;
    }
  }, [showSuccess, showError, t, loadData, makeAuthenticatedRequest]);

  // Update model
  const updateModel = useCallback(async (modelId: number, data: UpdateModelData) => {
    try {
      const response = await makeAuthenticatedRequest(
        `/api/reference-data/models/${modelId}`,
        'PUT',
        data
      );

      if (response.ok) {
        showSuccess(t('datamanagement:updateSuccess'));
        await loadData();
        return true;
      } else {
        const errorData = await response.json();
        showError(errorData.message || t('datamanagement:updateError'));
        return false;
      }
    } catch (error) {
      console.error('Model update error:', error);
      showError(t('datamanagement:updateError'));
      return false;
    }
  }, [showSuccess, showError, t, loadData, makeAuthenticatedRequest]);

  // Create brand with model
  const createBrandWithModel = useCallback(async (brandData: CreateBrandData, modelData: CreateModelData) => {
    try {
      const requestData = {
        brand: brandData,
        model: modelData
      };

      const response = await makeAuthenticatedRequest('/api/reference-data/brands-with-model', 'POST', requestData);

      if (response.ok) {
        showSuccess(t('datamanagement:createSuccess'));
        await loadData();
        return true;
      } else {
        const errorData = await response.json();
        const errorMessage = errorData?.message || t('datamanagement:createError');
        showError(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Brand creation error:', error);
      showError(t('datamanagement:createError'));
      return false;
    }
  }, [showSuccess, showError, t, loadData, makeAuthenticatedRequest]);

  // Create model
  const createModel = useCallback(async (data: CreateModelData) => {
    try {
      const response = await makeAuthenticatedRequest('/api/reference-data/models', 'POST', data);

      if (response.ok) {
        showSuccess(t('datamanagement:createSuccess'));
        await loadData();
        return true;
      } else {
        const errorData = await response.json();
        const errorMessage = errorData?.message || t('datamanagement:createError');
        showError(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Model creation error:', error);
      showError(t('datamanagement:createError'));
      return false;
    }
  }, [showSuccess, showError, t, loadData, makeAuthenticatedRequest]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    // State
    loading,
    statistics,
    brands,
    models,
    syncStatus,

    // Actions
    loadData,
    refreshSyncStatus,
    exportExcel,
    importExcel,
    updateBrand,
    updateModel,
    createBrandWithModel,
    createModel,
    syncSyrianCarsData,
    syncCarQueryData
  };
};

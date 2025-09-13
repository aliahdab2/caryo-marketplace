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

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      
      const [brandsRes, modelsRes, statsRes, syncStatusRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/admin/car-brands?size=1000`, { headers }), // Admin endpoint for all brands
        fetch(`${getApiUrl()}/api/admin/car-models?size=1000&sortBy=name`, { headers }),  // Admin endpoint for all models with valid sort field
        fetch(`${getApiUrl()}/api/admin/data/statistics`, { headers }),
        fetch(`${getApiUrl()}/api/admin/data/sync-status`, { headers })
      ]);

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

      if (modelsRes.ok) {
        const modelsResponse = await modelsRes.json();
        const modelsData = modelsResponse.data?.content || []; // Extract from paginated response
        console.log('Loaded models:', modelsData);
        // Backend now provides full brand information, no need to populate manually
        setModels(modelsData);
      } else {
        console.error('Failed to load models:', modelsRes.status, modelsRes.statusText);
        if (modelsRes.status === 401 || modelsRes.status === 403) {
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
          activeBrands: brandsData.filter(b => b.isActive).length,
          totalModels: 0,
          activeModels: 0
        });
      }

      if (syncStatusRes.ok) {
        const syncData = await syncStatusRes.json();
        console.log('Loaded sync status:', syncData);
        setSyncStatus(syncData.data || syncData);
      } else {
        console.error('Failed to load sync status:', syncStatusRes.status, syncStatusRes.statusText);
        if (syncStatusRes.status === 401 || syncStatusRes.status === 403) {
          throw new Error('Authentication required. Please log in again.');
        }
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
  }, [getApiUrl, showError, t]);

  // Export functionality
  const exportExcel = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${getApiUrl()}/api/admin/data/export`, {
        method: 'GET',
        headers: {
          ...headers,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'car-data.xlsx';
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
  }, [getApiUrl, showSuccess, showError, t]);

  // Import functionality
  const importExcel = useCallback(async (file: File) => {
    try {
      const headers = await getAuthHeaders();
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${getApiUrl()}/api/admin/data/import`, {
        method: 'POST',
        headers: {
          ...headers
        },
        body: formData
      });

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
  }, [getApiUrl, showSuccess, showError, t, loadData]);

  // Update brand
  const updateBrand = useCallback(async (brandId: number, data: UpdateBrandData) => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${getApiUrl()}/api/reference-data/brands/${brandId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

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
  }, [getApiUrl, showSuccess, showError, t, loadData]);

  // Update model
  const updateModel = useCallback(async (modelId: number, data: UpdateModelData) => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${getApiUrl()}/api/reference-data/models/${modelId}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

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
  }, [getApiUrl, showSuccess, showError, t, loadData]);

  // Create brand with model
  const createBrandWithModel = useCallback(async (brandData: CreateBrandData, modelData: CreateModelData) => {
    try {
      const headers = await getAuthHeaders();
      
      const requestData = {
        brand: brandData,
        model: modelData
      };

      const response = await fetch(`${getApiUrl()}/api/reference-data/brands-with-model`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

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
  }, [getApiUrl, showSuccess, showError, t, loadData]);

  // Create model
  const createModel = useCallback(async (data: CreateModelData) => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(`${getApiUrl()}/api/reference-data/models`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

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
  }, [getApiUrl, showSuccess, showError, t, loadData]);

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
    exportExcel,
    importExcel,
    updateBrand,
    updateModel,
    createBrandWithModel,
    createModel
  };
};

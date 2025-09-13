"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdDownload, 
  MdUpload, 
  MdRefresh,
  MdBarChart,
  MdDirectionsCar,
  MdSettings,
  MdCheckCircle,
  MdInfo,
  MdAdd
} from 'react-icons/md';
import { getAuthHeaders, isAdmin } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { useToastHelpers } from '@/components/ui/ToastProvider';
import { useLanguageDirection } from '@/utils/languageDirection';

interface CarBrand {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  isActive: boolean;
}

interface CarModel {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
  brandId: number;
  brand: CarBrand;
  isActive: boolean;
}

interface DataStatistics {
  totalBrands: number;
  activeBrands: number;
  totalModels: number;
  activeModels: number;
}

interface ImportResult {
  success: boolean;
  message: string;
  data?: string;
}

interface EditForm {
  name?: string;
  displayNameEn?: string;
  displayNameAr?: string;
  isActive?: boolean;
  brandId?: number;
}

interface AddForm {
  name?: string;
  displayNameEn?: string;
  displayNameAr?: string;
  isActive?: boolean;
  brandId?: string | number;
}

interface SyncStatusItem {
  allowed: boolean;
  message?: string;
  remainingCooldownHours?: number;
  lastSyncTime?: string;
}

interface SyncStatus {
  carquery?: SyncStatusItem;
  syriancars?: SyncStatusItem;
}

export default function DataManagementPage() {
  const { t } = useTranslation(['datamanagement', 'common']);
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToastHelpers();
  const { isRTL, flexClass } = useLanguageDirection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility function for API URL
  const getApiUrl = useCallback(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', []);

  // Form validation utilities
  const validateBrandForm = useCallback((form: AddForm): string | null => {
    if (!form.name?.trim()) return t('datamanagement:nameRequired');
    if (!form.displayNameEn?.trim()) return t('datamanagement:englishNameRequired');
    if (!form.displayNameAr?.trim()) return t('datamanagement:arabicNameRequired');
    return null;
  }, [t]);

  const validateModelForm = useCallback((form: AddForm): string | null => {
    if (!form.name?.trim()) return t('datamanagement:nameRequired');
    if (!form.displayNameEn?.trim()) return t('datamanagement:englishNameRequired');
    if (!form.displayNameAr?.trim()) return t('datamanagement:arabicNameRequired');
    if (!form.brandId) return t('datamanagement:brandRequired');
    return null;
  }, [t]);

  // Validation for model form when creating brand + model (no brandId required)
  const validateModelFormForNewBrand = useCallback((form: AddForm): string | null => {
    if (!form.name?.trim()) return t('datamanagement:nameRequired');
    if (!form.displayNameEn?.trim()) return t('datamanagement:englishNameRequired');
    if (!form.displayNameAr?.trim()) return t('datamanagement:arabicNameRequired');
    return null;
  }, [t]);

  // State management
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DataStatistics | null>(null);
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'models'>('overview');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [syncingCarQuery, setSyncingCarQuery] = useState(false);
  const [syncingSyrianCars, setSyncingSyrianCars] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [editingBrand, setEditingBrand] = useState<CarBrand | null>(null);
  const [editingModel, setEditingModel] = useState<CarModel | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({});
  const [showAddBrandWithModel, setShowAddBrandWithModel] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>({});
  const [addBrandForm, setAddBrandForm] = useState<AddForm>({});
  const [creatingBrandWithModel, setCreatingBrandWithModel] = useState(false);
  const [creatingModel, setCreatingModel] = useState(false);

  const loadSyncStatus = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/admin/data/sync-status`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        setSyncStatus(result.data);
      }
    } catch (error) {
      console.error('Error loading sync status:', error);
      // Don't show error for sync status as it's not critical
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStatistics(),
        loadBrands(),
        loadModels(),
        loadSyncStatus()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showError(t('datamanagement:loadDataError'));
    } finally {
      setLoading(false);
    }
  }, [showError, t, loadSyncStatus]);

  // Check for duplicate brand names
  const checkBrandDuplicate = useCallback((brandForm: AddForm): string | null => {
    const name = brandForm.name?.trim().toLowerCase();
    const displayNameEn = brandForm.displayNameEn?.trim().toLowerCase();
    const displayNameAr = brandForm.displayNameAr?.trim();

    if (name && brands.some(brand => brand.name.toLowerCase() === name)) {
      return t('datamanagement:brandNameExists', { name: brandForm.name });
    }
    
    if (displayNameEn && brands.some(brand => brand.displayNameEn.toLowerCase() === displayNameEn)) {
      return t('datamanagement:brandEnglishNameExists', { name: brandForm.displayNameEn });
    }
    
    if (displayNameAr && brands.some(brand => brand.displayNameAr === displayNameAr)) {
      return t('datamanagement:brandArabicNameExists', { name: brandForm.displayNameAr });
    }
    
    return null;
  }, [brands, t]);

  // Check for duplicate model names within a brand
  const checkModelDuplicate = useCallback((modelForm: AddForm, brandId?: number): string | null => {
    const name = modelForm.name?.trim().toLowerCase();
    const displayNameEn = modelForm.displayNameEn?.trim().toLowerCase();
    const displayNameAr = modelForm.displayNameAr?.trim();

    // Filter models by brand
    const brandModels = brandId 
      ? models.filter(model => model.brandId === brandId)
      : models; // For new brand creation, check against all models (though this is less likely to conflict)

    const brandName = brandId ? brands.find(b => b.id === brandId)?.displayNameEn : t('datamanagement:thisBrand');

    if (name && brandModels.some(model => model.name.toLowerCase() === name)) {
      return t('datamanagement:modelNameExists', { name: modelForm.name, brand: brandName });
    }
    
    if (displayNameEn && brandModels.some(model => model.displayNameEn.toLowerCase() === displayNameEn)) {
      return t('datamanagement:modelEnglishNameExists', { name: modelForm.displayNameEn, brand: brandName });
    }
    
    if (displayNameAr && brandModels.some(model => model.displayNameAr === displayNameAr)) {
      return t('datamanagement:modelArabicNameExists', { name: modelForm.displayNameAr, brand: brandName });
    }
    
    return null;
  }, [models, brands, t]);

  // Check admin access
  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [router, loadData]);

  const loadStatistics = async () => {
    try {
      const headers = await getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/admin/data/statistics`, { headers });
      
      if (response.ok) {
        const result = await response.json();
        setStatistics(result.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const headers = await getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/reference-data/brands`, { headers });
      
      if (response.ok) {
        const brandsData = await response.json();
        setBrands(brandsData);
      }
    } catch (error) {
      console.error('Error loading brands:', error);
    }
  };

  const loadModels = async () => {
    try {
      const headers = await getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/reference-data/models`, { headers });
      
      if (response.ok) {
        const modelsData = await response.json();
        setModels(modelsData);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const headers = await getAuthHeaders();
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/admin/data/export-excel`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `caryo-car-data-export-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showSuccess(t('datamanagement:exportSuccess'));
      } else {
        const errorData = await response.json();
        showError(errorData.message || t('datamanagement:exportError'));
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showError(t('datamanagement:exportError'));
    } finally {
      setExporting(false);
    }
  };

  const handleImportExcel = async (file: File) => {
    try {
      setImporting(true);
      const headers = await getAuthHeaders();
      
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/admin/data/import-excel`, {
        method: 'POST',
        headers: {
          ...headers,
          // Don't set Content-Type for FormData, let browser set it
        },
        body: formData
      });

      const result: ImportResult = await response.json();
      
      if (result.success) {
        showSuccess(`Import completed successfully: ${result.data}`);
        await loadData(); // Reload data after successful import
      } else {
        showWarning(`Import completed with issues: ${result.message}`);
        await loadData(); // Still reload data as some items might have been imported
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      showError(t('datamanagement:importErrorGeneric'));
    } finally {
      setImporting(false);
    }
  };

  const handleSyncCarQuery = async () => {
    // Check if sync is allowed
    if (syncStatus?.carquery && !syncStatus.carquery.allowed) {
      const remainingHours = syncStatus.carquery.remainingCooldownHours || 0;
      showError(`CarQuery sync is blocked to prevent API rate limiting. Please wait ${remainingHours} more hours.`);
      return;
    }

    // Show confirmation dialog for first-time sync
    if (!syncStatus?.carquery?.lastSyncTime) {
      const confirmed = window.confirm(
        'This will import comprehensive car data from CarQuery API. ' +
        'Note: CarQuery API has rate limits. After this sync, you must wait 2 hours before syncing again. ' +
        'Continue?'
      );
      if (!confirmed) return;
    }

    try {
      setSyncingCarQuery(true);
      const headers = await getAuthHeaders();
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/admin/data/load-carquery`, {
        method: 'POST',
        headers
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess(t('datamanagement:syncCarQuerySuccess'));
        await loadData(); // Reload data and sync status after successful sync
      } else {
        showError(`${t('datamanagement:syncCarQueryError')}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error syncing CarQuery data:', error);
      showError(t('datamanagement:syncCarQueryError'));
    } finally {
      setSyncingCarQuery(false);
    }
  };

  const handleSyncSyrianCars = async () => {
    // Check if sync is allowed
    if (syncStatus?.syriancars && !syncStatus.syriancars.allowed) {
      const remainingHours = syncStatus.syriancars.remainingCooldownHours || 0;
      showError(`SyrianCars sync is blocked to prevent rate limiting. Please wait ${remainingHours} more hours.`);
      return;
    }

    // Show confirmation dialog for first-time sync
    if (!syncStatus?.syriancars?.lastSyncTime) {
      const confirmed = window.confirm(
        'This will import Syrian market car data from SyrianCars.net. ' +
        'After this sync, you must wait 1 hour before syncing again. ' +
        'Continue?'
      );
      if (!confirmed) return;
    }

    try {
      setSyncingSyrianCars(true);
      const headers = await getAuthHeaders();
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/admin/data/load-syriacars`, {
        method: 'POST',
        headers
      });

      const result = await response.json();
      
      if (result.success) {
        showSuccess(t('datamanagement:syncSyrianCarsSuccess'));
        await loadData(); // Reload data and sync status after successful sync
      } else {
        showError(`${t('datamanagement:syncSyrianCarsError')}: ${result.message}`);
      }
    } catch (error) {
      console.error('Error syncing SyrianCars data:', error);
      showError(t('datamanagement:syncSyrianCarsError'));
    } finally {
      setSyncingSyrianCars(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel' ||
          file.name.toLowerCase().endsWith('.xlsx') ||
          file.name.toLowerCase().endsWith('.xls')) {
        handleImportExcel(file);
      } else {
        showError(t('datamanagement:fileValidationError'));
      }
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startEditBrand = (brand: CarBrand) => {
    setEditingBrand(brand);
    setEditForm({
      name: brand.name,
      displayNameEn: brand.displayNameEn,
      displayNameAr: brand.displayNameAr,
      isActive: brand.isActive
    });
  };

  const startEditModel = (model: CarModel) => {
    setEditingModel(model);
    setEditForm({
      name: model.name,
      displayNameEn: model.displayNameEn,
      displayNameAr: model.displayNameAr,
      isActive: model.isActive,
      brandId: model.brandId
    });
  };

  const cancelEdit = () => {
    setEditingBrand(null);
    setEditingModel(null);
    setEditForm({});
  };

  const startAddBrandWithModel = () => {
    setShowAddBrandWithModel(true);
    setAddBrandForm({
      name: '',
      displayNameEn: '',
      displayNameAr: '',
      isActive: true
    });
    setAddForm({
      name: '',
      displayNameEn: '',
      displayNameAr: '',
      isActive: true
    });
  };

  const startAddModel = () => {
    setShowAddModel(true);
    setAddForm({
      name: '',
      displayNameEn: '',
      displayNameAr: '',
      brandId: '',
      isActive: true
    });
  };

  const cancelAdd = () => {
    setShowAddBrandWithModel(false);
    setShowAddModel(false);
    setAddForm({});
    setAddBrandForm({});
  };

  const saveBrandWithModel = async () => {
    // Validate forms
    const brandValidation = validateBrandForm(addBrandForm);
    if (brandValidation) {
      showError(brandValidation);
      return;
    }
    
    // Use the validation that doesn't require brandId for new brand creation
    const modelValidation = validateModelFormForNewBrand(addForm);
    if (modelValidation) {
      showError(modelValidation);
      return;
    }

    // Check for duplicate brand
    const brandDuplicateCheck = checkBrandDuplicate(addBrandForm);
    if (brandDuplicateCheck) {
      showError(brandDuplicateCheck);
      return;
    }

    // Check for duplicate model (for new brand, we check against all models)
    const modelDuplicateCheck = checkModelDuplicate(addForm);
    if (modelDuplicateCheck) {
      showError(modelDuplicateCheck);
      return;
    }

    setCreatingBrandWithModel(true);
    try {
      const headers = await getAuthHeaders();
      const apiUrl = getApiUrl();
      
      // Use atomic endpoint for brand+model creation
      const response = await fetch(`${apiUrl}/api/reference-data/brands-with-model`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brand: addBrandForm,
          model: addForm
        })
      });

      const result = await response.json();
      
      if (response.status === 201 || response.ok) {
        showSuccess(t('datamanagement:brandWithModelCreated'));
        await loadData(); // Reload data
        cancelAdd();
      } else {
        showError(`${t('datamanagement:brandCreateError')}: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating brand with model:', error);
      // Try to extract the actual error message from the server response
      let errorMessage = t('datamanagement:brandCreateError');
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      showError(errorMessage);
    } finally {
      setCreatingBrandWithModel(false);
    }
  };

  const saveModelAdd = async () => {
    // Validate form
    const validation = validateModelForm(addForm);
    if (validation) {
      showError(validation);
      return;
    }

    // Check for duplicate model within the selected brand
    const modelDuplicateCheck = checkModelDuplicate(addForm, Number(addForm.brandId));
    if (modelDuplicateCheck) {
      showError(modelDuplicateCheck);
      return;
    }

    setCreatingModel(true);
    try {
      const headers = await getAuthHeaders();
      const apiUrl = getApiUrl();
      
      const response = await fetch(`${apiUrl}/api/reference-data/models`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...addForm,
          brandId: Number(addForm.brandId)
        })
      });

      const result = await response.json();
      
      if (response.status === 201 || response.ok) {
        showSuccess(t('datamanagement:modelCreated'));
        await loadData(); // Reload data
        cancelAdd();
      } else {
        showError(`${t('datamanagement:modelCreateError')}: ${result.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error creating model:', error);
      // Try to extract the actual error message from the server response
      let errorMessage = t('datamanagement:modelCreateError');
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      showError(errorMessage);
    } finally {
      setCreatingModel(false);
    }
  };

  const saveBrandEdit = async () => {
    if (!editingBrand) return;
    
    try {
      const headers = await getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiUrl}/api/reference-data/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const result = await response.json();
      
      if (result.success || response.ok) {
        showSuccess(t('datamanagement:brandUpdated'));
        await loadData(); // Reload data
        cancelEdit();
      } else {
        showError(`${t('datamanagement:brandUpdateError')}: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating brand:', error);
      showError(t('datamanagement:brandUpdateError'));
    }
  };

  const saveModelEdit = async () => {
    if (!editingModel) return;
    
    try {
      const headers = await getAuthHeaders();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      
      const response = await fetch(`${apiUrl}/api/reference-data/models/${editingModel.id}`, {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const result = await response.json();
      
      if (result.success || response.ok) {
        showSuccess(t('datamanagement:modelUpdated'));
        await loadData(); // Reload data
        cancelEdit();
      } else {
        showError(`${t('datamanagement:modelUpdateError')}: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating model:', error);
      showError(t('datamanagement:modelUpdateError'));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('datamanagement:loadingDataManagement')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className={`flex flex-col lg:${flexClass} lg:items-center lg:justify-between gap-6`}>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('datamanagement:title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('datamanagement:subtitle')}
              </p>
            </div>
            
            <div className={`flex flex-wrap items-center ${isRTL ? 'gap-x-reverse' : ''} gap-3`}>
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MdDownload className="w-4 h-4" />
                {exporting ? t('datamanagement:exporting') : t('datamanagement:exportExcel')}
              </button>
              
              <button
                onClick={triggerFileSelect}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MdUpload className="w-4 h-4" />
                {importing ? t('datamanagement:importing') : t('datamanagement:importExcel')}
              </button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <button
                onClick={handleSyncCarQuery}
                disabled={syncingCarQuery || loading || (syncStatus?.carquery && !syncStatus.carquery.allowed)}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                  syncStatus?.carquery && !syncStatus.carquery.allowed
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={syncStatus?.carquery && !syncStatus.carquery.allowed 
                  ? `Blocked: ${syncStatus.carquery.message}` 
                  : 'Import data from CarQuery API'}
              >
                <MdSettings className="w-4 h-4" />
                {syncingCarQuery ? t('datamanagement:syncingCarQuery') : t('datamanagement:syncCarQuery')}
                {syncStatus?.carquery && !syncStatus.carquery.allowed && (
                  <span className="text-xs ml-1">({syncStatus.carquery.remainingCooldownHours}h)</span>
                )}
              </button>
              
              <button
                onClick={handleSyncSyrianCars}
                disabled={syncingSyrianCars || loading || (syncStatus?.syriancars && !syncStatus.syriancars.allowed)}
                className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                  syncStatus?.syriancars && !syncStatus.syriancars.allowed
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={syncStatus?.syriancars && !syncStatus.syriancars.allowed 
                  ? `Blocked: ${syncStatus.syriancars.message}` 
                  : 'Import data from SyrianCars.net'}
              >
                <MdSettings className="w-4 h-4" />
                {syncingSyrianCars ? t('datamanagement:syncingSyrianCars') : t('datamanagement:syncSyrianCars')}
                {syncStatus?.syriancars && !syncStatus.syriancars.allowed && (
                  <span className="text-xs ml-1">({syncStatus.syriancars.remainingCooldownHours}h)</span>
                )}
              </button>
              
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MdRefresh className="w-4 h-4" />
                {t('datamanagement:refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <MdDirectionsCar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('datamanagement:totalBrands')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalBrands}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MdCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('datamanagement:activeBrands')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.activeBrands}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MdSettings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('datamanagement:totalModels')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalModels}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <MdBarChart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('datamanagement:activeModels')}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.activeModels}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className={`flex ${isRTL ? 'space-x-reverse' : ''} space-x-8 px-6`}>
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className={`flex items-center ${isRTL ? 'gap-x-reverse' : ''} gap-2`}>
                  <MdBarChart className="w-4 h-4" />
                  {t('datamanagement:overview')}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('brands')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'brands'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className={`flex items-center ${isRTL ? 'gap-x-reverse' : ''} gap-2`}>
                  <MdDirectionsCar className="w-4 h-4" />
                  {t('datamanagement:brands')} ({brands.length})
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('models')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'models'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className={`flex items-center ${isRTL ? 'gap-x-reverse' : ''} gap-2`}>
                  <MdSettings className="w-4 h-4" />
                  {t('datamanagement:models')} ({models.length})
                </div>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <MdInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        {t('datamanagement:infoTitle')}
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {t('datamanagement:infoDescription')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('datamanagement:exportProcess')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:exportStep1')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:exportStep2')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:exportStep3')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('datamanagement:dataIntegrity')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:validationFields')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:bilingualSupport')}</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:duplicateDetection')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('datamanagement:externalDataSources')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MdSettings className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('datamanagement:carQueryApi')}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:carQueryDescription')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MdSettings className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('datamanagement:syrianCarsNet')}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:syrianCarsDescription')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <MdInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{t('datamanagement:smartTranslation')}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{t('datamanagement:smartTranslationDescription')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'brands' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('datamanagement:brands')}</h3>
                  <div className={`flex items-center ${isRTL ? 'gap-x-reverse' : ''} gap-4`}>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{brands.length} total brands</span>
                    <button
                      onClick={startAddBrandWithModel}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <MdAdd className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('datamanagement:addBrandWithModel')}
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:englishName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:arabicName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:slug')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {brands.map((brand) => (
                        <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          {editingBrand?.id === brand.id ? (
                            // Edit mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={editForm.displayNameEn || ''}
                                  onChange={(e) => setEditForm({...editForm, displayNameEn: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={editForm.displayNameAr || ''}
                                  onChange={(e) => setEditForm({...editForm, displayNameAr: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {brand.slug}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={editForm.isActive ? 'true' : 'false'}
                                  onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                  <option value="true">{t('datamanagement:active')}</option>
                                  <option value="false">{t('datamanagement:inactive')}</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={saveBrandEdit}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  >
                                    {t('datamanagement:save')}
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                  >
                                    {t('datamanagement:cancel')}
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {brand.displayNameEn}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {brand.displayNameAr}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {brand.slug}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  brand.isActive 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {brand.isActive ? t('datamanagement:active') : t('datamanagement:inactive')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => startEditBrand(brand)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  {t('datamanagement:edit')}
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('datamanagement:models')}</h3>
                  <div className={`flex items-center ${isRTL ? 'gap-x-reverse' : ''} gap-4`}>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{models.length} total models</span>
                    <button
                      onClick={startAddModel}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <MdAdd className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      {t('datamanagement:addModel')}
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:brand')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:englishName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:arabicName')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:slug')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('datamanagement:status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {models.map((model) => (
                        <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          {editingModel?.id === model.id ? (
                            // Edit mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={editForm.brandId || ''}
                                  onChange={(e) => setEditForm({...editForm, brandId: Number(e.target.value)})}
                                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                  <option value="">{t('datamanagement:selectBrand')}</option>
                                  {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{brand.displayNameEn}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={editForm.displayNameEn || ''}
                                  onChange={(e) => setEditForm({...editForm, displayNameEn: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={editForm.displayNameAr || ''}
                                  onChange={(e) => setEditForm({...editForm, displayNameAr: e.target.value})}
                                  className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {model.slug}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <select
                                  value={editForm.isActive ? 'true' : 'false'}
                                  onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                                  className="px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                  <option value="true">{t('datamanagement:active')}</option>
                                  <option value="false">{t('datamanagement:inactive')}</option>
                                </select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={saveModelEdit}
                                    className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  >
                                    {t('datamanagement:save')}
                                  </button>
                                  <button
                                    onClick={cancelEdit}
                                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                                  >
                                    {t('datamanagement:cancel')}
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            // View mode
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {brands.find(brand => brand.id === model.brandId)?.displayNameEn || t('datamanagement:unknown')}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {model.displayNameEn}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {model.displayNameAr}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                                {model.slug}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  model.isActive 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                }`}>
                                  {model.isActive ? t('datamanagement:active') : t('datamanagement:inactive')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <button
                                  onClick={() => startEditModel(model)}
                                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                  {t('datamanagement:edit')}
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Brand + Model Modal */}
      {showAddBrandWithModel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('datamanagement:addBrandWithModel')}
              </h3>
              <div className="space-y-6">
                {/* Brand Section */}
                <div className="border-b border-gray-200 dark:border-gray-600 pb-4">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">{t('datamanagement:brandDetails')}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('datamanagement:name')}
                      </label>
                      <input
                        type="text"
                        value={addBrandForm.name || ''}
                        onChange={(e) => setAddBrandForm({...addBrandForm, name: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('datamanagement:englishName')}
                      </label>
                      <input
                        type="text"
                        value={addBrandForm.displayNameEn || ''}
                        onChange={(e) => setAddBrandForm({...addBrandForm, displayNameEn: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('datamanagement:arabicName')}
                      </label>
                      <input
                        type="text"
                        value={addBrandForm.displayNameAr || ''}
                        onChange={(e) => setAddBrandForm({...addBrandForm, displayNameAr: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Model Section */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">{t('datamanagement:modelDetails')}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('datamanagement:name')}
                      </label>
                      <input
                        type="text"
                        value={addForm.name || ''}
                        onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('datamanagement:englishName')}
                      </label>
                      <input
                        type="text"
                        value={addForm.displayNameEn || ''}
                        onChange={(e) => setAddForm({...addForm, displayNameEn: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('datamanagement:arabicName')}
                      </label>
                      <input
                        type="text"
                        value={addForm.displayNameAr || ''}
                        onChange={(e) => setAddForm({...addForm, displayNameAr: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className={`flex justify-end ${isRTL ? 'space-x-reverse' : ''} space-x-3 mt-6`}>
                <button
                  onClick={cancelAdd}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('datamanagement:cancel')}
                </button>
                <button
                  onClick={saveBrandWithModel}
                  disabled={creatingBrandWithModel}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingBrandWithModel ? t('common:saving') : t('datamanagement:save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Model Modal */}
      {showAddModel && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t('datamanagement:addModel')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('datamanagement:addModelDescription')}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('datamanagement:selectBrand')}
                  </label>
                  <select
                    value={addForm.brandId || ''}
                    onChange={(e) => setAddForm({...addForm, brandId: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">{t('datamanagement:selectBrand')}</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.displayNameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('datamanagement:name')}
                  </label>
                  <input
                    type="text"
                    value={addForm.name || ''}
                    onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('datamanagement:englishName')}
                  </label>
                  <input
                    type="text"
                    value={addForm.displayNameEn || ''}
                    onChange={(e) => setAddForm({...addForm, displayNameEn: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('datamanagement:arabicName')}
                  </label>
                  <input
                    type="text"
                    value={addForm.displayNameAr || ''}
                    onChange={(e) => setAddForm({...addForm, displayNameAr: e.target.value})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('datamanagement:status')}
                  </label>
                  <select
                    value={addForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setAddForm({...addForm, isActive: e.target.value === 'true'})}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="true">{t('datamanagement:active')}</option>
                    <option value="false">{t('datamanagement:inactive')}</option>
                  </select>
                </div>
              </div>
              <div className={`flex justify-end ${isRTL ? 'space-x-reverse' : ''} space-x-3 mt-6`}>
                <button
                  onClick={cancelAdd}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {t('datamanagement:cancel')}
                </button>
                <button
                  onClick={saveModelAdd}
                  disabled={creatingModel}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingModel ? t('common:saving') : t('datamanagement:save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

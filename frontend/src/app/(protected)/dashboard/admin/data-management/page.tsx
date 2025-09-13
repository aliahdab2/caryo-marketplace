"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdDownload, 
  MdUpload, 
  MdRefresh,
  MdViewList,
  MdBarChart,
  MdDirectionsCar,
  MdSettings,
  MdCheckCircle,
  MdError,
  MdWarning,
  MdInfo
} from 'react-icons/md';
import { getAuthHeaders, isAdmin } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import { useToastHelpers } from '@/components/ui/ToastProvider';

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

export default function DataManagementPage() {
  const { t } = useTranslation(['admin', 'common']);
  const router = useRouter();
  const { showSuccess, showError, showWarning } = useToastHelpers();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DataStatistics | null>(null);
  const [brands, setBrands] = useState<CarBrand[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'brands' | 'models'>('overview');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Check admin access
  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStatistics(),
        loadBrands(),
        loadModels()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadStatistics = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/data/statistics', headers);
      
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
      const response = await fetch('/api/reference-data/brands', headers);
      
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
      const response = await fetch('/api/reference-data/models', headers);
      
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
      
      const response = await fetch('/api/admin/data/export-excel', {
        method: 'GET',
        headers: headers.headers
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
        
        showSuccess(t('admin:dataManagement.exportSuccess'));
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Failed to export Excel file');
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showError('Failed to export Excel file');
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

      const response = await fetch('/api/admin/data/import-excel', {
        method: 'POST',
        headers: {
          ...headers.headers,
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
      showError('Failed to import Excel file');
    } finally {
      setImporting(false);
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
        showError(t('admin:dataManagement.fileValidationError'));
      }
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          <p className="text-gray-600 dark:text-gray-400">Loading data management...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t('admin:dataManagement.title')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t('admin:dataManagement.subtitle')}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportExcel}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MdDownload className="w-4 h-4" />
                {exporting ? t('admin:dataManagement.exporting') : t('admin:dataManagement.exportExcel')}
              </button>
              
              <button
                onClick={triggerFileSelect}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MdUpload className="w-4 h-4" />
                {importing ? t('admin:dataManagement.importing') : t('admin:dataManagement.importExcel')}
              </button>
              
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <MdRefresh className="w-4 h-4" />
                Refresh
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Brands</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalBrands}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MdCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Brands</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.activeBrands}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <MdSettings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Models</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.totalModels}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <MdBarChart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Models</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics.activeModels}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MdBarChart className="w-4 h-4" />
                  Overview
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
                <div className="flex items-center gap-2">
                  <MdDirectionsCar className="w-4 h-4" />
                  Brands ({brands.length})
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
                <div className="flex items-center gap-2">
                  <MdSettings className="w-4 h-4" />
                  Models ({models.length})
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
                        Excel Data Management
                      </h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Export current car data to Excel for review and editing. Import updated Excel files to modify brands and models with bilingual support (English/Arabic).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Export Process</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Click "Export Excel" to download current data</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Review and edit data in Excel with both English and Arabic names</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Save the Excel file and import it back using "Import Excel"</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Data Integrity</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Automatic validation of required fields</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Bilingual support with Arabic translations</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <MdCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Duplicate detection and smart updates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'brands' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Car Brands</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{brands.length} total brands</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          English Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Arabic Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {brands.map((brand) => (
                        <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                              {brand.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Car Models</h3>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{models.length} total models</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Brand
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          English Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Arabic Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Slug
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {models.map((model) => (
                        <tr key={model.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {model.brand?.displayNameEn || 'Unknown'}
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
                              {model.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
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
    </div>
  );
}

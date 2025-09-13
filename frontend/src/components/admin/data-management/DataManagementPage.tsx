"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useLanguageDirection } from '@/utils/languageDirection';
import { isAdmin } from '@/utils/auth';
import { useDataManagement } from './hooks/useDataManagement';
import { useSync } from './hooks/useSync';
import { 
  FiDatabase, 
  FiDownload, 
  FiUpload, 
  FiRefreshCw, 
  FiPlus, 
  FiEdit3, 
  FiSave, 
  FiX,
  FiExternalLink,
  FiBarChart,
  FiRefreshCcw,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiMoreHorizontal
} from 'react-icons/fi';

const ITEMS_PER_PAGE = 20;

export const DataManagementPage: React.FC = () => {
  const { t } = useTranslation(['datamanagement', 'common']);
  const router = useRouter();
  const { isRTL } = useLanguageDirection();
  
  // State for pagination and filtering
  const [brandsPage, setBrandsPage] = useState(1);
  const [modelsPage, setModelsPage] = useState(1);
  const [brandsSearch, setBrandsSearch] = useState('');
  const [modelsSearch, setModelsSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('');
  
  // State for editing
  const [editingBrand, setEditingBrand] = useState<number | null>(null);
  const [editingModel, setEditingModel] = useState<number | null>(null);
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddModel, setShowAddModel] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', displayNameEn: '', displayNameAr: '' });
  const [newModel, setNewModel] = useState({ name: '', displayNameEn: '', displayNameAr: '', brandId: '' });

  const {
    loading,
    statistics,
    brands,
    models,
    loadData,
    exportExcel,
    importExcel,
    updateBrand,
    updateModel,
    createBrandWithModel,
    createModel
  } = useDataManagement();

  const {
    syncingCarQuery,
    syncingSyrianCars,
    syncCarQuery,
    syncSyrianCars
  } = useSync(loadData);

  // Check admin access
  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
      return;
    }
  }, [router]);

  // Filtered and paginated data
  const filteredBrands = useMemo(() => {
    return brands.filter(brand => {
      const matchesSearch = !brandsSearch || 
        brand.name.toLowerCase().includes(brandsSearch.toLowerCase()) ||
        brand.displayNameEn.toLowerCase().includes(brandsSearch.toLowerCase()) ||
        brand.displayNameAr.includes(brandsSearch);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && brand.isActive) ||
        (statusFilter === 'inactive' && !brand.isActive);
      
      return matchesSearch && matchesStatus;
    });
  }, [brands, brandsSearch, statusFilter]);

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = !modelsSearch || 
        model.name.toLowerCase().includes(modelsSearch.toLowerCase()) ||
        model.displayNameEn.toLowerCase().includes(modelsSearch.toLowerCase()) ||
        model.displayNameAr.includes(modelsSearch);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && model.isActive) ||
        (statusFilter === 'inactive' && !model.isActive);
      
      const matchesBrand = !selectedBrandFilter || 
        model.brandId.toString() === selectedBrandFilter;
      
      return matchesSearch && matchesStatus && matchesBrand;
    });
  }, [models, modelsSearch, statusFilter, selectedBrandFilter]);

  const paginatedBrands = useMemo(() => {
    const startIndex = (brandsPage - 1) * ITEMS_PER_PAGE;
    return filteredBrands.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBrands, brandsPage]);

  const paginatedModels = useMemo(() => {
    const startIndex = (modelsPage - 1) * ITEMS_PER_PAGE;
    return filteredModels.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredModels, modelsPage]);

  const totalBrandsPages = Math.ceil(filteredBrands.length / ITEMS_PER_PAGE);
  const totalModelsPages = Math.ceil(filteredModels.length / ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setBrandsPage(1);
  }, [brandsSearch, statusFilter]);

  useEffect(() => {
    setModelsPage(1);
  }, [modelsSearch, statusFilter, selectedBrandFilter]);

  // Loading state
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

  const handleSaveBrand = async (brandId: number, updatedData: any) => {
    await updateBrand(brandId, updatedData);
    setEditingBrand(null);
  };

  const handleSaveModel = async (modelId: number, updatedData: any) => {
    await updateModel(modelId, updatedData);
    setEditingModel(null);
  };

  const handleAddBrand = async () => {
    if (!newBrand.name || !newBrand.displayNameEn || !newBrand.displayNameAr) return;
    
    const brandData = { ...newBrand };
    const modelData = { name: 'default', displayNameEn: 'Default', displayNameAr: 'افتراضي' };
    
    await createBrandWithModel(brandData, modelData);
    setNewBrand({ name: '', displayNameEn: '', displayNameAr: '' });
    setShowAddBrand(false);
  };

  const handleAddModel = async () => {
    if (!newModel.name || !newModel.displayNameEn || !newModel.displayNameAr || !newModel.brandId) return;
    
    await createModel(newModel);
    setNewModel({ name: '', displayNameEn: '', displayNameAr: '', brandId: '' });
    setShowAddModel(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FiDatabase className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('datamanagement:title')}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('datamanagement:subtitle')}
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                {t('common:refresh')}
              </button>
              
              <button
                onClick={exportExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <FiDownload className="w-4 h-4" />
                {t('datamanagement:exportExcel')}
              </button>
              
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer">
                <FiUpload className="w-4 h-4" />
                {t('datamanagement:importExcel')}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importExcel(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('datamanagement:totalBrands')}
            value={statistics?.totalBrands || 0}
            icon={FiBarChart}
            color="blue"
          />
          <StatCard
            title={t('datamanagement:activeBrands')}
            value={statistics?.activeBrands || 0}
            icon={FiBarChart}
            color="green"
          />
          <StatCard
            title={t('datamanagement:totalModels')}
            value={statistics?.totalModels || 0}
            icon={FiBarChart}
            color="purple"
          />
          <StatCard
            title={t('datamanagement:activeModels')}
            value={statistics?.activeModels || 0}
            icon={FiBarChart}
            color="green"
          />
        </div>

        {/* Sync Operations */}
        <SyncOperationsCard
          t={t}
          syncingCarQuery={syncingCarQuery}
          syncingSyrianCars={syncingSyrianCars}
          handleSyncCarQuery={syncCarQuery}
          handleSyncSyrianCars={syncSyrianCars}
        />

        {/* Brands Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('datamanagement:brands')} ({filteredBrands.length})
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('datamanagement:searchBrands')}
                  value={brandsSearch}
                  onChange={(e) => setBrandsSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-64"
                />
              </div>
              
              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">{t('datamanagement:allStatuses')}</option>
                <option value="active">{t('datamanagement:active')}</option>
                <option value="inactive">{t('datamanagement:inactive')}</option>
              </select>
              
              <button
                onClick={() => setShowAddBrand(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <FiPlus className="w-4 h-4" />
                {t('datamanagement:addBrand')}
              </button>
            </div>
          </div>

          {/* Add Brand Form */}
          {showAddBrand && (
            <AddBrandForm
              newBrand={newBrand}
              setNewBrand={setNewBrand}
              onSave={handleAddBrand}
              onCancel={() => setShowAddBrand(false)}
              t={t}
            />
          )}

          {/* Brands Table */}
          <BrandsTable
            brands={paginatedBrands}
            editingBrand={editingBrand}
            setEditingBrand={setEditingBrand}
            onSave={handleSaveBrand}
            isRTL={isRTL}
            t={t}
          />

          {/* Pagination */}
          <Pagination
            currentPage={brandsPage}
            totalPages={totalBrandsPages}
            onPageChange={setBrandsPage}
            totalItems={filteredBrands.length}
            itemsPerPage={ITEMS_PER_PAGE}
            isRTL={isRTL}
            t={t}
          />
        </div>

        {/* Models Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('datamanagement:models')} ({filteredModels.length})
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('datamanagement:searchModels')}
                  value={modelsSearch}
                  onChange={(e) => setModelsSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-full sm:w-64"
                />
              </div>
              
              {/* Brand Filter */}
              <select
                value={selectedBrandFilter}
                onChange={(e) => setSelectedBrandFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">{t('datamanagement:allBrands')}</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.displayNameEn}
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => setShowAddModel(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <FiPlus className="w-4 h-4" />
                {t('datamanagement:addModel')}
              </button>
            </div>
          </div>

          {/* Add Model Form */}
          {showAddModel && (
            <AddModelForm
              newModel={newModel}
              setNewModel={setNewModel}
              brands={brands}
              onSave={handleAddModel}
              onCancel={() => setShowAddModel(false)}
              t={t}
            />
          )}

          {/* Models Table */}
          <ModelsTable
            models={paginatedModels}
            brands={brands}
            editingModel={editingModel}
            setEditingModel={setEditingModel}
            onSave={handleSaveModel}
            isRTL={isRTL}
            t={t}
          />

          {/* Pagination */}
          <Pagination
            currentPage={modelsPage}
            totalPages={totalModelsPages}
            onPageChange={setModelsPage}
            totalItems={filteredModels.length}
            itemsPerPage={ITEMS_PER_PAGE}
            isRTL={isRTL}
            t={t}
          />
        </div>
      </div>
    </div>
  );
};

// Reusable Components

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'purple';
}> = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
        </div>
        <Icon className={`w-8 h-8 ${colorClasses[color]}`} />
      </div>
    </div>
  );
};

const SyncOperationsCard: React.FC<any> = ({
  t,
  syncingCarQuery,
  syncingSyrianCars,
  handleSyncCarQuery,
  handleSyncSyrianCars
}) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 mb-8">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
      <FiRefreshCcw className="w-6 h-6" />
      {t('datamanagement:syncOperations')}
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">CarQuery API</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('datamanagement:carQueryDesc')}
        </p>
        <button
          onClick={handleSyncCarQuery}
          disabled={syncingCarQuery}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiExternalLink className={`w-4 h-4 ${syncingCarQuery ? 'animate-spin' : ''}`} />
          {syncingCarQuery ? t('common:syncing') : t('datamanagement:syncCarQuery')}
        </button>
      </div>
      
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">SyrianCars</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('datamanagement:syrianCarsDesc')}
        </p>
        <button
          onClick={handleSyncSyrianCars}
          disabled={syncingSyrianCars}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FiExternalLink className={`w-4 h-4 ${syncingSyrianCars ? 'animate-spin' : ''}`} />
          {syncingSyrianCars ? t('common:syncing') : t('datamanagement:syncSyrianCars')}
        </button>
      </div>
    </div>
  </div>
);

const AddBrandForm: React.FC<any> = ({ newBrand, setNewBrand, onSave, onCancel, t }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
    <h3 className="font-medium text-gray-900 dark:text-white mb-4">{t('datamanagement:addNewBrand')}</h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
      <input
        type="text"
        placeholder={t('datamanagement:brandName')}
        value={newBrand.name}
        onChange={(e) => setNewBrand({...newBrand, name: e.target.value})}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
      <input
        type="text"
        placeholder={t('datamanagement:displayNameEn')}
        value={newBrand.displayNameEn}
        onChange={(e) => setNewBrand({...newBrand, displayNameEn: e.target.value})}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
      <input
        type="text"
        placeholder={t('datamanagement:displayNameAr')}
        value={newBrand.displayNameAr}
        onChange={(e) => setNewBrand({...newBrand, displayNameAr: e.target.value})}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
    </div>
    <div className="flex gap-3">
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <FiSave className="w-4 h-4" />
        {t('common:save')}
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        <FiX className="w-4 h-4" />
        {t('common:cancel')}
      </button>
    </div>
  </div>
);

const AddModelForm: React.FC<any> = ({ newModel, setNewModel, brands, onSave, onCancel, t }) => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
    <h3 className="font-medium text-gray-900 dark:text-white mb-4">{t('datamanagement:addNewModel')}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      <select
        value={newModel.brandId}
        onChange={(e) => setNewModel({...newModel, brandId: e.target.value})}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">{t('datamanagement:selectBrand')}</option>
        {brands.map((brand: any) => (
          <option key={brand.id} value={brand.id}>
            {brand.displayNameEn}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder={t('datamanagement:modelName')}
        value={newModel.name}
        onChange={(e) => setNewModel({...newModel, name: e.target.value})}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
      <input
        type="text"
        placeholder={t('datamanagement:displayNameEn')}
        value={newModel.displayNameEn}
        onChange={(e) => setNewModel({...newModel, displayNameEn: e.target.value})}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
      <input
        type="text"
        placeholder={t('datamanagement:displayNameAr')}
        value={newModel.displayNameAr}
        onChange={(e) => setNewModel({...newModel, displayNameAr: e.target.value})}
        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      />
    </div>
    <div className="flex gap-3">
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <FiSave className="w-4 h-4" />
        {t('common:save')}
      </button>
      <button
        onClick={onCancel}
        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        <FiX className="w-4 h-4" />
        {t('common:cancel')}
      </button>
    </div>
  </div>
);

const BrandsTable: React.FC<any> = ({ brands, editingBrand, setEditingBrand, onSave, isRTL, t }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-600">
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:name')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:displayNameEn')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:displayNameAr')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:status')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:actions')}
          </th>
        </tr>
      </thead>
      <tbody>
        {brands.map((brand: any) => (
          <BrandRow
            key={brand.id}
            brand={brand}
            isEditing={editingBrand === brand.id}
            onEdit={() => setEditingBrand(brand.id)}
            onSave={onSave}
            onCancel={() => setEditingBrand(null)}
            isRTL={isRTL}
            t={t}
          />
        ))}
      </tbody>
    </table>
  </div>
);

const ModelsTable: React.FC<any> = ({ models, brands, editingModel, setEditingModel, onSave, isRTL, t }) => (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-600">
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:brand')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:name')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:displayNameEn')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:displayNameAr')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:status')}
          </th>
          <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-4 font-medium text-gray-900 dark:text-white`}>
            {t('datamanagement:actions')}
          </th>
        </tr>
      </thead>
      <tbody>
        {models.map((model: any) => (
          <ModelRow
            key={model.id}
            model={model}
            brands={brands}
            isEditing={editingModel === model.id}
            onEdit={() => setEditingModel(model.id)}
            onSave={onSave}
            onCancel={() => setEditingModel(null)}
            isRTL={isRTL}
            t={t}
          />
        ))}
      </tbody>
    </table>
  </div>
);

const Pagination: React.FC<any> = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, isRTL, t }) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {t('common:showingResults', { start: startItem, end: endItem, total: totalItems })}
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {isRTL ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>
        
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 rounded-lg border ${
              page === currentPage
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
            } ${page === '...' ? 'cursor-default' : 'cursor-pointer'}`}
          >
            {page === '...' ? <FiMoreHorizontal className="w-4 h-4" /> : page}
          </button>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          {isRTL ? <FiChevronLeft className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// Brand Row Component (same as before but optimized)
const BrandRow: React.FC<any> = ({ brand, isEditing, onEdit, onSave, onCancel, isRTL, t }) => {
  const [editData, setEditData] = useState({
    name: brand.name,
    displayNameEn: brand.displayNameEn,
    displayNameAr: brand.displayNameAr,
    isActive: brand.isActive
  });

  const handleSave = () => {
    onSave(brand.id, editData);
  };

  if (isEditing) {
    return (
      <tr className="border-b border-gray-100 dark:border-gray-700">
        <td className="py-3 px-4">
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
        </td>
        <td className="py-3 px-4">
          <input
            type="text"
            value={editData.displayNameEn}
            onChange={(e) => setEditData({...editData, displayNameEn: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
        </td>
        <td className="py-3 px-4">
          <input
            type="text"
            value={editData.displayNameAr}
            onChange={(e) => setEditData({...editData, displayNameAr: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
        </td>
        <td className="py-3 px-4">
          <select
            value={editData.isActive ? 'true' : 'false'}
            onChange={(e) => setEditData({...editData, isActive: e.target.value === 'true'})}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="true">{t('datamanagement:active')}</option>
            <option value="false">{t('datamanagement:inactive')}</option>
          </select>
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
            >
              <FiSave className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">{brand.name}</td>
      <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">{brand.displayNameEn}</td>
      <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">{brand.displayNameAr}</td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          brand.isActive 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {brand.isActive ? t('datamanagement:active') : t('datamanagement:inactive')}
        </span>
      </td>
      <td className="py-3 px-4">
        <button
          onClick={onEdit}
          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
        >
          <FiEdit3 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

// Model Row Component (same as before but optimized)
const ModelRow: React.FC<any> = ({ model, brands, isEditing, onEdit, onSave, onCancel, isRTL, t }) => {
  const [editData, setEditData] = useState({
    name: model.name,
    displayNameEn: model.displayNameEn,
    displayNameAr: model.displayNameAr,
    brandId: model.brandId,
    isActive: model.isActive
  });

  const handleSave = () => {
    onSave(model.id, editData);
  };

  if (isEditing) {
    return (
      <tr className="border-b border-gray-100 dark:border-gray-700">
        <td className="py-3 px-4">
          <select
            value={editData.brandId}
            onChange={(e) => setEditData({...editData, brandId: parseInt(e.target.value)})}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            {brands.map((brand: any) => (
              <option key={brand.id} value={brand.id}>
                {brand.displayNameEn}
              </option>
            ))}
          </select>
        </td>
        <td className="py-3 px-4">
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({...editData, name: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
        </td>
        <td className="py-3 px-4">
          <input
            type="text"
            value={editData.displayNameEn}
            onChange={(e) => setEditData({...editData, displayNameEn: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
        </td>
        <td className="py-3 px-4">
          <input
            type="text"
            value={editData.displayNameAr}
            onChange={(e) => setEditData({...editData, displayNameAr: e.target.value})}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
        </td>
        <td className="py-3 px-4">
          <select
            value={editData.isActive ? 'true' : 'false'}
            onChange={(e) => setEditData({...editData, isActive: e.target.value === 'true'})}
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="true">{t('datamanagement:active')}</option>
            <option value="false">{t('datamanagement:inactive')}</option>
          </select>
        </td>
        <td className="py-3 px-4">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded"
            >
              <FiSave className="w-4 h-4" />
            </button>
            <button
              onClick={onCancel}
              className="p-1 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">
        {model.brand?.displayNameEn || 'Unknown Brand'}
      </td>
      <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">{model.name}</td>
      <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">{model.displayNameEn}</td>
      <td className="py-3 px-4 text-gray-900 dark:text-white text-sm">{model.displayNameAr}</td>
      <td className="py-3 px-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          model.isActive 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {model.isActive ? t('datamanagement:active') : t('datamanagement:inactive')}
        </span>
      </td>
      <td className="py-3 px-4">
        <button
          onClick={onEdit}
          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
        >
          <FiEdit3 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
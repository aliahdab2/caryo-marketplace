"use client";

import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageDirection } from '@/utils/languageDirection';
import { MdDownload, MdUpload, MdAdd, MdRefresh } from 'react-icons/md';
import { CarBrand, CarModel, UpdateBrandData, UpdateModelData, CreateBrandData, CreateModelData } from '../../types';
import { BrandsTable } from './BrandsTable';
import { ModelsTable } from './ModelsTable';
import { AddBrandModal } from './AddBrandModal';
import { AddModelModal } from './AddModelModal';

interface ManualManagementProps {
  brands: CarBrand[];
  models: CarModel[];
  loading: boolean;
  onExport: () => Promise<boolean>;
  onImport: (file: File) => Promise<boolean>;
  onRefresh: () => void;
  onUpdateBrand: (brandId: number, data: UpdateBrandData) => Promise<boolean>;
  onUpdateModel: (modelId: number, data: UpdateModelData) => Promise<boolean>;
  onCreateBrandWithModel: (brandData: CreateBrandData, modelData: CreateModelData) => Promise<boolean>;
  onCreateModel: (data: CreateModelData) => Promise<boolean>;
}

export const ManualManagement: React.FC<ManualManagementProps> = ({
  brands,
  models,
  loading,
  onExport,
  onImport,
  onRefresh,
  onUpdateBrand,
  onUpdateModel,
  onCreateBrandWithModel,
  onCreateModel
}) => {
  const { t } = useTranslation(['datamanagement']);
  const { isRTL, flexClass } = useLanguageDirection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [showAddModelModal, setShowAddModelModal] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    await onExport();
    setExporting(false);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    await onImport(file);
    setImporting(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6">
      <div className={`flex flex-col lg:${flexClass} lg:items-center lg:justify-between gap-6 mb-6`}>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('datamanagement:manualManagement')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('datamanagement:manualManagementDesc')}
          </p>
        </div>
        
        <div className={`flex flex-wrap items-center ${isRTL ? 'gap-x-reverse' : ''} gap-3`}>
          <button
            onClick={handleExport}
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
            onClick={() => setShowAddBrandModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <MdAdd className="w-4 h-4" />
            {t('datamanagement:addBrandWithModel')}
          </button>
          
          <button
            onClick={() => setShowAddModelModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <MdAdd className="w-4 h-4" />
            {t('datamanagement:addModel')}
          </button>
          
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MdRefresh className="w-4 h-4" />
            {t('datamanagement:refresh')}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleImport}
        className="hidden"
      />

      {/* Brands Table */}
      <div className="mb-8">
        <BrandsTable 
          brands={brands}
          onUpdate={onUpdateBrand}
        />
      </div>

      {/* Models Table */}
      <div>
        <ModelsTable 
          models={models}
          brands={brands}
          onUpdate={onUpdateModel}
        />
      </div>

      {/* Modals */}
      <AddBrandModal
        isOpen={showAddBrandModal}
        onClose={() => setShowAddBrandModal(false)}
        onSave={onCreateBrandWithModel}
        brands={brands}
        models={models}
      />

      <AddModelModal
        isOpen={showAddModelModal}
        onClose={() => setShowAddModelModal(false)}
        onSave={onCreateModel}
        brands={brands}
        models={models}
      />
    </div>
  );
};

"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CarBrand, CarModel, AddForm, CreateModelData } from '../../types';
import { useValidation } from '../../hooks/useValidation';
import { useToastHelpers } from '@/components/ui/ToastProvider';

interface AddModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateModelData) => Promise<boolean>;
  brands: CarBrand[];
  models: CarModel[];
}

export const AddModelModal: React.FC<AddModelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  brands,
  models
}) => {
  const { t } = useTranslation(['datamanagement', 'common']);
  const [form, setForm] = useState<AddForm>({});
  const [saving, setSaving] = useState(false);

  const {
    validateModelForm,
    checkModelDuplicate
  } = useValidation(brands, models);
  const { showError } = useToastHelpers();

  const handleSave = async () => {
    // Validate model form
    const modelError = validateModelForm(form);
    if (modelError) {
      showError(modelError);
      return;
    }

    // Check for duplicates
    if (form.brandId) {
      const duplicateError = checkModelDuplicate(form, form.brandId);
      if (duplicateError) {
        showError(duplicateError);
        return;
      }
    }

    setSaving(true);

    const modelData: CreateModelData = {
      name: form.name!,
      displayNameEn: form.displayNameEn!,
      displayNameAr: form.displayNameAr!,
      brandId: form.brandId!
    };

    const success = await onSave(modelData);
    setSaving(false);

    if (success) {
      setForm({});
      onClose();
    }
  };

  const handleClose = () => {
    setForm({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
                value={form.brandId || ''}
                onChange={(e) => setForm({...form, brandId: e.target.value})}
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
                value={form.name || ''}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder={t('datamanagement:namePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('datamanagement:englishName')}
              </label>
              <input
                type="text"
                value={form.displayNameEn || ''}
                onChange={(e) => setForm({...form, displayNameEn: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder={t('datamanagement:englishNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('datamanagement:arabicName')}
              </label>
              <input
                type="text"
                value={form.displayNameAr || ''}
                onChange={(e) => setForm({...form, displayNameAr: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder={t('datamanagement:arabicNamePlaceholder')}
                dir="rtl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500"
            >
              {t('datamanagement:cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('common:saving') : t('datamanagement:save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

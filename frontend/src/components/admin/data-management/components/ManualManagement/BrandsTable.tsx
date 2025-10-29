"use client";

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CarBrand, EditForm, UpdateBrandData } from '../../types';

interface BrandsTableProps {
  brands: CarBrand[];
  onUpdate: (brandId: number, data: UpdateBrandData) => Promise<boolean>;
}

export const BrandsTable: React.FC<BrandsTableProps> = ({
  brands,
  onUpdate
}) => {
  const { t } = useTranslation(['datamanagement']);
  const [editingBrand, setEditingBrand] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({});

  const startEdit = (brand: CarBrand) => {
    setEditingBrand(brand.id);
    setEditForm({
      name: brand.name,
      displayNameEn: brand.displayNameEn,
      displayNameAr: brand.displayNameAr,
      isActive: brand.isActive
    });
  };

  const cancelEdit = () => {
    setEditingBrand(null);
    setEditForm({});
  };

  const saveEdit = async (brandId: number) => {
    const success = await onUpdate(brandId, editForm);
    if (success) {
      cancelEdit();
    }
  };

  return (
    <>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        {t('datamanagement:brands')}
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('datamanagement:name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('datamanagement:englishName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('datamanagement:arabicName')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('datamanagement:status')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t('datamanagement:actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingBrand === brand.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <span className="text-sm text-gray-900 dark:text-white">{brand.name}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingBrand === brand.id ? (
                    <input
                      type="text"
                      value={editForm.displayNameEn || ''}
                      onChange={(e) => setEditForm({...editForm, displayNameEn: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  ) : (
                    <span className="text-sm text-gray-900 dark:text-white">{brand.displayNameEn}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingBrand === brand.id ? (
                    <input
                      type="text"
                      value={editForm.displayNameAr || ''}
                      onChange={(e) => setEditForm({...editForm, displayNameAr: e.target.value})}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      dir="rtl"
                    />
                  ) : (
                    <span className="text-sm text-gray-900 dark:text-white" dir="rtl">{brand.displayNameAr}</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editingBrand === brand.id ? (
                    <select
                      value={editForm.isActive ? 'true' : 'false'}
                      onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'true'})}
                      className="px-2 py-1 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="true">{t('datamanagement:active')}</option>
                      <option value="false">{t('datamanagement:inactive')}</option>
                    </select>
                  ) : (
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      brand.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {brand.isActive ? t('datamanagement:active') : t('datamanagement:inactive')}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingBrand === brand.id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(brand.id)}
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
                  ) : (
                    <button
                      onClick={() => startEdit(brand)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      {t('datamanagement:edit')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

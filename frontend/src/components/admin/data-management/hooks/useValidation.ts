"use client";

import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { AddForm, CarBrand, CarModel } from '../types';

export const useValidation = (brands: CarBrand[], models: CarModel[]) => {
  const { t } = useTranslation(['datamanagement']);

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

  const validateModelFormForNewBrand = useCallback((form: AddForm): string | null => {
    if (!form.name?.trim()) return t('datamanagement:nameRequired');
    if (!form.displayNameEn?.trim()) return t('datamanagement:englishNameRequired');
    if (!form.displayNameAr?.trim()) return t('datamanagement:arabicNameRequired');
    return null;
  }, [t]);

  const checkBrandDuplicate = useCallback((form: AddForm): string | null => {
    const nameExists = brands.some(brand => 
      brand.name.toLowerCase() === form.name?.toLowerCase()
    );
    if (nameExists) {
      return t('datamanagement:brandNameExists', { name: form.name });
    }

    const englishExists = brands.some(brand => 
      brand.displayNameEn.toLowerCase() === form.displayNameEn?.toLowerCase()
    );
    if (englishExists) {
      return t('datamanagement:brandEnglishNameExists', { name: form.displayNameEn });
    }

    const arabicExists = brands.some(brand => 
      brand.displayNameAr === form.displayNameAr
    );
    if (arabicExists) {
      return t('datamanagement:brandArabicNameExists', { name: form.displayNameAr });
    }

    return null;
  }, [brands, t]);

  const checkModelDuplicate = useCallback((form: AddForm, brandId: string): string | null => {
    const brandName = brands.find(b => b.id.toString() === brandId)?.displayNameEn || t('datamanagement:thisBrand');
    
    const nameExists = models.some(model => 
      model.brandId.toString() === brandId && 
      model.name.toLowerCase() === form.name?.toLowerCase()
    );
    if (nameExists) {
      return t('datamanagement:modelNameExists', { name: form.name, brand: brandName });
    }

    const englishExists = models.some(model => 
      model.brandId.toString() === brandId && 
      model.displayNameEn.toLowerCase() === form.displayNameEn?.toLowerCase()
    );
    if (englishExists) {
      return t('datamanagement:modelEnglishNameExists', { name: form.displayNameEn, brand: brandName });
    }

    const arabicExists = models.some(model => 
      model.brandId.toString() === brandId && 
      model.displayNameAr === form.displayNameAr
    );
    if (arabicExists) {
      return t('datamanagement:modelArabicNameExists', { name: form.displayNameAr, brand: brandName });
    }

    return null;
  }, [models, brands, t]);

  return {
    validateBrandForm,
    validateModelForm,
    validateModelFormForNewBrand,
    checkBrandDuplicate,
    checkModelDuplicate
  };
};

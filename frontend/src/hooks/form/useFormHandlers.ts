"use client";

import { useCallback } from 'react';
import { ListingFormData } from '@/types/listings';
import { FormErrors } from '@/types/forms';

type IdSlugItem = { id: number; slug?: string };

export type UseFormHandlersParams = {
  setFormData: React.Dispatch<React.SetStateAction<ListingFormData>>;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  carMakes: Array<IdSlugItem & { name?: string }>;
  governorates: Array<IdSlugItem>;
  locations: Array<IdSlugItem & { displayNameEn?: string; displayNameAr?: string }>;
  loadCarModels?: (makeId: string) => Promise<unknown>;
  loadLocations?: (governorateSlug: string) => Promise<unknown>;
};

export type UseFormHandlersReturn = {
  handleFieldChange: (field: keyof ListingFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  createDropdownHandler: (
    slugField: keyof ListingFormData,
    idField: keyof ListingFormData,
    dataArray: Array<IdSlugItem>
  ) => (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleMakeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleGovernorateChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export function useFormHandlers(params: UseFormHandlersParams): UseFormHandlersReturn {
  const { setFormData, setFormErrors, carMakes, governorates, locations: _locations, loadCarModels, loadLocations } = params;

  const handleFieldChange = useCallback((field: keyof ListingFormData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setFormData(prev => ({ ...prev, [field]: value }));
    };
  }, [setFormData]);

  const createDropdownHandler = useCallback((
    slugField: keyof ListingFormData,
    idField: keyof ListingFormData,
    dataArray: Array<IdSlugItem>
  ) => {
    return (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      const selectedItem = value ? dataArray.find(item => item.slug === value) : null;
      setFormData(prev => ({
        ...prev,
        [slugField]: value,
        [idField]: selectedItem?.id
      }));
    };
  }, [setFormData]);

  const handleMakeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedMake = value ? carMakes.find(make => make.slug === value) : null;
    setFormData(prev => ({
      ...prev,
      make: value,
      makeId: selectedMake?.id,
      ...(value !== prev.make ? { model: '', modelId: undefined } : {})
    }));

    if (selectedMake && loadCarModels) {
      loadCarModels(selectedMake.id.toString()).catch(() => {
        setFormErrors(prev => ({ ...prev, model: 'Failed to load car models. Please try again.' }));
      });
    }
  }, [carMakes, loadCarModels, setFormData, setFormErrors]);

  const handleGovernorateChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const selectedGovernorate = value ? governorates.find(gov => gov.slug === value) : null;
    setFormData(prev => ({
      ...prev,
      governorateSlug: value,
      governorateId: selectedGovernorate?.id,
      ...(value !== prev.governorateSlug ? { locationSlug: '', locationId: undefined } : {})
    }));

    if (value && loadLocations) {
      loadLocations(value).catch(() => {
        setFormErrors(prev => ({ ...prev, locationSlug: 'Failed to load locations. Please try again.' }));
      });
    }
  }, [governorates, loadLocations, setFormData, setFormErrors]);

  return {
    handleFieldChange,
    createDropdownHandler,
    handleMakeChange,
    handleGovernorateChange,
  };
}



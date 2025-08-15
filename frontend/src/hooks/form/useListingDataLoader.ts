"use client";

import { useEffect } from 'react';
import { ListingDataService } from '@/services/ListingDataService';
import { ListingFormData } from '@/types/listings';

type UseListingDataLoaderParams = {
  mode: 'create' | 'edit';
  listingId?: string | number;
  autoLoad: boolean;
  ready: boolean;
  setFormData: React.Dispatch<React.SetStateAction<ListingFormData>>;
  setIsLoadingData: (v: boolean) => void;
  setLoadError: (msg: string | null) => void;
  onAfterLoad?: (data: Partial<ListingFormData>) => void;
};

/**
 * Extracts the two data-loading effects from ListingWizard to a reusable hook.
 * Keeps behavior identical: initial auto-load and edit-mode loading.
 */
export function useListingDataLoader(params: UseListingDataLoaderParams) {
  const { mode, listingId, autoLoad, ready, setFormData, setIsLoadingData, setLoadError, onAfterLoad } = params;

  useEffect(() => {
    const loadData = async () => {
      if (!autoLoad || !ready) return;
      try {
        setIsLoadingData(true);
        setLoadError(null);
        const idParam = listingId !== undefined ? String(listingId) : undefined;
        const loadedData = await ListingDataService.loadFormData(mode, idParam);
        setFormData(prevFormData => ({
          ...prevFormData,
          ...loadedData,
          images: loadedData.images || prevFormData.images || [],
          videos: loadedData.videos || prevFormData.videos || [],
          videoUrls: loadedData.videoUrls || prevFormData.videoUrls || [],
          existingImageUrls: loadedData.existingImageUrls || prevFormData.existingImageUrls || [],
          existingVideoUrls: loadedData.existingVideoUrls || prevFormData.existingVideoUrls || [],
          features: loadedData.features || prevFormData.features || []
        }));
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load listing data');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [mode, listingId, autoLoad, ready, setFormData, setIsLoadingData, setLoadError]);

  useEffect(() => {
    if (!(autoLoad && mode === 'edit' && listingId && ready)) return;
    const loadEditData = async () => {
      try {
        setIsLoadingData(true);
        setLoadError(null);
        const idParam = listingId !== undefined ? String(listingId) : undefined;
        const data = await ListingDataService.loadFormData(mode, idParam);
        setFormData(prev => ({ ...prev, ...data }));
        if (onAfterLoad) onAfterLoad(data);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Failed to load listing data');
      } finally {
        setIsLoadingData(false);
      }
    };
    loadEditData();
  }, [autoLoad, mode, listingId, ready, setFormData, setIsLoadingData, setLoadError, onAfterLoad]);
}



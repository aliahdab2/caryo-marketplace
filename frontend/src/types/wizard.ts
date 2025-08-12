/**
 * Wizard and form component types
 */

import { ListingFormData } from './listings';

export interface ReferenceItem {
  id: number;
  name: string;
  displayNameEn: string;
  displayNameAr: string;
  slug: string;
}

export type Transmission = ReferenceItem;
export type FuelType = ReferenceItem;

export interface ListingWizardProps {
  mode: 'create' | 'edit';
  listingId?: string;
  initialData?: Partial<ListingFormData>;
  autoLoad?: boolean;
  autoSave?: boolean;
  onSuccess?: (listingId: string) => void;
  onCancel?: () => void;
}

export interface ErrorMessageProps {
  error?: string;
  id?: string;
  className?: string;
}

export interface UploadProgressProps {
  progress: number;
  fileName: string;
  isComplete: boolean;
}

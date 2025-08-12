/**
 * Auto-save related types and interfaces
 */

import { ListingFormData } from './listings';

export interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number;
  onSave?: (draftId: string) => void;
  onError?: (error: Error) => void;
  mode?: 'create' | 'edit';
}

export interface UseAutoSaveReturn {
  draftId: string | null;
  lastSaved: Date | null;
  isSaving: boolean;
  saveNow: () => void;
  deleteDraft: () => void;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

export interface DraftData {
  id: string;
  userId?: string;
  formData: Partial<ListingFormData>;
  lastSaved: string;
  title: string;
  autoSaveEnabled: boolean;
}

export interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date | null;
  className?: string;
}

/**
 * Auto-Save Hook
 * 
 * Provides auto-save functionality for forms.
 * Similar to Google Docs, Notion, and other modern web apps.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { ListingFormData } from '@/types/listings';
import { UseAutoSaveOptions, UseAutoSaveReturn } from '@/types/autoSave';
import { DraftService } from '@/services/DraftService';

export function useAutoSave(
  formData: Partial<ListingFormData>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveReturn {
  const {
    enabled = true,
    interval = DraftService.getAutoSaveInterval(),
    onSave,
    onError,
    mode = 'create'
  } = options;

  const [draftId, setDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastFormDataRef = useRef<string>('');

  // Initialize draft ID for create mode
  useEffect(() => {
    if (mode === 'create' && enabled && !draftId) {
      const newDraftId = DraftService.generateDraftId();
      setDraftId(newDraftId);
      console.log('[useAutoSave] Initialized draft ID:', newDraftId);
    }
  }, [mode, enabled, draftId]);

  // Save function
  const saveDraft = useCallback(async () => {
    console.log('[useAutoSave] saveDraft called:', { enabled, draftId, mode });
    
    if (!enabled || !draftId || mode === 'edit') {
      console.log('[useAutoSave] Skipping save:', { enabled, draftId, mode });
      return;
    }

    try {
      setIsSaving(true);
      setAutoSaveStatus('saving');
      console.log('[useAutoSave] Starting save process...');

      // Check if form data is worth saving
      const isWorthy = DraftService.isDraftWorthy(formData);
      console.log('[useAutoSave] Draft worthy check result:', isWorthy);
      
      if (!isWorthy) {
        console.log('[useAutoSave] Form data not worthy of saving');
        setAutoSaveStatus('idle');
        setIsSaving(false);
        return;
      }

      // Save the draft
      DraftService.saveDraft(draftId, formData, formData.title);
      
      const now = new Date();
      setLastSaved(now);
      setAutoSaveStatus('saved');
      
      onSave?.(draftId);
      
      console.log('[useAutoSave] Draft saved successfully:', draftId);
    } catch (error) {
      console.error('[useAutoSave] Error saving draft:', error);
      setAutoSaveStatus('error');
      onError?.(error as Error);
    } finally {
      setIsSaving(false);
    }
  }, [enabled, draftId, formData, mode, onSave, onError]);

  // Auto-save effect
  useEffect(() => {
    console.log('[useAutoSave] Effect triggered:', { enabled, mode, draftId, hasFormData: !!formData });
    
    if (!enabled || mode === 'edit') {
      console.log('[useAutoSave] Skipping auto-save:', { enabled, mode });
      return;
    }

    const currentFormData = JSON.stringify(formData);
    
    // Only save if form data has changed
    if (currentFormData !== lastFormDataRef.current) {
      console.log('[useAutoSave] Form data changed, scheduling save in', interval, 'ms');
      lastFormDataRef.current = currentFormData;
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout for auto-save
      timeoutRef.current = setTimeout(() => {
        console.log('[useAutoSave] Auto-save timeout triggered');
        saveDraft();
      }, interval);
    } else {
      console.log('[useAutoSave] Form data unchanged, skipping save');
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, enabled, interval, mode, saveDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  // Manual save function
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveDraft();
  }, [saveDraft]);

  // Delete draft function
  const deleteDraft = useCallback(() => {
    if (draftId) {
      DraftService.deleteDraft(draftId);
      setDraftId(null);
      setLastSaved(null);
      setAutoSaveStatus('idle');
      console.log('[useAutoSave] Draft deleted:', draftId);
    }
  }, [draftId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    draftId,
    lastSaved,
    isSaving,
    saveNow,
    deleteDraft,
    autoSaveStatus
  };
}

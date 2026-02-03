import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface AutoSaveOptions<T = unknown> {
  key: string;
  data: T;
  delay?: number;
  enabled?: boolean;
  onSave?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface AutoSaveResult {
  isSaving: boolean;
  lastSaved: Date | null;
  save: () => void;
  clear: () => void;
}

/**
 * Hook for automatic saving of form data to localStorage
 * 
 * @example
 * ```tsx
 * const { isSaving, lastSaved, save, clear } = useAutoSave({
 *   key: 'signup-form',
 *   data: formData,
 *   delay: 2000,
 *   enabled: true
 * });
 * ```
 */
export function useAutoSave<T = unknown>({
  key,
  data,
  delay = 2000,
  enabled = true,
  onSave,
  onError
}: AutoSaveOptions<T>): AutoSaveResult {
  const { t } = useTranslation('common');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastSavedRef = useRef<Date | null>(null);
  const isSavingRef = useRef(false);
  const previousDataRef = useRef<string>('');

  const saveToStorage = useCallback(async () => {
    if (!enabled || !key) return;

    try {
      isSavingRef.current = true;
      const serializedData = JSON.stringify(data);
      
      // Only save if data has actually changed
      if (serializedData === previousDataRef.current) {
        isSavingRef.current = false;
        return;
      }

      localStorage.setItem(key, serializedData);
      previousDataRef.current = serializedData;
      lastSavedRef.current = new Date();
      
      if (onSave) {
        onSave(data);
      }

      // Show subtle save indicator
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('autosave', {
          detail: { 
            key, 
            timestamp: lastSavedRef.current,
            message: t('autoSaved', 'Auto-saved')
          }
        });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (onError) {
        onError(error as Error);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [key, data, enabled, onSave, onError, t]);

  const debouncedSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(saveToStorage, delay);
  }, [saveToStorage, delay]);

  const save = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    saveToStorage();
  }, [saveToStorage]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    try {
      localStorage.removeItem(key);
      previousDataRef.current = '';
      lastSavedRef.current = null;
    } catch (error) {
      console.error('Failed to clear auto-save data:', error);
    }
  }, [key]);

  // Auto-save when data changes
  useEffect(() => {
    if (enabled && data) {
      debouncedSave();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, enabled, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving: isSavingRef.current,
    lastSaved: lastSavedRef.current,
    save,
    clear
  };
}

export default useAutoSave;
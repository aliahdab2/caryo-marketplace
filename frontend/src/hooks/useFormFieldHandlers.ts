import { useCallback } from 'react';

/**
 * Custom hook for handling dependent field changes in forms
 * Reduces duplication in form change handlers
 */
export function useFormFieldHandlers() {
  /**
   * Generic handler for dependent field changes with optional ID lookup
   */
  const createDependentFieldHandler = useCallback(<T extends { id: number; slug: string }>(
    fieldName: string,
    items: T[],
    loadFunction: (id: string) => Promise<any>,
    clearFunction: () => void,
    options?: {
      idField?: string;
      onSuccess?: (data: any) => void;
      onError?: (error: Error) => void;
      logger?: any;
      t?: (key: string) => string;
    }
  ) => {
    return (value: string) => {
      if (value && value.trim() !== '') {
        // Find the item by slug to get its ID
        const selectedItem = items.find(item => item.slug === value);
        if (selectedItem) {
          loadFunction(selectedItem.id.toString())
            .then((data) => {
              options?.logger?.debug(`Loaded data for ${fieldName}: ${JSON.stringify(data)}`);
              options?.onSuccess?.(data);
            })
            .catch(error => {
              options?.logger?.error(`Failed to load data for ${fieldName}:`, error);
              options?.onError?.(new Error(options?.t?.('common:failedToLoadData') || 'Failed to load data'));
            });
        } else {
          options?.logger?.warn(`${fieldName} not found for slug: ${value}`);
          clearFunction();
        }
      } else {
        clearFunction();
      }
    };
  }, []);

  /**
   * Generic handler for simple dependent field changes (no ID lookup needed)
   */
  const createSimpleDependentFieldHandler = useCallback((
    fieldName: string,
    loadFunction: (value: string) => Promise<any>,
    clearFunction: () => void,
    options?: {
      onSuccess?: (data: any) => void;
      onError?: (error: Error) => void;
      logger?: any;
      t?: (key: string) => string;
    }
  ) => {
    return (value: string) => {
      if (value && value.trim() !== '') {
        loadFunction(value)
          .then((data) => {
            options?.logger?.debug(`Loaded data for ${fieldName}: ${JSON.stringify(data)}`);
            options?.onSuccess?.(data);
          })
          .catch(error => {
            options?.logger?.error(`Failed to load data for ${fieldName}:`, error);
            options?.onError?.(new Error(options?.t?.('common:failedToLoadData') || 'Failed to load data'));
          });
      } else {
        clearFunction();
      }
    };
  }, []);

  return {
    createDependentFieldHandler,
    createSimpleDependentFieldHandler
  };
}

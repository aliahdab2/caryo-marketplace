"use client";

import { useEffect, useState, useMemo } from 'react';
import { useTranslation, UseTranslationResponse } from 'react-i18next';

/**
 * Custom hook for lazy loading translation namespaces and providing the t function.
 *
 * This hook dynamically loads translation namespaces when a component mounts
 * and then provides the translation function (`t`) and readiness state (`ready`).
 *
 * @param namespaces - Single namespace string or array of namespace strings to load
 * @param debug - Whether to log debugging information (defaults to development mode)
 * @returns An object containing the `t` function and `ready` state from `react-i18next`.
 */
export function useLazyTranslation(
  namespaces: string | string[], 
  debug: boolean = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_I18N_DEBUG !== 'false'
): UseTranslationResponse<string | string[], string> {
  const [namespacesLoaded, setNamespacesLoaded] = useState(false);
  
  // Use useMemo to avoid recreating this array on every render
  const normalizedNamespaces = useMemo(() => {
    return Array.isArray(namespaces) ? namespaces : [namespaces];
  }, [namespaces]);

  // Standard useTranslation hook from react-i18next
  // We pass the namespaces here, but it will only effectively use them once they are loaded.
  const { t, i18n: i18nInstance, ready } = useTranslation(normalizedNamespaces);

  useEffect(() => {
    let isMounted = true;
    
    const loadAndSetNamespaces = async () => {
      try {
        if (debug) {
          const notLoadedNamespaces = normalizedNamespaces.filter(
            ns => !i18nInstance.hasResourceBundle?.(i18nInstance.language, ns)
          );
          
          if (notLoadedNamespaces.length > 0) {
            console.log(
              `%c[i18n] Loading %c${notLoadedNamespaces.join(', ')} %c(${i18nInstance.language})`,
              'color: #FF9800; font-weight: bold',
              'color: #2196F3; font-weight: bold',
              'color: #9E9E9E'
            );
          }
        }
        
        // Ensure i18next is initialized before loading namespaces
        if (!i18nInstance.isInitialized) {
          await new Promise<void>((resolve) => {
            i18nInstance.on('initialized', () => resolve());
          });
        }

        await i18nInstance.loadNamespaces(normalizedNamespaces);
        if (isMounted) {
          setNamespacesLoaded(true);
        }
        
        if (debug && normalizedNamespaces.length > 0) {
          console.log(
            `%c[i18n] Loaded namespaces: %c${normalizedNamespaces.join(', ')} %c(${i18nInstance.language})`,
            'color: #4CAF50; font-weight: bold',
            'color: #2196F3; font-weight: bold',
            'color: #9E9E9E'
          );
        }
      } catch (error) {
        console.error('[i18n] Error loading translation namespaces:', error);
        if (isMounted) {
          setNamespacesLoaded(false); // Indicate failure
        }
      }
    };
    
    loadAndSetNamespaces();
    
    if (debug) {
      // Throttle the debug report to reduce console noise
      const timeoutId = setTimeout(() => {
        console.log(
          `%c[i18n] Translation status: %c${i18nInstance.language} %c(${normalizedNamespaces.join(', ')})`,
          'color: #673AB7; font-weight: bold',
          'color: #4CAF50; font-weight: bold',
          'color: #9E9E9E'
        );
      }, 1000);
      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [debug, i18nInstance, normalizedNamespaces]);

  // Return the t function and a ready state that depends on both i18next's ready and our namespace loading
  return {
    t,
    i18n: i18nInstance,
    ready: ready && namespacesLoaded,
  } as UseTranslationResponse<string | string[], string>; 
}

export default useLazyTranslation;

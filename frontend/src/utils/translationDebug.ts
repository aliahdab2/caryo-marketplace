"use client";

import { i18n as I18nInstanceType } from 'i18next'; // Import the type for i18n instance
import i18n from '@/utils/i18nExports'; // Default instance for some utilities

/**
 * Debug utility for monitoring translation loading
 * Only active in development mode
 */
export const translationDebug = {
  /**
   * Log when a namespace is loaded
   */
  logNamespaceLoaded: (namespace: string | string[], language: string) => { // Removed default i18n.language
    if (process.env.NODE_ENV !== 'development') return;
    
    const namespaces = Array.isArray(namespace) ? namespace : [namespace];
    console.log(
      `%c[i18n Loaded] %c${namespaces.join(', ')} %c(${language})`,
      'color: #4CAF50; font-weight: bold',
      'color: #2196F3; font-weight: bold',
      'color: #9E9E9E'
    );
  },
  
  /**
   * Check if a namespace is already loaded
   */
  isNamespaceLoaded: (namespace: string, language: string, instance?: I18nInstanceType): boolean => {
    const i18nInstance = instance || i18n; // Use provided instance or default
    // Add a check for store.data[language]
    return !!(i18nInstance.store?.data?.[language] && i18nInstance.hasResourceBundle(language, namespace));
  },
  
  /**
   * List all currently loaded namespaces
   */
  listLoadedNamespaces: (language: string, instance?: I18nInstanceType): string[] => {
    const i18nInstance = instance || i18n; // Use provided instance or default
    const loadedNamespaces: string[] = [];
    
    // Ensure the language data exists in the store
    if (!i18nInstance.store?.data?.[language]) {
      console.warn(`%c[i18n Debug] No resource data found for language: ${language}`, 'color: orange');
      return loadedNamespaces; // Return empty if no data for the language
    }

    // Check each available namespace to see if it's loaded
    // Consider making this list dynamic or passed in if namespaces change frequently
    ['common', 'translation', 'errors', 'listings', 'auth'].forEach(ns => {
      if (i18nInstance.hasResourceBundle(language, ns)) {
        loadedNamespaces.push(ns);
      }
    });
    
    return loadedNamespaces;
  },
  
  /**
   * Print a report of loaded and unloaded namespaces
   */
  printLoadingReport: (instance?: I18nInstanceType) => { // Accepts an optional i18n instance
    if (process.env.NODE_ENV !== 'development') return;
    
    const i18nInstance = instance || i18n; // Use provided instance or default
    
    // Ensure i18nInstance and its language property are available
    if (!i18nInstance || !i18nInstance.language) {
      console.warn('%c[i18n Debug] i18n instance or language not available for report.', 'color: orange');
      return;
    }
    const language = i18nInstance.language;

    // Ensure the language data exists in the store before proceeding
    if (!i18nInstance.store?.data?.[language]) {
      console.warn(`%c[i18n Debug] No resource data for language "${language}" to generate report.`, 'color: orange');
      return;
    }

    const allNamespaces = ['common', 'translation', 'errors', 'listings', 'auth'];
    const loadedNamespaces = translationDebug.listLoadedNamespaces(language, i18nInstance);
    const unloadedNamespaces = allNamespaces.filter(ns => !loadedNamespaces.includes(ns));
    
    console.group('%c[i18n Report] Translation Namespaces', 'color: #673AB7; font-weight: bold');
    console.log(
      `%cLoaded (%c${language}%c): %c${loadedNamespaces.join(', ') || 'None'}`,
      'color: #4CAF50; font-weight: bold',
      'color: #FF9800;', // Language color
      'color: #4CAF50; font-weight: bold', // Reset to loaded color
      'color: #2196F3'
    );
    console.log(
      `%cUnloaded (%c${language}%c): %c${unloadedNamespaces.join(', ') || 'None'}`,
      'color: #F44336; font-weight: bold',
      'color: #FF9800;', // Language color
      'color: #F44336; font-weight: bold', // Reset to unloaded color
      'color: #9E9E9E'
    );
    console.groupEnd();
  }
};

export default translationDebug;

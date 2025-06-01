"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { reloadNamespace } from '@/utils/i18nExports';
import { useTranslation } from 'react-i18next';

/**
 * A completely redesigned TranslationDebugger component that safely monitors i18n state
 * This avoids direct access to potentially uninitialized i18n internals
 */
export default function TranslationDebugger() {
  const [loadedNamespaces, setLoadedNamespaces] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('');
  const { i18n: i18nInstance } = useTranslation();
  const mountedRef = useRef(true);
  
  // Safer approach to check if namespaces are loaded
  const safelyCheckLoadedNamespaces = useCallback(() => {
    if (!i18nInstance || !mountedRef.current) return;
    
    const language = i18nInstance.language;
    if (!language) return;
    
    setCurrentLang(language);
    
    try {
      // All known namespaces we care about
      const allNamespaces = ['common', 'translation', 'errors', 'listings', 'auth'];
      const loaded: string[] = [];
      
      // Safely check each namespace
      for (const ns of allNamespaces) {
        try {
          // Using resolve to check if the namespace exists for this language
          if (i18nInstance.exists('test_key', { ns, lng: language })) {
            loaded.push(ns);
          } else if (i18nInstance.hasResourceBundle?.(language, ns)) {
            // Fallback to hasResourceBundle if it exists and is available
            loaded.push(ns);
          }
        } catch (err) {
          // Ignore individual namespace errors
          console.debug(`[i18n debug] Error checking namespace ${ns}:`, err);
        }
      }
      
      if (mountedRef.current) {
        setLoadedNamespaces(loaded);
      }
    } catch (error) {
      console.warn('[TranslationDebugger] Error checking namespaces:', error);
      if (mountedRef.current) {
        setLoadedNamespaces([]);
      }
    }
  }, [i18nInstance]);
  
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial check
    safelyCheckLoadedNamespaces();
    
    // Update on language change or resource loading
    const handleUpdate = () => {
      safelyCheckLoadedNamespaces();
    };
    
    if (i18nInstance) {
      // Listen for i18n events
      i18nInstance.on('initialized', handleUpdate);
      i18nInstance.on('loaded', handleUpdate);
      i18nInstance.on('languageChanged', handleUpdate);
    }
    
    // Check periodically (less frequently than before)
    const intervalId = setInterval(handleUpdate, 2000);
    
    return () => {
      mountedRef.current = false;
      if (i18nInstance) {
        i18nInstance.off('initialized', handleUpdate);
        i18nInstance.off('loaded', handleUpdate);
        i18nInstance.off('languageChanged', handleUpdate);
      }
      clearInterval(intervalId);
    };
  }, [i18nInstance, safelyCheckLoadedNamespaces]);
  
  // Don't render in production
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const allNamespaces = ['common', 'translation', 'errors', 'listings', 'auth'];
  const unloadedNamespaces = allNamespaces.filter(ns => !loadedNamespaces.includes(ns));
  
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '300px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      }}
    >
      <div 
        style={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px',
          cursor: 'pointer'
        }}
        onClick={() => setShowDetails(!showDetails)}
      >
        <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
          i18n Lazy Loading {showDetails ? '▲' : '▼'}
        </span>
        <span style={{ color: '#2196F3' }}>
          {loadedNamespaces.length}/{allNamespaces.length} loaded
        </span>
      </div>
      
      {showDetails && (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: '#4CAF50' }}>Loaded: </span>
            <span>{loadedNamespaces.join(', ') || 'None'}</span>
          </div>
          <div>
            <span style={{ color: '#F44336' }}>Unloaded: </span>
            <span>{unloadedNamespaces.join(', ') || 'None'}</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#9E9E9E' }}>
            Language: {currentLang}
          </div>
          <button 
            onClick={() => {
              try {
                reloadNamespace('auth');
                setTimeout(safelyCheckLoadedNamespaces, 300);
              } catch (err) {
                console.error('[i18n debug] Error reloading namespace:', err);
              }
            }} 
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '3px',
              cursor: 'pointer',
              marginTop: '8px',
              fontSize: '10px'
            }}
          >
            Reload &apos;auth&apos; Namespace
          </button>
        </div>
      )}
    </div>
  );
}

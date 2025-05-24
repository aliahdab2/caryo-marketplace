"use client";

import React, { useState, useEffect } from 'react';
import useServerConnectivity from '@/hooks/useServerConnectivity';
import { useTranslation } from 'react-i18next';
import type { ConnectivityStatusProps } from '@/types/ui';

export default function ConnectivityStatus({ 
  checkInterval = 180000, // Check every 3 minutes by default (reduced from 30 seconds)
  onStatusChange,
  autoHide = true, // Auto-hide by default
  autoHideDelay = 5000, // 5 seconds by default
  reactive = false, // Reactive mode disabled by default
  className = ''
}: ConnectivityStatusProps) {
  const { t } = useTranslation('errors');
  const { isConnected, isUnknown, status, checkNow } = useServerConnectivity({
    checkInterval
  });
  const [isVisible, setIsVisible] = useState(false);

  // Handle visibility based on connection status
  useEffect(() => {
    // Trigger callback if provided
    if (!isUnknown && onStatusChange) {
      onStatusChange(isConnected);
    }
    
    // Show the banner if disconnected
    if (status === 'disconnected') {
      setIsVisible(true);
    } else if (status === 'connected') {
      // If connected, show briefly then hide if autoHide is true
      setIsVisible(true);
      
      if (autoHide) {
        const hideTimer = setTimeout(() => {
          setIsVisible(false);
        }, autoHideDelay);
        
        return () => clearTimeout(hideTimer);
      }
    }
  }, [status, isConnected, isUnknown, autoHide, autoHideDelay, onStatusChange]);

  // Add event listeners for API requests in reactive mode
  useEffect(() => {
    // Only run this effect on the client side
    if (typeof window === 'undefined' || !reactive) return;
    
    // Check connectivity when an API request starts
    const handleApiRequestStart = () => {
      checkNow();
    };
    
    // Check connectivity when an API request fails with an error
    const handleApiRequestError = (event: Event) => {
      const customEvent = event as CustomEvent;
      const error = customEvent.detail?.error;
      
      // Only re-check on certain types of errors that might indicate connectivity issues
      if (error?.name === 'TypeError' || error?.message?.includes('network') || error?.message?.includes('timeout')) {
        checkNow();
      }
    };
    
    // Add event listeners
    window.addEventListener('api-request-start', handleApiRequestStart);
    window.addEventListener('api-request-error', handleApiRequestError);
    
    // Clean up on unmount
    return () => {
      window.removeEventListener('api-request-start', handleApiRequestStart);
      window.removeEventListener('api-request-error', handleApiRequestError);
    };
  }, [reactive, checkNow]);

  // If we've never checked or status is hidden, don't render
  if (isUnknown || !isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
    } ${
      isConnected 
        ? 'bg-green-100 border border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
        : 'bg-amber-100 border border-amber-200 text-amber-800 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400'
    } ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500'}`}></div>
        <p className="text-sm font-medium">
          {isConnected 
            ? t('serverConnected', 'Connected to server') 
            : t('errors.serverUnavailable', 'Cannot connect to server. Some features may be unavailable.')}
        </p>
        <button 
          onClick={checkNow} 
          className="ml-2 text-xs underline hover:text-blue-600 dark:hover:text-blue-400"
          aria-label="Check connection"
        >
          {t('retry', 'Retry')}
        </button>
      </div>
    </div>
  );
}

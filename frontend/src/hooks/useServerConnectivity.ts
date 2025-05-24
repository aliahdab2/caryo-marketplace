"use client";

import { useState, useEffect, useCallback } from 'react';
import { isServerAvailable } from '@/utils/serverCheck';

type ServerStatus = 'unknown' | 'connected' | 'disconnected';

import { UseServerConnectivityProps } from '@/types/api';

/**
 * Hook for monitoring backend server connectivity
 * Uses intelligent checking to minimize unnecessary requests
 */
export default function useServerConnectivity({
  checkInterval = 180000, // Default: check every 3 minutes (reduced from 30 seconds)
  initialDelay = 2000 // Default: longer initial delay to let the app load first
}: UseServerConnectivityProps = {}) {
  const [status, setStatus] = useState<ServerStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Function to check connectivity
  const checkConnectivity = useCallback(async (forceCheck: boolean = false) => {
    if (isChecking) return;
    setIsChecking(true);
    
    try {
      // Pass the forceCheck parameter to control cache usage
      const isConnected = await isServerAvailable(forceCheck);
      setStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error checking server connectivity:', error);
      setStatus('disconnected');
    } finally {
      setLastChecked(new Date());
      setIsChecking(false);
    }
  }, [isChecking]);

  // Force check connectivity now, bypassing cache
  const checkNow = useCallback(() => {
    checkConnectivity(true); // Force a fresh check when user manually requests it
  }, [checkConnectivity]);

  useEffect(() => {
    // Only run this effect in the browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    // Add a flag to track if component is mounted
    let isMounted = true;
    
    // Store visibility change tracking
    let wasHidden = document.hidden;
    const visibilityListener = () => {
      // Only check when page becomes visible after being hidden for a while
      if (wasHidden && !document.hidden) {
        // When coming back from tab hiding, force a fresh check
        checkConnectivity(true);
      }
      wasHidden = document.hidden;
    };
    
    // Check on online/offline status changes
    const onlineListener = () => {
      if (navigator.onLine) {
        // If browser reports we're back online, force a fresh check
        checkConnectivity(true);
      } else {
        // If browser reports we're offline, update status immediately
        setStatus('disconnected');
      }
    };

    // Initial check after a delay
    const initialCheck = setTimeout(() => {
      if (isMounted) {
        // For initial check, use cached result if available (within TTL)
        checkConnectivity(false);
      }
    }, initialDelay);

    // Set up interval checking only if interval > 0
    let interval: NodeJS.Timeout | undefined;
    
    if (checkInterval > 0) {
      // Set up intelligent interval checking
      // Only check at regular intervals when the page is visible
      interval = setInterval(() => {
        if (!document.hidden && isMounted) {
          // For regular interval checks, use cached result if available
          checkConnectivity(false);
        }
      }, checkInterval);
    }
    
    // Add event listeners for smarter checking
    document.addEventListener('visibilitychange', visibilityListener);
    window.addEventListener('online', onlineListener);
    window.addEventListener('offline', onlineListener);
    
    // Clean up everything
    return () => {
      isMounted = false;
      clearTimeout(initialCheck);
      if (interval) {
        clearInterval(interval);
      }
      document.removeEventListener('visibilitychange', visibilityListener);
      window.removeEventListener('online', onlineListener);
      window.removeEventListener('offline', onlineListener);
    };
  }, [checkConnectivity, checkInterval, initialDelay]);

  return {
    status,
    lastChecked,
    isConnected: status === 'connected',
    isDisconnected: status === 'disconnected',
    isUnknown: status === 'unknown',
    isChecking,
    checkNow
  };
}

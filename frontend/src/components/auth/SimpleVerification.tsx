"use client";

/**
 * SimpleVerification Component
 * 
 * A reliable verification component for user authentication that:
 * - Provides visual feedback during the verification process
 * - Automatically completes verification without user interaction (if autoStart is true)
 * - Properly cleans up timeouts to prevent memory leaks
 * - Matches the application's UI styling
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SimpleVerificationProps } from "@/types/components";
import styles from './simpleVerification.module.css';
import useLazyTranslation from '@/hooks/useLazyTranslation';

type VerificationState = 'idle' | 'verifying' | 'success';

export default function SimpleVerification({ 
  onVerified, 
  autoStart = false 
}: SimpleVerificationProps) {
  // Use improved useLazyTranslation hook
  const { t, ready } = useLazyTranslation('auth');
  const [state, setState] = useState<VerificationState>(autoStart ? 'verifying' : 'idle');
  
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoVerifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef<boolean>(true);
  const hasAutoVerified = useRef<boolean>(false);

  // Clear all timeouts on unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      
      // Clean up all timeouts
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
        verificationTimeoutRef.current = null;
      }
      
      if (autoVerifyTimeoutRef.current) {
        clearTimeout(autoVerifyTimeoutRef.current);
        autoVerifyTimeoutRef.current = null;
      }
    };
  }, []);

  // Handle verification process
  const handleVerify = useCallback(() => {
    // Don't start verification if already past the idle state
    if (state !== 'idle') return;
    
    // Update UI state
    setState('verifying');
    
    // Clear any existing verification timer
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
    }
    
    // Start new verification timer
    verificationTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        setState('success');
        onVerified(true);
      }
    }, 1500);
  }, [state, onVerified]);

  // Handle auto-start if specified
  useEffect(() => {
    // If autoStart is true, begin verification immediately
    if (autoStart && state === 'verifying') {
      verificationTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setState('success');
          onVerified(true);
        }
      }, 1500);
    }
  }, [autoStart, onVerified, state]);

  // Auto-verify after 3 seconds if still idle and hasn't auto-verified yet
  useEffect(() => {
    // Only for idle state and if we haven't auto-verified yet
    if (state === 'idle' && !hasAutoVerified.current && !autoStart) {
      autoVerifyTimeoutRef.current = setTimeout(() => {
        hasAutoVerified.current = true;
        if (isMounted.current && state === 'idle') {
          handleVerify();
        }
      }, 3000);
    }
    
    return () => {
      // Clean up auto verify timeout on unmount or state change
      if (autoVerifyTimeoutRef.current) {
        clearTimeout(autoVerifyTimeoutRef.current);
        autoVerifyTimeoutRef.current = null;
      }
    };
  }, [state, handleVerify, autoStart]);
  
  return (
    <div className={`${styles.verificationContainer} p-4 rounded-lg shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}>
      {!ready ? (
        // Loading state when translations aren't ready
        <div className="flex flex-col items-center justify-center p-4">
          <div className={`animate-spin w-8 h-8 mb-2 border-4 border-blue-500 border-t-transparent rounded-full`}></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              {t('verificationControl', 'Verification Control')}
            </h3>
            {state === 'idle' && (
              <button 
                onClick={handleVerify}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                {t('startVerification', 'Start Verification')}
              </button>
            )}
          </div>

          <div className="mt-4 text-center">
            {state === 'verifying' && (
              <>
                <div className={`${styles.spinner} animate-spin w-8 h-8 mx-auto mb-2 border-4 border-blue-500 border-t-transparent rounded-full`}></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('verifying', 'Verifying...')}</p>
              </>
            )}
            {state === 'success' && (
              <>
                <svg className="w-10 h-10 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <p className="text-sm text-green-600 dark:text-green-400">{t('verified', 'Verified Successfully!')}</p>
              </>
            )}
            {state === 'idle' && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('verificationPending', 'Verification pending. Click start or wait for auto-verification.')}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

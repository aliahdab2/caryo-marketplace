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
import { useTranslation } from 'react-i18next';
import { SimpleVerificationProps } from "@/types/components";
import styles from './simpleVerification.module.css';

type VerificationState = 'idle' | 'verifying' | 'success';

export default function SimpleVerification({ 
  onVerified, 
  autoStart = false 
}: SimpleVerificationProps) {
  const { t } = useTranslation('auth');
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
    <div 
      className={styles['verification-wrapper']}
      onClick={state === 'idle' ? handleVerify : undefined}
      style={{ cursor: state === 'idle' ? 'pointer' : 'default' }}
      role="button"
      tabIndex={state === 'idle' ? 0 : -1}
      aria-label={t('verificationControl')}
    >
      {state === 'idle' && (
        <div className={styles['idle-container'] + ' ' + styles.active}>
          <div className={styles['idle-text']}>{t('clickToVerify')}</div>
        </div>
      )}
      
      {state === 'verifying' && (
        <div className={styles['verifying-container'] + ' ' + styles.active}>
          <div className={styles.spinner}></div>
          <div className={styles['verifying-text']}>{t('verifying')}</div>
        </div>
      )}
      
      {state === 'success' && (
        <div className={styles['success-container'] + ' ' + styles.active}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <div className={styles['success-text']}>{t('verified')}</div>
        </div>
      )}
    </div>
  );
}

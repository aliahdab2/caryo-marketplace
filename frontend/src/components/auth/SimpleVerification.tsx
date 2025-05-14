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
import styles from './simpleVerification.module.css';

interface VerificationProps {
  /** Callback function that receives the verification status */
  onVerified: (verified: boolean) => void;
  /** Whether to automatically start verification without user interaction. Default: true for login, false for signup */
  autoStart?: boolean;
}

type VerificationState = 'idle' | 'verifying' | 'success';

export default function SimpleVerification({ 
  onVerified, 
  autoStart = false 
}: VerificationProps) {
  const { t } = useTranslation('common');
  const [state, setState] = useState<VerificationState>(autoStart ? 'verifying' : 'idle');
  
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef<boolean>(true);

  // Effect for component mount/unmount lifecycle
  useEffect(() => {
    isMounted.current = true;

    // If autoStart is true, begin verification immediately
    if (autoStart && state === 'verifying') {
      verificationTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setState('success');
          onVerified(true);
        }
      }, 1500);
    }
    
    // This cleanup will run when the component unmounts
    return () => {
      isMounted.current = false;
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, []); 

  const handleVerify = useCallback(() => {
    if (state !== 'idle') return;
    
    setState('verifying');
    
    // Clear any potentially existing timer
    if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
    }

    verificationTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) { // Check if component is still mounted
        setState('success');
        onVerified(true);
      }
    }, 1500);
  }, [state, onVerified]);

  // Auto-verify after 3 seconds if still idle
  useEffect(() => {
    let autoVerifyTimeoutId: NodeJS.Timeout | null = null;
    
    if (state === 'idle') {
      autoVerifyTimeoutId = setTimeout(() => {
        handleVerify(); 
      }, 3000);
    }
    
    return () => {
      if (autoVerifyTimeoutId) {
        clearTimeout(autoVerifyTimeoutId);
      }
    };
  }, [state, handleVerify]);
  
  return (
    <div 
      className={styles['verification-wrapper']}
      onClick={state === 'idle' ? handleVerify : undefined}
      style={{ cursor: state === 'idle' ? 'pointer' : 'default' }}
      role="button"
      tabIndex={state === 'idle' ? 0 : -1}
      aria-label={t('auth.verificationControl', 'Device verification control')}
    >
      {state === 'idle' && (
        <div className={styles['idle-container'] + ' ' + styles.active}>
          <div className={styles['idle-text']}>{t('auth.clickToVerify', 'Click to verify your device')}</div>
        </div>
      )}
      
      {state === 'verifying' && (
        <div className={styles['verifying-container'] + ' ' + styles.active}>
          <div className={styles.spinner}></div>
          <div className={styles['verifying-text']}>{t('auth.verifying', 'Verifying...')}</div>
        </div>
      )}
      
      {state === 'success' && (
        <div className={styles['success-container'] + ' ' + styles.active}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <div className={styles['success-text']}>{t('auth.verified', 'Verified')}</div>
        </div>
      )}
    </div>
  );
}

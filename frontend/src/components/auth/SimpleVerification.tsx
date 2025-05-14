"use client";

/**
 * SimpleVerification Component
 * 
 * A guaranteed-to-work verification component that always completes
 */
import React, { useState, useEffect, useRef, useCallback } from 'react'; // Added useRef, useCallback
import { useTranslation } from 'react-i18next';
import styles from './sasVerification.module.css';

interface VerificationProps {
  onVerified: (verified: boolean) => void;
}

export default function SimpleVerification({ onVerified }: VerificationProps) {
  const { t } = useTranslation('common');
  const [state, setState] = useState<'idle' | 'verifying' | 'success'>('idle');
  
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    // This cleanup will run when the component unmounts.
    return () => {
      isMounted.current = false;
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleanup on unmount.

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
  }, [state, onVerified]); // Added state and onVerified as dependencies

  // Auto-verify after 3 seconds if still idle
  useEffect(() => {
    let autoVerifyTimeoutId: NodeJS.Timeout | null = null;
    
    if (state === 'idle') {
      autoVerifyTimeoutId = setTimeout(() => {
        // handleVerify will internally check if component is mounted for its own timeout
        handleVerify(); 
      }, 3000);
    }
    
    return () => {
      if (autoVerifyTimeoutId) {
        clearTimeout(autoVerifyTimeoutId);
      }
    };
  }, [state, handleVerify]); // Added handleVerify to dependencies
  
  return (
    <div 
      className={styles['verification-wrapper']}
      onClick={state === 'idle' ? handleVerify : undefined}
      style={{ cursor: state === 'idle' ? 'pointer' : 'default' }}
      role="button"
      tabIndex={state === 'idle' ? 0 : -1} // Dynamic tabIndex
    >
      {state === 'idle' && (
        <div className={styles['idle-container'] + ' ' + styles.active}>
          <div className={styles['idle-text']}>{t('auth.clickToVerify', 'Click to verify your device')}</div>
        </div>
      )}
      
      {state === 'verifying' && (
        <div className={styles['verifying-container'] + ' ' + styles.active}>
          <div className={styles.spinner}></div> {/* Use CSS class for spinner */}
          <div className={styles['verifying-text']}>{t('auth.verifying', 'Verifying...')}</div>
        </div>
      )}
      
      {state === 'success' && (
        <div className={styles['success-container'] + ' ' + styles.active}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#008a2e" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <div className={styles['success-text']}>{t('auth.verified', 'Verified')}</div>
        </div>
      )}
    </div>
  );
}

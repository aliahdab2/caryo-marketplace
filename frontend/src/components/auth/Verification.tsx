"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './verification.module.css';

interface VerificationProps {
  onVerified: (isVerified: boolean) => void;
  autoVerify?: boolean;
  showIndicator?: boolean;
}

export default function Verification({ 
  onVerified, 
  autoVerify = false,
  showIndicator = true
}: VerificationProps) {
  const { t } = useTranslation('common');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = useCallback(async () => {
    setIsVerifying(true);
    setError(null);

    try {
      // Simulate verification process
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // In a real application, you would implement actual verification logic here
      // Such as:
      // - Device fingerprinting
      // - Behavioral analysis
      // - Risk scoring
      // - IP reputation check

      setIsVerified(true);
      onVerified(true);
    } catch (err) {
      const error = err as Error; // Type assertion
      setError(error.message || t('auth.verificationFailed'));
      onVerified(false);
    } finally {
      setIsVerifying(false);
    }
  }, [onVerified, t]); // Added t to dependency array

  // Auto-verify on mount if requested
  useEffect(() => {
    if (autoVerify) {
      handleVerify();
    }
  }, [autoVerify, handleVerify]);

  if (!showIndicator && autoVerify) {
    return null; // Don't render anything if indicator is hidden and auto-verifying
  }

  return (
    <div className={styles.verificationContainer}>
      {!isVerified ? (
        <>
          {!isVerifying ? (
            <button
              onClick={handleVerify}
              className={styles.verifyButton}
              disabled={isVerifying}
            >
              <span className={styles.verifyText}>{t('auth.verifyIdentity')}</span>
            </button>
          ) : (
            <div className={styles.verifyingIndicator}>
              <div className={styles.spinner}></div>
              <span>{t('auth.verifying')}</span>
            </div>
          )}
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </>
      ) : (
        <div className={styles.verifiedContainer}>
          <div className={styles.checkmarkContainer}>
            <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
              <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <span className={styles.verifiedText}>{t('auth.verified')}</span>
        </div>
      )}
    </div>
  );
}

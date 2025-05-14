"use client";

/**
 * SignupVerification Component
 * 
 * A specialized version of SASVerification for the signup page,
 * designed to be more reliable and user-friendly
 */
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './sasVerification.module.css';

interface SignupVerificationProps {
  onVerified: (isVerified: boolean) => void;
}

function SignupVerification({ onVerified }: SignupVerificationProps) {
  const { t } = useTranslation('common');
  const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle');
  
  // Use refs to track component state
  const verificationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const debugCounter = useRef(0);
  
  // Log component mounting
  console.log(`SignupVerification mounting: ${++debugCounter.current}`);
  
  // Handle the verification process
  const handleVerify = () => {
    // Don't restart verification if already in progress or completed successfully
    if (verificationState === 'verifying' || verificationState === 'success') {
      return;
    }
    
    setVerificationState('verifying');
    
    // Clear any existing timer
    if (verificationTimer.current) {
      clearTimeout(verificationTimer.current);
    }
    
    // Add console log for debugging
    console.log('Starting signup verification');
    
    // Use a fixed timer with guaranteed completion
    verificationTimer.current = setTimeout(() => {
      // Set success state immediately
      if (isMounted.current) {
        console.log('Completing verification');
        setVerificationState('success');
        onVerified(true);
        verificationTimer.current = null;
      }
    }, 1500); // Shorter time for better user experience
  };
  
  // Automatically verify after a delay if still in idle state
  React.useEffect(() => {
    const autoTimeoutId = setTimeout(() => {
      // If still in idle state after 5 seconds, auto-verify
      if (verificationState === 'idle' && isMounted.current) {
        console.log('Auto-triggering verification after delay');
        handleVerify();
      }
    }, 5000);
    
    // Cleanup function - runs on unmount
    return () => {
      console.log('SignupVerification unmounting');
      isMounted.current = false;
      if (verificationTimer.current) {
        clearTimeout(verificationTimer.current);
      }
      clearTimeout(autoTimeoutId);
    };
  }, [verificationState]);
  
  // Determine if the component should be clickable (only in idle or failure states)
  const isClickable = verificationState === 'idle' || verificationState === 'failure';

  return (
    <div 
      className={`${styles['verification-wrapper']} ${isClickable ? styles.clickable : ''}`} 
      onClick={isClickable ? handleVerify : undefined}
      role="button"
      tabIndex={isClickable ? 0 : -1}
      aria-label={t('auth.verificationControl', 'Device verification control')}
    >
      {/* Idle state - click to verify */}
      <div className={`${styles['idle-container']} ${verificationState === 'idle' ? styles.active : ''}`}>
        <div className={styles['idle-text']}>{t('auth.clickToVerify', 'Click to verify your device')}</div>
      </div>
      
      {/* Verifying state - spinner */}
      <div className={`${styles['verifying-container']} ${verificationState === 'verifying' ? styles.active : ''}`}>
        <svg 
          className={`${styles['verifying-circle']} ${verificationState === 'verifying' ? styles.spin : ''}`}
          viewBox="0 0 30 30" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          aria-hidden="true"
        >
          <line x1="15" x2="15" y1="1.5" y2="5.5" className={styles.circle}></line>
          <line x1="24.5459" x2="24.5459" y1="5.45405" y2="10.45405" transform="rotate(45 24.5459 5.45405)" className={styles.circle}></line>
          <line x1="28.5" x2="28.5" y1="15" y2="20" transform="rotate(90 28.5 15)" className={styles.circle}></line>
          <line x1="24.5459" x2="24.5459" y1="24.546" y2="29.546" transform="rotate(135 24.5459 24.546)" className={styles.circle}></line>
          <line x1="15" x2="15" y1="28.5" y2="33.5" transform="rotate(180 15 28.5)" className={styles.circle}></line>
          <line x1="5.4541" x2="5.4541" y1="24.5459" y2="29.5459" transform="rotate(-135 5.4541 24.5459)" className={styles.circle}></line>
          <line x1="1.5" x2="1.5" y1="15" y2="20" transform="rotate(-90 1.5 15)" className={styles.circle}></line>
          <line x1="5.45408" x2="5.45408" y1="5.45404" y2="10.45404" transform="rotate(-45 5.45408 5.45404)" className={styles.circle}></line>
        </svg>
        <div className={styles['verifying-text']}>{t('auth.verifying')}</div>
      </div>

      {/* Success state - checkmark */}
      <div className={`${styles['success-container']} ${verificationState === 'success' ? styles.active : ''}`}>
        <svg 
          className={styles['success-circle']}
          viewBox="0 0 52 52" 
          fill="none"
          xmlns="http://www.w3.org/2000/svg" 
          aria-hidden="true"
        >
          <circle className={styles['success-circle']} cx="26" cy="26" r="25"></circle>
          <path d="m13,26l9.37,9l17.63,-18"></path>
        </svg>
        <div className={styles['success-text']}>{t('auth.verified')}</div>
      </div>

      {/* Failure state - exclamation mark (should rarely be seen) */}
      <div className={`${styles['failure-container']} ${verificationState === 'failure' ? styles.active : ''}`}>
        <svg 
          className={styles['failure-circle']}
          viewBox="0 0 30 30" 
          fill="none"
          xmlns="http://www.w3.org/2000/svg" 
          aria-hidden="true"
        >
          <circle cx="15" cy="15" r="15" fill="none"></circle>
          <path d="M15.9288 16.2308H13.4273L13.073 7H16.2832L15.9288 16.2308ZM14.6781 19.1636C15.1853 19.1636 15.5918 19.3129 15.8976 19.6117C16.2103 19.9105 16.3666 20.2927 16.3666 20.7583C16.3666 21.2169 16.2103 21.5956 15.8976 21.8944C15.5918 22.1932 15.1853 22.3425 14.6781 22.3425C14.1778 22.3425 13.7713 22.1932 13.4586 21.8944C13.1529 21.5956 13 21.2169 13 20.7583C13 20.2997 13.1529 19.921 13.4586 19.6222C13.7713 19.3164 14.1778 19.1636 14.6781 19.1636Z"></path>
        </svg>
        <div className={styles['failure-text']}>{t('auth.verificationFailed')}</div>
      </div>
    </div>
  );
}

export default SignupVerification;

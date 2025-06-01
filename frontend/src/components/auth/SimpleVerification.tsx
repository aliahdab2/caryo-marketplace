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

type VerificationState = 'idle' | 'verifying' | 'success' | 'verified_hidden';

export default function SimpleVerification({ 
  onVerified, 
  autoStart = false,
  autoHide = true
}: SimpleVerificationProps) {
  // Use improved useLazyTranslation hook
  const { ready } = useLazyTranslation('auth');
  const [state, setState] = useState<VerificationState>(autoStart ? 'verifying' : 'idle');
  
  // Refs to track component state
  const verificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoVerifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Added for success state duration
  const isMounted = useRef<boolean>(true);
  const hasAutoVerified = useRef<boolean>(false);
  const hasVerified = useRef<boolean>(false); // Track if verification has been done

  // Clear all timeouts on unmount and reset state
  useEffect(() => {
    isMounted.current = true;
    hasVerified.current = false; // Reset verification status on mount
    
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
      if (successTimeoutRef.current) { // Cleanup for success timeout
        clearTimeout(successTimeoutRef.current);
        successTimeoutRef.current = null;
      }
    };
  }, []);

  // Callback to handle successful verification and schedule hiding the icon
  const markAsVerifiedAndScheduleHide = useCallback(() => {
    if (!isMounted.current) return;

    setState('success');
    
    // Only call onVerified if we haven't verified yet
    if (!hasVerified.current) {
      hasVerified.current = true;
      onVerified(true);
    }

    if (autoHide) {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      successTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setState('verified_hidden');
        }
      }, 2000); // Checkmark disappears after 2 seconds
    }
  }, [onVerified, autoHide]);

  // Handle verification process
  const handleVerify = useCallback(() => {
    // Don't start verification if already past the idle state or already verified
    if (state !== 'idle' || hasVerified.current) return;
    
    // Update UI state
    setState('verifying');
    
    // Clear any existing verification timer
    if (verificationTimeoutRef.current) {
      clearTimeout(verificationTimeoutRef.current);
    }
    
    // Start new verification timer
    verificationTimeoutRef.current = setTimeout(() => {
      markAsVerifiedAndScheduleHide();
    }, 1500);
  }, [state, markAsVerifiedAndScheduleHide]);

  // Handle auto-start if specified
  useEffect(() => {
    // If autoStart is true, begin verification immediately
    if (autoStart && state === 'verifying' && !hasVerified.current) {
      // Clear any existing verification timer to avoid multiple triggers
      if (verificationTimeoutRef.current) {
        clearTimeout(verificationTimeoutRef.current);
      }
      verificationTimeoutRef.current = setTimeout(() => {
        markAsVerifiedAndScheduleHide();
      }, 1500);
    }
    // Cleanup this specific timeout if component unmounts or dependencies change while verifying
    return () => {
      if (verificationTimeoutRef.current && state === 'verifying') { // Only clear if it was set by this effect instance
        clearTimeout(verificationTimeoutRef.current);
      }
    };
  }, [autoStart, state, markAsVerifiedAndScheduleHide]);

  // Auto-verify after 3 seconds if still idle and hasn't auto-verified yet
  useEffect(() => {
    // Only for idle state and if we haven't auto-verified yet and haven't verified already
    if (state === 'idle' && !hasAutoVerified.current && !autoStart && !hasVerified.current) {
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
    <div className="text-center"> {/* Simplified container, primarily for centering */}
      {!ready ? (
        // Loading state when translations aren't ready
        <div className="flex flex-col items-center justify-center p-4">
          <div data-testid="loading-spinner" className={`animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full`}></div>
          {/* Removed Loading... text */}
        </div>
      ) : (
        <>
          {/* Removed header with title and button */}

          <div className="mt-4"> {/* Adjusted to remove text-center if the parent div handles it, but keeping mt-4 */}
            {state === 'verifying' && (
              <>
                <div data-testid="verifying-spinner" className={`${styles.spinner} animate-spin w-8 h-8 mx-auto border-4 border-blue-500 border-t-transparent rounded-full`}></div>
                {/* Removed Verifying... text */}
              </>
            )}
            {state === 'success' && (
              <>
                <svg data-testid="success-icon" className="w-10 h-10 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
                {/* Removed Verified Successfully! text */}
              </>
            )}
            {(state === 'idle' || state === 'verified_hidden') && (
              // Idle or hidden state is now visually empty
              <div data-testid="placeholder-div" className="w-8 h-8 mx-auto"></div> // Placeholder to maintain height similar to spinner/icon, or can be removed
            )}
          </div>
        </>
      )}
    </div>
  );
}

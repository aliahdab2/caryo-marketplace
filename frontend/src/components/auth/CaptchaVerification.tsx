/**
 * CaptchaVerification Component (DEPRECATED)
 * 
 * This component has been deprecated and now uses the new SASVerification component
 * with a green color scheme. It maintains backward compatibility with existing code.
 */

"use client";

import React from 'react';
import SASVerification from './SASVerification';

interface CaptchaVerificationProps {
  onVerified: (isVerified: boolean) => void;
  onRefresh?: () => void;
}

export default function CaptchaVerification({ onVerified, onRefresh }: CaptchaVerificationProps) {
  const handleVerified = (isVerified: boolean) => {
    onVerified(isVerified);
    
    // Call onRefresh if provided
    if (onRefresh && isVerified) {
      onRefresh();
    }
  };

  return (
    <SASVerification 
      onVerified={handleVerified}
      autoVerify={true}
    />
  );
}

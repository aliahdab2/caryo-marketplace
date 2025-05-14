/**
 * CaptchaVerification Component (DEPRECATED)
 * 
 * This component has been deprecated and now uses the SimpleVerification component.
 * It maintains backward compatibility with existing code.
 */

"use client";

import React from 'react';
import SimpleVerification from './SimpleVerification';

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
    <SimpleVerification 
      onVerified={handleVerified}
      autoStart={true}
    />
  );
}

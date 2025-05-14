/**
 * CaptchaVerification Component (DEPRECATED)
 * 
 * This component has been deprecated and no longer provides captcha functionality.
 * It now simply passes verification success to maintain compatibility with existing code.
 */

"use client";

import React, { useEffect } from 'react';

interface CaptchaVerificationProps {
  onVerified: (isVerified: boolean) => void;
  onRefresh?: () => void;
}

export default function CaptchaVerification({ onVerified, onRefresh }: CaptchaVerificationProps) {
  // Automatically verify the user without any captcha
  useEffect(() => {
    // Auto-verify immediately
    onVerified(true);
    
    // Call onRefresh if provided
    if (onRefresh) {
      onRefresh();
    }
  }, [onVerified, onRefresh]);

  return (
    <div className="hidden">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        {t('auth.verifyHuman', 'Verify you are human')}
      </h3>
      
      <div className="flex flex-col space-y-4">
        {/* Captcha Display Area */}
        <div className="relative flex items-center justify-center bg-white dark:bg-gray-700 p-3 h-16 rounded border border-gray-300 dark:border-gray-600 select-none">
          {/* Display the captcha code in a way that's hard for bots to read */}
          <div className="captcha-text relative">
            {captchaCode.split('').map((char, index) => (
              <span 
                key={index}
                style={{
                  display: 'inline-block',
                  transform: `rotate(${Math.random() * 20 - 10}deg) translateY(${Math.random() * 6 - 3}px)`,
                  margin: '0 2px',
                  fontSize: `${Math.random() * 6 + 18}px`,
                  fontWeight: Math.random() > 0.5 ? 'bold' : 'normal',
                  fontStyle: Math.random() > 0.7 ? 'italic' : 'normal',
                  color: `hsl(${Math.random() * 360}, 70%, 40%)`,
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                  letterSpacing: `${Math.random() * 2}px`,
                  position: 'relative'
                }}
              >
                {char}
              </span>
            ))}
          </div>
          
          {/* Add some noise lines to make it harder for bots */}
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            {[...Array(8)].map((_, i) => (
              <line 
                key={i}
                x1={Math.random() * 100 + "%"} 
                y1={Math.random() * 100 + "%"} 
                x2={Math.random() * 100 + "%"} 
                y2={Math.random() * 100 + "%"} 
                stroke={`rgba(${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, ${Math.random() * 100 + 100}, 0.3)`} 
                strokeWidth="1"
              />
            ))}
          </svg>
          
          {/* Refresh button */}
          <button
            type="button"
            onClick={handleRefreshCaptcha}
            className="absolute right-2 top-2 p-1 rounded-full bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
            title={t('auth.refreshCaptcha', 'Refresh captcha')}
            disabled={isVerifying}
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        {/* Input field */}
        <div>
          <label htmlFor="captcha" className="sr-only">
            {t('auth.captchaCode', 'Verification Code')}
          </label>
          <input
            id="captcha"
            type="text"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            placeholder={t('auth.enterCaptcha', 'Enter the code above')}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isVerifying || isVerified}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
        
        {/* Verify button */}
        <button
          type="button"
          onClick={handleVerify}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${isVerified 
              ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'} 
            focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
          disabled={isVerifying || isVerified || !captchaInput}
        >
          {isVerifying ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : isVerified ? (
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          ) : null}
          {isVerifying 
            ? t('auth.verifying', 'Verifying...') 
            : isVerified 
              ? t('auth.verified', 'Verified') 
              : t('auth.verify', 'Verify')}
        </button>
      </div>
      
      {/* Success message */}
      {showSuccess && (
        <SimpleSuccessAlert 
          message={t('auth.verificationSuccessful', 'Verification successful!')}
          autoHideDuration={3000}
        />
      )}
    </div>
  );
}

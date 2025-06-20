"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { MdCheckCircle, MdClose } from 'react-icons/md';
import type { SuccessAlertProps } from '@/types/ui';

export default function SuccessAlert({
  message = "Success!",
  visible = false,
  onComplete,
  autoHideDuration = 3000,
  className = "",
  dismissible = true,
  showIcon = true
}: SuccessAlertProps) {
  const [isVisible, setIsVisible] = useState(visible);

  // Memoized close handler
  const handleClose = useCallback(() => {
    setIsVisible(false);
    if (onComplete) onComplete();
  }, [onComplete]);

  // Handle visibility changes
  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && autoHideDuration > 0) {
      const timer = setTimeout(handleClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [visible, autoHideDuration, handleClose]);

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible && isVisible) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, dismissible, handleClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-5 right-5 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-green-200 dark:border-green-700 p-4 flex items-center gap-3 transition-all duration-300 ease-in-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      } ${className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      {showIcon && (
        <div className="flex-shrink-0">
          <MdCheckCircle 
            className="text-green-600 dark:text-green-400 text-xl" 
            aria-hidden="true" 
          />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
          {message}
        </p>
      </div>
      
      {dismissible && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label="Close notification"
        >
          <MdClose className="text-lg" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

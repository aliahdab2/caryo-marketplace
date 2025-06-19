"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose } from 'react-icons/md';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title?: string;
  message: string;
  visible?: boolean;
  autoHideDuration?: number;
  dismissible?: boolean;
  onClose?: () => void;
  className?: string;
}

const toastConfig = {
  success: {
    icon: MdCheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/50',
    borderColor: 'border-green-200 dark:border-green-700',
    iconColor: 'text-green-600 dark:text-green-400',
    titleColor: 'text-green-800 dark:text-green-200',
    textColor: 'text-green-700 dark:text-green-300'
  },
  error: {
    icon: MdError,
    bgColor: 'bg-red-50 dark:bg-red-900/50',
    borderColor: 'border-red-200 dark:border-red-700',
    iconColor: 'text-red-600 dark:text-red-400',
    titleColor: 'text-red-800 dark:text-red-200',
    textColor: 'text-red-700 dark:text-red-300'
  },
  warning: {
    icon: MdWarning,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/50',
    borderColor: 'border-yellow-200 dark:border-yellow-700',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    titleColor: 'text-yellow-800 dark:text-yellow-200',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  info: {
    icon: MdInfo,
    bgColor: 'bg-blue-50 dark:bg-blue-900/50',
    borderColor: 'border-blue-200 dark:border-blue-700',
    iconColor: 'text-blue-600 dark:text-blue-400',
    titleColor: 'text-blue-800 dark:text-blue-200',
    textColor: 'text-blue-700 dark:text-blue-300'
  }
};

export default function Toast({
  type = 'info',
  title,
  message,
  visible = false,
  autoHideDuration = 5000,
  dismissible = true,
  onClose,
  className = ""
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(visible);
  const [isLeaving, setIsLeaving] = useState(false);

  const config = toastConfig[type];
  const IconComponent = config.icon;

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    // Wait for exit animation to complete
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    setIsVisible(visible);
    setIsLeaving(false);
    
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
      className={`fixed top-5 right-5 z-50 max-w-sm w-full rounded-lg shadow-lg border transition-all duration-300 ease-in-out transform ${
        isLeaving ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100'
      } ${config.bgColor} ${config.borderColor} ${className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <IconComponent 
              className={`text-xl ${config.iconColor}`} 
              aria-hidden="true" 
            />
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h3 className={`text-sm font-medium ${config.titleColor} mb-1`}>
                {title}
              </h3>
            )}
            <p className={`text-sm ${config.textColor} break-words`}>
              {message}
            </p>
          </div>
          
          {dismissible && (
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleClose}
                className={`inline-flex rounded-md p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.iconColor} hover:${config.bgColor}`}
                aria-label="Close notification"
              >
                <MdClose className="text-lg" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useLanguageDirection } from '@/utils/languageDirection';

interface ApiErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
}

const ApiErrorModal: React.FC<ApiErrorModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'error'
}) => {
  const { isRTL } = useLanguageDirection();
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        modalRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      onClose();
      return;
    }

    if (event.key === 'Enter') {
      onClose();
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Backdrop click handler
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  // Early return if modal is not open
  if (!isOpen) return null;

  const getIconAndStyles = () => {
    switch (type) {
      case 'warning':
        return {
          IconComponent: <FaExclamationTriangle className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />,
          iconBg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-200 dark:border-yellow-700',
          buttonBg: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'info':
        return {
          IconComponent: <FaInfoCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />,
          iconBg: 'bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
      default: // error
        return {
          IconComponent: <FaExclamationTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />,
          iconBg: 'bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 border-2 border-red-200 dark:border-red-700',
          buttonBg: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
    }
  };

  const { IconComponent, iconBg, buttonBg } = getIconAndStyles();

  return (
    <div
      className="fixed inset-0 delete-modal-backdrop flex items-center justify-center z-50 p-4 animate-modal-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-error-modal-title"
      aria-describedby="api-error-modal-description"
    >
      <div
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full mx-4 animate-modal-zoom-in ${isRTL ? 'rtl' : 'ltr'} border border-gray-200 dark:border-gray-700 overflow-hidden`}
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Close Button */}
        <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} z-20 p-4 animate-close-button`}>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 hover:scale-110 active:scale-95"
            aria-label="Close modal"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${iconBg} mb-4 animate-icon-bounce`}>
              {IconComponent}
            </div>
            <h3
              id="api-error-modal-title"
              className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 animate-modal-slide-up"
            >
              {title}
            </h3>
          </div>

          {/* Message */}
          <div className="text-center mb-8 animate-modal-slide-up">
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
              <p
                id="api-error-modal-description"
                className="text-gray-700 dark:text-gray-300 leading-relaxed break-words whitespace-pre-line"
              >
                {message}
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-center animate-modal-slide-up">
            <button
              onClick={onClose}
              className={`px-8 py-3 ${buttonBg} text-white font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl`}
              type="button"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiErrorModal;

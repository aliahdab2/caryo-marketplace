'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { FaTimes } from 'react-icons/fa';
import { MdWarning, MdDelete } from 'react-icons/md';
import { useLanguageDirection } from '@/utils/languageDirection';
import type { DeleteConfirmationModalProps } from '@/types/ui';

// Constants for better maintainability
const FOCUSABLE_SELECTOR = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

const ANIMATION_DELAYS = {
  FOCUS: 100,
  CLOSE_BUTTON: 200,
} as const;

// Style configurations
const STYLE_CONFIG = {
  warning: {
    iconBg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 border-2 border-yellow-200 dark:border-yellow-700',
    buttonBase: 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 focus:ring-yellow-500',
    buttonDisabled: 'disabled:from-yellow-400 disabled:to-orange-400'
  },
  danger: {
    iconBg: 'bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 border-2 border-red-200 dark:border-red-700',
    buttonBase: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500',
    buttonDisabled: 'disabled:from-red-400 disabled:to-red-500'
  }
} as const;

// Sub-components for better organization
interface CloseButtonProps {
  onClose: () => void;
  isLoading: boolean;
  isRTL: boolean;
}

const CloseButton: React.FC<CloseButtonProps> = React.memo(({ onClose, isLoading, isRTL }) => (
  <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} z-20 p-4 animate-close-button`}>
    <button
      onClick={onClose}
      disabled={isLoading}
      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 hover:scale-110 active:scale-95"
      aria-label="Close modal"
    >
      <FaTimes className="h-4 w-4" />
    </button>
  </div>
));
CloseButton.displayName = 'CloseButton';

interface ModalHeaderProps {
  title: string;
  iconComponent: React.ReactNode;
  iconBg: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = React.memo(({ title, iconComponent, iconBg }) => (
  <div className="text-center mb-8">
    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${iconBg} mb-6 animate-icon-bounce`}>
      {iconComponent}
    </div>
    <h3 
      id="modal-title"
      className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 animate-modal-slide-up"
    >
      {title}
    </h3>
  </div>
));
ModalHeader.displayName = 'ModalHeader';

/**
 * Props for ModalContent.
 *
 * @property {string | string[]} message - The message(s) to display in the modal.
 *   - Use a string for a single message.
 *   - Use an array of strings to display multiple messages, each in its own styled block.
 * @property {string} [itemName] - Optional name of the item being deleted, shown in a highlighted block.
 */
interface ModalContentProps {
  message: string | string[];
  itemName?: string;
}

const ModalContent: React.FC<ModalContentProps> = React.memo(({ message, itemName }) => (
  <div className="text-center mb-8 animate-modal-slide-up">
    {/* Handle both string and string[] types for message */}
    {Array.isArray(message) ? (
      <div className="space-y-3 mb-4">
        {message.map((msg, index) => (
          <div
            key={index}
            className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg"
          >
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {msg}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p
        id="modal-description"
        className="text-gray-600 dark:text-gray-300 mb-4 leading-relaxed"
      >
        {message}
      </p>
    )}

    {itemName && (
      <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-200 dark:border-gray-600">
        <p className="font-semibold text-gray-900 dark:text-gray-100 break-words">
          &quot;{itemName}&quot;
        </p>
      </div>
    )}
  </div>
));
ModalContent.displayName = 'ModalContent';

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  isLoading = false,
  loadingText = 'Deleting...',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  type = 'danger',
  className = ''
}) => {
  const { isRTL } = useLanguageDirection();
  const modalRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Memoized style calculations
  const styles = useMemo(() => {
    const config = STYLE_CONFIG[type];
    return {
      iconBg: config.iconBg,
      buttonBase: config.buttonBase,
      buttonDisabled: config.buttonDisabled
    };
  }, [type]);

  // Memoized icon component
  const IconComponent = useMemo(() => {
    const iconProps = { className: "h-8 w-8" };
    return type === 'warning' 
      ? <MdWarning {...iconProps} className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
      : <MdDelete {...iconProps} className="h-8 w-8 text-red-600 dark:text-red-400" />;
  }, [type]);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && confirmButtonRef.current) {
      const timer = setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, ANIMATION_DELAYS.FOCUS);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Optimized keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (event.key === 'Escape' && !isLoading) {
      onClose();
      return;
    }
    
    // Tab trapping within modal
    if (event.key === 'Tab') {
      const modal = modalRef.current;
      if (!modal) return;
      
      const focusableElements = modal.querySelectorAll(FOCUSABLE_SELECTOR);
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, [isOpen, onClose, isLoading]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Optimized backdrop click handler
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !isLoading) {
      onClose();
    }
  }, [onClose, isLoading]);

  // Early return if modal is not open
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 delete-modal-backdrop flex items-center justify-center z-50 p-4 animate-modal-fade-in"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <div 
        ref={modalRef}
        className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full mx-4 animate-modal-zoom-in ${isRTL ? 'rtl' : 'ltr'} ${className} border border-gray-200 dark:border-gray-700 overflow-hidden`} 
        dir={isRTL ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClose={onClose} isLoading={isLoading} isRTL={isRTL} />

        <div className="p-8">
          <ModalHeader 
            title={title} 
            iconComponent={IconComponent} 
            iconBg={styles.iconBg} 
          />
          
          <ModalContent message={message} itemName={itemName} />

          {/* Enhanced Action Buttons */}
          <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''} animate-modal-slide-up`}>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="modal-button flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed modal-focus-ring"
              type="button"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              disabled={isLoading}
              className={`modal-button flex-1 px-6 py-3 ${styles.buttonBase} ${styles.buttonDisabled} text-white font-semibold rounded-xl disabled:cursor-not-allowed modal-focus-ring shadow-lg hover:shadow-xl`}
              type="button"
              aria-describedby={isLoading ? 'loading-description' : undefined}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span id="loading-description">{loadingText}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <MdDelete className="h-5 w-5" />
                  {confirmText}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal; 
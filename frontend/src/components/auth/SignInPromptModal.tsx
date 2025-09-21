'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { MessageCircle, User, X } from 'lucide-react';

interface SignInPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: string; // e.g., "contact this seller", "save this listing", etc.
  callbackUrl?: string;
}

export default function SignInPromptModal({
  isOpen,
  onClose,
  action,
  callbackUrl,
}: SignInPromptModalProps) {
  const { t } = useTranslation(['auth', 'common']);
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const handleSignIn = () => {
    // Extract the original callback URL if we're already on an auth page to prevent nesting
    const currentUrl = window.location.href;
    let redirectUrl = callbackUrl || currentUrl;
    
    // If we're already on an auth page with a callback URL, extract the original callback
    if (currentUrl.includes('/auth/') && currentUrl.includes('callbackUrl=')) {
      const urlParams = new URLSearchParams(window.location.search);
      const existingCallback = urlParams.get('callbackUrl');
      if (existingCallback) {
        redirectUrl = decodeURIComponent(existingCallback);
      }
    }
    
    router.push('/auth/signin?callbackUrl=' + encodeURIComponent(redirectUrl));
  };

  const handleSignUp = () => {
    // Extract the original callback URL if we're already on an auth page to prevent nesting
    const currentUrl = window.location.href;
    let redirectUrl = callbackUrl || currentUrl;
    
    // If we're already on an auth page with a callback URL, extract the original callback
    if (currentUrl.includes('/auth/') && currentUrl.includes('callbackUrl=')) {
      const urlParams = new URLSearchParams(window.location.search);
      const existingCallback = urlParams.get('callbackUrl');
      if (existingCallback) {
        redirectUrl = decodeURIComponent(existingCallback);
      }
    }
    
    router.push('/auth/signup?callbackUrl=' + encodeURIComponent(redirectUrl));
  };

  // Handle ESC key, focus management, and body scroll
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' && isOpen && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('keydown', handleTabKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      // Focus the first focusable element when modal opens
      setTimeout(() => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        }
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.removeEventListener('keydown', handleTabKey);
      // Restore body scroll when modal closes
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('auth:signInRequired')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {t('auth:signInToAction', { action })}
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t('auth:signInBenefits')}
            </p>

            <div className="space-y-3">
              <button
                ref={firstFocusableRef}
                onClick={handleSignIn}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <User className="h-4 w-4 mr-2" />
                {t('auth:signIn')}
              </button>
              
              <button
                onClick={handleSignUp}
                className="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                {t('auth:createAccount')}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 py-2"
          >
            {t('common:cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

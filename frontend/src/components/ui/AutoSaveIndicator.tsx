import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface AutoSaveIndicatorProps {
  className?: string;
}

/**
 * Auto-save indicator that shows when form data is being saved
 */
export default function AutoSaveIndicator({ className = '' }: AutoSaveIndicatorProps) {
  const { t } = useTranslation('common');
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAutoSave = (event: CustomEvent) => {
      setMessage(event.detail.message || t('autoSaved', 'Auto-saved'));
      setIsVisible(true);

      // Hide after 2 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    };

    window.addEventListener('autosave', handleAutoSave as EventListener);

    return () => {
      window.removeEventListener('autosave', handleAutoSave as EventListener);
    };
  }, [t]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 ${className}`}>
      <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg px-4 py-2 shadow-lg animate-fade-in">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
          </svg>
          <span className="text-sm font-medium text-green-800 dark:text-green-200">
            {message}
          </span>
        </div>
      </div>
    </div>
  );
}
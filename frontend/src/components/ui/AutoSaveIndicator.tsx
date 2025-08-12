/**
 * Auto-Save Indicator Component
 * 
 * Shows the current auto-save status to users.
 * Similar to Google Docs "All changes saved" indicator.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { AutoSaveIndicatorProps } from '@/types/autoSave';

export default function AutoSaveIndicator({ 
  status, 
  lastSaved, 
  className = '' 
}: AutoSaveIndicatorProps) {
  const { t } = useTranslation(['common', 'listings']);

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return (
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        );
      case 'saved':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return t('common:autoSaveSaving', 'Saving...');
      case 'saved':
        if (lastSaved) {
          const timeAgo = getTimeAgo(lastSaved);
          return t('common:autoSaveSaved', 'Saved {{time}}', { time: timeAgo });
        }
        return t('common:autoSaveAllSaved', 'All changes saved');
      case 'error':
        return t('common:autoSaveError', 'Save failed - will retry');
      default:
        return null;
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) {
      return t('common:justNow', 'just now');
    } else if (diffMinutes === 1) {
      return t('common:oneMinuteAgo', '1 minute ago');
    } else if (diffMinutes < 60) {
      return t('common:minutesAgo', '{{count}} minutes ago', { count: diffMinutes });
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours === 1) {
        return t('common:oneHourAgo', '1 hour ago');
      }
      return t('common:hoursAgo', '{{count}} hours ago', { count: diffHours });
    }
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {getStatusIcon()}
      <span className={`
        ${status === 'saving' ? 'text-blue-600 dark:text-blue-400' : ''}
        ${status === 'saved' ? 'text-green-600 dark:text-green-400' : ''}
        ${status === 'error' ? 'text-red-600 dark:text-red-400' : ''}
      `}>
        {getStatusText()}
      </span>
    </div>
  );
}

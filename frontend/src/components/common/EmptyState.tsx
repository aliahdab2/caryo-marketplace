'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MdInbox, 
  MdSearch, 
  MdFavoriteBorder, 
  MdMessage, 
  MdDirectionsCar,
  MdNotificationsNone 
} from 'react-icons/md';

type EmptyStateVariant = 
  | 'default' 
  | 'search' 
  | 'favorites' 
  | 'messages' 
  | 'listings' 
  | 'notifications';

interface EmptyStateProps {
  /** Message to display */
  message?: string;
  /** Title for the empty state */
  title?: string;
  /** Variant determines the icon shown */
  variant?: EmptyStateVariant;
  /** Custom icon to display */
  icon?: React.ReactNode;
  /** Action button content */
  action?: React.ReactNode;
  /** Custom className for styling */
  className?: string;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
}

const variantIcons: Record<EmptyStateVariant, React.ComponentType<{ size: number; className: string }>> = {
  default: MdInbox,
  search: MdSearch,
  favorites: MdFavoriteBorder,
  messages: MdMessage,
  listings: MdDirectionsCar,
  notifications: MdNotificationsNone,
};

/**
 * Empty state component for consistent empty UI
 * 
 * @example
 * <EmptyState 
 *   variant="favorites" 
 *   title="No favorites yet"
 *   message="Start adding listings to your favorites"
 *   action={<Button>Browse Listings</Button>}
 * />
 */
export function EmptyState({
  message,
  title,
  variant = 'default',
  icon,
  action,
  className = '',
  size = 'medium',
}: EmptyStateProps) {
  const { t } = useTranslation('common');

  const sizeClasses = {
    small: 'p-4',
    medium: 'p-8',
    large: 'p-12',
  };

  const iconSizes = {
    small: 32,
    medium: 48,
    large: 64,
  };

  const textSizes = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  const IconComponent = variantIcons[variant];

  // Default messages based on variant
  const defaultTitles: Record<EmptyStateVariant, string> = {
    default: t('empty.default.title', 'Nothing here'),
    search: t('empty.search.title', 'No results found'),
    favorites: t('empty.favorites.title', 'No favorites yet'),
    messages: t('empty.messages.title', 'No messages'),
    listings: t('empty.listings.title', 'No listings'),
    notifications: t('empty.notifications.title', 'No notifications'),
  };

  const defaultMessages: Record<EmptyStateVariant, string> = {
    default: t('empty.default.message', 'There is nothing to display here.'),
    search: t('empty.search.message', 'Try adjusting your search or filters.'),
    favorites: t('empty.favorites.message', 'Start adding listings to your favorites.'),
    messages: t('empty.messages.message', 'Your conversations will appear here.'),
    listings: t('empty.listings.message', 'No listings match your criteria.'),
    notifications: t('empty.notifications.message', 'You\'re all caught up!'),
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {icon || (
        <IconComponent
          size={iconSizes[size]}
          className="text-gray-400 dark:text-gray-500 mb-4"
          aria-hidden="true"
        />
      )}

      <h3 className={`font-semibold text-gray-900 dark:text-gray-100 mb-2 ${textSizes[size]}`}>
        {title || defaultTitles[variant]}
      </h3>

      <p className={`text-gray-600 dark:text-gray-400 mb-4 max-w-md ${textSizes[size]}`}>
        {message || defaultMessages[variant]}
      </p>

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;

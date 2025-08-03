'use client';

import React from 'react';
import { FaSearch, FaBell, FaCar, FaHeart, FaFilter } from 'react-icons/fa';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useLanguageDirection } from '@/utils/languageDirection';

interface EmptyStateProps {
  type?: 'search' | 'alerts' | 'favorites' | 'general';
  title?: string;
  message?: string;
  actionButton?: {
    text: string;
    href?: string;
    onClick?: () => void;
    icon?: React.ReactNode;
  };
  className?: string;
}

const EmptyState = React.memo<EmptyStateProps>(({
  type = 'general',
  title,
  message,
  actionButton,
  className = ""
}) => {
  const { t } = useLazyTranslation(['search', 'common']);
  const { isRTL } = useLanguageDirection();

  const getIllustration = () => {
    switch (type) {
      case 'search':
        return (
          <div className="relative">
            {/* Main illustration container */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/30 rounded-3xl flex items-center justify-center mb-4 mx-auto">
              <div className="relative">
                {/* Car silhouette */}
                <div className="w-16 h-10 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg relative">
                  {/* Car wheels */}
                  <div className="absolute -bottom-1 left-2 w-3 h-3 bg-gray-600 rounded-full"></div>
                  <div className="absolute -bottom-1 right-2 w-3 h-3 bg-gray-600 rounded-full"></div>
                  {/* Car windows */}
                  <div className="absolute top-1 left-1 right-1 h-3 bg-blue-200 rounded-t-lg"></div>
                </div>
                {/* Search magnifying glass */}
                <div className={`absolute -top-2 w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-lg ${isRTL ? '-left-2' : '-right-2'}`}>
                  <FaSearch className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </div>
            {/* Floating search elements */}
            <div className={`absolute -top-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center opacity-20 animate-pulse ${isRTL ? '-right-3' : '-left-3'}`}>
              <FaFilter className="w-3 h-3 text-white" />
            </div>
            <div className={`absolute -bottom-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center opacity-20 animate-pulse ${isRTL ? '-left-3' : '-right-3'}`} style={{ animationDelay: '1s' }}>
              <FaCar className="w-3 h-3 text-white" />
            </div>
          </div>
        );

      case 'alerts':
        return (
          <div className="relative">
            {/* Person with notification illustration */}
            <div className="w-32 h-32 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/30 rounded-3xl flex items-center justify-center mb-4 mx-auto">
              <div className="relative">
                {/* Person silhouette */}
                <div className="w-14 h-18 bg-gradient-to-b from-green-400 to-green-600 rounded-t-full relative">
                  {/* Head */}
                  <div className="w-8 h-8 bg-green-500 rounded-full absolute -top-4 left-1/2 transform -translate-x-1/2"></div>
                  {/* Arms holding device */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-4 bg-gray-700 dark:bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
            {/* Notification badge */}
            <div className={`absolute -top-2 w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-bounce ${isRTL ? '-left-2' : '-right-2'}`}>
              <FaBell className="w-5 h-5 text-white" />
            </div>
            {/* Floating notification dots */}
            <div className={`absolute top-4 w-3 h-3 bg-red-400 rounded-full opacity-40 animate-ping ${isRTL ? '-right-2' : '-left-2'}`}></div>
            <div className={`absolute bottom-6 w-2 h-2 bg-orange-400 rounded-full opacity-40 animate-ping ${isRTL ? '-left-1' : '-right-1'}`} style={{ animationDelay: '0.5s' }}></div>
          </div>
        );

      case 'favorites':
        return (
          <div className="relative">
            {/* Heart with cars illustration */}
            <div className="w-32 h-32 bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/20 dark:to-pink-800/30 rounded-3xl flex items-center justify-center mb-4 mx-auto">
              <div className="relative">
                {/* Large heart */}
                <FaHeart className="w-16 h-16 text-red-400 opacity-80" />
                {/* Small car icon inside */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <FaCar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            {/* Floating hearts */}
            <div className={`absolute -top-1 w-4 h-4 text-red-300 opacity-60 animate-pulse ${isRTL ? '-right-2' : '-left-2'}`}>
              <FaHeart className="w-full h-full" />
            </div>
            <div className={`absolute -bottom-1 w-3 h-3 text-pink-300 opacity-60 animate-pulse ${isRTL ? '-left-2' : '-right-2'}`} style={{ animationDelay: '1s' }}>
              <FaHeart className="w-full h-full" />
            </div>
          </div>
        );

      default:
        return (
          <div className="relative">
            {/* Generic illustration */}
            <div className="w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-3xl flex items-center justify-center mb-4 mx-auto">
              <div className="w-16 h-16 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                <FaSearch className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        );
    }
  };

  const getDefaultContent = () => {
    switch (type) {
      case 'search':
        return {
          title: t('search:emptySearchTitle', 'No cars found'),
          message: t('search:emptySearchMessage', 'No cars match your search criteria. Try adjusting your filters or search terms to find more results.'),
          actionText: t('search:clearFilters', 'Clear filters')
        };
      case 'alerts':
        return {
          title: t('search:emptyAlertsTitle', 'No alerts yet'),
          message: t('search:emptyAlertsMessage', 'Create your first search alert to get notified when new cars matching your criteria are listed.'),
          actionText: t('search:searchForCars', 'Search for cars')
        };
      case 'favorites':
        return {
          title: t('search:emptyFavoritesTitle', 'No favorites yet'),
          message: t('search:emptyFavoritesMessage', 'Start exploring and save cars you like. Your favorites will appear here.'),
          actionText: t('search:browseCars', 'Browse cars')
        };
      default:
        return {
          title: t('search:emptyStateTitle', 'Nothing here yet'),
          message: t('search:emptyStateMessage', 'There\'s nothing to show at the moment.'),
          actionText: t('search:getStarted', 'Get started')
        };
    }
  };

  const defaultContent = getDefaultContent();
  const displayTitle = title || defaultContent.title;
  const displayMessage = message || defaultContent.message;

  return (
    <div className={`text-center py-16 px-6 ${className}`}>
      {/* Illustration */}
      <div className="flex justify-center mb-6">
        {getIllustration()}
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto">
        <h3 className={`text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3 ${isRTL ? 'text-center' : 'text-center'}`}>
          {displayTitle}
        </h3>
        <p className={`text-gray-500 dark:text-gray-400 mb-8 leading-relaxed ${isRTL ? 'text-center' : 'text-center'}`}>
          {displayMessage}
        </p>

        {/* Action Button */}
        {actionButton && (
          actionButton.href ? (
            <a
              href={actionButton.href}
              className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {actionButton.icon && (
                <span>
                  {actionButton.icon}
                </span>
              )}
              {actionButton.text}
            </a>
          ) : (
            <button
              onClick={actionButton.onClick}
              className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}
            >
              {actionButton.icon && (
                <span>
                  {actionButton.icon}
                </span>
              )}
              {actionButton.text}
            </button>
          )
        )}
      </div>
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;

"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageDirection } from '@/utils/languageDirection';
import { 
  MdDirectionsCar,
  MdRateReview,
  MdSync,
  MdDashboard
} from 'react-icons/md';
import { TabType, TabConfig } from '../types';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const { t } = useTranslation(['datamanagement']);
  const { isRTL } = useLanguageDirection();

  const tabs: TabConfig[] = [
    {
      id: 'manual',
      name: t('datamanagement:manualManagement'),
      icon: MdDirectionsCar,
      description: t('datamanagement:manualManagementDesc')
    },
    {
      id: 'review',
      name: t('datamanagement:reviewQueue'),
      icon: MdRateReview,
      description: t('datamanagement:reviewQueueDesc')
    },
    {
      id: 'sync',
      name: t('datamanagement:syncOperations'),
      icon: MdSync,
      description: t('datamanagement:syncOperationsDesc')
    },
    {
      id: 'overview',
      name: t('datamanagement:overview'),
      icon: MdDashboard,
      description: t('datamanagement:overviewDesc')
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className={`flex ${isRTL ? 'flex-row-reverse' : ''} space-x-8 ${isRTL ? 'space-x-reverse' : ''} px-6`}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Tab Description */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {tabs.find(tab => tab.id === activeTab)?.description}
        </p>
      </div>
    </div>
  );
};

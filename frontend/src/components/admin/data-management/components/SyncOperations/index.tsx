"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageDirection } from '@/utils/languageDirection';
import { MdRefresh, MdBarChart, MdDirectionsCar, MdCheckCircle, MdInfo } from 'react-icons/md';
import { SyncStatus } from '../../types';

interface SyncOperationsProps {
  syncStatus: SyncStatus | null;
  loading: boolean;
  onSync: (source: 'carquery' | 'syriancars') => void;
  syncingCarQuery?: boolean;
  syncingSyrianCars?: boolean;
}

export const SyncOperations: React.FC<SyncOperationsProps> = ({
  syncStatus,
  loading,
  onSync,
  syncingCarQuery = false,
  syncingSyrianCars = false
}) => {
  const { t } = useTranslation(['datamanagement']);
  const { isRTL, flexClass } = useLanguageDirection();
  
  const isCarQuerySyncing = syncStatus?.carquery?.status === 'IN_PROGRESS' || syncingCarQuery;
  const isSyrianCarsSyncing = syncStatus?.syriancars?.status === 'IN_PROGRESS' || syncingSyrianCars;

  // Debug logging
  console.log('🔍 [SyncOperations] Render state:', {
    syncingCarQuery,
    syncingSyrianCars,
    isCarQuerySyncing,
    isSyrianCarsSyncing,
    carQueryStatus: syncStatus?.carquery?.status,
    syrianCarsStatus: syncStatus?.syriancars?.status
  });

  return (
    <div className="p-6">
      <div className={`flex flex-col lg:${flexClass} lg:items-center lg:justify-between gap-6 mb-6`}>
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('datamanagement:syncOperations')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('datamanagement:syncOperationsDesc')}
          </p>
        </div>
        
        <div className={`flex flex-wrap items-center ${isRTL ? 'gap-x-reverse' : ''} gap-3`}>
          <button
            onClick={() => onSync('carquery')}
            disabled={isCarQuerySyncing || loading}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
              isCarQuerySyncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isCarQuerySyncing
              ? `Syncing: ${syncStatus?.carquery?.lastSyncMessage || 'In progress...'}` 
              : 'Import data from CarQuery API'}
          >
            <MdRefresh className={`w-4 h-4 ${isCarQuerySyncing ? 'animate-spin' : ''}`} />
            {isCarQuerySyncing ? t('datamanagement:syncing') : t('datamanagement:syncCarQuery')}
          </button>
          
          <button
            onClick={() => onSync('syriancars')}
            disabled={isSyrianCarsSyncing || loading}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
              isSyrianCarsSyncing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-600 hover:bg-orange-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isSyrianCarsSyncing
              ? `Syncing: ${syncStatus?.syriancars?.lastSyncMessage || 'In progress...'}` 
              : 'Import data from SyrianCars'}
          >
            <MdRefresh className={`w-4 h-4 ${isSyrianCarsSyncing ? 'animate-spin' : ''}`} />
            {isSyrianCarsSyncing ? t('datamanagement:syncing') : t('datamanagement:syncSyrianCars')}
          </button>
        </div>
      </div>

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* CarQuery Status */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <MdBarChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">CarQuery API</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">External car database</p>
            </div>
          </div>
          {syncStatus?.carquery && (
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                syncStatus.carquery.status !== 'FAILED' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {syncStatus.carquery.status !== 'FAILED' ? (
                  <>
                    <MdCheckCircle className="w-4 h-4" />
                    Available
                  </>
                ) : (
                  <>
                    <MdInfo className="w-4 h-4" />
                    Blocked
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {syncStatus.carquery.lastSyncMessage || 'No sync message available'}
              </p>
            </div>
          )}
        </div>

        {/* SyrianCars Status */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <MdDirectionsCar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">SyrianCars.net</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Local car marketplace</p>
            </div>
          </div>
          {syncStatus?.syriancars && (
            <div className="space-y-2">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                syncStatus.syriancars.status !== 'FAILED' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {syncStatus.syriancars.status !== 'FAILED' ? (
                  <>
                    <MdCheckCircle className="w-4 h-4" />
                    Available
                  </>
                ) : (
                  <>
                    <MdInfo className="w-4 h-4" />
                    Blocked
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {syncStatus.syriancars.lastSyncMessage || 'No sync message available'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

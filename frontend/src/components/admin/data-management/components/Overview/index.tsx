"use client";

import React from 'react';
import { MdDirectionsCar, MdCheckCircle, MdSettings, MdBarChart } from 'react-icons/md';
import { DataStatistics } from '../../types';

interface OverviewProps {
  statistics: DataStatistics | null;
}

export const Overview: React.FC<OverviewProps> = ({ statistics }) => {

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <MdDirectionsCar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Brands</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics?.totalBrands || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <MdCheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Brands</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics?.activeBrands || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <MdSettings className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Models</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics?.totalModels || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <MdBarChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Models</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{statistics?.activeModels || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-8">
        <MdBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Data Analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Detailed analytics and reporting features coming soon
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            📊 Future features: Data source breakdown, usage trends, quality metrics, and export reports
          </p>
        </div>
      </div>
    </div>
  );
};

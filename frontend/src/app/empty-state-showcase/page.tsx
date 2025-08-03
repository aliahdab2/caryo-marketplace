'use client';

import { useState } from 'react';
import { FaSearch, FaBell, FaHeart, FaCar } from 'react-icons/fa';
import EmptyState from '@/components/ui/EmptyState';

export default function EmptyStateShowcasePage() {
  const [selectedType, setSelectedType] = useState<'search' | 'alerts' | 'favorites' | 'general'>('search');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Empty State Component Showcase
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Beautiful empty states inspired by Blocket design
          </p>
        </div>

        {/* Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
            {(['search', 'alerts', 'favorites', 'general'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Showcase Area */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <EmptyState
              type={selectedType}
              actionButton={{
                text: selectedType === 'search' ? 'Clear filters' : 
                      selectedType === 'alerts' ? 'Search for cars' :
                      selectedType === 'favorites' ? 'Browse cars' : 'Get started',
                onClick: () => alert(`${selectedType} action clicked!`),
                icon: selectedType === 'search' ? <FaSearch className="w-4 h-4" /> :
                      selectedType === 'alerts' ? <FaBell className="w-4 h-4" /> :
                      selectedType === 'favorites' ? <FaHeart className="w-4 h-4" /> : <FaCar className="w-4 h-4" />
              }}
            />
          </div>
        </div>

        {/* Description */}
        <div className="max-w-2xl mx-auto mt-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">🎨 Beautiful Illustrations</h3>
              <p>Custom SVG-style illustrations for each empty state type</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">🌐 RTL Support</h3>
              <p>Full right-to-left layout support for Arabic interface</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">⚡ Smooth Animations</h3>
              <p>Subtle animations and hover effects for better UX</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">🔄 Configurable</h3>
              <p>Customizable titles, messages, and action buttons</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

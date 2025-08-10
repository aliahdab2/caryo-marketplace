'use client';

import React from 'react';
import Link from 'next/link';
import { Camera, TestTube, Settings, Play, Image as ImageIcon, Video } from 'lucide-react';

export default function TestHubPage() {
  const testComponents = [
    {
      id: 'gallery',
      title: 'Car Media Gallery',
      description: 'Test the CarMediaGallery component with various image and video configurations',
      icon: <Camera className="w-6 h-6" />,
      href: '/test/gallery',
      features: [
        'Multiple images with navigation',
        'Video support (YouTube embeds)',
        'Modal/lightbox functionality',
        'Touch/swipe gestures',
        'Keyboard navigation',
        'Responsive design'
      ],
      status: 'Available'
    },
    {
      id: 'components',
      title: 'UI Components',
      description: 'Test various UI components used throughout the application',
      icon: <Settings className="w-6 h-6" />,
      href: '/test/components',
      features: [
        'Buttons and forms',
        'Cards and layouts',
        'Icons and animations',
        'Loading states'
      ],
      status: 'Coming Soon'
    },
    {
      id: 'api',
      title: 'API Testing',
      description: 'Test API endpoints and data fetching functionality',
      icon: <TestTube className="w-6 h-6" />,
      href: '/test/api',
      features: [
        'Car listings API',
        'Authentication flows',
        'Image upload',
        'Search functionality'
      ],
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            CarYo Test Hub
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Development and testing environment for CarYo Marketplace components and features
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ImageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Components</h3>
                <p className="text-gray-600 dark:text-gray-300">1 Available</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Media Types</h3>
                <p className="text-gray-600 dark:text-gray-300">Images & Videos</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Play className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Interactive</h3>
                <p className="text-gray-600 dark:text-gray-300">Live Testing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Components Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {testComponents.map((component) => (
            <div
              key={component.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      {component.icon}
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {component.title}
                      </h3>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                        component.status === 'Available' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {component.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {component.description}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Features:</h4>
                  <ul className="space-y-1">
                    {component.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                {component.status === 'Available' ? (
                  <Link
                    href={component.href}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Test Component
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Development Notes */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Development Notes
          </h3>
          <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <p>• This test hub is for development and testing purposes only</p>
            <p>• Use these pages to validate component behavior before deployment</p>
            <p>• Test different screen sizes and device types for responsive design</p>
            <p>• Report any issues or unexpected behavior to the development team</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
          >
            ← Back to Main Site
          </Link>
        </div>
      </div>
    </div>
  );
}

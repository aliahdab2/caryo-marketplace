'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import CarMediaGallery from '@/components/CarMediaGallery/CarMediaGallery';
import { CarMedia } from '@/components/CarMediaGallery/types';
import { ArrowLeft, Settings, RotateCcw, Play } from 'lucide-react';

export default function GalleryTestPage() {
  const [selectedScenario, setSelectedScenario] = useState('full');
  const [initialIndex, setInitialIndex] = useState(0);

  // Sample media scenarios for testing
  const mediaScenarios = {
    full: {
      title: 'Full Gallery (Images + Video)',
      description: 'Complete gallery with multiple images and a video. Images appear in main slider, videos show as thumbnails below.',
      media: [
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=80',
          alt: 'BMW Car - Front View',
          width: 800,
          height: 600,
        },
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&auto=format&fit=crop&q=80',
          alt: 'BMW Car - Interior Dashboard',
          width: 800,
          height: 600,
        },
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80',
          alt: 'BMW Car - Side Profile',
          width: 800,
          height: 600,
        },
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1563720360172-67b8f3dce741?w=1200&auto=format&fit=crop&q=80',
          alt: 'BMW Car - Rear View',
          width: 800,
          height: 600,
        },
        {
          type: 'video' as const,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnailUrl: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=1200&auto=format&fit=crop&q=80',
          alt: 'Car Video Tour',
        },
      ] as CarMedia[]
    },
    imagesOnly: {
      title: 'Images Only',
      description: 'Gallery with only images, no video content',
      media: [
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=1200&auto=format&fit=crop&q=80',
          alt: 'Mercedes-Benz C-Class - Front View',
          width: 800,
          height: 600,
        },
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop&q=80',
          alt: 'Mercedes-Benz C-Class - Interior',
          width: 800,
          height: 600,
        },
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop&q=80',
          alt: 'Mercedes-Benz C-Class - Driving Shot',
          width: 800,
          height: 600,
        },
      ] as CarMedia[]
    },
    videoOnly: {
      title: 'Video Only',
      description: 'Gallery with only a video (for video-centric listings)',
      media: [
        {
          type: 'video' as const,
          url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=1200&auto=format&fit=crop&q=80',
          alt: 'Tesla Model S - Complete Video Tour',
        },
      ] as CarMedia[]
    },
    single: {
      title: 'Single Image',
      description: 'Gallery with only one image',
      media: [
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop&q=80',
          alt: 'Audi A4 - Single View',
          width: 800,
          height: 600,
        },
      ] as CarMedia[]
    },
    empty: {
      title: 'Empty Gallery',
      description: 'Gallery with no media items (error handling test)',
      media: [] as CarMedia[]
    },
    fallback: {
      title: 'Fallback Images',
      description: 'Gallery with reliable placeholder images for testing',
      media: [
        {
          type: 'image' as const,
          url: 'https://picsum.photos/800/600?random=1&automotive',
          alt: 'Test Car Image 1',
          width: 800,
          height: 600,
        },
        {
          type: 'image' as const,
          url: 'https://picsum.photos/800/600?random=2&automotive',
          alt: 'Test Car Image 2',
          width: 800,
          height: 600,
        },
        {
          type: 'image' as const,
          url: 'https://picsum.photos/800/600?random=3&automotive',
          alt: 'Test Car Image 3',
          width: 800,
          height: 600,
        },
      ] as CarMedia[]
    },
    multipleVideos: {
      title: 'Multiple Videos Test',
      description: 'Testing multiple video handling (should show only first video)',
      media: [
        {
          type: 'image' as const,
          url: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=1200&auto=format&fit=crop&q=80',
          alt: 'Porsche 911 - Front View',
          width: 800,
          height: 600,
        },
        {
          type: 'video' as const,
          url: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
          thumbnailUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=1200&auto=format&fit=crop&q=80',
          alt: 'Porsche 911 - First Video Tour',
        },
        {
          type: 'video' as const,
          url: 'https://www.youtube.com/watch?v=sTJ7AzBIJoI',
          thumbnailUrl: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop&q=80',
          alt: 'Porsche 911 - Second Video Tour',
        },
      ] as CarMedia[]
    }
  };

  const currentScenario = mediaScenarios[selectedScenario as keyof typeof mediaScenarios];

  const resetGallery = () => {
    setInitialIndex(0);
    // Force re-render by changing key
    const gallery = document.querySelector('.gallery-container');
    if (gallery) {
      gallery.setAttribute('key', Math.random().toString());
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center mb-2">
              <Link 
                href="/test" 
                className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Test Hub
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Car Media Gallery Test
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Test the CarMediaGallery component with various configurations
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-center mb-4">
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Test Controls</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {/* Scenario Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Test Scenario
              </label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {Object.entries(mediaScenarios).map(([key, scenario]) => (
                  <option key={key} value={key}>
                    {scenario.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Initial Index */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Starting Image Index
              </label>
              <input
                type="number"
                min="0"
                max={Math.max(0, currentScenario.media.length - 1)}
                value={initialIndex}
                onChange={(e) => setInitialIndex(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Reset Button */}
            <div className="flex items-end">
              <button
                onClick={resetGallery}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Gallery
              </button>
            </div>
          </div>

          {/* Scenario Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              {currentScenario.title}
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              {currentScenario.description}
            </p>
            <div className="flex items-center text-sm text-blue-700 dark:text-blue-300">
              <span className="mr-4">
                Images: {currentScenario.media.filter(m => m.type === 'image').length}
              </span>
              <span>
                Videos: {currentScenario.media.filter(m => m.type === 'video').length}
              </span>
            </div>
          </div>
        </div>

        {/* CarMediaGallery Component Test */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Debug info */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 border-b">
              <span>Debug: Total media: {currentScenario.media.length} | Images: {currentScenario.media.filter(m => m.type === 'image').length} | Videos: {currentScenario.media.filter(m => m.type === 'video').length} | Scenario: {selectedScenario} | Initial index: {initialIndex}</span>
            </div>
            
            {/* Pure Gallery Component Test */}
            <div className="p-4">
              <CarMediaGallery
                media={currentScenario.media}
                initialIndex={initialIndex}
                className="w-full"
                key={`${selectedScenario}-${initialIndex}`} // Force re-render when scenario or index changes
              />
            </div>
          </div>
        </div>

        {/* Testing Notes */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
            Testing Instructions
          </h3>
          
          {/* Mixed Media Explanation */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">📹 Mixed Media Behavior:</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              When you have both images and videos (like "Full Gallery"), images appear in the main slider, 
              and videos show as clickable thumbnails below with a "Video Content" section header.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800 dark:text-yellow-200">
            <div>
              <h4 className="font-medium mb-2">Desktop Testing:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Click images to open modal</li>
                <li>Use arrow keys for navigation</li>
                <li>Use arrow buttons to navigate</li>
                <li>Press ESC to close modal</li>
                <li>Click video thumbnails to play</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Mobile Testing:</h4>
              <ul className="space-y-1 list-disc list-inside">
                <li>Swipe left/right to navigate</li>
                <li>Tap images to open modal</li>
                <li>Test touch gestures</li>
                <li>Verify responsive layout</li>
                <li>Tap video thumbnails to play</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

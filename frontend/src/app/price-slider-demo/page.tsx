"use client";

import React, { useState } from 'react';
import PriceSlider from '@/components/ui/PriceSlider';
import { formatCurrency } from '@/utils/currency';

const PriceSliderDemo: React.FC = () => {
  const [minPrice, setMinPrice] = useState<number | undefined>(10000);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(50000);

  const handlePriceChange = (min: number | undefined, max: number | undefined) => {
    setMinPrice(min);
    setMaxPrice(max);
    console.log('Price range changed:', { min, max });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Price Slider Demo
          </h1>
          
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Interactive Price Range Slider
            </h2>
            <p className="text-gray-600 mb-6">
              This is a custom price slider component built for the Caryo Marketplace. 
              It features dual-range selection with both slider controls and input fields.
            </p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <PriceSlider
                minPrice={minPrice}
                maxPrice={maxPrice}
                minRange={0}
                maxRange={150000}
                step={1000}
                currency="USD"
                onChange={handlePriceChange}
                className="mb-4"
              />
            </div>
          </div>

          {/* Current Values Display */}
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Current Selection</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm text-blue-600 mb-1">Minimum Price</div>
                <div className="text-2xl font-bold text-blue-900">
                  {minPrice ? formatCurrency(minPrice, 'USD') : 'Any'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-blue-600 mb-1">Maximum Price</div>
                <div className="text-2xl font-bold text-blue-900">
                  {maxPrice ? formatCurrency(maxPrice, 'USD') : 'Any'}
                </div>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Dual-range slider with visual feedback
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Manual input fields for precise values
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Currency formatting with project&apos;s currency utils
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Touch and mouse support
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Configurable range, steps, and currency
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Debounced onChange events for performance
              </li>
            </ul>
          </div>

          {/* Integration Info */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-green-800 font-semibold mb-2">✅ Integration Complete</h4>
            <p className="text-green-700 text-sm">
              The price slider has been successfully integrated into the FilterModals component 
              and is ready to use in the price filter modal of the Caryo Marketplace search.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceSliderDemo;

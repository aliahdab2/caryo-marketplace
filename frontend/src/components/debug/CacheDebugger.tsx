'use client';
import { useState, useEffect } from 'react';
import { getCacheStats } from '@/utils/cachedFetch';

export const CacheDebugger = () => {
  const [stats, setStats] = useState({ size: 0, maxSize: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(getCacheStats());
    };

    // Update stats every 2 seconds
    const interval = setInterval(updateStats, 2000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white px-3 py-2 rounded text-sm font-mono"
      >
        Cache: {stats.size}/{stats.maxSize}
      </button>
      
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-gray-800 text-white p-4 rounded shadow-lg min-w-64">
          <h3 className="font-bold mb-2">Cache Statistics</h3>
          <div className="text-sm space-y-1">
            <div>Entries: {stats.size}</div>
            <div>Max Size: {stats.maxSize}</div>
            <div>Usage: {Math.round((stats.size / stats.maxSize) * 100)}%</div>
          </div>
          <div className="mt-3 text-xs text-gray-300">
            <div>• CACHE HIT = Using cached data</div>
            <div>• CACHE MISS = Fetching from API</div>
          </div>
        </div>
      )}
    </div>
  );
}; 
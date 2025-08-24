'use client';

import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import { useState, useEffect } from 'react';

/**
 * Debug component to help diagnose authentication issues
 * Shows current session data and localStorage contents
 */
export default function AuthDebugger() {
  const { user, status } = useOptimizedSession();
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});

  useEffect(() => {
    // Read localStorage data
    const data: Record<string, string> = {};
    try {
      data.authToken = localStorage.getItem('authToken') || 'null';
      data.username = localStorage.getItem('username') || 'null';
      data.userRoles = localStorage.getItem('userRoles') || 'null';
    } catch (error) {
      console.error('Error reading localStorage:', error);
    }
    setLocalStorageData(data);
  }, [user, status]);

  const clearAllAuthData = () => {
    try {
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      localStorage.removeItem('userRoles');
      
      // Also clear any NextAuth session data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('nextauth') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Reload the page to refresh session
      window.location.reload();
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Auth Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Session Status:</strong> {status}
        </div>
        
        <div>
          <strong>User ID:</strong> {user?.id || 'null'}
        </div>
        
        <div>
          <strong>User Name:</strong> {user?.name || 'null'}
        </div>
        
        <div>
          <strong>User Email:</strong> {user?.email || 'null'}
        </div>
        
        <div>
          <strong>User Roles:</strong> {user?.roles ? JSON.stringify(user.roles) : 'null'}
        </div>
        
        <div>
          <strong>Is Admin:</strong> {user?.isAdmin ? 'true' : 'false'}
        </div>
        
        <hr className="my-3" />
        
        <div>
          <strong>localStorage username:</strong> {localStorageData.username}
        </div>
        
        <div>
          <strong>localStorage authToken:</strong> {localStorageData.authToken ? 'present' : 'null'}
        </div>
        
        <div>
          <strong>localStorage userRoles:</strong> {localStorageData.userRoles}
        </div>
      </div>
      
      <button
        onClick={clearAllAuthData}
        className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
      >
        Clear All Auth Data & Reload
      </button>
    </div>
  );
}

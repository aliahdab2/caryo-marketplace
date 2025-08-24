'use client';

import { useOptimizedSession } from '@/hooks/useOptimizedSession';
import { useState, useEffect } from 'react';
import { signOut, signIn } from 'next-auth/react';

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

  const fixUserRoles = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        alert('No auth token found. Please log in first.');
        return;
      }

      const response = await fetch('http://localhost:8080/api/auth/fix-roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        alert('Success: ' + data.message);
        // Reload to refresh session with new roles
        window.location.reload();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error fixing roles:', error);
      alert('Error fixing roles: ' + error);
    }
  };

  const refreshSession = async () => {
    try {
      // Sign out and back in to get fresh session with roles
      await signOut({ redirect: false });
      setTimeout(() => {
        signIn('google');
      }, 1000);
    } catch (error) {
      console.error('Error refreshing session:', error);
      alert('Error refreshing session: ' + error);
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
      
      <div className="mt-4 space-y-2">
        <button
          onClick={refreshSession}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm"
        >
          Refresh Session (Get New Token)
        </button>
        
        <button
          onClick={fixUserRoles}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm"
        >
          Fix Missing Roles
        </button>
        
        <button
          onClick={clearAllAuthData}
          className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
        >
          Clear All Auth Data & Reload
        </button>
      </div>
    </div>
  );
}

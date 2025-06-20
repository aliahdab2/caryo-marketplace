"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastProps } from './Toast';

interface ToastItem extends Omit<ToastProps, 'visible' | 'onClose'> {
  id: string;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = generateId();
    const newToast: ToastItem = { ...toast, id };

    setToasts(prev => {
      const updated = [newToast, ...prev];
      // Limit the number of toasts
      return updated.slice(0, maxToasts);
    });

    return id;
  }, [generateId, maxToasts]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const contextValue: ToastContextType = {
    showToast,
    hideToast,
    clearAllToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      
      {/* Render toasts */}
      <div className="fixed top-5 right-5 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast, index) => (
          <div 
            key={toast.id} 
            className="pointer-events-auto"
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 50 - index 
            }}
          >
            <Toast
              {...toast}
              visible={true}
              onClose={() => hideToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Convenience hooks for different toast types
export function useToastHelpers() {
  const { showToast } = useToast();

  return {
    showSuccess: useCallback((message: string, title?: string) => 
      showToast({ type: 'success', message, title }), [showToast]),
    
    showError: useCallback((message: string, title?: string) => 
      showToast({ type: 'error', message, title }), [showToast]),
    
    showWarning: useCallback((message: string, title?: string) => 
      showToast({ type: 'warning', message, title }), [showToast]),
    
    showInfo: useCallback((message: string, title?: string) => 
      showToast({ type: 'info', message, title }), [showToast])
  };
}

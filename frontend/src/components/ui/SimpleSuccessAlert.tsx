"use client";

import React, { useEffect, useState } from 'react';
import type { SimpleSuccessAlertProps } from '@/types/ui';

export default function SimpleSuccessAlert({
  visible = true,
  onComplete,
  autoHideDuration = 3000,
  message = "Success!",
  className = ''
}: SimpleSuccessAlertProps) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    setIsVisible(visible);
    
    if (visible && autoHideDuration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [visible, autoHideDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div 
      id="success" 
      className={`cb-container ${className}`} 
      role="alert" 
      style={{
        display: 'grid',
        visibility: 'visible',
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        padding: '16px',
      }}
    >
      <svg 
        id="success-i" 
        viewBox="0 0 52 52" 
        aria-hidden="true" 
        style={{ 
          display: 'block',
          visibility: 'visible',
          width: '24px',
          height: '24px'
        }}
      >
        <circle 
          className="success-circle" 
          cx="26" 
          cy="26" 
          r="25" 
          style={{ 
            fill: '#22c55e',
            stroke: '#22c55e',
            strokeWidth: '2'
          }}
        />
        <path 
          className="p1" 
          d="m13,26l9.37,9l17.63,-18" 
          style={{ 
            fill: 'none',
            stroke: 'white',
            strokeWidth: '3',
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          }}
        />
      </svg>
      <span id="success-text" style={{ fontWeight: 500 }}>{message}</span>
    </div>
  );
}

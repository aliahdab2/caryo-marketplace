"use client";

import React, { useEffect, useState } from 'react';
import type { SuccessAlertProps } from '@/types/ui'; // Use SuccessAlertProps directly

// Define the spinner style CSS
const spinnerStyle = `
  @keyframes spinner {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0.15;
    }
  }
  .spinner-animation g line {
    animation-name: spinner;
    animation-duration: 0.75s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
  }
  .spinner-animation g line:nth-child(1) {
    animation-delay: 0.00s;
  }
  .spinner-animation g line:nth-child(2) {
    animation-delay: 0.09s;
  }
  .spinner-animation g line:nth-child(3) {
    animation-delay: 0.18s;
  }
  .spinner-animation g line:nth-child(4) {
    animation-delay: 0.27s;
  }
  .spinner-animation g line:nth-child(5) {
    animation-delay: 0.36s;
  }
  .spinner-animation g line:nth-child(6) {
    animation-delay: 0.45s;
  }
  .spinner-animation g line:nth-child(7) {
    animation-delay: 0.54s;
  }
  .spinner-animation g line:nth-child(8) {
    animation-delay: 0.63s;
  }
  
  .success-circle {
    stroke-dasharray: 166;
    stroke-dashoffset: 166;
    stroke-width: 2;
    stroke-miterlimit: 10;
    stroke: white;
    fill: none;
    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
  }
  
  .success-checkmark {
    transform-origin: 50% 50%;
    stroke-dasharray: 48;
    stroke-dashoffset: 48;
    stroke-width: 3;
    animation: stroke 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
  }
  
  @keyframes stroke {
    100% {
      stroke-dashoffset: 0;
    }
  }
`;

export default function SuccessAlert({
  message = "Success!",
  visible = false, // This 'visible' comes from AlertProps now
  onComplete,
  autoHideDuration = 3000,
  className = ''
}: SuccessAlertProps) { // Use SuccessAlertProps directly
  const [isVisible, setIsVisible] = useState(visible);
  const [animationComplete, setAnimationComplete] = useState(false);

  // Handle visibility changes
  useEffect(() => {
    setIsVisible(visible);
    
    if (visible) {
      setAnimationComplete(false);
      
      // Animation happens for 800ms, then we show as completed
      const animationTimer = setTimeout(() => {
        setAnimationComplete(true);
        
        // Auto-hide after specified duration
        if (autoHideDuration) {
          const hideTimer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) {
              onComplete();
            }
          }, autoHideDuration);
          
          return () => clearTimeout(hideTimer);
        }
      }, 800);
      
      return () => clearTimeout(animationTimer);
    }
  }, [visible, autoHideDuration, onComplete]);

  // Always render the component to avoid layout shifts, but control visibility
  if (!isVisible) return null;

  return (
    <>
      <style jsx>{spinnerStyle}</style>
      <div
        id="success"
        className={`cb-container fixed top-5 right-5 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center gap-3 transition-all duration-300 ease-in-out ${className}`}
        role="alert"
        style={{
          display: isVisible ? 'flex' : 'none', // Use display none when not visible
          visibility: isVisible ? 'visible' : 'hidden',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
          position: 'fixed', // Ensure it's fixed positioned
          pointerEvents: isVisible ? 'auto' : 'none' // Prevent interactions when hidden
        }}
      >
        {/* Animated checkmark */}
        <div className="relative w-10 h-10">
          {/* Loading spinner (visible during animation) */}
          <svg
            className={`absolute inset-0 w-10 h-10 text-blue-500 transition-opacity duration-300 ${
              animationComplete ? 'opacity-0' : 'opacity-100 spinner-animation'
            }`}
            viewBox="0 0 30 30"
            style={{ display: animationComplete ? 'none' : 'block' }}
          >
            <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="15" x2="15" y1="7.5" y2="0"></line>
              <line x1="20.303" x2="23.787" y1="9.697" y2="5.303"></line>
              <line x1="22.5" x2="30" y1="15" y2="15"></line>
              <line x1="20.303" x2="23.787" y1="20.303" y2="24.697"></line>
              <line x1="15" x2="15" y1="22.5" y2="30"></line>
              <line x1="9.697" x2="5.303" y1="20.303" y2="23.787"></line>
              <line x1="7.5" x2="0" y1="15" y2="15"></line>
              <line x1="9.697" x2="5.303" y1="9.697" y2="5.303"></line>
            </g>
          </svg>

          {/* Success checkmark (appears after animation) */}
          <svg
            className={`absolute inset-0 w-10 h-10 transition-opacity duration-500 ${
              animationComplete ? 'opacity-100' : 'opacity-0'
            }`}
            viewBox="0 0 52 52"
            aria-hidden="true"
            style={{ display: animationComplete ? 'block' : 'none' }}
          >
            <circle 
              className="success-circle stroke-green-500" 
              cx="26" 
              cy="26" 
              r="25"
              fill="rgb(34, 197, 94)"
            />
            <path 
              className="success-checkmark stroke-white" 
              fill="none" 
              d="m13,26l9.37,9l17.63,-18"
            />
          </svg>
        </div>

        {/* Success text */}
        <span 
          className="text-gray-900 dark:text-white font-medium text-sm"
        >
          {message}
        </span>
      </div>
    </>
  );
}

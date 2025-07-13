import React, { ReactNode, useEffect, useState } from 'react';

interface SmoothTransitionProps {
  children: ReactNode;
  isLoading: boolean;
  loadingComponent: ReactNode;
  className?: string;
  minimumLoadingTime?: number; // Minimum time to show loading state
  loadingType?: 'full' | 'overlay'; // Type of loading display
}

/**
 * Component to provide smooth transitions between loading and content states
 * Prevents jarring flashes by ensuring a minimum loading time
 */
export const SmoothTransition: React.FC<SmoothTransitionProps> = ({
  children,
  isLoading,
  loadingComponent,
  className = '',
  minimumLoadingTime = 200,
  loadingType = 'full'
}) => {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      setShowLoading(true);
      setLoadingStartTime(Date.now());
    } else if (loadingStartTime) {
      const elapsed = Date.now() - loadingStartTime;
      const remainingTime = Math.max(0, minimumLoadingTime - elapsed);
      
      setTimeout(() => {
        setShowLoading(false);
        setLoadingStartTime(null);
      }, remainingTime);
    } else {
      setShowLoading(false);
    }
  }, [isLoading, loadingStartTime, minimumLoadingTime]);

  if (loadingType === 'overlay') {
    return (
      <div className={`relative ${className}`}>
        {children}
        {showLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm transition-opacity duration-200 flex items-center justify-center z-10">
            {loadingComponent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-200 ${className}`}>
      {showLoading ? loadingComponent : children}
    </div>
  );
};

export default SmoothTransition;

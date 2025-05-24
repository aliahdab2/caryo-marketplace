'use client';

import React from 'react';
import { useResponsive } from '@/utils/responsive';
import type { ResponsiveContainerProps } from '@/types/responsive';

/**
 * A responsive container component that adjusts width based on screen size
 * with improved fluid scaling between breakpoints
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  as: Component = 'div',
  fluid = false,
  maxWidth = null,
  padding = null,
  scale = 'hybrid',
}) => {
  // Define different container strategies
  const containerStrategies = {
    // Original step-based implementation with hard breakpoints
    step: fluid
      ? 'w-full px-2 xxs:px-3 xs:px-4 sm:px-6 lg:px-8'
      : 'mx-auto w-full max-w-[98%] xxs:max-w-[96%] xs:max-w-[95%] sm:max-w-[90%] md:max-w-6xl lg:max-w-7xl px-1.5 xxs:px-2 xs:px-3 sm:px-4 lg:px-6',
    
    // Fully fluid implementation using calc(), clamp(), and viewport units
    fluid: fluid
      ? 'w-full px-[calc(0.5rem+1vw)]'
      : 'mx-auto w-[calc(100%-2rem)] max-w-[min(1400px,98%)] px-[max(0.5rem,calc(1rem+0.5vw))]',
    
    // Hybrid approach combining both fluid scaling and breakpoints
    hybrid: fluid
      ? 'w-full px-[calc(0.5rem+0.5vw)] xxs:px-[calc(0.75rem+0.5vw)] sm:px-[calc(1rem+1vw)] lg:px-[calc(1.5rem+1vw)]'
      : 'mx-auto w-[calc(100%-1rem)] sm:w-[calc(100%-2rem)] md:w-[calc(100%-3rem)] max-w-[clamp(300px,95%,1400px)] px-[max(0.5rem,calc(0.5rem+0.5vw))] sm:px-[max(0.75rem,calc(0.75rem+0.5vw))] lg:px-[max(1rem,calc(1rem+0.5vw))]'
  };
  
  // Use provided strategy or default to hybrid
  const containerBaseClasses = containerStrategies[scale];
  
  // Apply any custom overrides if provided
  const containerClasses = [
    containerBaseClasses,
    maxWidth ? `max-w-[${maxWidth}]` : '',
    padding ? `px-[${padding}]` : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={containerClasses}>
      {children}
    </Component>
  );
};

interface ResponsiveVisibilityProps {
  children: React.ReactNode;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}

/**
 * A component that conditionally renders children based on screen size
 */
export const ResponsiveVisibility: React.FC<ResponsiveVisibilityProps> = ({
  children,
  showOnMobile = true,
  showOnTablet = true,
  showOnDesktop = true,
}) => {
  const { isMobile, isTablet, isDesktop, isMounted } = useResponsive();

  if (!isMounted) return null;
  
  const shouldShow = 
    (isMobile && showOnMobile) || 
    (isTablet && showOnTablet) || 
    (isDesktop && showOnDesktop);
  
  return shouldShow ? <>{children}</> : null;
};

/**
 * A component that only renders on mobile screens
 */
export const MobileOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveVisibility showOnMobile={true} showOnTablet={false} showOnDesktop={false}>
      {children}
    </ResponsiveVisibility>
  );
};

/**
 * A component that only renders on tablet screens
 */
export const TabletOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveVisibility showOnMobile={false} showOnTablet={true} showOnDesktop={false}>
      {children}
    </ResponsiveVisibility>
  );
};

/**
 * A component that only renders on desktop screens
 */
export const DesktopOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveVisibility showOnMobile={false} showOnTablet={false} showOnDesktop={true}>
      {children}
    </ResponsiveVisibility>
  );
};

/**
 * A component that renders on tablet and desktop screens
 */
export const NotOnMobile: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveVisibility showOnMobile={false} showOnTablet={true} showOnDesktop={true}>
      {children}
    </ResponsiveVisibility>
  );
};

/**
 * A component that renders on mobile and tablet screens
 */
export const NotOnDesktop: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ResponsiveVisibility showOnMobile={true} showOnTablet={true} showOnDesktop={false}>
      {children}
    </ResponsiveVisibility>
  );
};

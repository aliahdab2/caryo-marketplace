/**
 * Responsive utilities and helpers for fluid layouts
 */

import { useEffect, useState } from 'react';

// Screen sizes (matching those in tailwind.config.js)
export const BREAKPOINTS = {
  xs: 375,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

/**
 * Generates a fluid value between two points based on viewport size
 * Useful for creating smooth transitions between breakpoints
 * 
 * @param minSize Minimum value (at minWidth)
 * @param maxSize Maximum value (at maxWidth)
 * @param minWidth Minimum viewport width to start scaling
 * @param maxWidth Maximum viewport width to stop scaling
 * @returns CSS calc() function as a string
 */
export const fluidValue = (
  minSize: number,
  maxSize: number,
  minWidth: number = BREAKPOINTS.xs,
  maxWidth: number = BREAKPOINTS.lg,
  unit: string = 'px'
): string => {
  // Calculate the slope and base value for the linear equation
  const slope = (maxSize - minSize) / (maxWidth - minWidth);
  const base = minSize - slope * minWidth;
  
  return `clamp(${minSize}${unit}, ${base.toFixed(4)}${unit} + ${(slope * 100).toFixed(4)}vw, ${maxSize}${unit})`;
};

/**
 * Hook to detect current breakpoint
 * @returns Current breakpoint label: 'xs', 'sm', 'md', 'lg', 'xl', '2xl'
 */
export function useBreakpoint(): BreakpointKey {
  // Default to 'xs' on server side
  const [breakpoint, setBreakpoint] = useState<BreakpointKey>('xs');
  
  useEffect(() => {
    // Function to determine current breakpoint
    const calculateBreakpoint = (): void => {
      const width = window.innerWidth;
      
      if (width >= BREAKPOINTS['2xl']) {
        setBreakpoint('2xl');
      } else if (width >= BREAKPOINTS.xl) {
        setBreakpoint('xl');
      } else if (width >= BREAKPOINTS.lg) {
        setBreakpoint('lg');
      } else if (width >= BREAKPOINTS.md) {
        setBreakpoint('md');
      } else if (width >= BREAKPOINTS.sm) {
        setBreakpoint('sm');
      } else {
        setBreakpoint('xs');
      }
    };
    
    // Calculate initial breakpoint
    calculateBreakpoint();
    
    // Add resize listener
    window.addEventListener('resize', calculateBreakpoint);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', calculateBreakpoint);
    };
  }, []);
  
  return breakpoint;
}

/**
 * Hook to check if the current viewport matches a media query
 * 
 * @param query Media query string, e.g. "(min-width: 768px)"
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);
    
    // Create listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);
  
  return matches;
}

/**
 * Generates spacing values that scale with screen size
 * 
 * @param baseSize Base size (for smallest screen)
 * @param maxSize Maximum size (for largest screen)
 * @param unit CSS unit (px, rem, etc)
 * @returns CSS calc value as a string
 */
export function responsiveSpace(
  baseSize: number,
  maxSize: number = baseSize * 1.5,
  unit: string = 'rem'
): string {
  return fluidValue(baseSize, maxSize, BREAKPOINTS.xs, BREAKPOINTS.xl, unit);
}

/**
 * Generates font sizes that scale properly with screen size
 * Similar to responsiveSpace but with font-specific defaults
 * 
 * @param baseSize Base font size (for smallest screen)
 * @param maxSize Maximum font size (for largest screen)
 * @param unit CSS unit (px, rem, etc)
 * @returns CSS calc value as a string
 */
export function responsiveFontSize(
  baseSize: number,
  maxSize: number = baseSize * 1.25,
  unit: string = 'rem'
): string {
  return fluidValue(baseSize, maxSize, BREAKPOINTS.xs, BREAKPOINTS.xl, unit);
}

/**
 * Hook that provides responsive functionality including breakpoint and various screen size checks
 * @returns Object with current breakpoint and boolean flags for different screen sizes
 */
export function useResponsive() {
  const currentBreakpoint = useBreakpoint();
  const [isMounted, setIsMounted] = useState(false);
  
  const isXs = useMediaQuery(`(max-width: ${BREAKPOINTS.sm - 1}px)`);
  const isSm = useMediaQuery(`(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`);
  const isMd = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
  const isLg = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`);
  const isXl = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS['2xl'] - 1}px)`);
  const is2Xl = useMediaQuery(`(min-width: ${BREAKPOINTS['2xl']}px)`);
  
  const isMobile = isXs || isSm;
  const isTablet = isMd;
  const isDesktop = isLg || isXl || is2Xl;
  
  // Set isMounted to true after the component mounts to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  return {
    breakpoint: currentBreakpoint,
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    isMobile,
    isTablet,
    isDesktop,
    isMounted
  };
}

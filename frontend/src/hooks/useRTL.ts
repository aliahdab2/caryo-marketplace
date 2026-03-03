import { useTranslation } from 'react-i18next';
import { useMemo, useCallback } from 'react';

/**
 * RTL languages configuration
 * Add new RTL languages here as needed
 */
const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur'] as const);

/**
 * SVG path constants for arrow directions
 */
const ARROW_PATHS = {
  LEFT_LTR: 'M15 19l-7-7 7-7',
  LEFT_RTL: 'M9 5l7 7-7 7',
  RIGHT_LTR: 'M9 5l7 7-7 7',
  RIGHT_RTL: 'M15 19l-7-7 7-7',
} as const;

/**
 * RTL utility hook with optimized performance and comprehensive utilities
 * 
 * @example
 * ```tsx
 * const { isRTL, dir, textAlign, marginStart } = useRTL();
 * 
 * return (
 *   <div dir={dir} className={textAlign}>
 *     <span className={marginStart('2')}>Text</span>
 *   </div>
 * );
 * ```
 */
export function useRTL() {
  const { i18n } = useTranslation();
  
  const isRTL = useMemo(() => {
    // First check i18n language
    if (i18n.language && RTL_LANGUAGES.has(i18n.language as 'ar' | 'he' | 'fa' | 'ur')) {
      return true;
    }

    // Fallback to document direction for SSR/hydration cases
    if (typeof document !== 'undefined') {
      const docDir = document.documentElement.dir;
      if (docDir === 'rtl') {
        return true;
      }
    }

    return false;
  }, [i18n.language]);
  
  // Core direction properties
  const dir = isRTL ? 'rtl' : 'ltr';
  const className = isRTL ? 'rtl' : 'ltr';
  const textAlign = isRTL ? 'text-right' : 'text-left';
  const flexDirection = isRTL ? 'flex-row-reverse' : 'flex-row';
  
  // Optimized utility functions with useCallback
  const marginStart = useCallback((size: string) => 
    isRTL ? `mr-${size}` : `ml-${size}`, [isRTL]);
  
  const marginEnd = useCallback((size: string) => 
    isRTL ? `ml-${size}` : `mr-${size}`, [isRTL]);
  
  const paddingStart = useCallback((size: string) => 
    isRTL ? `pr-${size}` : `pl-${size}`, [isRTL]);
  
  const paddingEnd = useCallback((size: string) => 
    isRTL ? `pl-${size}` : `pr-${size}`, [isRTL]);
  
  const borderStart = useCallback((style: string) => 
    isRTL ? `border-r-${style}` : `border-l-${style}`, [isRTL]);
  
  const borderEnd = useCallback((style: string) => 
    isRTL ? `border-l-${style}` : `border-r-${style}`, [isRTL]);
  
  const spaceX = useCallback((size: string) => 
    isRTL ? `space-x-reverse space-x-${size}` : `space-x-${size}`, [isRTL]);
  
  const conditionalClass = useCallback((ltrClass: string, rtlClass: string) => 
    isRTL ? rtlClass : ltrClass, [isRTL]);
  
  const getArrowDirection = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      return isRTL ? ARROW_PATHS.LEFT_RTL : ARROW_PATHS.LEFT_LTR;
    }
    return isRTL ? ARROW_PATHS.RIGHT_RTL : ARROW_PATHS.RIGHT_LTR;
  }, [isRTL]);
  
  // Inline style helpers for complex scenarios
  const getInlineStyles = useCallback(() => ({
    textAlign: isRTL ? 'right' as const : 'left' as const,
    direction: dir as 'rtl' | 'ltr',
    unicodeBidi: 'embed' as const,
  }), [isRTL, dir]);
  
  // Legacy direction object for backward compatibility
  const direction = useMemo(() => ({
    dir,
    className,
    textAlign,
    flexDirection,
    marginStart,
    marginEnd,
    paddingStart,
    paddingEnd,
    borderStart,
    borderEnd,
    spaceX,
  }), [
    dir, className, textAlign, flexDirection,
    marginStart, marginEnd, paddingStart, paddingEnd,
    borderStart, borderEnd, spaceX
  ]);
  
  return {
    // Core properties
    isRTL,
    dir,
    className,
    textAlign,
    flexDirection,
    
    // Utility functions
    marginStart,
    marginEnd,
    paddingStart,
    paddingEnd,
    borderStart,
    borderEnd,
    spaceX,
    conditionalClass,
    getArrowDirection,
    getInlineStyles,
    
    // Legacy compatibility
    direction,
  };
}

export default useRTL;

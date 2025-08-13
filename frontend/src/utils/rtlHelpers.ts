/**
 * RTL Helper Utilities for React Components
 * 
 * These utilities help create RTL-aware class names and layouts
 * without needing to check isRTL in every component.
 */

/**
 * Get RTL-aware spacing classes
 */
export function getRTLSpacing(isRTL: boolean) {
  return {
    // Margin classes
    ml: (size: string) => isRTL ? `mr-${size}` : `ml-${size}`,
    mr: (size: string) => isRTL ? `ml-${size}` : `mr-${size}`,
    ms: (size: string) => `ms-${size}`, // Tailwind handles RTL automatically
    me: (size: string) => `me-${size}`, // Tailwind handles RTL automatically
    
    // Padding classes  
    pl: (size: string) => isRTL ? `pr-${size}` : `pl-${size}`,
    pr: (size: string) => isRTL ? `pl-${size}` : `pr-${size}`,
    
    // Position classes
    left: (size: string) => isRTL ? `right-${size}` : `left-${size}`,
    right: (size: string) => isRTL ? `left-${size}` : `right-${size}`,
    
    // Start/End classes (modern approach)
    start: (size: string) => `start-${size}`, // Tailwind handles RTL automatically
    end: (size: string) => `end-${size}`,     // Tailwind handles RTL automatically
    
    // Space between elements
    spaceX: (size: string) => isRTL ? `space-x-reverse space-x-${size}` : `space-x-${size}`,
    
    // Flex direction
    flexRow: isRTL ? 'flex-row-reverse' : 'flex-row',
  };
}

/**
 * Get RTL-aware arrow directions for SVG paths
 */
export function getRTLArrows(isRTL: boolean) {
  return {
    // Navigation arrows
    leftArrow: isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7",      // Previous in LTR, Next in RTL
    rightArrow: isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7",     // Next in LTR, Previous in RTL
    
    // Chevron arrows (smaller)
    chevronLeft: isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7",
    chevronRight: isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7",
    
    // Expand/collapse arrows  
    expandRight: isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7",
    expandDown: "M19 9l-7 7-7-7",
  };
}

/**
 * Get RTL-aware text alignment classes
 */
export function getRTLText(isRTL: boolean) {
  return {
    textLeft: isRTL ? 'text-right' : 'text-left',
    textRight: isRTL ? 'text-left' : 'text-right',
    textStart: 'text-start', // Tailwind handles RTL automatically
    textEnd: 'text-end',     // Tailwind handles RTL automatically
  };
}

/**
 * Complete RTL helper object for easy use in components
 */
export function createRTLHelpers(isRTL: boolean) {
  return {
    isRTL,
    spacing: getRTLSpacing(isRTL),
    arrows: getRTLArrows(isRTL),
    text: getRTLText(isRTL),
    
    // Quick utility functions
    dir: isRTL ? 'rtl' : 'ltr',
    opposite: !isRTL,
    
    // Conditional class helper
    rtlClass: (ltrClass: string, rtlClass: string) => isRTL ? rtlClass : ltrClass,
  };
}

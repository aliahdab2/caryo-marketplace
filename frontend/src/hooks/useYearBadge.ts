import { useMemo } from 'react';
import { useLanguageDirection } from '@/utils/languageDirection';

/**
 * Configuration for year badge size variants
 */
type YearBadgeSize = 'sm' | 'md' | 'lg';

/**
 * Configuration for year badge position variants
 */
type YearBadgePosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';

/**
 * Props for useYearBadge hook
 */
interface UseYearBadgeProps {
  /** The year to display in the badge */
  year?: number;
  /** Size variant of the badge */
  size?: YearBadgeSize;
  /** Position of the badge relative to its container */
  position?: YearBadgePosition;
  /** Custom z-index for the badge */
  zIndex?: number;
}

/**
 * Return type for useYearBadge hook
 */
interface YearBadgeConfig {
  /** CSS classes for the badge container */
  containerClassName: string;
  /** CSS classes for the badge element */
  badgeClassName: string;
  /** CSS classes for the badge text */
  textClassName: string;
  /** Whether the badge should be rendered */
  shouldRender: boolean;
  /** The formatted year value */
  displayYear: string;
}

/**
 * Size configuration mapping
 */
const SIZE_CONFIG = {
  sm: {
    padding: 'px-2 py-1',
    text: 'text-xs',
    spacing: '2',
    borderRadius: 'rounded-lg'
  },
  md: {
    padding: 'px-3 py-1.5',
    text: 'text-xs',
    spacing: '3',
    borderRadius: 'rounded-xl'
  },
  lg: {
    padding: 'px-4 py-2',
    text: 'text-sm',
    spacing: '4',
    borderRadius: 'rounded-xl'
  }
} as const;

/**
 * Base badge styling that's consistent across all variants
 */
const BASE_BADGE_STYLES = [
  'bg-gradient-to-br from-black/30 via-slate-800/40 to-black/30',
  'backdrop-blur-sm text-white font-semibold shadow-md border border-white/20',
  'transition-all duration-300 ease-out transform-gpu',
  'hover:scale-105 hover:bg-gradient-to-br hover:from-black/60 hover:via-slate-800/70 hover:to-black/60',
  'hover:border-white/30 hover:shadow-lg hover:backdrop-blur-md',
  'select-none' // Prevent text selection
];

/**
 * Custom hook for rendering year badges with consistent styling and RTL support
 * 
 * @example
 * ```tsx
 * const yearBadge = useYearBadge({ 
 *   year: 2023, 
 *   size: 'md', 
 *   position: 'bottom-left' 
 * });
 * 
 * return yearBadge.shouldRender ? (
 *   <div className={yearBadge.containerClassName}>
 *     <div className={yearBadge.badgeClassName}>
 *       <span className={yearBadge.textClassName}>
 *         {yearBadge.displayYear}
 *       </span>
 *     </div>
 *   </div>
 * ) : null;
 * ```
 */
export function useYearBadge({ 
  year, 
  size = 'md', 
  position = 'bottom-left',
  zIndex = 10
}: UseYearBadgeProps): YearBadgeConfig {
  const { isRTL } = useLanguageDirection();

  return useMemo(() => {
    const shouldRender = Boolean(year && year > 0);
    
    if (!shouldRender) {
      return {
        containerClassName: '',
        badgeClassName: '',
        textClassName: '',
        shouldRender: false,
        displayYear: ''
      };
    }

    const config = SIZE_CONFIG[size];
    const spacing = config.spacing;
    
    // Generate position classes with RTL support
    const getPositionClasses = (pos: YearBadgePosition): string => {
      const positions = {
        'bottom-left': `bottom-${spacing} ${isRTL ? 'right' : 'left'}-${spacing}`,
        'bottom-right': `bottom-${spacing} ${isRTL ? 'left' : 'right'}-${spacing}`,
        'top-left': `top-${spacing} ${isRTL ? 'right' : 'left'}-${spacing}`,
        'top-right': `top-${spacing} ${isRTL ? 'left' : 'right'}-${spacing}`
      };
      return positions[pos];
    };

    const containerClassName = `absolute ${getPositionClasses(position)} z-${zIndex}`;

    const badgeClassName = [
      ...BASE_BADGE_STYLES,
      config.padding,
      config.text,
      config.borderRadius
    ].join(' ');

    const textClassName = 'relative tracking-wide drop-shadow-md';

    const displayYear = year?.toString() ?? '';

    return {
      containerClassName,
      badgeClassName,
      textClassName,
      shouldRender,
      displayYear
    };
  }, [year, size, position, isRTL, zIndex]);
}

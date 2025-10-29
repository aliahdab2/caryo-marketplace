"use client";

import React from 'react';
import { useYearBadge } from '@/hooks/useYearBadge';

/**
 * Props for YearBadge component
 */
interface YearBadgeProps {
  /** The year to display in the badge */
  year?: number;
  /** Size variant of the badge */
  size?: 'sm' | 'md' | 'lg';
  /** Position of the badge relative to its container */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  /** Custom z-index for the badge */
  zIndex?: number;
  /** Additional CSS classes for the container */
  className?: string;
}

/**
 * YearBadge component for displaying year information with consistent styling
 *
 * @example
 * ```tsx
 * <div className="relative">
 *   <img src="car-image.jpg" alt="Car" />
 *   <YearBadge year={2023} size="md" position="bottom-left" />
 * </div>
 * ```
 */
export const YearBadge: React.FC<YearBadgeProps> = ({
  year,
  size = 'md',
  position = 'bottom-left',
  zIndex = 10,
  className = ''
}) => {
  const yearBadge = useYearBadge({ year, size, position, zIndex });

  if (!yearBadge.shouldRender) {
    return null;
  }

  return (
    <div className={`${yearBadge.containerClassName} ${className}`}>
      <div className={yearBadge.badgeClassName}>
        <span className={yearBadge.textClassName}>
          {yearBadge.displayYear}
        </span>
      </div>
    </div>
  );
};

export default YearBadge;

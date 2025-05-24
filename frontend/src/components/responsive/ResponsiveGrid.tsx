'use client';

import React from 'react';
import type { ResponsiveGridProps } from '@/types/responsive';

/**
 * A responsive grid component that adjusts columns and gaps based on screen size
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = { default: 4, md: 6, lg: 8 },
}) => {
  // Generate grid column classes
  const generateColClass = () => {
    const colClasses = [];
    
    if (cols.default) {
      const value = cols.default === 'full' ? 'grid-cols-1' : `grid-cols-${cols.default}`;
      colClasses.push(value);
    } else {
      colClasses.push('grid-cols-1');
    }
    
    if (cols.xxs) {
      const value = cols.xxs === 'full' ? 'xxs:grid-cols-1' : `xxs:grid-cols-${cols.xxs}`;
      colClasses.push(value);
    }
    
    if (cols.xs) {
      const value = cols.xs === 'full' ? 'xs:grid-cols-1' : `xs:grid-cols-${cols.xs}`;
      colClasses.push(value);
    }
    
    if (cols.sm) {
      const value = cols.sm === 'full' ? 'sm:grid-cols-1' : `sm:grid-cols-${cols.sm}`;
      colClasses.push(value);
    }
    
    if (cols.md) {
      const value = cols.md === 'full' ? 'md:grid-cols-1' : `md:grid-cols-${cols.md}`;
      colClasses.push(value);
    }
    
    if (cols.lg) {
      const value = cols.lg === 'full' ? 'lg:grid-cols-1' : `lg:grid-cols-${cols.lg}`;
      colClasses.push(value);
    }
    
    if (cols.xl) {
      const value = cols.xl === 'full' ? 'xl:grid-cols-1' : `xl:grid-cols-${cols.xl}`;
      colClasses.push(value);
    }
    
    if (cols['2xl']) {
      const value = cols['2xl'] === 'full' ? '2xl:grid-cols-1' : `2xl:grid-cols-${cols['2xl']}`;
      colClasses.push(value);
    }
    
    return colClasses.join(' ');
  };
  
  // Generate gap classes
  const generateGapClass = () => {
    const gapClasses = [];
    
    if (gap.default) {
      gapClasses.push(`gap-${gap.default}`);
    } else {
      gapClasses.push('gap-4');
    }
    
    if (gap.xxs) gapClasses.push(`xxs:gap-${gap.xxs}`);
    if (gap.xs) gapClasses.push(`xs:gap-${gap.xs}`);
    if (gap.sm) gapClasses.push(`sm:gap-${gap.sm}`);
    if (gap.md) gapClasses.push(`md:gap-${gap.md}`);
    if (gap.lg) gapClasses.push(`lg:gap-${gap.lg}`);
    if (gap.xl) gapClasses.push(`xl:gap-${gap.xl}`);
    if (gap['2xl']) gapClasses.push(`2xl:gap-${gap['2xl']}`);
    
    return gapClasses.join(' ');
  };

  return (
    <div className={`grid ${generateColClass()} ${generateGapClass()} ${className}`}>
      {children}
    </div>
  );
};

interface ResponsiveFlexProps {
  children: React.ReactNode;
  className?: string;
  direction?: {
    default?: 'row' | 'col';
    xxs?: 'row' | 'col';
    xs?: 'row' | 'col';
    sm?: 'row' | 'col';
    md?: 'row' | 'col';
    lg?: 'row' | 'col';
    xl?: 'row' | 'col';
    '2xl'?: 'row' | 'col';
  };
  wrap?: boolean;
  gap?: number;
  itemsCenter?: boolean;
  justifyCenter?: boolean;
  justifyBetween?: boolean;
}

/**
 * A responsive flex component with direction control based on screen size
 */
export const ResponsiveFlex: React.FC<ResponsiveFlexProps> = ({
  children,
  className = '',
  direction = { default: 'col', md: 'row' },
  wrap = false,
  gap = 4,
  itemsCenter = false,
  justifyCenter = false,
  justifyBetween = false,
}) => {
  // Generate direction classes
  const generateDirectionClass = () => {
    const dirClasses = [];
    
    if (direction.default) {
      dirClasses.push(`flex-${direction.default}`);
    } else {
      dirClasses.push('flex-col');
    }
    
    if (direction.xxs) dirClasses.push(`xxs:flex-${direction.xxs}`);
    if (direction.xs) dirClasses.push(`xs:flex-${direction.xs}`);
    if (direction.sm) dirClasses.push(`sm:flex-${direction.sm}`);
    if (direction.md) dirClasses.push(`md:flex-${direction.md}`);
    if (direction.lg) dirClasses.push(`lg:flex-${direction.lg}`);
    if (direction.xl) dirClasses.push(`xl:flex-${direction.xl}`);
    if (direction['2xl']) dirClasses.push(`2xl:flex-${direction['2xl']}`);
    
    return dirClasses.join(' ');
  };

  // Generate other flex classes
  const flexClasses = [
    'flex',
    generateDirectionClass(),
    wrap ? 'flex-wrap' : '',
    `gap-${gap}`,
    itemsCenter ? 'items-center' : '',
    justifyCenter ? 'justify-center' : '',
    justifyBetween ? 'justify-between' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={flexClasses}>
      {children}
    </div>
  );
};

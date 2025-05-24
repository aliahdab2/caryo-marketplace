import type { ImageProps } from 'next/image';
import type { ElementType, ReactNode } from 'react';

// ResponsiveCard Types
export interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | string;
  hover?: boolean;
}

// ResponsiveContainer Types
export interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  fluid?: boolean;
  maxWidth?: string | null;
  padding?: string | null;
  scale?: 'fluid' | 'step' | 'hybrid';
}

// ResponsiveGrid Types
export type GridColumnValue = 1|2|3|4|5|6|7|8|9|10|11|12|'full';

export interface ResponsiveGridBreakpoints {
  default?: GridColumnValue;
  xxs?: GridColumnValue;
  xs?: GridColumnValue;
  sm?: GridColumnValue;
  md?: GridColumnValue;
  lg?: GridColumnValue;
  xl?: GridColumnValue;
  '2xl'?: GridColumnValue;
}

export interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: ResponsiveGridBreakpoints;
  gap?: ResponsiveGridBreakpoints;
}

// ResponsiveImage Types
export interface ResponsiveImageSources {
  default: string;
  mobile?: string;
  tablet?: string;
  desktop?: string;
}

export interface ResponsiveImageProps extends Omit<ImageProps, 'src'> {
  src: ResponsiveImageSources | string;
  fallbackSrc?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill';
  rounded?: boolean | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  containerClassName?: string;
}

// ResponsiveTypography Types
export type FontSizeType = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
export type ComponentType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
export type WeightType = 'normal' | 'medium' | 'semibold' | 'bold';
export type AlignType = 'left' | 'center' | 'right';

export interface ResponsiveTextProps {
  children: ReactNode;
  size?: FontSizeType;
  component?: ComponentType;
  className?: string;
  weight?: WeightType;
  color?: string;
  align?: AlignType;
  id?: string;
  testId?: string;
}

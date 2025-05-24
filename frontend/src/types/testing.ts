/**
 * Types for testing components and utilities
 */

export type DirectionType = 'rtl' | 'ltr';

export interface ComparisonResult {
  message: string;
  timestamp: string;
}

export interface RTLTestComponentProps {
  className?: string;
}

export interface RTLVisualTestProps {
  className?: string;
  testName?: string;
}

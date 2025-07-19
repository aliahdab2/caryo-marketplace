import { ReactNode } from 'react';
import type { ComponentProps } from './components';

/**
 * Alert Types - Base for various alert components
 */
export interface AlertProps extends ComponentProps {
  message?: string; // Optional: specific message for the alert
  visible?: boolean; // Optional: controls the visibility of the alert
  onComplete?: () => void; // Optional: callback when alert auto-hides or completes its action
  autoHideDuration?: number; // Optional: duration in ms before auto-hiding
  onClose?: () => void; // Optional: callback for when the alert is manually closed
}

/**
 * Interface for success alert props
 */
export interface SuccessAlertProps extends AlertProps {
  message?: string; // Made optional with default value
  visible?: boolean; // Made optional with default value
  dismissible?: boolean; // Allow dismissing the alert manually
  showIcon?: boolean; // Show/hide the success icon
  // onClose is inherited from AlertProps and can be used for manual close
  // onComplete and autoHideDuration are inherited from AlertProps for auto-hide behavior
}

/**
 * Interface for simple success alert props
 */
export interface SimpleSuccessAlertProps extends AlertProps {
  message: string; // Override to make message required
  visible: boolean; // Override to make visible required, changed from 'show'
  // onClose, onComplete, and autoHideDuration are inherited from AlertProps
}

/**
 * Interface for connectivity status props
 */
export interface ConnectivityStatusProps extends ComponentProps {
  isOnline?: boolean; // Made optional because component can use its internal state from useServerConnectivity hook
  className?: string;
  checkInterval?: number; // Time in milliseconds between checks (0 to disable interval checking)
  onStatusChange?: (isConnected: boolean) => void;
  autoHide?: boolean; // Whether to auto-hide the connected status
  autoHideDelay?: number; // Time before hiding the connected status
  reactive?: boolean; // Whether to check connectivity only when API requests are made
}

/**
 * Base props interface for common UI components
 */
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

/**
 * Spinner Types
 */
export interface SpinnerProps extends ComponentProps {
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Price Slider Types
 */
export interface PriceSliderProps {
  minPrice?: number;
  maxPrice?: number;
  minRange?: number;
  maxRange?: number;
  step?: number;
  currency?: string;
  onChange: (minPrice: number | undefined, maxPrice: number | undefined) => void;
  className?: string;
  // Theme customization
  trackColor?: string;
  thumbColor?: string;
  showInputs?: boolean;
  showLabels?: boolean;
  // Translation function
  t?: (key: string, fallback: string) => string;
  // Locale for number formatting
  locale?: string;
}

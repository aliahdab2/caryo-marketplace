import { ReactNode, ElementType } from 'react';
import { SignInResponse } from "next-auth/react"; // Import SignInResponse
import { FavoriteHandlers } from './favorites'; // Added import

/**
 * Props for Auth Provider
 */
export interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Props for the GoogleSignInButton component
 */
export interface GoogleSignInButtonProps extends ComponentProps {
  /** URL to redirect to after successful sign in */
  callbackUrl?: string;
  /** Whether to redirect after sign in (default: true) */
  redirect?: boolean;
  /** Callback function to run on successful sign in */
  onSuccess?: (response: SignInResponse | undefined) => void; // Use SignInResponse
  /** Callback function to run on sign in error */
  onError?: (error: Error | string) => void;
}

/**
 * Props for Sign In Button
 */
export interface SignInButtonProps extends ComponentProps {
  onClick?: () => void;
}

/**
 * Props for Success Alert
 */
export interface SuccessAlertProps {
  message?: string;
  visible: boolean;
  onComplete?: () => void;
  autoHideDuration?: number;
}

/**
 * Props for Simple Success Alert
 */
export interface SimpleSuccessAlertProps {
  visible?: boolean;
  onComplete?: () => void;
  autoHideDuration?: number;
  message?: string;
}

/**
 * Props for Responsive Text
 */
export interface ResponsiveTextProps {
  children: ReactNode;
  size?: FontSizeType;
  component?: ElementType;
  className?: string;
  weight?: WeightType;
  color?: string;
  align?: AlignType;
  id?: string;
  testId?: string;
}

/**
 * Props for Responsive Heading
 */
export interface ResponsiveHeadingProps extends Omit<ResponsiveTextProps, 'component'> {
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Props for Main Layout
 */
export interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Props for Responsive Container
 */
export interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  fluid?: boolean;
  maxWidth?: string | null;
  padding?: string | null;
  scale?: 'fluid' | 'step' | 'hybrid';
}

/**
 * Props for Responsive Visibility
 */
export interface ResponsiveVisibilityProps {
  children: ReactNode;
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}

/**
 * Props for Responsive Card
 */
export interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | string;
  hover?: boolean;
}

/**
 * Props for Favorite Button
 */
export interface FavoriteButtonProps extends FavoriteHandlers {
  listingId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outline';
}

/**
 * Props for Favorite Button (Legacy - used in src/components/FavoriteButton.tsx)
 */
export interface LegacyFavoriteButtonProps {
  listingId: string;
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * Props for Language Switcher
 */
export interface LanguageSwitcherProps {
  className?: string;
  showNames?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Component Props
 */
export interface ComponentProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Props for CaptchaVerification component (DEPRECATED)
 */
export interface CaptchaVerificationProps extends ComponentProps {
  onVerified: (isVerified: boolean) => void;
  onRefresh?: () => void;
}

/**
 * Props for SimpleVerification component
 */
export interface SimpleVerificationProps extends ComponentProps {
  onVerified: (verified: boolean) => void;
  autoStart?: boolean;
  autoHide?: boolean;
}

/**
 * Props for Verification component
 */
export interface VerificationProps extends ComponentProps {
  onVerified: (isVerified: boolean) => void;
  autoVerify?: boolean;
  showIndicator?: boolean;
}

// Types
export type FontSizeType = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
export type WeightType = 'normal' | 'medium' | 'semibold' | 'bold';
export type AlignType = 'left' | 'center' | 'right';

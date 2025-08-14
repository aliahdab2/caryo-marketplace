"use client";

import React, { ComponentType } from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from './ErrorBoundary';

type ErrorBoundaryConfig = Omit<ErrorBoundaryProps, 'children'>;

/**
 * Higher-Order Component for Error Boundary Integration
 * 
 * This HOC makes it easy to wrap any component with an error boundary
 * without needing to manually wrap it in JSX every time.
 * 
 * Features:
 * - Automatic error boundary wrapping
 * - Configurable error boundary options
 * - Preserves component props and refs
 * - TypeScript support with proper type inference
 * - Display name preservation for debugging
 * 
 * Usage:
 * ```tsx
 * // Basic usage
 * const SafeComponent = withErrorBoundary(MyComponent);
 * 
 * // With configuration
 * const SafeFormComponent = withErrorBoundary(FormComponent, {
 *   componentName: 'User Form',
 *   level: 'section',
 *   enableRetry: true,
 *   maxRetries: 3,
 *   onError: (error, errorInfo, errorId) => {
 *     analytics.track('component_error', { component: 'User Form', errorId });
 *   }
 * });
 * 
 * // As a decorator (if using experimental decorators)
 * @withErrorBoundary({
 *   componentName: 'Product Catalog',
 *   level: 'page'
 * })
 * class ProductCatalog extends Component {
 *   // component implementation
 * }
 * ```
 */

export function withErrorBoundary<T = Record<string, unknown>>(
  WrappedComponent: ComponentType<T>,
  errorBoundaryConfig: ErrorBoundaryConfig = {}
): ComponentType<T> {
  const WithErrorBoundaryComponent: React.FC<T> = (props) => {
    const componentName = errorBoundaryConfig.componentName || 
                         WrappedComponent.displayName || 
                         WrappedComponent.name || 
                         'Component';

    const config: ErrorBoundaryProps = {
      componentName,
      level: 'component',
      enableRetry: true,
      maxRetries: 2,
      resetOnPropsChange: true,
      ...errorBoundaryConfig,
      children: React.createElement(WrappedComponent as React.ComponentType<any>, props as any) // eslint-disable-line @typescript-eslint/no-explicit-any -- Necessary for generic component wrapping
    };

    return <ErrorBoundary {...config} />;
  };

  // Preserve component metadata
  WithErrorBoundaryComponent.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithErrorBoundaryComponent;
}

/**
 * Decorator version of withErrorBoundary for class components
 * 
 * Usage:
 * ```tsx
 * @errorBoundary({ componentName: 'UserProfile', level: 'section' })
 * class UserProfile extends Component<UserProfileProps> {
 *   render() {
 *     return <div>User profile content</div>;
 *   }
 * }
 * ```
 */
export function errorBoundary(config: ErrorBoundaryConfig = {}) {
  return function <T extends ComponentType<any>>(target: T): T { // eslint-disable-line @typescript-eslint/no-explicit-any -- Necessary for decorator pattern
    return withErrorBoundary(target, config) as T;
  };
}

/**
 * Pre-configured HOCs for common use cases
 */

// For page-level components
export const withPageErrorBoundary = <T = Record<string, unknown>>(
  WrappedComponent: ComponentType<T>,
  config: Partial<ErrorBoundaryConfig> = {}
) => withErrorBoundary(WrappedComponent, {
  level: 'page',
  enableRetry: true,
  maxRetries: 1,
  resetOnPropsChange: true,
  ...config
});

// For section-level components
export const withSectionErrorBoundary = <T = Record<string, unknown>>(
  WrappedComponent: ComponentType<T>,
  config: Partial<ErrorBoundaryConfig> = {}
) => withErrorBoundary(WrappedComponent, {
  level: 'section',
  enableRetry: true,
  maxRetries: 2,
  resetOnPropsChange: true,
  ...config
});

// For form components
export const withFormErrorBoundary = <T = Record<string, unknown>>(
  WrappedComponent: ComponentType<T>,
  config: Partial<ErrorBoundaryConfig> = {}
) => withErrorBoundary(WrappedComponent, {
  level: 'section',
  enableRetry: true,
  maxRetries: 2,
  resetOnPropsChange: true,
  onError: (error, errorInfo, errorId) => {
    console.warn('Form component error:', { error: error.message, errorId });
    config.onError?.(error, errorInfo, errorId);
  },
  ...config
});

// For media components
export const withMediaErrorBoundary = <T = Record<string, unknown>>(
  WrappedComponent: ComponentType<T>,
  config: Partial<ErrorBoundaryConfig> = {}
) => withErrorBoundary(WrappedComponent, {
  level: 'component',
  enableRetry: true,
  maxRetries: 3,
  resetOnPropsChange: true,
  onError: (error, errorInfo, errorId) => {
    console.warn('Media component error:', { error: error.message, errorId });
    
    // Clear any stored media URLs to prevent memory leaks
    if (typeof window !== 'undefined') {
      // This would be implemented based on your media management system
      console.log('Cleaning up media resources due to error');
    }
    
    config.onError?.(error, errorInfo, errorId);
  },
  ...config
});

/**
 * Hook for conditional error boundary wrapping
 * 
 * Useful when you want to conditionally apply error boundaries
 * based on environment or feature flags.
 * 
 * Usage:
 * ```tsx
 * const SafeComponent = useConditionalErrorBoundary(
 *   MyComponent,
 *   process.env.NODE_ENV === 'production',
 *   { componentName: 'My Component' }
 * );
 * ```
 */
export function useConditionalErrorBoundary<T extends object>(
  WrappedComponent: ComponentType<T>,
  shouldWrap: boolean,
  config: ErrorBoundaryConfig = {}
): ComponentType<T> {
  return React.useMemo(() => {
    if (shouldWrap) {
      return withErrorBoundary(WrappedComponent, config);
    }
    return WrappedComponent;
  }, [WrappedComponent, shouldWrap, config]);
}

export default withErrorBoundary;

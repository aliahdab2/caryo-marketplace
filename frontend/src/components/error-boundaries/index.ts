/**
 * Error Boundary Components
 * 
 * Comprehensive error boundary system for robust React applications.
 * Provides component-level error isolation, graceful degradation,
 * and specialized error handling for different component types.
 * 
 * Usage Examples:
 * 
 * // Basic error boundary
 * <ErrorBoundary componentName="User Dashboard" level="page">
 *   <UserDashboard />
 * </ErrorBoundary>
 * 
 * // Form-specific error boundary
 * <FormErrorBoundary formName="Registration Form" enableAutoSave={true}>
 *   <RegistrationForm />
 * </FormErrorBoundary>
 * 
 * // Media upload error boundary
 * <MediaErrorBoundary mediaType="image" enableFallbackMode={true}>
 *   <ImageUploadComponent />
 * </MediaErrorBoundary>
 * 
 * // HOC usage
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   componentName: 'My Component',
 *   level: 'section'
 * });
 * 
 * // Pre-configured HOCs
 * const SafeForm = withFormErrorBoundary(FormComponent);
 * const SafeMedia = withMediaErrorBoundary(MediaComponent);
 */

// Core error boundary components
export { ErrorBoundary } from './ErrorBoundary';
export { FormErrorBoundary } from './FormErrorBoundary';
export { MediaErrorBoundary } from './MediaErrorBoundary';

// Higher-order components and utilities
export {
  withErrorBoundary,
  errorBoundary,
  withPageErrorBoundary,
  withSectionErrorBoundary,
  withFormErrorBoundary,
  withMediaErrorBoundary,
  useConditionalErrorBoundary
} from './withErrorBoundary';

// Type exports
export type {
  ErrorBoundaryState,
  ErrorBoundaryProps
} from './ErrorBoundary';

// Re-export React's ErrorInfo type for convenience
export type { ErrorInfo } from 'react';

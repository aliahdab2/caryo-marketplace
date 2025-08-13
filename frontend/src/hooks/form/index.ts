/**
 * Form Management Hooks
 * 
 * This module provides a comprehensive set of custom hooks for managing
 * complex multi-step forms with validation, state management, and navigation.
 * 
 * Usage Examples:
 * 
 * // Simple form validation
 * const validation = useFormValidation({
 *   totalSteps: 4,
 *   translationFunction: t
 * });
 * 
 * // Form state management
 * const formState = useFormState({
 *   initialData: {},
 *   onFormChange: (data) => console.log(data)
 * });
 * 
 * // Wizard step navigation
 * const steps = useWizardSteps({
 *   totalSteps: 4,
 *   onStepChange: (step) => console.log(step)
 * });
 * 
 * // Complete wizard solution (recommended)
 * const wizard = useListingWizard({
 *   initialData: {},
 *   translationFunction: t,
 *   onFormChange: saveData,
 *   onStepChange: trackSteps
 * });
 */

// Individual hooks for granular control
export { useFormValidation } from './useFormValidation';
export { useFormState } from './useFormState';
export { useWizardSteps } from './useWizardSteps';

// Main composite hook for complete wizard functionality
export { useListingWizard } from './useListingWizard';

// Note: Individual hook interfaces are not exported as they're internal implementation details.
// The main useListingWizard hook provides all necessary functionality and type safety.

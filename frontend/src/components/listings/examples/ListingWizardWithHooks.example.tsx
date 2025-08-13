/**
 * Example: ListingWizard Refactored with Custom Hooks
 * 
 * This file demonstrates how to integrate the new custom hooks
 * into the ListingWizard component, showing the before/after
 * transformation and the benefits gained.
 */

"use client";

import React from 'react';
import { useLazyTranslation } from '@/hooks/useLazyTranslation';
import { useListingWizard } from '@/hooks/form';
import { ListingFormData } from '@/types/listings';

interface ListingWizardWithHooksProps {
  initialData?: Partial<ListingFormData>;
  mode?: 'create' | 'edit';
  autoSave?: boolean;
  onSubmit?: (data: ListingFormData) => Promise<void>;
}

/**
 * Example of how the ListingWizard could be refactored using the new hooks
 * 
 * Benefits of this approach:
 * 1. Cleaner component code focused on UI
 * 2. Reusable validation logic
 * 3. Better separation of concerns
 * 4. Easier testing
 * 5. More maintainable codebase
 */
export const ListingWizardWithHooks: React.FC<ListingWizardWithHooksProps> = ({
  initialData = {},
  mode = 'create',
  autoSave = false,
  onSubmit
}) => {
  const { t } = useLazyTranslation(['listings', 'common']);

  // Single hook provides all wizard functionality
  const {
    // Form state
    formData,
    handleChange,
    updateField,
    hasFormChanges,

    // Validation
    formErrors,
    clearFieldError,
    isCurrentStepValid,

    // Step navigation
    currentStep,
    isFirstStep,
    isLastStep,
    goToNextStep,
    goToPreviousStep,
    getStepProgress,
    canGoToStep,

    // Combined operations
    validateAndGoToNextStep,
    submitForm
  } = useListingWizard({
    initialData,
    translationFunction: t,
    debugEnabled: process.env.NODE_ENV === 'development',
    onFormChange: (data) => {
      // Auto-save logic could go here
      if (autoSave && mode === 'create') {
        console.log('Auto-saving:', data);
      }
    },
    onStepChange: (newStep, previousStep) => {
      console.log(`Step changed: ${previousStep} → ${newStep}`);
    }
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { isValid, errors } = submitForm();
    
    if (!isValid) {
      console.log('Validation failed:', errors);
      return;
    }

    try {
      await onSubmit?.(formData);
      console.log('Form submitted successfully');
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };

  // Handle step navigation
  const handleStepChange = (targetStep: number) => {
    if (!canGoToStep(targetStep)) {
      console.log(`Cannot navigate to step ${targetStep}`);
      return;
    }

    // Use validateAndGoToStep for forward navigation
    if (targetStep > currentStep) {
      validateAndGoToNextStep();
    } else {
      // Direct navigation for backward steps
      // This would call goToStep internally
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Step {currentStep} of 4
          </span>
          <span className="text-sm text-gray-500">
            {getStepProgress().toFixed(0)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getStepProgress()}%` }}
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex justify-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <button
            key={step}
            onClick={() => handleStepChange(step)}
            disabled={!canGoToStep(step)}
            className={`mx-2 w-10 h-10 rounded-full font-medium transition-colors ${
              step === currentStep
                ? 'bg-blue-600 text-white'
                : canGoToStep(step)
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {step}
          </button>
        ))}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Example Step Content */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Vehicle Identity</h2>
            
            <div>
              <label htmlFor="make" className="block text-sm font-medium mb-1">
                Make *
              </label>
              <input
                type="text"
                id="make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.make ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.make && (
                <p className="text-red-500 text-sm mt-1">{formErrors.make}</p>
              )}
            </div>

            <div>
              <label htmlFor="model" className="block text-sm font-medium mb-1">
                Model *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.model ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.model && (
                <p className="text-red-500 text-sm mt-1">{formErrors.model}</p>
              )}
            </div>
          </div>
        )}

        {/* Additional steps would go here */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-bold">Vehicle Details</h2>
            <p>Step 2 content...</p>
          </div>
        )}

        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-bold">Content & Media</h2>
            <p>Step 3 content...</p>
          </div>
        )}

        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-bold">Pricing & Contact</h2>
            <p>Step 4 content...</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <button
            type="button"
            onClick={goToPreviousStep}
            disabled={isFirstStep}
            className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex space-x-2">
            {hasFormChanges() && (
              <span className="text-sm text-gray-500 self-center">
                Unsaved changes
              </span>
            )}
            
            {!isLastStep ? (
              <button
                type="button"
                onClick={validateAndGoToNextStep}
                disabled={!isCurrentStepValid()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isCurrentStepValid()}
                className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {mode === 'edit' ? 'Update' : 'Create'} Listing
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h3 className="font-bold mb-2">Debug Info</h3>
          <pre className="text-xs">
            {JSON.stringify({
              currentStep,
              hasFormChanges: hasFormChanges(),
              isCurrentStepValid: isCurrentStepValid(),
              formErrors: Object.keys(formErrors)
            }, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ListingWizardWithHooks;

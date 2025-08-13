/**
 * Example: Error Boundary Integration
 * 
 * This demonstrates how to integrate error boundaries throughout
 * the application for robust error handling and graceful degradation.
 */

"use client";

import React, { useState } from 'react';
import { 
  ErrorBoundary, 
  FormErrorBoundary, 
  MediaErrorBoundary,
  withErrorBoundary,
  withFormErrorBoundary,
  withMediaErrorBoundary 
} from '@/components/error-boundaries';

// Example components that might throw errors
const ProblematicComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Intentional error for demonstration');
  }
  return <div className="p-4 bg-green-100 rounded">Component working correctly!</div>;
};

const ProblematicForm: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Form validation error');
  }
  return (
    <form className="space-y-4 p-4 bg-blue-100 rounded">
      <input type="text" placeholder="Name" className="w-full p-2 border rounded" />
      <input type="email" placeholder="Email" className="w-full p-2 border rounded" />
      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
    </form>
  );
};

const ProblematicMediaUpload: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Media upload component crashed');
  }
  return (
    <div className="p-4 bg-purple-100 rounded border-2 border-dashed border-purple-300">
      <p>Drag & drop files here or click to browse</p>
      <input type="file" multiple className="mt-2" />
    </div>
  );
};

// HOC-wrapped components
const SafeComponent = withErrorBoundary(ProblematicComponent, {
  componentName: 'Safe Component',
  level: 'component'
});

const SafeForm = withFormErrorBoundary(ProblematicForm, {
  componentName: 'Safe Form'
});

const SafeMediaUpload = withMediaErrorBoundary(ProblematicMediaUpload, {
  componentName: 'Safe Media Upload'
});

/**
 * Complete example showing different error boundary patterns
 */
export const ErrorBoundaryIntegrationExample: React.FC = () => {
  const [triggerErrors, setTriggerErrors] = useState({
    basic: false,
    form: false,
    media: false,
    hoc: false,
    nested: false
  });

  const toggleError = (type: keyof typeof triggerErrors) => {
    setTriggerErrors(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Error Boundary Integration Examples</h1>
        <p className="text-gray-600 mb-6">
          Demonstrating different error boundary patterns for robust error handling
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">Error Simulation Controls</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(triggerErrors).map(([type, isActive]) => (
            <button
              key={type}
              onClick={() => toggleError(type as keyof typeof triggerErrors)}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)} Error
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Click buttons to trigger errors in different components
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Basic Error Boundary */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">1. Basic Error Boundary</h2>
          <p className="text-sm text-gray-600">
            General-purpose error boundary with retry functionality
          </p>
          
          <ErrorBoundary
            componentName="Basic Component"
            level="component"
            enableRetry={true}
            maxRetries={3}
            onError={(error, errorInfo, errorId) => {
              console.log('Basic error caught:', { error: error.message, errorId });
            }}
          >
            <ProblematicComponent shouldThrow={triggerErrors.basic} />
          </ErrorBoundary>
        </div>

        {/* Form Error Boundary */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">2. Form Error Boundary</h2>
          <p className="text-sm text-gray-600">
            Specialized for forms with data loss prevention
          </p>
          
          <FormErrorBoundary
            formName="Example Form"
            enableAutoSave={false}
            onFormError={(error, errorId) => {
              console.log('Form error caught:', { error: error.message, errorId });
            }}
            onDataLoss={() => {
              console.warn('Potential data loss detected!');
            }}
          >
            <ProblematicForm shouldThrow={triggerErrors.form} />
          </FormErrorBoundary>
        </div>

        {/* Media Error Boundary */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">3. Media Error Boundary</h2>
          <p className="text-sm text-gray-600">
            Media-specific error handling with fallback mode
          </p>
          
          <MediaErrorBoundary
            mediaType="mixed"
            enableFallbackMode={true}
            maxRetries={2}
            onMediaError={(error, errorId, mediaType) => {
              console.log('Media error caught:', { error: error.message, errorId, mediaType });
            }}
          >
            <ProblematicMediaUpload shouldThrow={triggerErrors.media} />
          </MediaErrorBoundary>
        </div>

        {/* HOC Pattern */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">4. HOC Pattern</h2>
          <p className="text-sm text-gray-600">
            Components wrapped with error boundaries using HOCs
          </p>
          
          <div className="space-y-4">
            <SafeComponent shouldThrow={triggerErrors.hoc} />
            <SafeForm shouldThrow={triggerErrors.hoc} />
            <SafeMediaUpload shouldThrow={triggerErrors.hoc} />
          </div>
        </div>

        {/* Nested Error Boundaries */}
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-xl font-semibold">5. Nested Error Boundaries</h2>
          <p className="text-sm text-gray-600">
            Layered error boundaries for granular error isolation
          </p>
          
          <ErrorBoundary
            componentName="Page Container"
            level="page"
            enableRetry={true}
          >
            <div className="border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-medium mb-3">Page Level Boundary</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <ErrorBoundary
                  componentName="Section A"
                  level="section"
                  enableRetry={true}
                >
                  <div className="border border-green-200 rounded p-3">
                    <h4 className="font-medium mb-2">Section A</h4>
                    <ProblematicComponent shouldThrow={triggerErrors.nested} />
                  </div>
                </ErrorBoundary>

                <ErrorBoundary
                  componentName="Section B"
                  level="section"
                  enableRetry={true}
                >
                  <div className="border border-green-200 rounded p-3">
                    <h4 className="font-medium mb-2">Section B (Always Works)</h4>
                    <ProblematicComponent shouldThrow={false} />
                  </div>
                </ErrorBoundary>
              </div>
            </div>
          </ErrorBoundary>
        </div>
      </div>

      {/* Error Handling Best Practices */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Error Boundary Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-medium mb-2">✅ Do:</h3>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Use error boundaries at strategic points in your component tree</li>
              <li>• Provide meaningful error messages for different contexts</li>
              <li>• Implement retry mechanisms for transient errors</li>
              <li>• Log errors for monitoring and debugging</li>
              <li>• Use specialized boundaries for forms and media uploads</li>
              <li>• Test error scenarios during development</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">❌ Don't:</h3>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300">
              <li>• Wrap every single component with error boundaries</li>
              <li>• Catch errors that should propagate to parent boundaries</li>
              <li>• Ignore error boundary triggers in production</li>
              <li>• Use error boundaries for event handlers</li>
              <li>• Forget to clean up resources in error states</li>
              <li>• Show technical error details to end users in production</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Integration with Analytics */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Production Integration</h2>
        <div className="text-sm space-y-2">
          <p>
            <strong>Analytics:</strong> Error boundaries automatically track errors to Google Analytics 
            and Sentry when properly configured.
          </p>
          <p>
            <strong>Monitoring:</strong> Error IDs are generated for each error instance, making it 
            easy to track and debug issues in production.
          </p>
          <p>
            <strong>User Experience:</strong> Users see friendly error messages instead of blank screens,
            with options to retry or continue using the application.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryIntegrationExample;

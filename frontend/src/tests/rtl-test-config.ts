import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';

/**
 * RTL Testing Configuration
 * 
 * This file provides helper functions and custom render methods
 * for testing RTL (Right-to-Left) layouts and behaviors.
 */

// Custom render method that sets up RTL context
interface RTLRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  direction?: 'rtl' | 'ltr';
  locale?: 'ar' | 'en';
}

/**
 * Custom render method for RTL testing
 * @param ui Component to render
 * @param options Render options including RTL settings
 * @returns The rendered component and testing utilities
 */
export function renderWithRTL(
  ui: ReactElement,
  {
    direction = 'rtl',
    locale = 'ar',
    ...renderOptions
  }: RTLRenderOptions = {}
) {
  // Set document direction and language
  document.documentElement.dir = direction;
  document.documentElement.lang = locale;
  
  // Mock RTL stylesheet loaded
  if (direction === 'rtl') {
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', '/rtl-specific.css');
    link.setAttribute('data-testid', 'rtl-stylesheet');
    document.head.appendChild(link);
  }
  
  // Standard render with our RTL setup
  return render(ui, renderOptions);
}

/**
 * Helper to check if an element has correct RTL styling
 * @param element DOM element to check
 * @returns Object with RTL validation results
 */
export function checkElementRTLStyling(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  
  return {
    hasRightTextAlign: styles.textAlign === 'right',
    hasRTLDirection: styles.direction === 'rtl',
    hasReversedFlexDirection: ['row-reverse', 'column-reverse'].includes(styles.flexDirection),
    // Add additional checks for other RTL properties
  };
}

/**
 * Helper to validate RTL spacing between elements
 * @param container Container element
 * @param selector Selector for child elements to check spacing between
 * @returns Whether spacing appears correct for RTL
 */
export function validateRTLSpacing(container: HTMLElement, selector: string) {
  const elements = container.querySelectorAll(selector);
  
  // In a real browser, we'd check computed positions
  // For Jest/JSDOM, we check for the correct utility classes
  const containerClasses = container.className;
  
  return {
    hasRTLSpacingClasses: containerClasses.includes('rtl:space-x-reverse') ||
                          containerClasses.includes('rtl:gap'),
    numberOfElements: elements.length
  };
}

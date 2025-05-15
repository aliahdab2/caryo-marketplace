/**
 * Helper functions for RTL-related testing
 */

/**
 * Check if RTL stylesheet is loaded in the document
 * @returns boolean - true if RTL stylesheet is loaded
 */
export function isRTLStylesheetLoaded(): boolean {
  if (typeof document === 'undefined') return false;
  
  // Look for our dynamically loaded RTL stylesheet
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  for (let i = 0; i < stylesheets.length; i++) {
    const href = stylesheets[i].getAttribute('href');
    if (href && href.includes('rtl-specific.css')) {
      return true;
    }
  }
  return false;
}

/**
 * Get all RTL-specific style rules from a stylesheet
 * @returns Array of RTL-specific CSS rules
 */
export function getRTLStyleRules(): string[] {
  if (typeof document === 'undefined') return [];
  
  const rtlRules: string[] = [];
  
  // Iterate through all stylesheets
  for (let i = 0; i < document.styleSheets.length; i++) {
    try {
      const sheet = document.styleSheets[i];
      
      // Skip cross-origin stylesheets that can't be accessed
      if (!sheet.cssRules) continue;
      
      for (let j = 0; j < sheet.cssRules.length; j++) {
        const rule = sheet.cssRules[j];
        // Check if the rule selector contains RTL
        if (rule instanceof CSSStyleRule && 
            (rule.selectorText.includes('[dir="rtl"]') || 
             rule.selectorText.includes('rtl\\:'))) {
          rtlRules.push(rule.cssText);
        }
      }
    } catch (e) {
      // Skip inaccessible stylesheets (CORS issues)
      console.warn('Could not access stylesheet rules:', e);
    }
  }
  
  return rtlRules;
}

/**
 * Set document direction for testing purposes
 * @param direction 'rtl' or 'ltr'
 */
export function setDocumentDirection(direction: 'rtl' | 'ltr'): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dir = direction;
  document.documentElement.lang = direction === 'rtl' ? 'ar' : 'en';
}

/**
 * Get the computed styles for an element with RTL consideration
 * @param element DOM element to check
 * @param property CSS property to check
 * @returns The computed style value
 */
export function getRTLComputedStyle(element: Element, property: string): string {
  return window.getComputedStyle(element).getPropertyValue(property);
}

/**
 * Check if an element has proper RTL alignment
 * @param element Element to check
 * @returns Object with RTL alignment properties
 */
export function checkRTLAlignment(element: Element) {
  const styles = window.getComputedStyle(element);
  
  return {
    textAlign: styles.getPropertyValue('text-align'),
    direction: styles.getPropertyValue('direction'),
    flexDirection: styles.getPropertyValue('flex-direction'),
    justifyContent: styles.getPropertyValue('justify-content'),
    alignItems: styles.getPropertyValue('align-items'),
  };
}

/**
 * Take a screenshot for visual testing
 * This is a placeholder - integrate with your preferred visual testing tool
 * @param elementId ID of the element to capture, or entire page if not specified
 * @param testName Name of the test for the screenshot
 * @param mode 'rtl' or 'ltr'
 */
export function captureScreenshot(elementId?: string, testName?: string, mode: 'rtl' | 'ltr' = 'rtl') {
  // This implementation will depend on your preferred visual testing tool
  // e.g., Percy, Chromatic, or custom screenshot solutions
  
  console.info(`[Visual Test] Capturing ${mode} screenshot for "${testName || 'untitled test'}"${elementId ? ` of element #${elementId}` : ''}`);
  
  // For integration with a real solution, you would call the appropriate API here
  // For example, with Percy:
  // if (typeof percy !== 'undefined') {
  //   percy.snapshot({
  //     name: `${testName || 'RTL Test'} - ${mode}`,
  //     scope: elementId ? `#${elementId}` : 'document',
  //   });
  // }
}

/**
 * Compare RTL vs LTR layouts for visual regression testing
 * @param testName Name of the test case
 * @param elementId Optional element ID to scope the comparison
 * @param currentDirection Current direction to determine what to capture
 */
export function compareRTLandLTR(testName: string, currentDirection: 'rtl' | 'ltr', elementId?: string) {
  // Capture screenshot for current direction
  console.info(`Visual comparison for "${testName}" in ${currentDirection.toUpperCase()} mode`);
  captureScreenshot(elementId, testName, currentDirection);
  
  // Return helpful message for UI display
  return {
    status: 'success',
    message: `Visual comparison initiated for ${currentDirection.toUpperCase()} mode`,
    timestamp: new Date().toISOString(),
  };
}

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { isRTLStylesheetLoaded, setDocumentDirection } from '@/utils/rtl-test-utils';
import ClientRTLStylesLoader from '@/components/layout/ClientRTLStylesLoader';

// Mock usePathname to avoid router context errors
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Create a fake document.documentElement to manipulate dir
const mockDocumentElementDir = (dir) => {
  Object.defineProperty(document.documentElement, 'dir', {
    value: dir,
    writable: true
  });
};

describe('RTL Conditional Stylesheet Loading', () => {
  beforeEach(() => {
    // Reset the DOM between tests
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    mockDocumentElementDir('ltr');
  });

  test('ClientRTLStylesLoader adds link tag only in RTL mode', async () => {
    // First test LTR mode
    mockDocumentElementDir('ltr');
    render(<ClientRTLStylesLoader />);
    
    // In LTR mode, there should be no RTL stylesheet
    const stylesheetLTR = document.querySelector('link[href="/rtl-specific.css"]');
    expect(stylesheetLTR).not.toBeInTheDocument();
    
    // Now test RTL mode
    mockDocumentElementDir('rtl');
    render(<ClientRTLStylesLoader />);
    
    // Wait for the useEffect to run
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // There should now be an RTL stylesheet
    const stylesheetRTL = document.querySelector('link[href="/rtl-specific.css"]');
    expect(stylesheetRTL).toBeInTheDocument();
  });
  
  test('isRTLStylesheetLoaded returns correct value', () => {
    // Initially no stylesheet should be loaded
    expect(isRTLStylesheetLoaded()).toBe(false);
    
    // Add a stylesheet manually
    const link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', '/rtl-specific.css');
    document.head.appendChild(link);
    
    // Now the function should detect it
    expect(isRTLStylesheetLoaded()).toBe(true);
  });
});

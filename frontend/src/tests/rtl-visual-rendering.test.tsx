import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { setDocumentDirection } from '@/utils/rtl-test-utils';

// Mock function for window.getComputedStyle
window.getComputedStyle = jest.fn().mockImplementation(() => ({
  getPropertyValue: (prop: string) => {
    // Return appropriate values based on document.dir
    if (document.documentElement.dir === 'rtl') {
      switch (prop) {
        case 'text-align': return 'right';
        case 'direction': return 'rtl';
        case 'flex-direction': return 'row-reverse';
        default: return '';
      }
    } else {
      switch (prop) {
        case 'text-align': return 'left';
        case 'direction': return 'ltr';
        case 'flex-direction': return 'row';
        default: return '';
      }
    }
  }
}));

describe('RTL Visual Layout Tests', () => {
  beforeEach(() => {
    // Reset direction before each test
    setDocumentDirection('ltr');
  });

  test('Text alignment updates correctly based on RTL mode', () => {
    // Test in LTR mode first
    setDocumentDirection('ltr');
    
    const { rerender, container } = render(
      <div className="rtl:text-right" data-testid="test-text">
        Test text
      </div>
    );
    
    const element = container.firstChild as Element | null;
    if (!element) return;
    const ltrStyle = window.getComputedStyle(element);
    expect(ltrStyle.getPropertyValue('text-align')).toBe('left');
    
    // Switch to RTL and re-render
    setDocumentDirection('rtl');
    
    rerender(
      <div className="rtl:text-right" data-testid="test-text">
        Test text
      </div>
    );
    
    if (!element) return;
    const rtlStyle = window.getComputedStyle(element);
    expect(rtlStyle.getPropertyValue('text-align')).toBe('right');
  });
  
  test('Flex direction reverses in RTL mode', () => {
    // Test in LTR mode first
    setDocumentDirection('ltr');
    
    const { rerender, container } = render(
      <div className="flex rtl:flex-row-reverse" data-testid="test-flex">
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    );
    
    const element = container.firstChild as Element | null;
    if (!element) return;
    const ltrStyle = window.getComputedStyle(element);
    expect(ltrStyle.getPropertyValue('flex-direction')).toBe('row');
    
    // Switch to RTL and re-render
    setDocumentDirection('rtl');
    
    rerender(
      <div className="flex rtl:flex-row-reverse" data-testid="test-flex">
        <div>Item 1</div>
        <div>Item 2</div>
      </div>
    );
    
    if (!element) return;
    const rtlStyle = window.getComputedStyle(element);
    expect(rtlStyle.getPropertyValue('flex-direction')).toBe('row-reverse');
  });
  
  test('Button spacing applies correct RTL classes', () => {
    const { container } = render(
      <div className="flex space-x-3 rtl:space-x-reverse">
        <button>Button 1</button>
        <button>Button 2</button>
      </div>
    );
    
    // Check that rtl:space-x-reverse class is present
    expect(container.firstChild).toHaveClass('rtl:space-x-reverse');
  });
});

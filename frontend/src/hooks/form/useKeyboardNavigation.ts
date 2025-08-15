"use client";

import { useCallback, useEffect } from 'react';

type UseKeyboardNavigationParams = {
  formRef: React.RefObject<HTMLFormElement>;
  focusableSelector?: string;
};

export function useKeyboardNavigation({ formRef, focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])' }: UseKeyboardNavigationParams) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      const form = formRef.current;
      if (!form) return;
      const focusableElements = form.querySelectorAll(focusableSelector);
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, [formRef, focusableSelector]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}



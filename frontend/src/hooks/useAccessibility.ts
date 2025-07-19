/**
 * 🎯 Priority 3: Focus Management and Accessibility
 * 
 * Custom hook for managing focus and accessibility in search components
 */

import { useRef, useCallback, useEffect } from 'react';

interface UseFocusManagementOptions {
  trapFocus?: boolean;
  restoreFocus?: boolean;
  autoFocus?: boolean;
}

interface UseFocusManagementReturn {
  containerRef: React.RefObject<HTMLElement>;
  focusFirst: () => void;
  focusLast: () => void;
  focusPrevious: () => void;
  focusNext: () => void;
  getFocusableElements: () => HTMLElement[];
  setInitialFocus: () => void;
}

export function useFocusManagement(options: UseFocusManagementOptions = {}): UseFocusManagementReturn {
  const { trapFocus = false, restoreFocus = true, autoFocus = false } = options;
  
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Store the previously focused element when component mounts
  useEffect(() => {
    if (restoreFocus) {
      previousActiveElement.current = document.activeElement;
    }

    // Restore focus when component unmounts
    return () => {
      if (restoreFocus && previousActiveElement.current && 'focus' in previousActiveElement.current) {
        (previousActiveElement.current as HTMLElement).focus();
      }
    };
  }, [restoreFocus]);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(containerRef.current.querySelectorAll(focusableSelectors)) as HTMLElement[];
  }, []);

  // Focus the first focusable element
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  // Focus the last focusable element
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // Focus the previous focusable element
  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    } else if (trapFocus && focusableElements.length > 0) {
      // Wrap to last element if focus trapping is enabled
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements, trapFocus]);

  // Focus the next focusable element
  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    if (currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    } else if (trapFocus && focusableElements.length > 0) {
      // Wrap to first element if focus trapping is enabled
      focusableElements[0].focus();
    }
  }, [getFocusableElements, trapFocus]);

  // Set initial focus when component loads
  const setInitialFocus = useCallback(() => {
    if (autoFocus) {
      focusFirst();
    }
  }, [autoFocus, focusFirst]);

  // Handle keydown events for focus trapping
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: moving backwards
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: moving forwards
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus, getFocusableElements]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusPrevious,
    focusNext,
    getFocusableElements,
    setInitialFocus
  };
}

interface UseAnnouncementsReturn {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  clearAnnouncements: () => void;
}

// Custom hook for screen reader announcements
export function useAnnouncements(): UseAnnouncementsReturn {
  const announcementElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create announcement region if it doesn't exist
    if (!announcementElementRef.current) {
      const announcementDiv = document.createElement('div');
      announcementDiv.setAttribute('aria-live', 'polite');
      announcementDiv.setAttribute('aria-atomic', 'true');
      announcementDiv.setAttribute('class', 'sr-only');
      announcementDiv.setAttribute('id', 'search-announcements');
      document.body.appendChild(announcementDiv);
      announcementElementRef.current = announcementDiv;
    }

    return () => {
      // Cleanup on unmount
      if (announcementElementRef.current && document.body.contains(announcementElementRef.current)) {
        document.body.removeChild(announcementElementRef.current);
      }
    };
  }, []);

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcementElementRef.current) {
      announcementElementRef.current.setAttribute('aria-live', priority);
      announcementElementRef.current.textContent = message;
      
      // Clear the message after a short delay to allow for re-announcement of the same message
      setTimeout(() => {
        if (announcementElementRef.current) {
          announcementElementRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const clearAnnouncements = useCallback(() => {
    if (announcementElementRef.current) {
      announcementElementRef.current.textContent = '';
    }
  }, []);

  return { announce, clearAnnouncements };
}

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}

// Custom hook for keyboard navigation
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions = {}) {
  const {
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    enabled = true
  } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;
        case 'Enter':
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;
        case 'ArrowUp':
          if (onArrowUp) {
            event.preventDefault();
            onArrowUp();
          }
          break;
        case 'ArrowDown':
          if (onArrowDown) {
            event.preventDefault();
            onArrowDown();
          }
          break;
        case 'ArrowLeft':
          if (onArrowLeft) {
            event.preventDefault();
            onArrowLeft();
          }
          break;
        case 'ArrowRight':
          if (onArrowRight) {
            event.preventDefault();
            onArrowRight();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);
}

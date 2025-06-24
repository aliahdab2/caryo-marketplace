"use client";

import { useAutomaticLanguageDetection } from '@/hooks/useAutomaticLanguageDetection';

/**
 * Component that automatically detects and sets the user's preferred language
 * based on their browser settings. This runs once when the app initializes.
 */
export default function AutoLanguageDetector() {
  useAutomaticLanguageDetection();
  
  // This component doesn't render anything, it just handles the language detection
  return null;
}

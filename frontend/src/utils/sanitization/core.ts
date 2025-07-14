/**
 * Core sanitization logic
 * 
 * Provides different levels of input sanitization with performance optimizations
 */

// Lazy load DOMPurify only when needed for HTML content
let DOMPurifyModule: typeof import('dompurify').default | null = null;
let DOMPurifyPromise: Promise<typeof import('dompurify').default | null> | null = null;

const loadDOMPurify = async (): Promise<typeof import('dompurify').default | null> => {
  if (DOMPurifyModule) return DOMPurifyModule;
  if (DOMPurifyPromise) return DOMPurifyPromise;
  
  if (typeof window !== 'undefined') {
    DOMPurifyPromise = import('dompurify')
      .then(({ default: purify }) => {
        DOMPurifyModule = purify;
        return purify;
      })
      .catch(error => {
        console.warn('Failed to load DOMPurify:', error);
        return null;
      });
    return DOMPurifyPromise;
  }
  return null;
};

// Pre-compiled regex patterns for performance
export const SECURITY_PATTERNS = {
  HTML_TAGS: /<[^>]*>/g,
  SCRIPT_TAGS: /<script[^>]*>.*?<\/script>/gi,
  EVENT_HANDLERS: /on\w+\s*=/gi,
  JS_PROTOCOLS: /javascript:|vbscript:|data:/gi,
  EXCESSIVE_WHITESPACE: /\s+/g,
  CONTROL_CHARS: /[\x00-\x1F\x7F]/g,
} as const;

export type SanitizationLevel = 'basic' | 'standard' | 'strict';

/**
 * Core sanitization function with different security levels
 */
export function sanitizeCore(input: string, level: SanitizationLevel): string {
  if (!input || typeof input !== 'string') return '';

  let sanitized = input.trim();
  
  // Apply sanitization based on level
  switch (level) {
    case 'basic':
      // Minimal sanitization for trusted inputs
      sanitized = sanitized.replace(/[<>]/g, '');
      break;
      
    case 'standard':
      // Standard sanitization for user content - removes tags but preserves content
      sanitized = sanitized.replace(SECURITY_PATTERNS.SCRIPT_TAGS, (match) => {
        // Extract content from script tags: <script>content</script> -> content
        return match.replace(/<script[^>]*>(.*?)<\/script>/gi, '$1');
      });
      sanitized = sanitized.replace(SECURITY_PATTERNS.HTML_TAGS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.JS_PROTOCOLS, '');
      // Remove event handlers but preserve quoted values
      sanitized = sanitized.replace(/on\w+\s*=\s*"([^"]*)"/gi, '"$1"');
      break;
      
    case 'strict':
      // Strict sanitization for untrusted content
      sanitized = sanitized.replace(SECURITY_PATTERNS.SCRIPT_TAGS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.HTML_TAGS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.JS_PROTOCOLS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.EVENT_HANDLERS, '');
      sanitized = sanitized.replace(SECURITY_PATTERNS.CONTROL_CHARS, '');
      
      // HTML entity encoding for dangerous characters
      sanitized = sanitized.replace(/[&<>"'`=\/]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
          "'": '&#x27;', '/': '&#x2F;', '`': '&#x60;', '=': '&#x3D;'
        };
        return escapeMap[match] || match;
      });
      break;
  }
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(SECURITY_PATTERNS.EXCESSIVE_WHITESPACE, ' ').trim();
  
  // Length limiting for DoS prevention
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  return sanitized;
}

/**
 * Smart sanitization that auto-detects input type and applies appropriate level
 */
export function smartSanitize(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Detect potentially dangerous content
  const hasHTML = /<[^>]+>/.test(input);
  const hasJS = /javascript:|vbscript:|on\w+\s*=/.test(input);
  
  if (hasJS || hasHTML) {
    // Use a modified strict sanitization that doesn't encode quotes for smartSanitize
    let sanitized = input.trim();
    sanitized = sanitized.replace(SECURITY_PATTERNS.SCRIPT_TAGS, '');
    sanitized = sanitized.replace(SECURITY_PATTERNS.HTML_TAGS, '');
    sanitized = sanitized.replace(SECURITY_PATTERNS.JS_PROTOCOLS, '');
    // Remove event handlers but preserve quoted values  
    sanitized = sanitized.replace(/on\w+\s*=\s*"([^"]*)"/gi, '"$1"');
    sanitized = sanitized.replace(SECURITY_PATTERNS.CONTROL_CHARS, '');
    
    // Remove excessive whitespace
    sanitized = sanitized.replace(SECURITY_PATTERNS.EXCESSIVE_WHITESPACE, ' ').trim();
    
    // Length limiting for DoS prevention
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000);
    }
    
    return sanitized;
  }
  
  return sanitizeCore(input, 'standard');
}

/**
 * HTML-specific sanitization using DOMPurify
 */
export async function sanitizeHtml(html: string): Promise<string> {
  if (!html || typeof html !== 'string') return '';
  
  const purify = await loadDOMPurify();
  if (!purify) {
    console.warn('DOMPurify not available, falling back to basic sanitization');
    return sanitizeCore(html, 'strict');
  }
  
  return purify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
    ALLOWED_ATTR: []
  });
}

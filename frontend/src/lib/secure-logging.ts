/**
 * Secure Logging Configuration
 * 
 * This module provides secure logging utilities that prevent
 * sensitive authentication data from being exposed in console logs.
 */

// List of sensitive keywords that should never appear in logs
const SENSITIVE_KEYWORDS = [
  'client_secret',
  'clientSecret',
  'access_token',
  'accessToken',
  'refresh_token',
  'refreshToken',
  'id_token',
  'idToken',
  'password',
  'token',
  'secret',
  'GOCSPX-',
  'ya29.',
  'eyJ', // JWT token prefix
];

/**
 * Sanitizes log data by removing or masking sensitive information
 */
function sanitizeLogData(data: unknown): unknown {
  if (typeof data === 'string') {
    // Check if string contains sensitive data
    for (const keyword of SENSITIVE_KEYWORDS) {
      if (data.includes(keyword)) {
        return '[REDACTED - SENSITIVE DATA]';
      }
    }
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    if (Array.isArray(data)) {
      return data.map(item => sanitizeLogData(item));
    }
    
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Check if key is sensitive
      const keyLower = key.toLowerCase();
      const isSensitiveKey = SENSITIVE_KEYWORDS.some(keyword => 
        keyLower.includes(keyword.toLowerCase())
      );

      if (isSensitiveKey) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeLogData(value);
      }
    }
    
    return sanitized;
  }

  return data;
}

/**
 * Secure console wrapper that sanitizes sensitive data
 */
export const secureConsole = {
  log: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args.map(sanitizeLogData));
    }
  },
  
  error: (...args: unknown[]) => {
    console.error(...args.map(sanitizeLogData));
  },
  
  warn: (...args: unknown[]) => {
    console.warn(...args.map(sanitizeLogData));
  },
  
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(...args.map(sanitizeLogData));
    }
  },
  
  info: (...args: unknown[]) => {
    console.info(...args.map(sanitizeLogData));
  }
};

/**
 * Override NextAuth's internal logging ONLY in production
 * In development, allow full logging for debugging purposes
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    debug: console.debug,
    info: console.info,
  };

  // Override console methods to sanitize NextAuth logs in PRODUCTION ONLY
  console.log = (...args: unknown[]) => {
    const message = args.join(' ');
    if (message.includes('NextAuth') || message.includes('OAUTH_CALLBACK_RESPONSE')) {
      originalConsole.log(...args.map(sanitizeLogData));
    } else {
      originalConsole.log(...args);
    }
  };

  console.error = (...args: unknown[]) => {
    const message = args.join(' ');
    if (message.includes('NextAuth')) {
      originalConsole.error(...args.map(sanitizeLogData));
    } else {
      originalConsole.error(...args);
    }
  };

  console.warn = (...args: unknown[]) => {
    const message = args.join(' ');
    if (message.includes('NextAuth')) {
      originalConsole.warn(...args.map(sanitizeLogData));
    } else {
      originalConsole.warn(...args);
    }
  };

  console.debug = (...args: unknown[]) => {
    const message = args.join(' ');
    if (message.includes('NextAuth')) {
      originalConsole.debug(...args.map(sanitizeLogData));
    } else {
      originalConsole.debug(...args);
    }
  };
}

// In development, provide a warning about sensitive data exposure
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.warn('🔓 Development Mode: NextAuth debug logging enabled. Sensitive data may be visible in logs.');
}

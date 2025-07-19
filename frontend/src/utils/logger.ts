/**
 * Enhanced logger utility for Caryo Marketplace
 * Provides conditional logging based on environment and debug flags
 * 
 * Design pattern:
 * - Export pre-configured logger instances for common use cases
 * - Export factory function for creating custom logger instances
 * - No default export to avoid confusion between class and instances
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): [string, ...unknown[]] {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
    return [`${timestamp} ${prefix} [${level.toUpperCase()}] ${message}`, ...args];
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(...this.formatMessage('debug', message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(...this.formatMessage('info', message, ...args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(...this.formatMessage('warn', message, ...args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(...this.formatMessage('error', message, ...args));
    }
  }
}

// Create logger instances for different modules
export const searchLogger = new Logger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_SEARCH === 'true',
  level: 'info',
  prefix: 'SEARCH'
});

export const apiLogger = new Logger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_API === 'true',
  level: 'warn',
  prefix: 'API'
});

export const filterLogger = new Logger({
  enabled: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG_FILTERS === 'true',
  level: 'info',
  prefix: 'FILTERS'
});

/**
 * Factory function to create new logger instances
 * 
 * @example
 * // Use pre-configured loggers for common cases
 * import { searchLogger, apiLogger } from '@/utils/logger';
 * searchLogger.info('Search query executed');
 * 
 * // Create custom logger for specific modules
 * import { createLogger } from '@/utils/logger';
 * const myLogger = createLogger({
 *   enabled: true,
 *   level: 'debug',
 *   prefix: 'CUSTOM_MODULE'
 * });
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}

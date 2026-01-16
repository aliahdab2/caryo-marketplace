/**
 * Custom API Error class for typed error handling
 * 
 * This follows industry best practices for error handling:
 * - Typed errors with HTTP status codes
 * - Structured error information
 * - Easy to detect and handle specific error types
 * 
 * @example
 * try {
 *   await fetchDealer(id);
 * } catch (error) {
 *   if (error instanceof ApiError && error.status === 404) {
 *     notFound();
 *   }
 *   throw error;
 * }
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if this is a "not found" error (404)
   */
  isNotFound(): boolean {
    return this.status === 404;
  }

  /**
   * Check if this is an authentication error (401)
   */
  isUnauthorized(): boolean {
    return this.status === 401;
  }

  /**
   * Check if this is a forbidden error (403)
   */
  isForbidden(): boolean {
    return this.status === 403;
  }

  /**
   * Check if this is a validation error (400)
   */
  isBadRequest(): boolean {
    return this.status === 400;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }
}

/**
 * Type guard to check if an error is an ApiError
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * Create an ApiError from a fetch Response
 */
export async function createApiErrorFromResponse(response: Response): Promise<ApiError> {
  let message = `Request failed with status ${response.status}`;
  let code: string | undefined;
  let details: unknown;

  try {
    const data = await response.json();
    if (data.message) {
      message = data.message;
    }
    if (data.error) {
      if (typeof data.error === 'string') {
        message = data.error;
      } else if (data.error.message) {
        message = data.error.message;
        code = data.error.code;
      }
    }
    details = data;
  } catch {
    // Response body is not JSON, use default message
  }

  return new ApiError(message, response.status, code, details);
}

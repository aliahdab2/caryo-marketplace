/**
 * Utility functions for handling API errors in a consistent way
 */

import { Session } from 'next-auth';
import { isFavorited } from './favorites';
import { FavoriteServiceOptions } from '@/types/favorites';

/**
 * Check if an error is related to Hibernate proxy serialization issues
 */
export function isHibernateSerializationError(errorText: string): boolean {
  const hibernatePatterns = [
    'ByteBuddyInterceptor',
    'Type definition error',
    'Hibernate',
    'LazyInitializationException',
    'HibernateProxy',
    'could not initialize proxy',
    'failed to lazily initialize',
    'no Session',
    'JsonMappingException',
    'serializer',
    'Cannot extract primitive value',
    'ConversionFailedException',
    'No serializer found'
  ];
  
  return hibernatePatterns.some(pattern => errorText.includes(pattern));
}

/**
 * Extracts the clearest error message from an error object
 */
export function extractErrorMessage(error: unknown): string {
  if (!error) return 'Unknown error';
  
  // If it's an Error object
  if (error instanceof Error) {
    return error.message;
  }
  
  // If it's a Response object
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.message) return String(errorObj.message);
    if (errorObj.error) return typeof errorObj.error === 'string' ? errorObj.error : JSON.stringify(errorObj.error);
    if (errorObj.statusText) return String(errorObj.statusText);
  }
  
  // Fallback
  return String(error);
}

/**
 * Handles API errors for favorite operations by verifying actual state
 * Returns true if the error was handled successfully (operation succeeded despite error)
 */
export async function handleFavoriteApiError(
  error: unknown, 
  listingId: string,
  expectedState: boolean,
  options?: FavoriteServiceOptions,
  session?: Session | null
): Promise<boolean> {
  // Extract error details
  const errorObj = error as Error;
  const errorMessage = extractErrorMessage(error);
  
  console.log('[API-ERROR-HANDLER] Analyzing error:', {
    message: errorMessage,
    type: errorObj?.constructor?.name || typeof error
  });

  // Check if this is an error that might be related to Hibernate serialization
  const is500Error = errorMessage.includes('500');
  const isSerializationError = isHibernateSerializationError(errorMessage);
  
  if (is500Error || isSerializationError) {
    console.log('[API-ERROR-HANDLER] Detected potential Hibernate serialization issue');
    
    // Add retry with delay for more reliable state checking
    const checkState = async (retryCount = 3, delayMs = 300): Promise<boolean> => {
      try {
        // Verify the actual state to see if the operation succeeded despite the error
        const actualState = await isFavorited(listingId, options, session);
        console.log(`[API-ERROR-HANDLER] Actual favorite state: ${actualState.isFavorite}, expected: ${expectedState}`);
        
        // If the state matches what we expected after the operation, consider it successful
        if (actualState.isFavorite === expectedState) {
          console.log('[API-ERROR-HANDLER] Operation actually succeeded despite the error');
          return true;
        } else {
          // If we have retries left, wait and try again
          if (retryCount > 0) {
            console.log(`[API-ERROR-HANDLER] State mismatch, retrying... (${retryCount} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
            return checkState(retryCount - 1, delayMs);
          }
          
          console.log('[API-ERROR-HANDLER] Operation did not produce the expected state after retries');
          return false;
        }
      } catch (verifyError) {
        console.error('[API-ERROR-HANDLER] Error verifying state after API error:', verifyError);
        
        // If we have retries left, wait and try again
        if (retryCount > 0) {
          console.log(`[API-ERROR-HANDLER] Verification error, retrying... (${retryCount} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          return checkState(retryCount - 1, delayMs);
        }
        
        return false;
      }
    };
    
    return await checkState();
  }
  
  // If we couldn't handle the error, return false
  return false;
}

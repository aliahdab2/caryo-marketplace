import { SWRResponse } from 'swr';

/**
 * Interface for API message responses
 */
export interface MessageResponse {
  message: string;
}

/**
 * Interface for location data
 */
export interface Location {
  city: string;
  cityAr?: string;
  country: string;
  countryCode: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Interface for use server connectivity props
 */
export interface UseServerConnectivityProps {
  checkInterval?: number;
  initialDelay?: number;
  onStatusChange?: (isOnline: boolean) => void;
}

/**
 * Base API response interface
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

/**
 * Base paginated response interface
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
}

// General API Types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status?: number;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

// Fetcher specific types
export interface FetchError extends Error {
  info?: unknown;
  status?: number;
}

// FetcherResponse can be a type alias if it doesn't add new members
export type FetcherResponse<Data, Err = FetchError> = SWRResponse<Data, Err>;

// UseServerConnectivity Hook Types
export interface UseServerConnectivityProps {
  checkInterval?: number;
  initialDelay?: number;
}

// Generic type for paginated API responses
export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
}

// Generic type for API request options
export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown; // Can be stringified JSON, FormData, etc.
  params?: Record<string, string | number>; // URL query parameters
}

/**
 * Utility functions for handling seller types in the frontend
 */

import { SellerType } from '@/types/sellerTypes';

/**
 * Filters out certified dealer from seller types for public display
 * @param sellerTypes - Array of seller types from API
 * @returns Filtered array without certified dealer
 */
export function filterPublicSellerTypes(sellerTypes: SellerType[]): SellerType[] {
  return sellerTypes.filter(type => type.name !== 'certified');
}

/**
 * Checks if a seller type should be visible in public interfaces
 * @param sellerTypeName - Name of the seller type
 * @returns True if the seller type should be visible
 */
export function isSellerTypePublic(sellerTypeName: string): boolean {
  return sellerTypeName !== 'certified';
}

/**
 * Gets the default seller type ID for new users (private)
 * @param sellerTypes - Array of available seller types
 * @returns ID of the private seller type, or undefined if not found
 */
export function getDefaultSellerTypeId(sellerTypes: SellerType[]): number | undefined {
  const privateType = sellerTypes.find(type => type.name === 'private');
  return privateType?.id;
}

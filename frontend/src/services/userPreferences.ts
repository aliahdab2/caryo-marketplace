'use client';

import { api } from './api';

// Mirrors backend UserPreferencesResponse / UserPreferencesRequest
export interface UserPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  newMessages: boolean;
  listingExpiry: boolean;
  priceDrops: boolean;
  newsletter: boolean;
  marketing: boolean;
  showPhone: boolean;
  showEmail: boolean;
}

/**
 * Get the current user's notification and privacy preferences.
 * Users who never saved preferences get the backend defaults.
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  return api.get<UserPreferences>('/api/v1/users/me/preferences');
}

/**
 * Full update of the current user's preferences.
 */
export async function updateUserPreferences(preferences: UserPreferences): Promise<UserPreferences> {
  return api.put<UserPreferences>(
    '/api/v1/users/me/preferences',
    preferences as unknown as Record<string, unknown>
  );
}

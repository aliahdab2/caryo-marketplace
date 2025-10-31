/**
 * User Blocking Service
 * Handles user-level blocking functionality
 */

import { api } from './api';

export interface UserBlockResponse {
  id: number;
  blocker: {
    id: number;
    username: string;
    email: string;
  };
  blocked: {
    id: number;
    username: string;
    email: string;
  };
  createdAt: string;
}

export interface BlockStatusResponse {
  blocked: boolean;
  userId: number;
}

export class UserBlockService {
  /**
   * Block a user
   */
  static async blockUser(userId: number): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>(`/api/users/block/${userId}`, {});
    return { message: response.message || 'User has been blocked successfully' };
  }

  /**
   * Unblock a user
   */
  static async unblockUser(userId: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/api/users/block/${userId}`);
    return { message: response.message || 'User has been unblocked successfully' };
  }

  /**
   * Get list of blocked users
   */
  static async getBlockedUsers(): Promise<UserBlockResponse[]> {
    const response = await api.get<UserBlockResponse[]>('/api/users/block');
    return response || [];
  }

  /**
   * Check if a user is blocked
   */
  static async isBlocked(userId: number): Promise<boolean> {
    const response = await api.get<{ status: string; data: boolean }>(`/api/users/block/${userId}/status`);
    return response.data || false;
  }
}


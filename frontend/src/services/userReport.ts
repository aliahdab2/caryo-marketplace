/**
 * User Reports Service
 * Handles user reporting functionality
 */

import { api } from './api';

export interface UserReportResponse {
  id: number;
  reporterId: number;
  reporterUsername: string;
  reporterEmail?: string;
  reportedUserId: number;
  reportedUserUsername: string;
  reportedUserEmail?: string;
  conversationId?: number;
  listingId?: number;
  listingTitle?: string;
  reportType: string;
  reportTypeDisplay?: string;
  reason: string;
  status: string;
  adminNotes?: string;
  resolvedById?: number;
  resolvedByUsername?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface PaginatedReportsResponse {
  content: UserReportResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ReportUserRequest {
  reportedUserId: number;
  conversationId?: number;
  reportType: string;
  reason: string;
}

export class UserReportService {
  /**
   * Get current user's reports
   */
  static async getMyReports(page: number = 0, size: number = 20): Promise<PaginatedReportsResponse> {
    const response = await api.get<PaginatedReportsResponse>(`/api/v1/reports/my-reports?page=${page}&size=${size}&sortBy=createdAt&sortDir=desc`);
    return response;
  }
}


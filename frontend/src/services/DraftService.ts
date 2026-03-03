/**
 * Draft Service
 * 
 * Handles auto-saving and managing draft listings.
 * Follows modern web app patterns like Google Docs, Notion, etc.
 */

import { ListingFormData } from '@/types/listings';
import { DraftData } from '@/types/autoSave';

const DRAFT_STORAGE_KEY = 'caryo_listing_drafts';
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds for testing
const DRAFT_EXPIRY_DAYS = 30;

export class DraftService {
  /**
   * Generate a unique draft ID
   */
  static generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save a draft to localStorage
   */
  static saveDraft(draftId: string, formData: Partial<ListingFormData>, title?: string): void {
    try {
      const drafts = this.getAllDrafts();
      const draftTitle = title || formData.title || 'Untitled Draft';
      
      const draftData: DraftData = {
        id: draftId,
        formData,
        lastSaved: new Date().toISOString(),
        title: draftTitle,
        autoSaveEnabled: true
      };

      drafts[draftId] = draftData;
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('[DraftService] Error saving draft:', error);
    }
  }

  /**
   * Load a specific draft
   */
  static loadDraft(draftId: string): DraftData | null {
    try {
      const drafts = this.getAllDrafts();
      const draft = drafts[draftId];
      
      if (!draft) {
        console.warn('[DraftService] Draft not found:', draftId);
        return null;
      }

      // Check if draft is expired
      const lastSaved = new Date(draft.lastSaved);
      const now = new Date();
      const daysDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 3600 * 24);
      
      if (daysDiff > DRAFT_EXPIRY_DAYS) {
        console.warn('[DraftService] Draft expired, removing:', draftId);
        this.deleteDraft(draftId);
        return null;
      }

      return draft;
    } catch (error) {
      console.error('[DraftService] Error loading draft:', error);
      return null;
    }
  }

  /**
   * Get all drafts for the current user
   */
  static getAllDrafts(): Record<string, DraftData> {
    try {
      const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[DraftService] Error loading drafts:', error);
      return {};
    }
  }

  /**
   * Get drafts list for UI display
   */
  static getDraftsList(): DraftData[] {
    const drafts = this.getAllDrafts();
    return Object.values(drafts)
      .sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());
  }

  /**
   * Delete a specific draft
   */
  static deleteDraft(draftId: string): void {
    try {
      const drafts = this.getAllDrafts();
      delete drafts[draftId];
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
      console.error('[DraftService] Error deleting draft:', error);
    }
  }

  /**
   * Clean up expired drafts
   */
  static cleanupExpiredDrafts(): void {
    try {
      const drafts = this.getAllDrafts();
      const now = new Date();
      let cleanedCount = 0;

      Object.entries(drafts).forEach(([draftId, draft]) => {
        const lastSaved = new Date(draft.lastSaved);
        const daysDiff = (now.getTime() - lastSaved.getTime()) / (1000 * 3600 * 24);
        
        if (daysDiff > DRAFT_EXPIRY_DAYS) {
          delete drafts[draftId];
          cleanedCount++;
        }
      });

      if (cleanedCount > 0) {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts));
      }
    } catch (error) {
      console.error('[DraftService] Error cleaning up drafts:', error);
    }
  }

  /**
   * Check if form data has meaningful content worth saving
   */
  static isDraftWorthy(formData: Partial<ListingFormData>): boolean {
    const hasTitle = formData.title && formData.title.trim().length > 0;
    const hasDescription = formData.description && formData.description.trim().length > 0;
    const hasMake = formData.make && formData.make.trim().length > 0;
    const hasPrice = formData.price && formData.price.trim().length > 0;
    
    // Save if at least 1 meaningful field is filled (for easier testing)
    const meaningfulFields = [hasTitle, hasDescription, hasMake, hasPrice].filter(Boolean).length;
    const isWorthy = meaningfulFields >= 1;
    
    return isWorthy;
  }

  /**
   * Get auto-save interval
   */
  static getAutoSaveInterval(): number {
    return AUTO_SAVE_INTERVAL;
  }

  /**
   * Format last saved time for display
   */
  static formatLastSaved(lastSaved: string): string {
    const date = new Date(lastSaved);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  }
}

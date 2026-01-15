import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// Types
// ============================================

export type Language = 'en' | 'ar';
export type Theme = 'light' | 'dark' | 'system';

export interface SavedFilters {
  brand?: string;
  model?: string;
  yearFrom?: number;
  yearTo?: number;
  priceFrom?: number;
  priceTo?: number;
  mileageFrom?: number;
  mileageTo?: number;
  fuelType?: string;
  transmission?: string;
  bodyStyle?: string;
  condition?: string;
  governorate?: string;
  sellerType?: string;
}

export interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Modals
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  openModal: (modalId: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;

  // Search filters (persisted)
  savedFilters: SavedFilters;
  setSavedFilters: (filters: SavedFilters) => void;
  clearSavedFilters: () => void;

  // Preferences (persisted)
  preferredLanguage: Language;
  setPreferredLanguage: (lang: Language) => void;
  
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // View preferences
  listingsViewMode: 'grid' | 'list';
  setListingsViewMode: (mode: 'grid' | 'list') => void;

  // Recently viewed (for quick access)
  recentSearches: string[];
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

// ============================================
// Store
// ============================================

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Sidebar
      sidebarOpen: false,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      // Modals
      activeModal: null,
      modalData: null,
      openModal: (modalId, data = {}) => set({ activeModal: modalId, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      // Search filters
      savedFilters: {},
      setSavedFilters: (filters) => set({ savedFilters: filters }),
      clearSavedFilters: () => set({ savedFilters: {} }),

      // Preferences
      preferredLanguage: 'en',
      setPreferredLanguage: (lang) => set({ preferredLanguage: lang }),
      
      theme: 'system',
      setTheme: (theme) => set({ theme }),

      // View preferences
      listingsViewMode: 'grid',
      setListingsViewMode: (mode) => set({ listingsViewMode: mode }),

      // Recent searches (keep last 10)
      recentSearches: [],
      addRecentSearch: (query) => {
        const current = get().recentSearches;
        const filtered = current.filter((q) => q !== query); // Remove duplicates
        const updated = [query, ...filtered].slice(0, 10); // Keep max 10
        set({ recentSearches: updated });
      },
      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'caryo-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields (not transient UI state)
      partialize: (state) => ({
        savedFilters: state.savedFilters,
        preferredLanguage: state.preferredLanguage,
        theme: state.theme,
        listingsViewMode: state.listingsViewMode,
        recentSearches: state.recentSearches,
      }),
    }
  )
);

// ============================================
// Selectors (for performance optimization)
// ============================================

export const selectSidebarOpen = (state: UIState) => state.sidebarOpen;
export const selectActiveModal = (state: UIState) => state.activeModal;
export const selectModalData = (state: UIState) => state.modalData;
export const selectSavedFilters = (state: UIState) => state.savedFilters;
export const selectPreferredLanguage = (state: UIState) => state.preferredLanguage;
export const selectTheme = (state: UIState) => state.theme;
export const selectListingsViewMode = (state: UIState) => state.listingsViewMode;
export const selectRecentSearches = (state: UIState) => state.recentSearches;

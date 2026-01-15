import { act, renderHook } from '@testing-library/react';
import { useUIStore } from '../uiStore';

// Reset store before each test
beforeEach(() => {
  const { result } = renderHook(() => useUIStore());
  act(() => {
    result.current.setSidebarOpen(false);
    result.current.closeModal();
    result.current.clearSavedFilters();
    result.current.clearRecentSearches();
    result.current.setPreferredLanguage('en');
    result.current.setTheme('system');
    result.current.setListingsViewMode('grid');
  });
});

describe('uiStore', () => {
  describe('sidebar', () => {
    it('should toggle sidebar open/closed', () => {
      const { result } = renderHook(() => useUIStore());
      
      expect(result.current.sidebarOpen).toBe(false);
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.sidebarOpen).toBe(true);
      
      act(() => {
        result.current.toggleSidebar();
      });
      
      expect(result.current.sidebarOpen).toBe(false);
    });

    it('should set sidebar state directly', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.setSidebarOpen(true);
      });
      
      expect(result.current.sidebarOpen).toBe(true);
    });
  });

  describe('modals', () => {
    it('should open modal with id and data', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.openModal('upgrade', { tier: 'professional' });
      });
      
      expect(result.current.activeModal).toBe('upgrade');
      expect(result.current.modalData).toEqual({ tier: 'professional' });
    });

    it('should close modal and clear data', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.openModal('upgrade', { tier: 'professional' });
      });
      
      act(() => {
        result.current.closeModal();
      });
      
      expect(result.current.activeModal).toBeNull();
      expect(result.current.modalData).toBeNull();
    });
  });

  describe('saved filters', () => {
    it('should save and retrieve filters', () => {
      const { result } = renderHook(() => useUIStore());
      
      const filters = {
        brand: 'toyota',
        yearFrom: 2020,
        priceFrom: 10000,
        priceTo: 30000,
      };
      
      act(() => {
        result.current.setSavedFilters(filters);
      });
      
      expect(result.current.savedFilters).toEqual(filters);
    });

    it('should clear filters', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.setSavedFilters({ brand: 'bmw' });
      });
      
      act(() => {
        result.current.clearSavedFilters();
      });
      
      expect(result.current.savedFilters).toEqual({});
    });
  });

  describe('preferences', () => {
    it('should switch language', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.setPreferredLanguage('ar');
      });
      
      expect(result.current.preferredLanguage).toBe('ar');
    });

    it('should switch theme', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.setTheme('dark');
      });
      
      expect(result.current.theme).toBe('dark');
    });

    it('should switch listings view mode', () => {
      const { result } = renderHook(() => useUIStore());
      
      expect(result.current.listingsViewMode).toBe('grid');
      
      act(() => {
        result.current.setListingsViewMode('list');
      });
      
      expect(result.current.listingsViewMode).toBe('list');
    });
  });

  describe('recent searches', () => {
    it('should add recent search', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.addRecentSearch('toyota camry');
      });
      
      expect(result.current.recentSearches).toContain('toyota camry');
    });

    it('should keep only 10 recent searches', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        for (let i = 1; i <= 15; i++) {
          result.current.addRecentSearch(`search ${i}`);
        }
      });
      
      expect(result.current.recentSearches).toHaveLength(10);
      expect(result.current.recentSearches[0]).toBe('search 15');
    });

    it('should not duplicate searches', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.addRecentSearch('bmw');
        result.current.addRecentSearch('audi');
        result.current.addRecentSearch('bmw'); // duplicate
      });
      
      expect(result.current.recentSearches).toEqual(['bmw', 'audi']);
    });

    it('should clear recent searches', () => {
      const { result } = renderHook(() => useUIStore());
      
      act(() => {
        result.current.addRecentSearch('test');
        result.current.clearRecentSearches();
      });
      
      expect(result.current.recentSearches).toEqual([]);
    });
  });
});

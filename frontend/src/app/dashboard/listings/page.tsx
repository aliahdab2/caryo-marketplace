"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getSession } from "next-auth/react";
import { getMyListings, deleteListingById, deleteMultipleListings } from "../../../services/listings";
import { Listing } from "../../../types/listings";
import { ListingsView } from "@/components/listings";
import { 
  MdSearch, 
  MdDelete, 
  MdClose,
  MdDirectionsCar
} from "react-icons/md";
import { SelectWithArrow } from '@/components/ui/SelectWithArrow';
import { useDirection } from '@/utils/direction';
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';
import Breadcrumb, { createDashboardBreadcrumb } from '@/components/ui/Breadcrumb';

export default function ListingsPage() {

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [listings, setListings] = useState<Listing[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  // Removed mobile sort toggle - not needed with compact design
  // const [tableRefreshed, setTableRefreshed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);

  const { t } = useTranslation(['dashboard', 'listings', 'common']);
  const { isRTL } = useDirection();
  
  // Delete confirmation hook
  const deleteConfirmation = useDeleteConfirmation({
    namespace: 'listings',
    onDelete: async (id: string) => {
      await deleteListingById(id);
      setListings(prev => prev.filter(listing => listing.id !== id));
    },
    onBulkDelete: async (ids: string[]) => {
      await deleteMultipleListings(ids);
      setListings(prev => prev.filter(listing => !ids.includes(listing.id)));
      setSelectedItems([]);
    },
    onError: (error) => {
      console.error('Failed to delete listing(s):', error);
    }
  });
  
  // Load user's listings from API
  useEffect(() => {
    const loadListings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const session = await getSession();
        
        if (session && session.accessToken) {
          const userListings = await getMyListings();
          setListings(userListings);
        } else {
          throw new Error('You need to log in to view your listings');
        }
      } catch (err) {
        console.error('Failed to load listings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    };

    loadListings();
  }, []);
  
  // Hook for the sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      if (tableHeaderRef.current) {
        const header = tableHeaderRef.current;
        const tableTop = header.parentElement?.getBoundingClientRect().top || 0;
        
        if (tableTop < 0) {
          header.classList.add('fixed-header');
        } else {
          header.classList.remove('fixed-header');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulate table refresh
  // Removed refresh animation button for cleaner header



	// Function to filter and sort listings
	const filteredListings = listings
		.filter(listing => {
			// Filter by search - V2: Use enhanced object structure
			const searchMatch = !search || 
				listing.title?.toLowerCase().includes(search.toLowerCase()) ||
				listing.brand?.displayNameEn?.toLowerCase().includes(search.toLowerCase()) ||
				listing.model?.displayNameEn?.toLowerCase().includes(search.toLowerCase());
			
			// Filter by status
			const statusMatch = statusFilter === "all" || listing.status === statusFilter;
			
			return searchMatch && statusMatch;
		})
		.sort((a, b) => {
			// Sort by the selected criteria
			const multiplier = sortOrder === "asc" ? 1 : -1;
			
			switch (sortBy) {
				case "title":
					return (a.title || "").localeCompare(b.title || "") * multiplier;
				case "price":
					return ((a.price || 0) - (b.price || 0)) * multiplier;
				case "date":
					return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * multiplier;
				case "newest":
				default:
					return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
			}
		});

  // Delete multiple items
  const handleDeleteMultiple = () => {
    if (selectedItems.length === 0) return;
    deleteConfirmation.openBulkDelete(selectedItems);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">{t('loading')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <Breadcrumb items={createDashboardBreadcrumb({
          label: t('dashboard:myListings'),
          translationKey: 'dashboard.myListings',
          translationNamespace: 'dashboard'
        })} />
        {/* Header (clean, single title) */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{t("dashboard:myListings")}</h1>
        </div>

        {/* Management summary cards (aligned with dashboard colors) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl p-4 border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <MdDirectionsCar className="w-4 h-4" /> {t('listings:total')}
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{listings.length}</div>
          </div>
          <div className="rounded-xl p-4 border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <div className="text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
              <MdDirectionsCar className="w-4 h-4" /> {t('listings:active')}
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{listings.filter(l => l.status === 'active').length}</div>
          </div>
          <div className="rounded-xl p-4 border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
            <div className="text-sm text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <MdDirectionsCar className="w-4 h-4" /> {t('listings:pending')}
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{listings.filter(l => l.status === 'pending').length}</div>
          </div>
        </div>
        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center mb-6">
            <div className="text-red-600 dark:text-red-400 text-lg mb-2">⚠️ {t('error')}</div>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              {t('tryAgain')}
            </button>
          </div>
        )}

        

			{/* Compact Filters & Search */}
			<div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('listings:searchListings')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="min-w-[120px]">
            <SelectWithArrow
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              isRTL={isRTL}
            >
              <option value="all">{t('listings:allStatuses')}</option>
              <option value="active">{t('listings:active')}</option>
              <option value="pending">{t('listings:pending')}</option>
              <option value="expired">{t('listings:expired')}</option>
            </SelectWithArrow>
          </div>

          {/* Sort By */}
          <div className="min-w-[100px]">
            <SelectWithArrow
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              isRTL={isRTL}
            >
              <option value="newest">{t('listings:newest')}</option>
              <option value="title">{t('listings:title')}</option>
              <option value="price">{t('listings:price')}</option>
              <option value="date">{t('listings:date')}</option>
            </SelectWithArrow>
          </div>

          {/* Sort Order */}
          <div className="min-w-[100px]">
            <SelectWithArrow
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
              isRTL={isRTL}
            >
              <option value="asc">{t('listings:ascending')}</option>
              <option value="desc">{t('listings:descending')}</option>
            </SelectWithArrow>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {selectedItems.length} {t('listings:itemsSelected')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteMultiple}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <MdDelete size={18} />
                {t('listings:deleteSelected')}
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <MdClose className="mr-1.5" size={16} />
                {t("listings:clearSelection")}
              </button>
            </div>
          </div>
        </div>
      )}

			{/* Listings Display - Using Unified Component */}
      <ListingsView
        listings={filteredListings}
        loading={false}
        variant="full"
        showHeader={false}
        showSearch={false}
        showFilters={false}
        showBulkActions={false}
        showActions={true}
        showViewAllLink={false}
        onDelete={async (id: string) => {
          await deleteListingById(id);
          setListings(prev => prev.filter(listing => listing.id !== id));
        }}
      />

			{/* Help box */}
			<div className="mt-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
				<h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
					{t("dashboard:listingsTips")}
				</h3>
				<ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
					<li>{t("dashboard:tip1")}</li>
					<li>{t("dashboard:tip2")}</li>
					<li>{t("dashboard:tip3")}</li>
				</ul>
				{/* Learn more link temporarily removed per request */}
			</div>
      </div>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal {...deleteConfirmation.modalProps} />
    </div>
  );
}

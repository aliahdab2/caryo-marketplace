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
  MdFilterListAlt, 
  MdDelete, 
  MdClose,
  MdRefresh as MdReload,
  MdOutlineNotificationsActive
} from "react-icons/md";
import DeleteConfirmationModal from '@/components/ui/DeleteConfirmationModal';
import { useDeleteConfirmation } from '@/hooks/useDeleteConfirmation';

export default function ListingsPage() {

	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
	const [listings, setListings] = useState<Listing[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [tableRefreshed, setTableRefreshed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);

  const { t, i18n } = useTranslation(['dashboard', 'listings', 'common']);
  
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
  const refreshTable = () => {
    setTableRefreshed(true);
    // Show refresh animation for 1.5 seconds
    setTimeout(() => setTableRefreshed(false), 1500);
  };



	// Function to filter and sort listings
	const filteredListings = listings
		.filter(listing => {
			// Filter by search
			const searchMatch = !search || 
				listing.title?.toLowerCase().includes(search.toLowerCase()) ||
				listing.brand?.toLowerCase().includes(search.toLowerCase()) ||
				listing.model?.toLowerCase().includes(search.toLowerCase());
			
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
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

        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">{t("dashboard:myListings")}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date().toLocaleDateString(i18n.language, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
				<div className="flex items-center gap-2">
					<button
						onClick={refreshTable}
						className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
						title={t("listings:refreshTable")}
					>
						<MdReload className={`${tableRefreshed ? 'animate-spin' : ''}`} size={20} />
					</button>
					<Link
						href="/dashboard/listings/new"
						className="inline-flex items-center py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow"
					>
						<MdOutlineNotificationsActive size={18} className="mr-2" />
						{t("dashboard:addNewListing")}
					</Link>
				</div>
        </div>

			{/* Filters & Search */}
			<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 mb-6">
        {/* Mobile Sort Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsMobileSortOpen(!isMobileSortOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors w-full"
          >
            <MdFilterListAlt />
            {t('listings:filterAndSort')}
          </button>
        </div>

        <div className={`${isMobileSortOpen ? 'block' : 'hidden'} md:block`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('listings:searchListings')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('listings:allStatuses')}</option>
              <option value="active">{t('listings:active')}</option>
              <option value="pending">{t('listings:pending')}</option>
              <option value="expired">{t('listings:expired')}</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">{t('listings:newest')}</option>
              <option value="title">{t('listings:title')}</option>
              <option value="price">{t('listings:price')}</option>
              <option value="date">{t('listings:date')}</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="asc">{t('listings:ascending')}</option>
              <option value="desc">{t('listings:descending')}</option>
            </select>
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
				<div className="mt-4">
					<Link
						href="/help/listings"
						className="text-primary hover:underline"
          >
            {t("common:learnMore")} →
          </Link>
        </div>
      </div>
      </div>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal {...deleteConfirmation.modalProps} />
    </div>
  );
}

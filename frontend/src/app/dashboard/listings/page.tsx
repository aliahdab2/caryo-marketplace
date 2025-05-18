"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "../../../utils/localization";
import { 
  MdSearch, 
  MdFilterListAlt, 
  MdInfoOutline, 
  MdMoreVert, 
  MdEdit, 
  MdDelete, 
  MdRefresh,
  MdClose,
  MdArrowUpward,
  MdArrowDownward,
  MdHelpOutline,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdViewList,
  MdRefresh as MdReload,
  MdOutlineNotificationsActive
} from "react-icons/md";

// Mock data for listings (in a real app, this would come from an API)
const MOCK_LISTINGS = [
  {
    id: "1",
    title: "Toyota Camry 2020",
    price: 25000,
    currency: "SYP",
    location: "Dubai",
    created: "2023-05-15",
    expires: "2025-07-20", // future date
    status: "active",
    views: 120,
    image: "/images/vehicles/car-default.svg",
  },
  {
    id: "2",
    title: "Honda Civic 2019",
    price: 18500,
    currency: "SYP",
    location: "Abu Dhabi",
    created: "2023-04-20",
    expires: "2025-05-22", // future date
    status: "active",
    views: 75,
    image: "/images/vehicles/car-default.svg",
  },
  {
    id: "3",
    title: "BMW X5 2018",
    price: 35000,
    currency: "SYP",
    location: "Sharjah",
    created: "2023-03-10",
    expires: "2023-06-10", // past date
    status: "expired",
    views: 210,
    image: "/images/vehicles/car-default.svg",
  },
  {
    id: "4",
    title: "Mercedes E-Class 2019",
    price: 32500,
    currency: "SYP",
    location: "Dubai",
    created: "2023-05-10",
    expires: "2023-07-05", // past date
    status: "expired",
    views: 180,
    image: "/images/vehicles/car-default.svg",
  },
];

export default function ListingsPage() {
  const { t, i18n } = useTranslation("common");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [listings, setListings] = useState(MOCK_LISTINGS);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [tableRefreshed, setTableRefreshed] = useState(false);
  const tableHeaderRef = useRef<HTMLTableSectionElement>(null);
  
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

  /**
   * Calculates days until expiry or days since expired
   * @param expiryDate - The expiry date in ISO format
   * @returns Positive number for days until expiry, negative number for days since expiry
   */
  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day for consistent calculations
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0); // Normalize to start of day
    
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Function to filter and sort listings
  const filteredListings = listings
    .filter((listing) => {
      // Filter by search term
      const searchMatch = listing.title
        .toLowerCase()
        .includes(search.toLowerCase());

      // Filter by status
      const statusMatch =
        statusFilter === "all" || listing.status === statusFilter;

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      // Sort listings
      const sortMultiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortBy) {
        case "price":
          return sortMultiplier * (a.price - b.price);
        case "date":
          return sortMultiplier * (new Date(a.created).getTime() - new Date(b.created).getTime());
        case "views":
          return sortMultiplier * (a.views - b.views);
        case "expiry":
          return sortMultiplier * (new Date(a.expires).getTime() - new Date(b.expires).getTime());
        case "title":
          return sortMultiplier * a.title.localeCompare(b.title);
        default:
          return sortMultiplier * (new Date(b.created).getTime() - new Date(a.created).getTime());
      }
    });

  // Count of expired listings
  const expiredCount = listings.filter(listing => listing.status === "expired").length;

  // Handle clear filters
  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortBy("newest");
    setSortOrder("desc");
  };

  // Function to handle listing delete
  const handleDelete = (id: string) => {
    if (window.confirm(t("listings.confirmDelete"))) {
      setListings((prev) => prev.filter((listing) => listing.id !== id));
      // Also remove from selected items if present
      if (selectedItems.includes(id)) {
        setSelectedItems(prev => prev.filter(itemId => itemId !== id));
      }
    }
  };

  // Function to handle listing renewal
  const handleRenew = (id: string) => {
    setListings((prev) =>
      prev.map((listing) => {
        if (listing.id === id) {
          // Calculate new expiry date (+ 3 months from now)
          const newExpiry = new Date();
          newExpiry.setMonth(newExpiry.getMonth() + 3);

          return {
            ...listing,
            status: "active",
            expires: newExpiry.toISOString().split("T")[0],
          };
        }
        return listing;
      })
    );
  };

  // Handle bulk operations
  const handleBulkAction = (action: 'delete' | 'renew') => {
    if (action === 'delete') {
      if (window.confirm(t("listings.confirmBulkDelete"))) {
        setListings(prev => prev.filter(listing => !selectedItems.includes(listing.id)));
        setSelectedItems([]);
      }
    } else if (action === 'renew') {
      setListings(prev => 
        prev.map(listing => {
          if (selectedItems.includes(listing.id)) {
            const newExpiry = new Date();
            newExpiry.setMonth(newExpiry.getMonth() + 3);
            
            return {
              ...listing,
              status: "active",
              expires: newExpiry.toISOString().split("T")[0],
            };
          }
          return listing;
        })
      );
    }
  };

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Toggle all items selection
  const toggleAllSelection = () => {
    if (selectedItems.length === filteredListings.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredListings.map(listing => listing.id));
    }
  };

  // Function to handle column sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  // Function to get sort icon
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? <MdArrowUpward className="inline ml-1" /> : <MdArrowDownward className="inline ml-1" />;
  };

  // Handle bulk renew all expired
  const handleRenewAllExpired = () => {
    setListings(prev => 
      prev.map(listing => {
        if (listing.status === 'expired') {
          const newExpiry = new Date();
          newExpiry.setMonth(newExpiry.getMonth() + 3);
          
          return {
            ...listing,
            status: "active",
            expires: newExpiry.toISOString().split("T")[0],
          };
        }
        return listing;
      })
    );
  };

  return (
    <div className={`transition-all duration-300 ${tableRefreshed ? 'opacity-70' : 'opacity-100'}`}>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">
            {t("dashboard.myListings")}
          </h1>
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
            title={t("listings.refreshTable")}
          >
            <MdReload className={`${tableRefreshed ? 'animate-spin' : ''}`} size={20} />
          </button>
          <Link
            href="/dashboard/listings/new"
            className="inline-flex items-center py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-sm hover:shadow"
          >
            <span className="mr-2">+</span>
            {t("dashboard.createListing")}
          </Link>
        </div>
      </div>

      {/* Alert for expired listings */}
      {expiredCount > 0 && (
        <div className="mb-6 p-5 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <MdOutlineNotificationsActive className="text-amber-500 text-xl mr-3 animate-pulse" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-300">
                {t("listings.expiredListingsAlert", { count: expiredCount })}
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                {t("dashboard.expiredRenewalDesc")}
              </p>
            </div>
          </div>
          <button 
            onClick={handleRenewAllExpired}
            className="whitespace-nowrap text-sm bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md transition-colors shadow-sm hover:shadow flex items-center"
          >
            <MdRefresh className="mr-1.5" />
            {t("listings.renewAll")}
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 md:p-6 mb-6">
        {/* Mobile Sort Button */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setIsMobileSortOpen(!isMobileSortOpen)}
            className="flex items-center justify-between w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-all"
            aria-expanded={isMobileSortOpen}
            aria-controls="filter-controls"
          >
            <span className="flex items-center text-gray-700 dark:text-gray-300 font-medium">
              <MdFilterListAlt className="mr-2" /> 
              {t("common.filtersAndSort")}
            </span>
            <span className="text-lg">{isMobileSortOpen ? '−' : '+'}</span>
          </button>
        </div>

        <div 
          id="filter-controls"
          className={`grid grid-cols-1 md:grid-cols-12 gap-5 ${isMobileSortOpen ? '' : 'hidden md:grid'}`}
        >
          <div className="md:col-span-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("common.search")}
            </label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("listings.searchPlaceholder")}
                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                aria-label={t("listings.searchFields")}
              />
              <MdSearch className="absolute left-3 top-3.5 text-gray-400" size={20} />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label={t("common.clearFilters")}
                >
                  <MdClose size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="status-filter">
              {t("listings.status")}
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              aria-label={t("listings.filterByStatus")}
            >
              <option value="all">{t("common.all")}</option>
              <option value="active">{t("listings.active")}</option>
              <option value="expired">{t("listings.expired")}</option>
              <option value="pending">{t("listings.pending")}</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="sort-by">
              {t("common.sortBy")}
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              aria-label={t("common.sortBy")}
            >
              <option value="date">{t("common.date")}</option>
              <option value="price">{t("common.price")}</option>
              <option value="title">{t("common.title")}</option>
              <option value="views">{t("common.views")}</option>
              <option value="expiry">{t("listings.expiry")}</option>
            </select>
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 invisible">
              {t("common.actions")}
            </label>
            <button 
              onClick={handleClearFilters}
              className="w-full md:w-auto p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors flex justify-center items-center focus:ring-2 focus:ring-primary/30 focus:border-primary"
              title={t("common.clearFilters")}
              aria-label={t("common.clearFilters")}
              type="button"
            >
              <MdClose className="mr-1 md:mr-0" aria-hidden="true" />
              <span className="md:hidden ml-1">{t("common.clearFilters")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl shadow-md animate-fadeIn flex flex-wrap items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-medium">{selectedItems.length}</span>
            </div>
            <span className="font-medium text-primary-800 dark:text-primary-300">
              {t("listings.itemsSelected", { count: selectedItems.length })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
            <button 
              onClick={() => handleBulkAction('delete')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm transition-colors shadow-sm hover:shadow flex items-center"
            >
              <MdDelete className="mr-1.5" size={16} />
              {t("listings.deleteSelected")}
            </button>
            <button 
              onClick={() => handleBulkAction('renew')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm transition-colors shadow-sm hover:shadow flex items-center"
            >
              <MdRefresh className="mr-1.5" size={16} />
              {t("listings.renewSelected")}
            </button>
            <button 
              onClick={() => setSelectedItems([])}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-md text-sm transition-colors flex items-center"
            >
              <MdClose className="mr-1.5" size={16} />
              {t("listings.clearSelection")}
            </button>
          </div>
        </div>
      )}

      {/* Listings Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead ref={tableHeaderRef} className="bg-gray-50 dark:bg-gray-700 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">
                  <div 
                    className="cursor-pointer"
                    onClick={toggleAllSelection}
                    title={t("common.selectAll")}
                  >
                    {selectedItems.length === filteredListings.length && filteredListings.length > 0 ? (
                      <MdCheckBox size={20} className="text-primary" />
                    ) : (
                      <MdCheckBoxOutlineBlank size={20} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">
                  <span 
                    onClick={() => handleSort("title")}
                    className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 flex items-center"
                  >
                    {t("common.title")} {getSortIcon("title")}
                  </span>
                </th>
                <th className="py-3 px-4">
                  <span 
                    onClick={() => handleSort("price")}
                    className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 flex items-center"
                  >
                    {t("common.price")} {getSortIcon("price")}
                  </span>
                </th>
                <th className="py-3 px-4">{t("common.status")}</th>
                <th className="py-3 px-4">
                  <span 
                    onClick={() => handleSort("expiry")}
                    className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 flex items-center"
                  >
                    {t("common.date")} {getSortIcon("expiry")}
                  </span>
                </th>
                <th className="py-3 px-4">
                  <div className="flex items-center">
                    <span 
                      onClick={() => handleSort("views")}
                      className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 flex items-center"
                    >
                      {t("common.views")} {getSortIcon("views")}
                    </span>
                    <div className="ml-1 group relative">
                      <MdHelpOutline size={16} className="text-gray-400 cursor-help" />
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-0 mb-1 w-48 bg-gray-800 text-white text-xs p-2 rounded pointer-events-none transition-opacity z-10">
                        {t("listings.viewsTooltip")}
                      </div>
                    </div>
                  </div>
                </th>
                <th className="py-3 px-4">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredListings.length > 0 ? (
                filteredListings.map((listing) => {
                  // Calculate days until expiry
                  const daysUntilExpiry = getDaysUntilExpiry(listing.expires);
                  
                  // Format expiry text with appropriate translation
                  const expiryText = daysUntilExpiry > 0 
                    ? t("listings.expiresIn", { days: daysUntilExpiry })
                    : t("listings.expiredDaysAgo", { days: Math.abs(daysUntilExpiry) });
                  
                  // Define row background color and styles based on status
                  const isExpired = listing.status === "expired";
                  const isExpiringSoon = !isExpired && daysUntilExpiry <= 7;
                  
                  // Apply appropriate visual styles based on status
                  const rowBgColor = isExpired 
                    ? "hover:bg-red-50/30 dark:hover:bg-red-900/10 bg-red-50/20 dark:bg-red-900/5" 
                    : isExpiringSoon
                      ? "hover:bg-amber-50/30 dark:hover:bg-amber-900/10 bg-amber-50/10 dark:bg-amber-900/5"
                    : listing.status === "active"
                      ? "hover:bg-green-50/30 dark:hover:bg-green-900/10" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-700";
                  
                  return (
                  <tr
                    key={listing.id}
                    className={`${rowBgColor} transition-colors`}
                  >
                    <td className="py-4 px-4">
                      <div 
                        className="cursor-pointer"
                        onClick={() => toggleItemSelection(listing.id)}
                      >
                        {selectedItems.includes(listing.id) ? (
                          <MdCheckBox size={20} className="text-primary" />
                        ) : (
                          <MdCheckBoxOutlineBlank size={20} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 mr-3 rtl:ml-3 rtl:mr-0 border border-gray-200 dark:border-gray-600 shadow-sm">
                          <Image
                            src={listing.image || "/images/vehicles/car-default.svg"}
                            alt={listing.title}
                            width={64}
                            height={64}
                            className="h-16 w-16 object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              // Fallback to default car image if remote image fails
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Prevent infinite loop
                              target.src = "/images/vehicles/car-default.svg";
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-bold text-lg text-gray-900 dark:text-white mb-1 line-clamp-1">
                            {listing.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <span className="inline-flex items-center">
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12,2C8.13,2,5,5.13,5,9c0,5.25,7,13,7,13s7-7.75,7-13C19,5.13,15.87,2,12,2z M12,11.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5,2.5-2.5s2.5,1.12,2.5,2.5S13.38,11.5,12,11.5z"/>
                              </svg>
                              {listing.location}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                            {listing.created ? (
                              formatDate(listing.created, i18n.language, { dateStyle: 'medium' }) || t('listings.addedRecently')
                            ) : t('listings.addedRecently')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium text-gray-900 dark:text-white text-lg">
                        {formatNumber(listing.price, i18n.language, { style: 'currency', currency: listing.currency })}
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {listing.currency === 'SYP' ? 'Syrian Pound' : 'US Dollar'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center w-fit shadow-sm ${
                            listing.status === "active"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border border-green-200 dark:border-green-800"
                              : listing.status === "expired"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800"
                              : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full mr-2 ${
                            listing.status === "active"
                              ? "bg-green-500 animate-pulse" 
                              : listing.status === "expired"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          }`}></span>
                          {t(`listings.${listing.status}`)}
                        </span>
                        
                        {listing.status === "active" && (
                          <div className="text-xs text-green-600 dark:text-green-400 ml-1">
                            {formatDate(new Date(listing.expires), i18n.language, { dateStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">
                          {formatDate(new Date(listing.expires), i18n.language, { dateStyle: 'medium' })}
                        </div>
                        
                        {/* Progress bar showing time until expiry */}
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${
                              daysUntilExpiry > 30
                                ? "bg-green-500"
                                : daysUntilExpiry > 7
                                ? "bg-blue-500"
                                : daysUntilExpiry > 0
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`} 
                            style={{ 
                              width: `${daysUntilExpiry <= 0 ? 100 : Math.min(100, Math.max(0, 100 - (daysUntilExpiry / 90 * 100)))}%` 
                            }}
                            title={t("listings.expiryProgress")}
                          ></div>
                        </div>
                        
                        <div className={`text-xs mt-1.5 ${
                          daysUntilExpiry > 7
                            ? "text-green-600 dark:text-green-400"
                            : daysUntilExpiry > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-red-600 dark:text-red-400"
                        }`}>
                          {expiryText}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="group relative">
                        <div className="flex items-center">
                          <span className="font-medium text-lg">{formatNumber(listing.views, i18n.language)}</span>
                          <div className="ml-1.5 bg-gray-100 dark:bg-gray-700 rounded-full p-1 cursor-help">
                            <MdInfoOutline className="text-gray-500 dark:text-gray-400" size={16} />
                          </div>
                        </div>
                        
                        {/* Enhanced Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-0 mb-2 w-60 bg-gray-900 text-white text-xs p-3 rounded shadow-lg pointer-events-none transition-opacity z-10">
                          <div className="text-sm font-medium mb-1">{t("listings.viewsTooltip")}</div>
                          <div className="opacity-75 text-xs">{t("listings.tooltipInfo")}</div>
                          <div className="absolute bottom-[-6px] left-3 border-solid border-t-gray-900 border-t-[6px] border-x-transparent border-x-[6px] border-b-0"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/listings/edit/${listing.id}`}
                          className="p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors"
                          title={t("common.edit")}
                        >
                          <MdEdit size={18} />
                        </Link>
                        
                        <button
                          onClick={() => handleDelete(listing.id)}
                          className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                          title={t("common.delete")}
                        >
                          <MdDelete size={18} />
                        </button>
                        
                        {listing.status === "expired" && (
                          <button
                            onClick={() => handleRenew(listing.id)}
                            className="p-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                            title={t("listings.renew")}
                          >
                            <MdRefresh size={18} />
                          </button>
                        )}
                        
                        <div className="relative ml-1 group">
                          <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                            <MdMoreVert size={18} />
                          </button>
                          
                          {/* Dropdown menu */}
                          <div className="absolute right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 w-40 py-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all z-10">
                            <Link
                              href={`/listings/view/${listing.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <MdViewList size={16} className="mr-2 text-gray-600 dark:text-gray-400" />
                              {t("common.view")}
                            </Link>
                            
                            {/* More actions could go here */}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="py-6 px-4 text-center text-gray-500 dark:text-gray-400"
                  >
                    {search || statusFilter !== "all"
                      ? t("listings.noMatchingListings")
                      : t("listings.noListings")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - could be implemented here */}
      <div className="flex justify-center mt-6">
        {/* Pagination would go here */}
      </div>

      {/* Help box */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
          {t("dashboard.listingsTips")}
        </h3>
        <ul className="text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>{t("dashboard.tip1")}</li>
          <li>{t("dashboard.tip2")}</li>
          <li>{t("dashboard.tip3")}</li>
        </ul>
        <div className="mt-4">
          <Link
            href="/help/listings"
            className="text-primary hover:underline"
          >
            {t("common.learnMore")} →
          </Link>
        </div>
      </div>
    </div>
  );
}

// CSS for sticky header effects would typically be in a separate stylesheet 
// But for the purpose of this example, we could include some sample CSS here:
/*
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}

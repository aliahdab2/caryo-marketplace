"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { formatDate, formatNumber } from "../../utils/localization";
import { Listing } from "../../types/listings";
import { 
  MdDirectionsCar, 
  MdEditNote,
  MdDelete,
  MdArrowForward,
  MdAddCircleOutline,
  MdAccessTime,
  MdLocationOn,
  MdSpeed,
  MdSearch,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
  MdLocalGasStation,
  MdSettings
} from "react-icons/md";
import DeleteConfirmationModal from "../ui/DeleteConfirmationModal";
import { useDeleteConfirmation } from "../../hooks/useDeleteConfirmation";
import { useState, useCallback } from "react";

// Move namespaces outside component to prevent recreation on every render
const LISTINGS_NAMESPACES = ['listings', 'common'];

interface ListingsViewProps {
  listings: Listing[];
  loading?: boolean;
  
  // Display Configuration
  variant?: 'summary' | 'full'; // summary for dashboard, full for listings page
  maxRows?: number; // for summary variant
  showHeader?: boolean;
  headerTitle?: string;
  headerIcon?: React.ReactNode;
  
  // Features
  showActions?: boolean;
  showViewAllLink?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showBulkActions?: boolean;
  showPagination?: boolean;
  
  // Callbacks
  onDelete?: (id: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onSearch?: (term: string) => void;
  onFilter?: (filter: Record<string, unknown>) => void;
  onSort?: (sortBy: string, order: 'asc' | 'desc') => void;
  
  // Styling
  className?: string;
}

export default function ListingsView({
  listings,
  loading = false,
  variant = 'summary',
  maxRows,
  showHeader = true,
  headerTitle,
  headerIcon,
  showActions = true,
  showViewAllLink = true,
  showSearch = false,
  showFilters = false,
  showBulkActions = false,
  showPagination = false, // eslint-disable-line @typescript-eslint/no-unused-vars
  onDelete,
  onBulkDelete,
  onSearch,
  onFilter, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSort, // eslint-disable-line @typescript-eslint/no-unused-vars
  className = ""
}: ListingsViewProps) {
  const { t, i18n } = useTranslation(LISTINGS_NAMESPACES);
  
  // State for full variant features
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [sortOrder] = useState<"asc" | "desc">("desc");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Delete confirmation hook
  const deleteConfirmation = useDeleteConfirmation({
    namespace: 'listings',
    onDelete: onDelete || (async () => {}),
    onBulkDelete: onBulkDelete || (async () => {}),
    onError: (error) => {
      console.error('Failed to delete listing(s):', error);
    }
  });

  // Memoized helper functions for performance
  const formatLocation = useCallback((listing: Listing) => {
    const isArabic = i18n.language === 'ar';
    const city = isArabic ? listing.location?.cityAr : listing.location?.city;
    const governorate = isArabic ? listing.governorate?.nameAr : listing.governorate?.nameEn;
    
    if (city && governorate) {
      return `${city}، ${governorate}`;
    } else if (city) {
      return city;
    } else if (governorate) {
      return governorate;
    } else {
      return listing.location?.country || '';
    }
  }, [i18n.language]);

  const formatListingDate = useCallback((listing: Listing) => {
    const dateToFormat = listing.createdAt || listing.listingDate;
    if (dateToFormat) {
      return formatDate(dateToFormat, i18n.language, { dateStyle: 'medium' });
    }
    return null;
  }, [i18n.language]);

  const getStatusStyle = useCallback((status: string) => {
    const statusStyles = {
      active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      expired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    };
    return statusStyles[status as keyof typeof statusStyles] || statusStyles.pending;
  }, []);

  const formatCurrencyDisplay = useCallback((price: number, currency: string) => {
    // For USD, show $ + number
    if (currency === 'USD') {
      const formattedNumber = formatNumber(price, i18n.language, { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      return `$ ${formattedNumber}`;
    }
    
    // For other currencies, show number + currency code
    const formattedNumber = formatNumber(price, i18n.language, { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return `${formattedNumber} ${currency}`;
  }, [i18n.language]);

  // Handle delete
  const handleDelete = (id: string) => {
    const listing = listings.find(l => l.id === id);
    deleteConfirmation.openSingleDelete(id, listing?.title);
  };

  // Handle bulk selection
  const handleSelectAll = () => {
    if (selectedItems.length === displayListings.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(displayListings.map(l => l.id));
    }
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // Apply filters and sorting for full variant
  let displayListings = listings;
  
  if (variant === 'full') {
    // Apply search filter
    if (searchTerm) {
      displayListings = displayListings.filter(listing =>
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      displayListings = displayListings.filter(listing => listing.status === statusFilter);
    }
    
    // Apply sorting
    displayListings = displayListings.sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      switch (sortBy) {
        case 'title':
          return (a.title || '').localeCompare(b.title || '') * multiplier;
        case 'price':
          return ((a.price || 0) - (b.price || 0)) * multiplier;
        case 'date':
        case 'newest':
        default:
          return (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * multiplier;
      }
    });
  } else {
    // For summary variant, limit listings
    if (maxRows) {
      displayListings = displayListings.slice(0, maxRows);
    }
  }

  // Render search and filters for full variant
  const renderSearchAndFilters = () => {
    if (!showSearch && !showFilters) return null;

    return (
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        {showSearch && (
          <div className="relative">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchListings') || 'Search your listings...'}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('allStatuses') || 'All Statuses'}</option>
              <option value="active">{t('active') || 'Active'}</option>
              <option value="pending">{t('pending') || 'Pending'}</option>
              <option value="expired">{t('expired') || 'Expired'}</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">{t('newest') || 'Newest First'}</option>
              <option value="title">{t('title') || 'Title A-Z'}</option>
              <option value="price">{t('price') || 'Price'}</option>
            </select>
          </div>
        )}

        {/* Bulk Actions */}
        {showBulkActions && selectedItems.length > 0 && (
          <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <span className="text-sm text-blue-600 dark:text-blue-400">
              {selectedItems.length} {t('itemsSelected') || 'items selected'}
            </span>
            <button
              onClick={() => deleteConfirmation.openBulkDelete(selectedItems)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <MdDelete className="w-4 h-4 inline mr-2" />
              {t('deleteSelected') || 'Delete Selected'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render header
  const renderHeader = () => {
    if (!showHeader) return null;

    const defaultTitle = variant === 'summary' ? t('listings:recentListings') : t('listings:myListings');
    const title = headerTitle || defaultTitle;

    return (
      <div className="bg-white dark:bg-gray-800 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800/30 rounded-lg flex items-center justify-center">
              {headerIcon || <MdDirectionsCar className="text-xl text-blue-600 dark:text-blue-400" />}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h2>
              <p className="text-base text-gray-500 dark:text-gray-400">
                {listings.length} {listings.length === 1 ? t('listings:listing') : t('listings:listings')}
                {variant === 'summary' && maxRows && listings.length > maxRows && (
                  <span className="text-gray-400 dark:text-gray-500">
                    {" "}({t('showing')} {displayListings.length} {t('recent')})
                  </span>
                )}
              </p>
            </div>
          </div>
          {showViewAllLink && variant === 'summary' && (
            <Link 
              href="/dashboard/listings"
              className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
            >
              {t('viewAll', { ns: 'common' })}
              <MdArrowForward className="ml-2 rtl:ml-0 rtl:mr-2 rtl:rotate-180 w-5 h-5" />
            </Link>
          )}
          {variant === 'full' && showBulkActions && (
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {selectedItems.length === displayListings.length ? (
                  <MdCheckBox className="w-5 h-5 mr-2 text-blue-600" />
                ) : (
                  <MdCheckBoxOutlineBlank className="w-5 h-5 mr-2 text-gray-400" />
                )}
                {t('selectAll') || 'Select All'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render listings content
  const renderListings = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {[...Array(Math.min(3, maxRows || 3))].map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4 animate-pulse">
              <div className="flex items-center space-x-4 rtl:space-x-reverse">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (displayListings.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <MdDirectionsCar className="text-gray-400 dark:text-gray-500 text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('listings:noListings')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
            {t('noListingsDesc') || 'You haven\'t created any listings yet. Start by creating your first listing!'}
          </p>
          <Link 
            href="/dashboard/listings/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors duration-200 hover:shadow-md"
          >
            <MdAddCircleOutline className="mr-2 w-4 h-4" />
            {t('listings:createListing')}
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {displayListings.map((listing) => {
          const currency = (listing.currency ?? 'USD') as string;
          const hasValidPrice = listing.price && listing.price > 0;
          const hasValidMileage = listing.mileage && listing.mileage > 0;
          const isSelected = selectedItems.includes(listing.id);
          
          return (
            <div 
              key={listing.id} 
              className={`group bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:shadow-md overflow-hidden ${
                isSelected ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
            >
              <div className="p-4 sm:p-5">
                <div className="flex items-center space-x-4 rtl:space-x-reverse sm:space-x-5 rtl:sm:space-x-reverse">
                  {/* Selection checkbox for full variant with bulk actions */}
                  {variant === 'full' && showBulkActions && (
                    <div className="flex items-center">
                      <button
                        onClick={() => handleSelectItem(listing.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                      >
                        {isSelected ? (
                          <MdCheckBox className="w-5 h-5 text-blue-600" />
                        ) : (
                          <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Image Section */}
                  <div className="relative flex-shrink-0">
                    <div className="w-36 h-28 sm:w-40 sm:h-32 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 shadow-sm">
                      {listing.image ? (
                        <Image 
                          src={listing.image} 
                          alt={listing.title || 'Vehicle image'}
                          width={160}
                          height={128}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                          priority={false}
                        />
                      ) : null}
                      <div className={`absolute inset-0 flex items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-700 ${listing.image ? 'hidden' : ''}`}>
                        <MdDirectionsCar size={36} className="text-gray-300 dark:text-gray-500" />
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute -top-2 -right-2 rtl:-left-2 rtl:right-auto">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shadow-sm border border-white dark:border-gray-800 ${getStatusStyle(listing.status || 'pending')}`}>
                        {listing?.status 
                          ? t(`listings:listingStatus${listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}`)
                          : t('listings:listingStatusPending')
                        }
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Title and Price */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex-1 mr-3 rtl:mr-0 rtl:ml-3 leading-tight">
                        {listing.title}
                      </h3>
                      {hasValidPrice && (
                        <div className="text-right rtl:text-left flex-shrink-0">
                          <div className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                            {formatCurrencyDisplay(listing.price, currency)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Make and Model - Enhanced with year */}
                    <div className="mb-2">
                      {(listing.brandNameEn || listing.brandNameAr || listing.make || listing.brand) && (
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Primary vehicle info */}
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700/50 text-blue-900 dark:text-blue-100 text-sm font-medium shadow-sm">
                            <MdDirectionsCar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold">
                                {i18n.language === 'ar'
                                  ? (listing.brandNameAr || listing.brand || listing.make)
                                  : (listing.brandNameEn || listing.brand || listing.make)}
                              </span>
                              {(listing.modelNameEn || listing.modelNameAr || listing.model) && (
                                <>
                                  <span className="text-blue-400 dark:text-blue-300">•</span>
                                  <span className="font-medium opacity-90">
                                    {i18n.language === 'ar' 
                                      ? (listing.modelNameAr || listing.model) 
                                      : (listing.modelNameEn || listing.model)}
                                  </span>
                                </>
                              )}
                              {(listing.year || listing.modelYear) && (
                                <>
                                  <span className="text-blue-400 dark:text-blue-300">•</span>
                                  <span className="text-xs bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200 px-1.5 py-0.5 rounded font-medium">
                                    {listing.year || listing.modelYear}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Additional specs if available */}
                          {(listing.fuelType || listing.transmission || hasValidMileage) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {hasValidMileage && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700/50 text-orange-700 dark:text-orange-300 text-xs">
                                  <MdSpeed className="w-3 h-3" />
                                  {listing.mileage.toLocaleString()} {t('common:km')}
                                </span>
                              )}
                              {listing.fuelType && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-300 text-xs">
                                  <MdLocalGasStation className="w-3 h-3" />
                                  {listing.fuelType}
                                </span>
                              )}
                              {listing.transmission && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 text-xs">
                                  <MdSettings className="w-3 h-3" />
                                  {listing.transmission}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Location, Date, and Actions */}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <div className="flex flex-wrap items-center text-sm text-gray-500 dark:text-gray-400 gap-4">
                        <div className="flex items-center">
                          <MdLocationOn className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-blue-500 flex-shrink-0" />
                          <span className="truncate">
                            {formatLocation(listing)}
                          </span>
                        </div>
                        {formatListingDate(listing) && (
                          <div className="flex items-center">
                            <MdAccessTime className="w-4 h-4 mr-1.5 rtl:mr-0 rtl:ml-1.5 text-green-500 flex-shrink-0" />
                            <span className="whitespace-nowrap">
                              {formatListingDate(listing)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      {showActions && (
                        <div className="flex items-center space-x-1 rtl:space-x-reverse flex-shrink-0 ml-3 rtl:ml-0 rtl:mr-3">
                          <Link
                            href={`/dashboard/listings/edit/${listing.id}`}
                            className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 transition-colors duration-200"
                            title={t('edit', { ns: 'common' })}
                          >
                            <MdEditNote size={18} />
                          </Link>
                          <button 
                            onClick={() => handleDelete(listing.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors duration-200"
                            title={t('delete', { ns: 'common' })}
                          >
                            <MdDelete size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden ${className}`}>
      {renderHeader()}
      
      <div className="p-6">
        {renderSearchAndFilters()}
        {renderListings()}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal {...deleteConfirmation.modalProps} />
    </div>
  );
}

package com.autotrader.autotraderbackend.repository.specification;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Enhanced JPA Specifications for CarListing filtering with slug-based brand/model support.
 * 
 * Implements AutoTrader UK style filtering using repeated query parameters:
 * - ?brandSlugs=toyota&brandSlugs=honda
 * - ?modelSlugs=camry&modelSlugs=accord
 * 
 * This approach provides maximum flexibility for filtering by multiple brands and models
 * across different brands, supporting complex search scenarios.
 */

public class CarListingSpecification {

    /**
     * Creates a specification for filtering car listings based on the provided filter criteria.
     * 
     * @param filter The filter request containing search criteria
     * @param governorateEntity Optional governorate entity for location filtering
     * @return Specification for filtering car listings
     * @throws IllegalArgumentException if filter parameters are invalid
     */
    public static Specification<CarListing> fromFilter(ListingFilterRequest filter, Governorate governorateEntity) {
        return fromFilter(filter, governorateEntity != null ? List.of(governorateEntity) : null);
    }

    /**
     * Creates a specification for filtering car listings based on the provided filter criteria with multiple governorates.
     * 
     * @param filter The filter request containing search criteria
     * @param governorateEntities Optional list of governorate entities for location filtering
     * @return Specification for filtering car listings
     * @throws IllegalArgumentException if filter parameters are invalid
     */
    public static Specification<CarListing> fromFilter(ListingFilterRequest filter, List<Governorate> governorateEntities) {
        if (filter == null) {
            throw new IllegalArgumentException("Filter request cannot be null");
        }

        // Perform all validation upfront before creating the specification
        validateFilterParameters(filter);

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Enhanced hierarchical brand/model filtering
            addBrandModelPredicates(filter, root, criteriaBuilder, predicates);

            // Add numeric range filters (validation already done)
            addYearRangePredicates(filter, root, criteriaBuilder, predicates);
            addPriceRangePredicates(filter, root, criteriaBuilder, predicates);
            addMileageRangePredicates(filter, root, criteriaBuilder, predicates);

            // Add entity-based filters
            addGovernorateFilter(governorateEntities, root, criteriaBuilder, predicates);
            addStatusFilters(filter, root, criteriaBuilder, predicates);
            addSellerTypeFilter(filter, root, criteriaBuilder, predicates);
            addTransmissionFilter(filter, root, criteriaBuilder, predicates);
            addFuelTypeFilter(filter, root, criteriaBuilder, predicates);
            addBodyStyleFilter(filter, root, criteriaBuilder, predicates);
            
            
            // Add text search filter
            addSearchQueryFilter(filter, root, criteriaBuilder, predicates);

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Validates all filter parameters upfront to ensure they are valid.
     * @param filter The filter request to validate
     * @throws IllegalArgumentException if any parameter is invalid
     */
    private static void validateFilterParameters(ListingFilterRequest filter) {
        // Validate year range
        if (filter.getMinYear() != null) {
            if (filter.getMinYear() < 1900 || filter.getMinYear() > 2030) {
                throw new IllegalArgumentException("Invalid minimum year: " + filter.getMinYear());
            }
        }

        if (filter.getMaxYear() != null) {
            if (filter.getMaxYear() < 1900 || filter.getMaxYear() > 2030) {
                throw new IllegalArgumentException("Invalid maximum year: " + filter.getMaxYear());
            }
        }

        if (filter.getMinYear() != null && filter.getMaxYear() != null) {
            if (filter.getMinYear() > filter.getMaxYear()) {
                throw new IllegalArgumentException("Minimum year cannot be greater than maximum year");
            }
        }

        // Validate price range
        if (filter.getMinPrice() != null) {
            if (filter.getMinPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Minimum price cannot be negative");
            }
        }

        if (filter.getMaxPrice() != null) {
            if (filter.getMaxPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Maximum price cannot be negative");
            }
        }

        if (filter.getMinPrice() != null && filter.getMaxPrice() != null) {
            if (filter.getMinPrice().compareTo(filter.getMaxPrice()) > 0) {
                throw new IllegalArgumentException("Minimum price cannot be greater than maximum price");
            }
        }

        // Validate mileage range
        if (filter.getMinMileage() != null) {
            if (filter.getMinMileage() < 0) {
                throw new IllegalArgumentException("Minimum mileage cannot be negative");
            }
        }

        if (filter.getMaxMileage() != null) {
            if (filter.getMaxMileage() < 0) {
                throw new IllegalArgumentException("Maximum mileage cannot be negative");
            }
        }

        if (filter.getMinMileage() != null && filter.getMaxMileage() != null) {
            if (filter.getMinMileage() > filter.getMaxMileage()) {
                throw new IllegalArgumentException("Minimum mileage cannot be greater than maximum mileage");
            }
        }

        // Validate slug filters (new fields don't need complex validation)
        List<String> brandSlugs = filter.getNormalizedBrandSlugs();
        List<String> modelSlugs = filter.getNormalizedModelSlugs();
        
        // Basic validation - no need for complex brand filter validation anymore
        if (brandSlugs.size() > 50) {
            throw new IllegalArgumentException("Too many brand slugs provided (max 50)");
        }
        
        if (modelSlugs.size() > 50) {
            throw new IllegalArgumentException("Too many model slugs provided (max 50)");
        }

    }

    /**
     * Adds brand and model predicates using slug-based filtering.
     */
    private static void addBrandModelPredicates(ListingFilterRequest filter, 
                                              jakarta.persistence.criteria.Root<CarListing> root,
                                              jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                              List<Predicate> predicates) {
        
        // Use slug-based filtering (AutoTrader UK pattern)
        List<String> brandSlugs = filter.getNormalizedBrandSlugs();
        List<String> modelSlugs = filter.getNormalizedModelSlugs();
        
        // Brand filtering (supports multiple brands)
        if (!brandSlugs.isEmpty()) {
            Predicate brandPredicate = root.get("model").get("brand").get("slug").in(brandSlugs);
            predicates.add(brandPredicate);
            
            // Log for debugging
            // Brand slug filter added
        }
        
        // Model filtering (supports multiple models, can span multiple brands)
        if (!modelSlugs.isEmpty()) {
            Predicate modelPredicate = root.get("model").get("slug").in(modelSlugs);
            predicates.add(modelPredicate);
            
            // Log for debugging
            // Model slug filter added
        }
    }

    /**
     * Adds year range filtering predicates (validation already done).
     */
    private static void addYearRangePredicates(ListingFilterRequest filter,
                                             jakarta.persistence.criteria.Root<CarListing> root,
                                             jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                             List<Predicate> predicates) {
        if (filter.getMinYear() != null) {
            predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("modelYear"), filter.getMinYear()));
        }

        if (filter.getMaxYear() != null) {
            predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("modelYear"), filter.getMaxYear()));
        }
    }

    /**
     * Adds price range filtering predicates (validation already done).
     */
    private static void addPriceRangePredicates(ListingFilterRequest filter,
                                              jakarta.persistence.criteria.Root<CarListing> root,
                                              jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                              List<Predicate> predicates) {
        if (filter.getMinPrice() != null) {
            predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
        }

        if (filter.getMaxPrice() != null) {
            predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
        }
    }

    /**
     * Adds mileage range filtering predicates (validation already done).
     */
    private static void addMileageRangePredicates(ListingFilterRequest filter,
                                                jakarta.persistence.criteria.Root<CarListing> root,
                                                jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                                List<Predicate> predicates) {
        if (filter.getMinMileage() != null) {
            predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("mileage"), filter.getMinMileage()));
        }

        if (filter.getMaxMileage() != null) {
            predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("mileage"), filter.getMaxMileage()));
        }
    }

    /**
     * Adds governorate filtering predicate.
     */
    private static void addGovernorateFilter(Governorate governorateEntity,
                                           jakarta.persistence.criteria.Root<CarListing> root,
                                           jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                           List<Predicate> predicates) {
        if (governorateEntity != null) {
            predicates.add(criteriaBuilder.equal(root.get("governorate").get("id"), governorateEntity.getId()));
        }
    }

    /**
     * Adds governorate filtering predicate for multiple governorates.
     */
    private static void addGovernorateFilter(List<Governorate> governorateEntities,
                                           jakarta.persistence.criteria.Root<CarListing> root,
                                           jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                           List<Predicate> predicates) {
        if (governorateEntities != null && !governorateEntities.isEmpty()) {
            if (governorateEntities.size() == 1) {
                // Single governorate - use equality
                predicates.add(criteriaBuilder.equal(root.get("governorate").get("id"), governorateEntities.get(0).getId()));
            } else {
                // Multiple governorates - use IN clause
                List<Long> governorateIds = governorateEntities.stream()
                    .map(Governorate::getId)
                    .collect(java.util.stream.Collectors.toList());
                predicates.add(root.get("governorate").get("id").in(governorateIds));
            }
        }
    }

    /**
     * Adds status filtering predicates (sold, archived).
     */
    private static void addStatusFilters(ListingFilterRequest filter,
                                       jakarta.persistence.criteria.Root<CarListing> root,
                                       jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                       List<Predicate> predicates) {
        if (filter.getIsSold() != null) {
            predicates.add(criteriaBuilder.equal(root.get("sold"), filter.getIsSold()));
        }

        if (filter.getIsArchived() != null) {
            predicates.add(criteriaBuilder.equal(root.get("archived"), filter.getIsArchived()));
        }
    }

    /**
     * Adds seller type filtering predicate.
     */
    private static void addSellerTypeFilter(ListingFilterRequest filter,
                                          jakarta.persistence.criteria.Root<CarListing> root,
                                          jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                          List<Predicate> predicates) {
        if (filter.getSellerTypeIds() != null && !filter.getSellerTypeIds().isEmpty()) {
            predicates.add(root.get("seller").get("sellerType").get("id").in(filter.getSellerTypeIds()));
        }
    }

    /**
     * Adds transmission filtering predicate.
     */
    private static void addTransmissionFilter(ListingFilterRequest filter,
                                            jakarta.persistence.criteria.Root<CarListing> root,
                                            jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                            List<Predicate> predicates) {
<<<<<<< HEAD
        if (filter.getTransmissionId() != null) {
            System.out.println("DEBUG: Adding transmission filter with ID: " + filter.getTransmissionId());
            predicates.add(criteriaBuilder.equal(root.get("transmissionType").get("id"), filter.getTransmissionId()));
=======
        if (filter.getTransmissionIds() != null && !filter.getTransmissionIds().isEmpty()) {
            predicates.add(root.get("transmissionType").get("id").in(filter.getTransmissionIds()));
>>>>>>> 78c5d03 (feat: add filtering capabilities for transmission, fuel type, and body style in car listings; update related request and response models, specifications, and controller methods)
        }
    }

    /**
     * Adds fuel type filtering predicate.
     */
    private static void addFuelTypeFilter(ListingFilterRequest filter,
                                        jakarta.persistence.criteria.Root<CarListing> root,
                                        jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                        List<Predicate> predicates) {
<<<<<<< HEAD
        if (filter.getFuelTypeId() != null) {
            predicates.add(criteriaBuilder.equal(root.get("fuelType").get("id"), filter.getFuelTypeId()));
=======
        if (filter.getFuelTypeIds() != null && !filter.getFuelTypeIds().isEmpty()) {
            predicates.add(root.get("fuelType").get("id").in(filter.getFuelTypeIds()));
>>>>>>> 78c5d03 (feat: add filtering capabilities for transmission, fuel type, and body style in car listings; update related request and response models, specifications, and controller methods)
        }
    }

    /**
     * Adds body style filtering predicate.
     */
    private static void addBodyStyleFilter(ListingFilterRequest filter,
                                         jakarta.persistence.criteria.Root<CarListing> root,
                                         jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                         List<Predicate> predicates) {
        if (filter.getBodyStyleIds() != null && !filter.getBodyStyleIds().isEmpty()) {
            predicates.add(root.get("bodyStyle").get("id").in(filter.getBodyStyleIds()));
        }
    }

    /**
     * Creates a specification for approved listings only.
     * 
     * @return Specification filtering for approved listings
     */
    public static Specification<CarListing> isApproved() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("approved"));
    }

    /**
     * Creates a specification for non-sold listings only.
     * 
     * @return Specification filtering for non-sold listings
     */
    public static Specification<CarListing> isNotSold() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isFalse(root.get("sold"));
    }

    /**
     * Creates a specification for non-archived listings only.
     * 
     * @return Specification filtering for non-archived listings
     */
    public static Specification<CarListing> isNotArchived() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isFalse(root.get("archived"));
    }

    /**
     * Creates a specification for listings with active users only.
     * 
     * @return Specification filtering for active user listings
     */
    public static Specification<CarListing> isUserActive() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("isUserActive"));
    }

    /**
     * Adds text search filtering predicate.
     * Searches in title, description, brand names (English and Arabic), model names (English and Arabic),
     * and governorate names (English and Arabic).
     */
    private static void addSearchQueryFilter(ListingFilterRequest filter,
                                           jakarta.persistence.criteria.Root<CarListing> root,
                                           jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                           List<Predicate> predicates) {
        if (filter.getSearchQuery() != null && !filter.getSearchQuery().trim().isEmpty()) {
            String searchTerm = "%" + filter.getSearchQuery().trim().toLowerCase() + "%";
            
            // Create predicates for searching in different fields
            List<Predicate> searchPredicates = new ArrayList<>();
            
            // Search in listing title and description
            searchPredicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("title")), searchTerm));
            searchPredicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("description")), searchTerm));
            
            // Search in brand names (English and Arabic)
            searchPredicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("brandNameEn")), searchTerm));
            searchPredicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("brandNameAr")), searchTerm));
            
            // Search in model names (English and Arabic)
            searchPredicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("modelNameEn")), searchTerm));
            searchPredicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("modelNameAr")), searchTerm));
            
            // Search in governorate names (English and Arabic)
            searchPredicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("governorateNameEn")), searchTerm));
            searchPredicates.add(criteriaBuilder.like(
                criteriaBuilder.lower(root.get("governorateNameAr")), searchTerm));
            
            // Combine all search predicates with OR (any field match is valid)
            predicates.add(criteriaBuilder.or(searchPredicates.toArray(new Predicate[0])));
        }
    }
}
package com.autotrader.autotraderbackend.repository.specification;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Enhanced JPA Specifications for CarListing filtering with hierarchical brand/model support.
 * 
 * Supports hierarchical filtering syntax:
 * - "Toyota" (brand only)
 * - "Toyota:Camry" (brand with single model)
 * - "Toyota:Camry;Corolla" (brand with multiple models)
 * - "Toyota:Camry,Honda:Civic" (multiple brands with models)
 * - "Toyota:Camry;Corolla,Honda" (mixed brand-only and brand-with-models)
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
            addGovernorateFilter(governorateEntity, root, criteriaBuilder, predicates);
            addStatusFilters(filter, root, criteriaBuilder, predicates);
            addSellerTypeFilter(filter, root, criteriaBuilder, predicates);

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

        // Validate brand filter
        if (filter.getBrand() != null && !filter.getBrand().trim().isEmpty()) {
            validateBrandFilter(filter.getBrand());
        }
    }

    /**
     * Validates the brand filter format.
     */
    private static void validateBrandFilter(String brandFilter) {
        if (brandFilter == null || brandFilter.trim().isEmpty()) {
            return; // Empty filter is valid
        }

        String[] brandModelGroups = brandFilter.split(",");
        for (String group : brandModelGroups) {
            String trimmedGroup = group.trim();
            if (!StringUtils.hasText(trimmedGroup)) {
                continue;
            }

            String[] parts = trimmedGroup.split(":");
            String brand = parts[0].trim();
            
            // Validate brand name length (consistent with other validation methods)
            if (brand.length() > 100) {
                throw new IllegalArgumentException("Brand name is too long: " + brand);
            }

            if (parts.length > 1) {
                String modelsString = parts[1].trim();
                String[] models = modelsString.split(";");
                
                for (String model : models) {
                    String trimmedModel = model.trim();
                    if (StringUtils.hasText(trimmedModel) && trimmedModel.length() > 100) {
                        throw new IllegalArgumentException("Model name is too long: " + trimmedModel);
                    }
                }
            }
        }
    }

    /**
     * Adds brand and model predicates using hierarchical filtering syntax.
     */
    private static void addBrandModelPredicates(ListingFilterRequest filter, 
                                              jakarta.persistence.criteria.Root<CarListing> root,
                                              jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder,
                                              List<Predicate> predicates) {
        if (!StringUtils.hasText(filter.getBrand())) {
            return;
        }

        String brandFilter = filter.getBrand().trim();
        if (brandFilter.isEmpty()) {
            return;
        }

        List<Predicate> brandOrConditions = new ArrayList<>();
        String[] brandModelGroups = brandFilter.split(",");

        for (String group : brandModelGroups) {
            String trimmedGroup = group.trim();
            if (!StringUtils.hasText(trimmedGroup)) {
                continue;
            }

            Predicate groupPredicate = processBrandModelGroup(trimmedGroup, root, criteriaBuilder);
            if (groupPredicate != null) {
                brandOrConditions.add(groupPredicate);
            }
        }

        if (!brandOrConditions.isEmpty()) {
            predicates.add(criteriaBuilder.or(brandOrConditions.toArray(new Predicate[0])));
        }
    }

    /**
     * Processes a single brand-model group (e.g., "Toyota:Camry;Corolla" or "Honda").
     */
    private static Predicate processBrandModelGroup(String group,
                                                  jakarta.persistence.criteria.Root<CarListing> root,
                                                  jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder) {
        if (!StringUtils.hasText(group)) {
            return null;
        }

        String[] parts = group.split(":", 2);
        String brandName = parts[0].trim();

        if (!StringUtils.hasText(brandName)) {
            return null;
        }

        // Validate brand name (basic validation)
        if (brandName.length() > 100) {
            throw new IllegalArgumentException("Brand name too long: " + brandName);
        }

        Predicate brandPredicate = createBilingualLikePredicate(root, criteriaBuilder, "brandName", brandName);

        if (parts.length > 1 && StringUtils.hasText(parts[1])) {
            // Process models
            String[] modelNames = parts[1].split(";");
            List<Predicate> modelOrPredicates = new ArrayList<>();

            for (String modelName : modelNames) {
                String trimmedModel = modelName.trim();
                if (StringUtils.hasText(trimmedModel)) {
                    // Validate model name
                    if (trimmedModel.length() > 100) {
                        throw new IllegalArgumentException("Model name too long: " + trimmedModel);
                    }
                    modelOrPredicates.add(createBilingualLikePredicate(root, criteriaBuilder, "modelName", trimmedModel));
                }
            }

            if (!modelOrPredicates.isEmpty()) {
                Predicate modelsPredicate = modelOrPredicates.size() == 1
                    ? modelOrPredicates.get(0)
                    : criteriaBuilder.or(modelOrPredicates.toArray(new Predicate[0]));
                return criteriaBuilder.and(brandPredicate, modelsPredicate);
            }
        }

        return brandPredicate;
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
        if (filter.getSellerTypeId() != null) {
            predicates.add(criteriaBuilder.equal(root.get("seller").get("sellerType").get("id"), filter.getSellerTypeId()));
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
     * Creates a bilingual LIKE predicate that searches in both English and Arabic fields.
     * This method handles case-insensitive searching and supports special characters.
     * 
     * @param root The JPA root entity
     * @param criteriaBuilder The JPA criteria builder
     * @param fieldName The base field name (without En/Ar suffix)
     * @param value The search value
     * @return Predicate that searches in both language fields
     * @throws IllegalArgumentException if parameters are invalid
     */
    private static Predicate createBilingualLikePredicate(jakarta.persistence.criteria.Root<CarListing> root, 
                                                        jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder, 
                                                        String fieldName, 
                                                        String value) {
        if (!StringUtils.hasText(fieldName) || !StringUtils.hasText(value)) {
            throw new IllegalArgumentException("Field name and value cannot be null or empty");
        }

        // Sanitize the search value to prevent SQL injection
        String sanitizedValue = sanitizeSearchValue(value);
        String lowerCaseValue = "%" + sanitizedValue.toLowerCase().trim() + "%";
        
        try {
            Predicate enPredicate = criteriaBuilder.like(
                criteriaBuilder.lower(root.get(fieldName + "En")),
                lowerCaseValue
            );
            Predicate arPredicate = criteriaBuilder.like(
                criteriaBuilder.lower(root.get(fieldName + "Ar")),
                lowerCaseValue
            );
            return criteriaBuilder.or(enPredicate, arPredicate);
        } catch (Exception e) {
            throw new IllegalArgumentException("Error creating bilingual predicate for field: " + fieldName, e);
        }
    }

    /**
     * Sanitizes search values to prevent SQL injection and handle special characters.
     * 
     * @param value The input value to sanitize
     * @return Sanitized value safe for SQL LIKE operations
     */
    private static String sanitizeSearchValue(String value) {
        if (value == null) {
            return "";
        }
        
        // Remove or escape potentially dangerous characters
        return value.trim()
                   .replaceAll("[%_]", "\\\\$&")  // Escape SQL LIKE wildcards
                   .replaceAll("[\\r\\n\\t]", " ")  // Replace line breaks with spaces
                   .replaceAll("\\s+", " ");  // Normalize whitespace
    }

    /**
     * Validates a hierarchical brand filter string.
     * 
     * @param brandFilter The brand filter string to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidHierarchicalBrandFilter(String brandFilter) {
        if (!StringUtils.hasText(brandFilter)) {
            return true; // Empty filters are valid (no filtering)
        }

        try {
            String[] groups = brandFilter.split(",");
            for (String group : groups) {
                String trimmedGroup = group.trim();
                if (!StringUtils.hasText(trimmedGroup)) {
                    continue;
                }

                String[] parts = trimmedGroup.split(":", 2);
                String brandName = parts[0].trim();
                
                // Basic validation
                if (!StringUtils.hasText(brandName) || brandName.length() > 100) {
                    return false;
                }

                if (parts.length > 1) {
                    String[] modelNames = parts[1].split(";");
                    for (String modelName : modelNames) {
                        String trimmedModel = modelName.trim();
                        if (StringUtils.hasText(trimmedModel) && trimmedModel.length() > 100) {
                            return false;
                        }
                    }
                }
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

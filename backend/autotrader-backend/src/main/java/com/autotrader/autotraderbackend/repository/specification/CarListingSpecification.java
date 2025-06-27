package com.autotrader.autotraderbackend.repository.specification;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class CarListingSpecification {

    public static Specification<CarListing> fromFilter(ListingFilterRequest filter, Governorate governorateEntity) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Using denormalized fields for brand and model filtering
            // Search in both English and Arabic fields for better bilingual support
            
            // New logic for brand/model filtering to support complex hierarchical queries.
            // The `brand` parameter must contain brand-model pairs, e.g., "Toyota:Camry;Corolla,Honda"
            // This translates to (Toyota AND (Camry OR Corolla)) OR (Honda).
            // Note: Model-only filtering is not supported - brand must always be provided with model.
            if (StringUtils.hasText(filter.getBrand())) {
                List<Predicate> brandOrConditions = new ArrayList<>();
                String[] brandModelGroups = filter.getBrand().split(",");

                for (String group : brandModelGroups) {
                    if (StringUtils.hasText(group)) {
                        String[] parts = group.split(":", 2);  // Split only on first colon
                        String brandName = parts[0].trim();

                        if (StringUtils.hasText(brandName)) {
                            Predicate brandPredicate = createBilingualLikePredicate(root, criteriaBuilder, "brandName", brandName);

                            if (parts.length > 1 && StringUtils.hasText(parts[1])) {
                                // This group has models, e.g., "Camry;Corolla"
                                String[] modelNames = parts[1].split(";");
                                List<Predicate> modelOrPredicates = new ArrayList<>();
                                
                                for (String modelName : modelNames) {
                                    String trimmedModel = modelName.trim();
                                    if (StringUtils.hasText(trimmedModel)) {
                                        modelOrPredicates.add(createBilingualLikePredicate(root, criteriaBuilder, "modelName", trimmedModel));
                                    }
                                }

                                if (!modelOrPredicates.isEmpty()) {
                                    Predicate modelsPredicate = modelOrPredicates.size() == 1
                                        ? modelOrPredicates.get(0)
                                        : criteriaBuilder.or(modelOrPredicates.toArray(new Predicate[0]));
                                    brandOrConditions.add(criteriaBuilder.and(brandPredicate, modelsPredicate));
                                } else {
                                    // This case might happen for "Toyota:", treat as brand-only
                                    brandOrConditions.add(brandPredicate);
                                }
                            } else {
                                // This group is a brand only, e.g., "Honda"
                                brandOrConditions.add(brandPredicate);
                            }
                        }
                    }
                }

                if (!brandOrConditions.isEmpty()) {
                    predicates.add(criteriaBuilder.or(brandOrConditions.toArray(new Predicate[0])));
                }
            }
            // Note: The separate 'model' parameter is intentionally not processed.
            // Frontend must always provide brand context with model selections.
            
            if (filter.getMinYear() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("modelYear"), filter.getMinYear()));
            }
            if (filter.getMaxYear() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("modelYear"), filter.getMaxYear()));
            }
            if (filter.getMinPrice() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), filter.getMinPrice()));
            }
            if (filter.getMaxPrice() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), filter.getMaxPrice()));
            }
            if (filter.getMinMileage() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("mileage"), filter.getMinMileage()));
            }
            if (filter.getMaxMileage() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("mileage"), filter.getMaxMileage()));
            }

            // Add filter for Governorate entity if provided
            if (governorateEntity != null) {
                predicates.add(criteriaBuilder.equal(root.get("governorate").get("id"), governorateEntity.getId()));
            }

            // Add filter for isSold status if provided
            if (filter.getIsSold() != null) {
                predicates.add(criteriaBuilder.equal(root.get("sold"), filter.getIsSold()));
            }

            // Add filter for isArchived status if provided
            if (filter.getIsArchived() != null) {
                predicates.add(criteriaBuilder.equal(root.get("archived"), filter.getIsArchived()));
            }

            // Add filter for seller type if provided
            if (filter.getSellerTypeId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("seller").get("sellerType").get("id"), filter.getSellerTypeId()));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<CarListing> isApproved() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("approved"));
    }

    public static Specification<CarListing> isNotSold() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isFalse(root.get("sold"));
    }

    public static Specification<CarListing> isNotArchived() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isFalse(root.get("archived"));
    }

    public static Specification<CarListing> isUserActive() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("isUserActive"));
    }

    private static Predicate createBilingualLikePredicate(jakarta.persistence.criteria.Root<CarListing> root, jakarta.persistence.criteria.CriteriaBuilder criteriaBuilder, String fieldName, String value) {
        String lowerCaseValue = "%" + value.toLowerCase().trim() + "%";
        Predicate enPredicate = criteriaBuilder.like(
            criteriaBuilder.lower(root.get(fieldName + "En")),
            lowerCaseValue
        );
        Predicate arPredicate = criteriaBuilder.like(
            criteriaBuilder.lower(root.get(fieldName + "Ar")),
            lowerCaseValue
        );
        return criteriaBuilder.or(enPredicate, arPredicate);
    }
}

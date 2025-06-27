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
            
            boolean hasBrandFilter = StringUtils.hasText(filter.getBrand());
            boolean hasModelFilter = StringUtils.hasText(filter.getModel());
            
            if (hasBrandFilter && hasModelFilter) {
                // When both brands and models are selected, create a combined OR condition:
                // (brand1 OR brand2 OR ... OR brandN) OR (model1 OR model2 OR ... OR modelN)
                // This allows showing cars from any selected brand PLUS cars with any selected model
                
                List<Predicate> combinedPredicates = new ArrayList<>();
                
                // Add brand predicates
                String[] brandNames = filter.getBrand().split(",");
                for (String brandName : brandNames) {
                    String trimmedBrand = brandName.trim();
                    if (StringUtils.hasText(trimmedBrand)) {
                        Predicate brandEnPredicate = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("brandNameEn")),
                            "%" + trimmedBrand.toLowerCase() + "%"
                        );
                        Predicate brandArPredicate = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("brandNameAr")),
                            "%" + trimmedBrand.toLowerCase() + "%"
                        );
                        combinedPredicates.add(criteriaBuilder.or(brandEnPredicate, brandArPredicate));
                    }
                }
                
                // Add model predicates
                String[] modelNames = filter.getModel().split(",");
                for (String modelName : modelNames) {
                    String trimmedModel = modelName.trim();
                    if (StringUtils.hasText(trimmedModel)) {
                        Predicate modelEnPredicate = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("modelNameEn")),
                            "%" + trimmedModel.toLowerCase() + "%"
                        );
                        Predicate modelArPredicate = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("modelNameAr")),
                            "%" + trimmedModel.toLowerCase() + "%"
                        );
                        combinedPredicates.add(criteriaBuilder.or(modelEnPredicate, modelArPredicate));
                    }
                }
                
                if (!combinedPredicates.isEmpty()) {
                    predicates.add(criteriaBuilder.or(combinedPredicates.toArray(new Predicate[0])));
                }
                
            } else if (hasBrandFilter) {
                // Only brands selected - show cars from any selected brand
                String[] brandNames = filter.getBrand().split(",");
                List<Predicate> brandPredicates = new ArrayList<>();
                
                for (String brandName : brandNames) {
                    String trimmedBrand = brandName.trim();
                    if (StringUtils.hasText(trimmedBrand)) {
                        Predicate brandEnPredicate = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("brandNameEn")),
                            "%" + trimmedBrand.toLowerCase() + "%"
                        );
                        Predicate brandArPredicate = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("brandNameAr")),
                            "%" + trimmedBrand.toLowerCase() + "%"
                        );
                        brandPredicates.add(criteriaBuilder.or(brandEnPredicate, brandArPredicate));
                    }
                }
                
                if (!brandPredicates.isEmpty()) {
                    predicates.add(criteriaBuilder.or(brandPredicates.toArray(new Predicate[0])));
                }
                
            } else if (hasModelFilter) {
                // Only models selected - show cars with any selected model
                String[] modelNames = filter.getModel().split(",");
                List<Predicate> modelPredicates = new ArrayList<>();
                
                for (String modelName : modelNames) {
                    String trimmedModel = modelName.trim();
                    if (StringUtils.hasText(trimmedModel)) {
                        Predicate modelEnPredicate = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("modelNameEn")),
                            "%" + trimmedModel.toLowerCase() + "%"
                        );
                        Predicate modelArPredicate = criteriaBuilder.like(
                            criteriaBuilder.lower(root.get("modelNameAr")),
                            "%" + trimmedModel.toLowerCase() + "%"
                        );
                        modelPredicates.add(criteriaBuilder.or(modelEnPredicate, modelArPredicate));
                    }
                }
                
                if (!modelPredicates.isEmpty()) {
                    predicates.add(criteriaBuilder.or(modelPredicates.toArray(new Predicate[0])));
                }
            }
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
}

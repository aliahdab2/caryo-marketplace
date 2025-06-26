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
            if (StringUtils.hasText(filter.getBrand())) {
                Predicate brandEnPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("brandNameEn")),
                    "%" + filter.getBrand().toLowerCase() + "%"
                );
                Predicate brandArPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("brandNameAr")),
                    "%" + filter.getBrand().toLowerCase() + "%"
                );
                predicates.add(criteriaBuilder.or(brandEnPredicate, brandArPredicate));
            }
            if (StringUtils.hasText(filter.getModel())) {
                Predicate modelEnPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("modelNameEn")),
                    "%" + filter.getModel().toLowerCase() + "%"
                );
                Predicate modelArPredicate = criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("modelNameAr")),
                    "%" + filter.getModel().toLowerCase() + "%"
                );
                predicates.add(criteriaBuilder.or(modelEnPredicate, modelArPredicate));
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

package com.autotrader.autotraderbackend.repository.specification;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public class CarListingSpecification {

    public static Specification<CarListing> fromFilter(ListingFilterRequest filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter by approved status unless explicitly overridden (e.g., for admin views)
            // predicates.add(criteriaBuilder.isTrue(root.get("approved")));
            // Note: We apply the approved filter in the service layer for clarity

            if (StringUtils.hasText(filter.getBrand())) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("brand")), "%" + filter.getBrand().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getModel())) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("model")), "%" + filter.getModel().toLowerCase() + "%"));
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
            if (StringUtils.hasText(filter.getLocation())) {
                String lowerCaseLocation = "%" + filter.getLocation().toLowerCase() + "%";
                // For backward compatibility and tests, include a direct search on location field
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("location")), lowerCaseLocation));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<CarListing> isApproved() {
        return (root, query, criteriaBuilder) -> criteriaBuilder.isTrue(root.get("approved"));
    }
}

package com.caryo.marketplace.service;

import com.caryo.marketplace.repository.CarListingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.caryo.marketplace.model.CarListing;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for managing brand/model status changes and their impact on existing listings.
 * Provides warnings and handles cascade operations when brands/models are deactivated.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BrandModelStatusService {

    private final CarListingRepository carListingRepository;

    /**
     * Checks how many active listings would be affected if a brand is deactivated.
     *
     * @param brandId The brand ID to check
     * @return StatusChangeImpact containing count and details
     */
    @Transactional(readOnly = true)
    public StatusChangeImpact checkBrandDeactivationImpact(Long brandId) {
        log.debug("Checking impact of deactivating brand ID: {}", brandId);

        Specification<CarListing> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Find active listings with this brand
            predicates.add(criteriaBuilder.isTrue(root.get("approved")));
            predicates.add(criteriaBuilder.isFalse(root.get("sold")));
            predicates.add(criteriaBuilder.isFalse(root.get("archived")));
            predicates.add(criteriaBuilder.equal(root.get("model").get("brand").get("id"), brandId));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        long affectedListings = carListingRepository.count(spec);

        return new StatusChangeImpact(
            brandId,
            null,
            "BRAND",
            affectedListings,
            affectedListings > 0 ?
                String.format("Deactivating this brand will hide %d active listings from users", affectedListings) :
                "No active listings will be affected"
        );
    }

    /**
     * Checks how many active listings would be affected if a model is deactivated.
     *
     * @param modelId The model ID to check
     * @return StatusChangeImpact containing count and details
     */
    @Transactional(readOnly = true)
    public StatusChangeImpact checkModelDeactivationImpact(Long modelId) {
        log.debug("Checking impact of deactivating model ID: {}", modelId);

        Specification<CarListing> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Find active listings with this model
            predicates.add(criteriaBuilder.isTrue(root.get("approved")));
            predicates.add(criteriaBuilder.isFalse(root.get("sold")));
            predicates.add(criteriaBuilder.isFalse(root.get("archived")));
            predicates.add(criteriaBuilder.equal(root.get("model").get("id"), modelId));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        long affectedListings = carListingRepository.count(spec);

        return new StatusChangeImpact(
            null,
            modelId,
            "MODEL",
            affectedListings,
            affectedListings > 0 ?
                String.format("Deactivating this model will hide %d active listings from users", affectedListings) :
                "No active listings will be affected"
        );
    }

    /**
     * Data class representing the impact of a status change operation.
     */
    public static class StatusChangeImpact {
        private final Long brandId;
        private final Long modelId;
        private final String entityType;
        private final long affectedListingsCount;
        private final String impactMessage;

        public StatusChangeImpact(Long brandId, Long modelId, String entityType,
                                long affectedListingsCount, String impactMessage) {
            this.brandId = brandId;
            this.modelId = modelId;
            this.entityType = entityType;
            this.affectedListingsCount = affectedListingsCount;
            this.impactMessage = impactMessage;
        }

        // Getters
        public Long getBrandId() { return brandId; }
        public Long getModelId() { return modelId; }
        public String getEntityType() { return entityType; }
        public long getAffectedListingsCount() { return affectedListingsCount; }
        public String getImpactMessage() { return impactMessage; }

        public boolean hasImpact() { return affectedListingsCount > 0; }

        public boolean isHighImpact() { return affectedListingsCount > 10; }

        public String getSeverityLevel() {
            if (affectedListingsCount == 0) return "NONE";
            if (affectedListingsCount <= 5) return "LOW";
            if (affectedListingsCount <= 20) return "MEDIUM";
            return "HIGH";
        }
    }
}

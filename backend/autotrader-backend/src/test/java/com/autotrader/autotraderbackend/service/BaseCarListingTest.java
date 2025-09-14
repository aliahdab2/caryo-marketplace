package com.autotrader.autotraderbackend.service;

import org.springframework.data.jpa.domain.Specification;
import static org.mockito.ArgumentMatchers.any;

/**
 * Base test class for car listing related services.
 * Provides common helper methods to avoid code duplication.
 */
public abstract class BaseCarListingTest {

    /**
     * Helper method to create properly typed Specification matcher for Mockito
     */
    @SuppressWarnings("unchecked")
    protected <T> Specification<T> anySpecification() {
        return any(Specification.class);
    }
}

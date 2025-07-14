package com.autotrader.autotraderbackend.repository.specification;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.springframework.data.jpa.domain.Specification;

import java.util.Arrays;
import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("Slug-Based Filtering Tests")
class SlugBasedFilteringTest {

    @Nested
    @DisplayName("Brand Slug Filtering Tests")
    class BrandSlugFilteringTests {

        @Test
        @DisplayName("Should create specification with single brand slug")
        void fromFilter_withSingleBrandSlug_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrandSlugs(Arrays.asList("toyota"));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedBrandSlugs()).containsExactly("toyota");
        }

        @Test
        @DisplayName("Should create specification with multiple brand slugs")
        void fromFilter_withMultipleBrandSlugs_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrandSlugs(Arrays.asList("toyota", "honda", "bmw"));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedBrandSlugs()).containsExactlyInAnyOrder("toyota", "honda", "bmw");
        }

        @Test
        @DisplayName("Should handle empty brand slugs")
        void fromFilter_withEmptyBrandSlugs_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrandSlugs(Collections.emptyList());
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedBrandSlugs()).isEmpty();
        }

        @Test
        @DisplayName("Should normalize brand slugs (trim, lowercase, remove duplicates)")
        void fromFilter_shouldNormalizeBrandSlugs() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrandSlugs(Arrays.asList("  TOYOTA  ", "honda", "TOYOTA", "BMW ", null, ""));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedBrandSlugs()).containsExactlyInAnyOrder("toyota", "honda", "bmw");
        }
    }

    @Nested
    @DisplayName("Model Slug Filtering Tests")
    class ModelSlugFilteringTests {

        @Test
        @DisplayName("Should create specification with single model slug")
        void fromFilter_withSingleModelSlug_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setModelSlugs(Arrays.asList("camry"));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedModelSlugs()).containsExactly("camry");
        }

        @Test
        @DisplayName("Should create specification with multiple model slugs")
        void fromFilter_withMultipleModelSlugs_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setModelSlugs(Arrays.asList("camry", "corolla", "civic", "accord"));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedModelSlugs()).containsExactlyInAnyOrder("camry", "corolla", "civic", "accord");
        }

        @Test
        @DisplayName("Should normalize model slugs (trim, lowercase, remove duplicates)")
        void fromFilter_shouldNormalizeModelSlugs() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setModelSlugs(Arrays.asList("  CAMRY  ", "corolla", "CAMRY", "Civic ", null, ""));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedModelSlugs()).containsExactlyInAnyOrder("camry", "corolla", "civic");
        }
    }

    @Nested
    @DisplayName("Combined Brand and Model Slug Filtering Tests")
    class CombinedSlugFilteringTests {

        @Test
        @DisplayName("Should create specification with both brand and model slugs")
        void fromFilter_withBrandAndModelSlugs_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrandSlugs(Arrays.asList("toyota", "honda"));
            filter.setModelSlugs(Arrays.asList("camry", "civic"));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedBrandSlugs()).containsExactlyInAnyOrder("toyota", "honda");
            assertThat(filter.getNormalizedModelSlugs()).containsExactlyInAnyOrder("camry", "civic");
        }

        @Test
        @DisplayName("Should handle AutoTrader UK pattern - multiple brands and models")
        void fromFilter_withAutoTraderUKPattern_shouldCreateSpecification() {
            // AutoTrader UK pattern: ?brandSlugs=toyota&brandSlugs=honda&modelSlugs=camry&modelSlugs=civic&modelSlugs=accord
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrandSlugs(Arrays.asList("toyota", "honda"));
            filter.setModelSlugs(Arrays.asList("camry", "civic", "accord"));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
            assertThat(filter.getNormalizedBrandSlugs()).containsExactlyInAnyOrder("toyota", "honda");
            assertThat(filter.getNormalizedModelSlugs()).containsExactlyInAnyOrder("camry", "civic", "accord");
        }
    }

    @Nested
    @DisplayName("Validation Tests")
    class ValidationTests {

        @Test
        @DisplayName("Should throw exception when too many brand slugs provided")
        void fromFilter_withTooManyBrandSlugs_shouldThrowException() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            // Create a list with more than 50 brand slugs
            String[] manyBrands = new String[51];
            for (int i = 0; i < 51; i++) {
                manyBrands[i] = "brand" + i;
            }
            filter.setBrandSlugs(Arrays.asList(manyBrands));
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Too many brand slugs provided (max 50)");
        }

        @Test
        @DisplayName("Should throw exception when too many model slugs provided")
        void fromFilter_withTooManyModelSlugs_shouldThrowException() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            // Create a list with more than 50 model slugs
            String[] manyModels = new String[51];
            for (int i = 0; i < 51; i++) {
                manyModels[i] = "model" + i;
            }
            filter.setModelSlugs(Arrays.asList(manyModels));
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Too many model slugs provided (max 50)");
        }
    }
}

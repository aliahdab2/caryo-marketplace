package com.autotrader.autotraderbackend.repository.specification;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("CarListingSpecification Tests")
class CarListingSpecificationTest {

    @Nested
    @DisplayName("Hierarchical Brand Filter Tests")
    class HierarchicalBrandFilterTests {

        @Test
        @DisplayName("Should create specification with single brand filter")
        void fromFilter_withSingleBrand_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("Toyota");
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create specification with brand and single model")
        void fromFilter_withBrandAndSingleModel_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("Toyota:Camry");
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create specification with brand and multiple models")
        void fromFilter_withBrandAndMultipleModels_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("Toyota:Camry;Corolla;Prius");
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create specification with multiple brands and models")
        void fromFilter_withMultipleBrandsAndModels_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("Toyota:Camry;Corolla,Honda:Civic;Accord,BMW:X3");
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create specification with mixed brand-only and brand-with-models")
        void fromFilter_withMixedBrandTypes_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("Toyota:Camry,Honda,BMW:X3;X5");
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should handle empty brand filter gracefully")
        void fromFilter_withEmptyBrand_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("");
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should handle null brand filter gracefully")
        void fromFilter_withNullBrand_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand(null);
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should handle brand filter with spaces and special characters")
        void fromFilter_withSpecialCharacters_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("Mercedes-Benz:C-Class;E-Class,Rolls-Royce:Phantom");
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @ParameterizedTest
        @ValueSource(strings = {
            "Toyota:Camry",
            "Honda",
            "BMW:X3;X5;M3",
            "Toyota:Camry,Honda:Civic",
            "Mercedes-Benz:C-Class;E-Class,BMW",
            "Audi:A4;A6;Q7,Lexus:ES;RX,Infiniti"
        })
        @DisplayName("Should handle various valid brand filter formats")
        void fromFilter_withVariousValidFormats_shouldCreateSpecification(String brandFilter) {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand(brandFilter);
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }
    }

    @Nested
    @DisplayName("Year Range Filter Tests")
    class YearRangeFilterTests {

        @Test
        @DisplayName("Should create specification with valid year range")
        void fromFilter_withValidYearRange_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinYear(2020);
            filter.setMaxYear(2024);
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create specification with only minimum year")
        void fromFilter_withOnlyMinYear_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinYear(2020);
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create specification with only maximum year")
        void fromFilter_withOnlyMaxYear_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMaxYear(2024);
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @ParameterizedTest
        @CsvSource({
            "1899", "2031", "0", "-1", "3000"
        })
        @DisplayName("Should throw exception for invalid minimum years")
        void fromFilter_withInvalidMinYear_shouldThrowException(int invalidYear) {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinYear(invalidYear);
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid minimum year");
        }

        @ParameterizedTest
        @CsvSource({
            "1899", "2031", "0", "-1", "3000"
        })
        @DisplayName("Should throw exception for invalid maximum years")
        void fromFilter_withInvalidMaxYear_shouldThrowException(int invalidYear) {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMaxYear(invalidYear);
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid maximum year");
        }

        @Test
        @DisplayName("Should throw exception when min year is greater than max year")
        void fromFilter_withMinYearGreaterThanMaxYear_shouldThrowException() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinYear(2024);
            filter.setMaxYear(2020);
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Minimum year cannot be greater than maximum year");
        }
    }

    @Nested
    @DisplayName("Price Range Filter Tests")
    class PriceRangeFilterTests {

        @Test
        @DisplayName("Should create specification with valid price range")
        void fromFilter_withValidPriceRange_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinPrice(new BigDecimal("10000"));
            filter.setMaxPrice(new BigDecimal("50000"));
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should throw exception for negative minimum price")
        void fromFilter_withNegativeMinPrice_shouldThrowException() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinPrice(new BigDecimal("-1000"));
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Minimum price cannot be negative");
        }

        @Test
        @DisplayName("Should throw exception for negative maximum price")
        void fromFilter_withNegativeMaxPrice_shouldThrowException() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMaxPrice(new BigDecimal("-5000"));
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Maximum price cannot be negative");
        }

        @Test
        @DisplayName("Should throw exception when min price is greater than max price")
        void fromFilter_withMinPriceGreaterThanMaxPrice_shouldThrowException() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinPrice(new BigDecimal("50000"));
            filter.setMaxPrice(new BigDecimal("30000"));
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Minimum price cannot be greater than maximum price");
        }
    }

    @Nested
    @DisplayName("Mileage Range Filter Tests")
    class MileageRangeFilterTests {

        @Test
        @DisplayName("Should create specification with valid mileage range")
        void fromFilter_withValidMileageRange_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinMileage(10000);
            filter.setMaxMileage(100000);
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should throw exception for negative minimum mileage")
        void fromFilter_withNegativeMinMileage_shouldThrowException() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinMileage(-1000);
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Minimum mileage cannot be negative");
        }

        @Test
        @DisplayName("Should throw exception when min mileage is greater than max mileage")
        void fromFilter_withMinMileageGreaterThanMaxMileage_shouldThrowException() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setMinMileage(100000);
            filter.setMaxMileage(50000);
            
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(filter, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Minimum mileage cannot be greater than maximum mileage");
        }
    }

    @Nested
    @DisplayName("Complex Filter Combination Tests")
    class ComplexFilterTests {

        @Test
        @DisplayName("Should create specification with all filters combined")
        void fromFilter_withAllFilters_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("Toyota:Camry;Corolla,Honda:Civic");
            filter.setMinYear(2020);
            filter.setMaxYear(2024);
            filter.setMinPrice(new BigDecimal("15000"));
            filter.setMaxPrice(new BigDecimal("45000"));
            filter.setMinMileage(5000);
            filter.setMaxMileage(80000);
            filter.setIsSold(false);
            filter.setIsArchived(false);
            filter.setSellerTypeId(1L);

            Governorate governorate = new Governorate();
            governorate.setId(1L);
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, governorate);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should handle filters with whitespace and formatting issues")
        void fromFilter_withWhitespaceAndFormatting_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setBrand("  Toyota : Camry ; Corolla  ,  Honda : Civic  ");
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }
    }

    @Nested
    @DisplayName("Null and Edge Case Tests")
    class NullAndEdgeCaseTests {

        @Test
        @DisplayName("Should throw exception for null filter")
        void fromFilter_withNullFilter_shouldThrowException() {
            // When & Then
            assertThatThrownBy(() -> CarListingSpecification.fromFilter(null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Filter request cannot be null");
        }

        @Test
        @DisplayName("Should create specification with empty filter")
        void fromFilter_withEmptyFilter_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should handle governorate entity filter")
        void fromFilter_withGovernorateEntity_shouldCreateSpecification() {
            // Given
            ListingFilterRequest filter = new ListingFilterRequest();
            Governorate governorate = new Governorate();
            governorate.setId(1L);
            
            // When
            Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, governorate);
            
            // Then
            assertThat(spec).isNotNull();
        }
    }

    @Nested
    @DisplayName("Static Specification Tests")
    class StaticSpecificationTests {

        @Test
        @DisplayName("Should create isApproved specification")
        void isApproved_shouldCreateSpecification() {
            // When
            Specification<CarListing> spec = CarListingSpecification.isApproved();
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create isNotSold specification")
        void isNotSold_shouldCreateSpecification() {
            // When
            Specification<CarListing> spec = CarListingSpecification.isNotSold();
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create isNotArchived specification")
        void isNotArchived_shouldCreateSpecification() {
            // When
            Specification<CarListing> spec = CarListingSpecification.isNotArchived();
            
            // Then
            assertThat(spec).isNotNull();
        }

        @Test
        @DisplayName("Should create isUserActive specification")
        void isUserActive_shouldCreateSpecification() {
            // When
            Specification<CarListing> spec = CarListingSpecification.isUserActive();
            
            // Then
            assertThat(spec).isNotNull();
        }
    }

    @Nested
    @DisplayName("Brand Filter Validation Tests")
    class BrandFilterValidationTests {

        @ParameterizedTest
        @ValueSource(strings = {
            "Toyota",
            "Toyota:Camry",
            "Toyota:Camry;Corolla",
            "Toyota:Camry,Honda:Civic",
            "Mercedes-Benz:C-Class;E-Class",
            ""
        })
        @DisplayName("Should validate correct brand filter formats")
        void isValidHierarchicalBrandFilter_withValidFormats_shouldReturnTrue(String brandFilter) {
            // When
            boolean isValid = CarListingSpecification.isValidHierarchicalBrandFilter(brandFilter);
            
            // Then
            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("Should validate null brand filter as valid")
        void isValidHierarchicalBrandFilter_withNull_shouldReturnTrue() {
            // When
            boolean isValid = CarListingSpecification.isValidHierarchicalBrandFilter(null);
            
            // Then
            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("Should invalidate brand filter with excessively long brand name")
        void isValidHierarchicalBrandFilter_withLongBrandName_shouldReturnFalse() {
            // Given
            String longBrandName = "A".repeat(101); // 101 characters
            
            // When
            boolean isValid = CarListingSpecification.isValidHierarchicalBrandFilter(longBrandName);
            
            // Then
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("Should invalidate brand filter with excessively long model name")
        void isValidHierarchicalBrandFilter_withLongModelName_shouldReturnFalse() {
            // Given
            String longModelName = "A".repeat(101); // 101 characters
            String brandFilter = "Toyota:" + longModelName;
            
            // When
            boolean isValid = CarListingSpecification.isValidHierarchicalBrandFilter(brandFilter);
            
            // Then
            assertThat(isValid).isFalse();
        }
    }
}
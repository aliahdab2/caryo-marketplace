package com.autotrader.autotraderbackend.repository.specification;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import jakarta.persistence.criteria.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CarListingSpecificationTest {

    @Mock
    private Root<CarListing> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder criteriaBuilder;

    @Mock
    private Path<Object> path;

    @Mock
    private Path<Object> nestedPath;

    @Mock
    private Expression<String> stringPath;

    @Mock
    private Predicate mockPredicate;

    @BeforeEach
    void setUp() {
        // Mock behavior for path chaining
        lenient().when(root.get(anyString())).thenReturn(path);
        lenient().when(path.get(anyString())).thenReturn(nestedPath);
        lenient().when(nestedPath.get(anyString())).thenReturn(path);
        lenient().when(criteriaBuilder.lower(any())).thenReturn(stringPath);

        // Mock behavior for predicate creation
        lenient().when(criteriaBuilder.like(any(), anyString())).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.or(any(), any())).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.and(any(), any())).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.or(any(Predicate[].class))).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.and(any(Predicate[].class))).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.greaterThanOrEqualTo(any(), any(Integer.class))).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.lessThanOrEqualTo(any(), any(Integer.class))).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.greaterThanOrEqualTo(any(), any(BigDecimal.class))).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.lessThanOrEqualTo(any(), any(BigDecimal.class))).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.equal(any(), any())).thenReturn(mockPredicate);
    }

    @Test
    void fromFilter_withSingleBrandAndSingleModel() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota:Camry");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder, times(1)).and(any(Predicate.class), any(Predicate.class));
    }

    @Test
    void fromFilter_withSingleBrandAndMultipleModels() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota:Camry;Corolla");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%corolla%"));
        
        ArgumentCaptor<Predicate[]> orCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder, atLeast(1)).or(orCaptor.capture());
        
        verify(criteriaBuilder, times(1)).and(any(Predicate.class), any(Predicate.class));
    }

    @Test
    void fromFilter_withMultipleBrandModelGroups() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota:Camry,Honda:Civic");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%honda%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%civic%"));

        verify(criteriaBuilder, times(2)).and(any(Predicate.class), any(Predicate.class));
    }

    @Test
    void fromFilter_withComplexHierarchicalQuery() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota:Camry;Corolla,Honda,BMW:X5");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%corolla%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%honda%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%bmw%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%x5%"));

        verify(criteriaBuilder, times(2)).and(any(Predicate.class), any(Predicate.class));
    }

    @Test
    void fromFilter_withBrandOnly_shouldCreateBrandPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, never()).like(any(), eq("%camry%"));
    }

    @Test
    void fromFilter_withModelOnly_shouldNotCreateAnyPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        // Model-only filtering is not supported anymore - would need to be "Toyota:Camry"
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Model-only filtering is not supported - no model predicates should be created
        verify(criteriaBuilder, never()).like(any(), eq("%camry%"));
        verify(criteriaBuilder, never()).like(any(), eq("%toyota%"));
    }

    @Test
    void fromFilter_withEmptyModelInPair_shouldTreatAsBrandOnly() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota:,Honda");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%honda%"));
        verify(criteriaBuilder, never()).and(any(Predicate.class), any(Predicate.class));
    }

    @Test
    void fromFilter_withCaseInsensitive_shouldConvertToLowerCase() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("tOyOtA:cAmRy");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
    }

    @Test
    void fromFilter_withAllOtherFilters_shouldAddAllPredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota:Camry");
        filter.setMinYear(2020);
        filter.setMaxYear(2024);
        filter.setMinPrice(new BigDecimal("15000.0"));
        filter.setMaxPrice(new BigDecimal("50000.0"));
        filter.setMinMileage(10000);
        filter.setMaxMileage(80000);
        filter.setIsSold(false);
        filter.setIsArchived(false);
        filter.setSellerTypeId(1L);

        Governorate governorate = new Governorate();
        governorate.setId(1L);

        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, governorate);
        Predicate result = spec.toPredicate(root, query, criteriaBuilder);

        // Verify that a predicate was created (non-null result)
        assertThat(result).isNotNull();
        
        // Verify that the criteriaBuilder.and() was called to combine predicates
        verify(criteriaBuilder, atLeastOnce()).and(any(Predicate[].class));
        
        // Verify key filter operations were performed
        verify(criteriaBuilder, atLeast(2)).like(any(), anyString()); // For brand filtering
        verify(criteriaBuilder, atLeastOnce()).greaterThanOrEqualTo(any(), any(Integer.class)); // For min values
        verify(criteriaBuilder, atLeastOnce()).lessThanOrEqualTo(any(), any(Integer.class)); // For max values
    }

    @Test
    void fromFilter_withEmptyBrand_shouldNotCreateAnyBrandOrModelPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("");
        // Model-only filtering is not supported anymore
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Since model-only filtering is not supported, no brand or model predicates should be created
        verify(criteriaBuilder, never()).like(any(), eq("%camry%"));
        verify(criteriaBuilder, never()).like(any(), eq("%toyota%"));
    }

    @Test
    void fromFilter_withEmptyModel_shouldNotCreateModelPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota");
        // Empty model is not relevant anymore since we removed the model field
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, never()).like(any(), eq("%camry%"));
    }

    @Test
    void fromFilter_withWhitespaceOnlyBrand_shouldHandleGracefully() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("   ");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        Predicate result = spec.toPredicate(root, query, criteriaBuilder);

        assertThat(result).isNotNull();
        verify(criteriaBuilder, never()).like(any(), anyString());
    }

    @Test
    void fromFilter_withSpecialCharactersInBrand_shouldEscapeCorrectly() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Mercedes-Benz:C-Class");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%mercedes-benz%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%c-class%"));
    }

    @Test
    void fromFilter_withMixedCaseAndSpaces_shouldNormalizeCorrectly() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand(" Toyota : Camry ");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
    }

    @Test
    void fromFilter_withEmptyFilter_shouldCreateEmptyPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        Predicate result = spec.toPredicate(root, query, criteriaBuilder);

        assertThat(result).isNotNull();
        // Should only call and() to combine the empty predicate list
        verify(criteriaBuilder, times(1)).and(any(Predicate[].class));
        verify(criteriaBuilder, never()).like(any(), anyString());
    }

    @Test
    void fromFilter_withOnlyYearFilters_shouldCreateYearPredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setMinYear(2020);
        filter.setMaxYear(2024);
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(1)).greaterThanOrEqualTo(any(), eq(2020));
        verify(criteriaBuilder, times(1)).lessThanOrEqualTo(any(), eq(2024));
    }

    @Test
    void fromFilter_withOnlyPriceFilters_shouldCreatePricePredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setMinPrice(new BigDecimal("10000"));
        filter.setMaxPrice(new BigDecimal("50000"));
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(1)).greaterThanOrEqualTo(any(), eq(new BigDecimal("10000")));
        verify(criteriaBuilder, times(1)).lessThanOrEqualTo(any(), eq(new BigDecimal("50000")));
    }

    @Test
    void fromFilter_withMultipleBrandsOnly_shouldCreateBrandOrConditions() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota,Honda,BMW");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%honda%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%bmw%"));
        
        // Should create OR conditions for multiple brands
        verify(criteriaBuilder, atLeastOnce()).or(any(Predicate[].class));
    }

    @Test
    void fromFilter_withBrandContainingColon_shouldHandleCorrectly() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota:Camry:Hybrid");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        // Should treat "Camry:Hybrid" as the model part (colon remains intact in model name)
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry:hybrid%"));
    }

    @Test
    void fromFilter_withGovernorateOnly_shouldCreateGovernorateFilter() {
        ListingFilterRequest filter = new ListingFilterRequest();
        
        Governorate governorate = new Governorate();
        governorate.setId(5L);
        
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, governorate);
        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder, times(1)).equal(any(), eq(5L));
    }
}

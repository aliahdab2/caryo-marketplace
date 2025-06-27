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
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingSpecificationTest {

    @Mock
    private Root<CarListing> root;

    @Mock
    private CriteriaQuery<?> query;

    @Mock
    private CriteriaBuilder criteriaBuilder;

    @Mock
    private Path<String> stringPath;
    @Mock
    private Path<Integer> integerPath;
    @Mock
    private Path<Double> doublePath;
    @Mock
    private Path<BigDecimal> bigDecimalPath;
    @Mock
    private Path<Boolean> booleanPath;

    @Mock
    private Predicate mockPredicate;

    @BeforeEach
    @SuppressWarnings("unchecked") // Suppress warnings for generic mocking
    void setUpMocks() {
        // Mock root.get() calls to return appropriate Path objects
        lenient().when(root.<String>get(anyString())).thenReturn(stringPath);
        lenient().when(root.<Integer>get(eq("modelYear"))).thenReturn(integerPath);
        lenient().when(root.<Integer>get(eq("mileage"))).thenReturn(integerPath);
        // Mock get("price") to return the BigDecimal path
        lenient().when(root.<BigDecimal>get(eq("price"))).thenReturn(bigDecimalPath);
        lenient().when(root.<Boolean>get(eq("approved"))).thenReturn(booleanPath);

        // Mock criteriaBuilder methods to return a generic predicate
        // Specific interactions will be verified in tests
        lenient().when(criteriaBuilder.like(any(), anyString())).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.equal(any(), any())).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.or(any(Predicate.class), any(Predicate.class))).thenReturn(mockPredicate);
        // These lines cause the warnings, suppressed by annotation on method
        lenient().when(criteriaBuilder.greaterThanOrEqualTo(any(), any(Comparable.class))).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.lessThanOrEqualTo(any(), any(Comparable.class))).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.isTrue(any())).thenReturn(mockPredicate);
        lenient().when(criteriaBuilder.and(any(Predicate[].class))).thenReturn(mockPredicate); // For the final AND
        lenient().when(criteriaBuilder.lower(any())).thenReturn(stringPath); // Mock lower() to return the path itself for simplicity
    }

    @Test
    void fromFilter_withEmptyFilter_shouldReturnNoPredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify that 'and' is called with an empty array (or null predicate if empty)
        verify(criteriaBuilder).and(eq(new Predicate[0]));
        verifyNoMoreInteractions(criteriaBuilder); // Ensure no other criteria methods were called
    }

    @Test
    void fromFilter_withBrand_shouldAddBrandPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Toyota");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify bilingual brand search - should search in both English and Arabic fields
        verify(criteriaBuilder, times(2)).lower(any()); // Called twice: once for brandNameEn, once for brandNameAr
        verify(criteriaBuilder, times(2)).like(any(), eq("%toyota%"));
        verify(criteriaBuilder).or(any(Predicate.class), any(Predicate.class));

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(1, predicateCaptor.getValue().length, "Should combine exactly 1 predicate");
    }

    @Test
    void fromFilter_withModel_shouldAddModelPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setModel("Camry");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify bilingual model search - should search in both English and Arabic fields
        verify(criteriaBuilder, times(2)).lower(any()); // Called twice: once for modelNameEn, once for modelNameAr
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder).or(any(Predicate.class), any(Predicate.class));

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(1, predicateCaptor.getValue().length, "Should combine exactly 1 predicate");
    }

    @Test
    void fromFilter_withMinMaxYear_shouldAddYearPredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setMinYear(2015);
        filter.setMaxYear(2020);
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Use eq() for the Path argument
        verify(criteriaBuilder).greaterThanOrEqualTo(eq(root.get("modelYear")), eq(2015));
        verify(criteriaBuilder).lessThanOrEqualTo(eq(root.get("modelYear")), eq(2020));

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(2, predicateCaptor.getValue().length, "Should combine exactly 2 predicates");
    }

     @Test
    void fromFilter_withMinMaxPrice_shouldAddPricePredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        BigDecimal minPrice = BigDecimal.valueOf(10000.0);
        BigDecimal maxPrice = BigDecimal.valueOf(20000.0);
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Use eq() for the Path argument
        verify(criteriaBuilder).greaterThanOrEqualTo(eq(root.get("price")), eq(minPrice));
        verify(criteriaBuilder).lessThanOrEqualTo(eq(root.get("price")), eq(maxPrice));

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(2, predicateCaptor.getValue().length, "Should combine exactly 2 predicates");
    }

    @Test
    void fromFilter_withMinMaxMileage_shouldAddMileagePredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setMinMileage(50000);
        filter.setMaxMileage(100000);
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Use eq() for the Path argument
        verify(criteriaBuilder).greaterThanOrEqualTo(eq(root.get("mileage")), eq(50000));
        verify(criteriaBuilder).lessThanOrEqualTo(eq(root.get("mileage")), eq(100000));

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(2, predicateCaptor.getValue().length, "Should combine exactly 2 predicates");
    }

    @Test
    void fromFilter_withLocation_shouldAddLocationPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setLocation("London");
        // We're passing null for the locationEntity - the location field in filter should be ignored
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify location filter has been removed in favor of locationEntity in the main specification
        // This test now verifies that no location-related filters are applied without a Location entity

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(0, predicateCaptor.getValue().length, "Should combine 0 predicates since location string is now ignored");
    }

    @Test
    @SuppressWarnings("unchecked")
    void fromFilter_withAllFilters_shouldAddAllPredicates() {
        // Mock the nested path structure for seller.sellerType.id
        Path<Object> sellerPath = mock(Path.class);
        Path<Object> sellerTypePath = mock(Path.class);
        Path<Object> sellerTypeIdPath = mock(Path.class);
        when(root.get("seller")).thenReturn(sellerPath);
        when(sellerPath.get("sellerType")).thenReturn(sellerTypePath);
        when(sellerTypePath.get("id")).thenReturn(sellerTypeIdPath);

        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setBrand("Honda");
        filter.setModel("Civic");
        filter.setMinYear(2018);
        filter.setMaxYear(2021);
        BigDecimal minPrice = BigDecimal.valueOf(15000.0);
        BigDecimal maxPrice = BigDecimal.valueOf(25000.0);
        filter.setMinPrice(minPrice);
        filter.setMaxPrice(maxPrice);
        filter.setMinMileage(30000);
        filter.setMaxMileage(60000);
        filter.setLocation("Manchester");
        filter.setSellerTypeId(1L);

        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);
        spec.toPredicate(root, query, criteriaBuilder);

        // Verify individual predicates using eq() for Path arguments where applicable
        verify(criteriaBuilder, times(4)).lower(any()); // Called 4 times: 2 for brand (EN + AR), 2 for model (EN + AR)
        verify(criteriaBuilder, times(2)).like(any(), eq("%honda%")); // 2 times for brand (EN + AR)
        verify(criteriaBuilder, times(2)).like(any(), eq("%civic%")); // 2 times for model (EN + AR)
        verify(criteriaBuilder, times(2)).or(any(Predicate.class), any(Predicate.class)); // For brand and model OR conditions
        verify(criteriaBuilder).greaterThanOrEqualTo(eq(root.get("modelYear")), eq(2018));
        verify(criteriaBuilder).lessThanOrEqualTo(eq(root.get("modelYear")), eq(2021));
        verify(criteriaBuilder).greaterThanOrEqualTo(eq(root.get("price")), eq(minPrice));
        verify(criteriaBuilder).lessThanOrEqualTo(eq(root.get("price")), eq(maxPrice));
        verify(criteriaBuilder).greaterThanOrEqualTo(eq(root.get("mileage")), eq(30000));
        verify(criteriaBuilder).lessThanOrEqualTo(eq(root.get("mileage")), eq(60000));
        
        // Verify seller type filter
        verify(root).get("seller");
        verify(sellerPath).get("sellerType");
        verify(sellerTypePath).get("id");
        verify(criteriaBuilder).equal(sellerTypeIdPath, 1L);
        
        // No longer verify location String predicate since we use locationEntity now
        // verify(criteriaBuilder).like(any(), eq("%manchester%"));

        // Verify the final 'and' combines all 8 predicates using ArgumentCaptor 
        // (Brand and Model are now combined into a single OR predicate when both are present)
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(8, predicateCaptor.getValue().length, "Should combine exactly 8 predicates");
    }

    @Test
    void isApproved_shouldAddApprovedPredicate() {
        Specification<CarListing> spec = CarListingSpecification.isApproved();
        spec.toPredicate(root, query, criteriaBuilder);

        verify(criteriaBuilder).isTrue(eq(root.get("approved"))); // Use eq() for Path
        verifyNoMoreInteractions(criteriaBuilder); // Ensure only isTrue was called
    }

    @Test
    @SuppressWarnings("unchecked")
    void fromFilter_withGovernorateEntity_shouldAddGovernoratePredicate() {
        // Create a mock Governorate entity
        Governorate mockGovernorate = mock(Governorate.class);
        when(mockGovernorate.getId()).thenReturn(1L);

        // Mock the nested path structure for governorate.id
        Path<Object> governoratePath = mock(Path.class);
        Path<Object> governorateIdPath = mock(Path.class);
        when(root.get("governorate")).thenReturn(governoratePath);
        when(governoratePath.get("id")).thenReturn(governorateIdPath);

        ListingFilterRequest filter = new ListingFilterRequest();
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, mockGovernorate);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify that the correct path is used: root.get("governorate").get("id")
        verify(root).get("governorate");
        verify(governoratePath).get("id");
        verify(criteriaBuilder).equal(governorateIdPath, 1L);

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(1, predicateCaptor.getValue().length, "Should combine exactly 1 predicate for governorate filter");
    }

    @Test
    @SuppressWarnings("unchecked")
    void fromFilter_withSellerTypeId_shouldAddSellerTypePredicate() {
        // Mock the nested path structure for seller.sellerType.id
        Path<Object> sellerPath = mock(Path.class);
        Path<Object> sellerTypePath = mock(Path.class);
        Path<Object> sellerTypeIdPath = mock(Path.class);
        when(root.get("seller")).thenReturn(sellerPath);
        when(sellerPath.get("sellerType")).thenReturn(sellerTypePath);
        when(sellerTypePath.get("id")).thenReturn(sellerTypeIdPath);

        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setSellerTypeId(2L);
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify that the correct path is used: root.get("seller").get("sellerType").get("id")
        verify(root).get("seller");
        verify(sellerPath).get("sellerType");
        verify(sellerTypePath).get("id");
        verify(criteriaBuilder).equal(sellerTypeIdPath, 2L);

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(1, predicateCaptor.getValue().length, "Should combine exactly 1 predicate for seller type filter");
    }

    @Test
    void fromFilter_withIsSoldAndIsArchived_shouldAddStatusPredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setIsSold(true);
        filter.setIsArchived(false);
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify status filters
        verify(criteriaBuilder).equal(eq(root.get("sold")), eq(true));
        verify(criteriaBuilder).equal(eq(root.get("archived")), eq(false));

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(2, predicateCaptor.getValue().length, "Should combine exactly 2 predicates for status filters");
    }

    @Test
    void fromFilter_withSingleModel_shouldCreateSingleModelPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setModel("Camry");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify model filters for both languages - should appear twice (EN + AR)
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder, times(2)).like(any(), anyString()); // English + Arabic

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(1, predicateCaptor.getValue().length, "Should combine exactly 1 predicate for single model filter");
    }

    @Test
    void fromFilter_withMultipleModels_shouldCreateMultipleModelPredicates() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setModel("Camry,Corolla,RAV4");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify each model is searched in both languages (each model name appears twice)
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%corolla%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%rav4%"));
        
        // Should have 6 LIKE calls total (3 models × 2 languages)
        verify(criteriaBuilder, times(6)).like(any(), anyString());
        
        // Should combine model predicates with OR operations
        verify(criteriaBuilder, times(3)).or(any(Predicate.class), any(Predicate.class)); // One for each model (EN OR AR)
        verify(criteriaBuilder, times(1)).or(any(Predicate[].class)); // Combine all models with OR

        // Use ArgumentCaptor for 'and'
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(1, predicateCaptor.getValue().length, "Should combine exactly 1 predicate for multiple model filter");
    }

    @Test
    void fromFilter_withMultipleModelsWithSpaces_shouldTrimAndFilter() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setModel(" Camry , Corolla , RAV4 ");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Verify spaces are trimmed properly - each model name appears twice (EN + AR)
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%corolla%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%rav4%"));
        
        // Should have 6 LIKE calls total (3 models × 2 languages)
        verify(criteriaBuilder, times(6)).like(any(), anyString());
    }

    @Test
    void fromFilter_withEmptyAndValidModels_shouldFilterOutEmptyOnes() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setModel("Camry,,Corolla, ,RAV4");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Should only create predicates for non-empty models - each appears twice (EN + AR)
        verify(criteriaBuilder, times(2)).like(any(), eq("%camry%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%corolla%"));
        verify(criteriaBuilder, times(2)).like(any(), eq("%rav4%"));
        
        // Should have 6 LIKE calls total (3 valid models × 2 languages)
        verify(criteriaBuilder, times(6)).like(any(), anyString());
    }

    @Test
    void fromFilter_withEmptyModel_shouldNotCreateModelPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setModel("");
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Should not create any model-related predicates
        verify(root, never()).get("modelNameEn");
        verify(root, never()).get("modelNameAr");
        
        // Use ArgumentCaptor for 'and' - should have 0 predicates
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(0, predicateCaptor.getValue().length, "Should have no predicates for empty model filter");
    }

    @Test
    void fromFilter_withNullModel_shouldNotCreateModelPredicate() {
        ListingFilterRequest filter = new ListingFilterRequest();
        filter.setModel(null);
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filter, null);

        spec.toPredicate(root, query, criteriaBuilder);

        // Should not create any model-related predicates
        verify(root, never()).get("modelNameEn");
        verify(root, never()).get("modelNameAr");
        
        // Use ArgumentCaptor for 'and' - should have 0 predicates
        ArgumentCaptor<Predicate[]> predicateCaptor = ArgumentCaptor.forClass(Predicate[].class);
        verify(criteriaBuilder).and(predicateCaptor.capture());
        assertEquals(0, predicateCaptor.getValue().length, "Should have no predicates for null model filter");
    }
}

package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import static org.mockito.ArgumentMatchers.any;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingQueryServiceTest extends BaseCarListingTest {

    @Mock
    private CarListingRepository carListingRepository;


    @Mock
    private GovernorateRepository governorateRepository;

    @Mock
    private CarListingMapper carListingMapper;

    @InjectMocks
    private CarListingQueryService queryService;

    private CarListing testListing;
    private CarListingResponse testResponse;
    private Pageable pageable;

    @BeforeEach
    void setUp() {
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Test Car");

        testResponse = new CarListingResponse();
        testResponse.setId(1L);
        testResponse.setTitle("Test Car");

        pageable = PageRequest.of(0, 10);
    }

    @Test
    void getAllApprovedListings_ShouldReturnMappedPage() {
        // Given
        List<CarListing> listings = List.of(testListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        when(carListingRepository.findAll(anySpecification(), eq(pageable))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

        // When
        Page<CarListingResponse> result = queryService.getAllApprovedListings(pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(testResponse, result.getContent().get(0));

        verify(carListingRepository).findAll(anySpecification(), eq(pageable));
        verify(carListingMapper).toCarListingResponse(testListing);
    }

    @Test
    void getApprovedListingsCount_ShouldReturnCount() {
        // Given
        when(carListingRepository.count(anySpecification())).thenReturn(5L);

        // When
        long result = queryService.getApprovedListingsCount();

        // Then
        assertEquals(5L, result);
        verify(carListingRepository).count(anySpecification());
    }

    @Test
    void getFilteredListings_WithValidLocationId_ShouldApplyGovernorateFilter() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setLocationId(1L);

        Governorate governorate = new Governorate();
        governorate.setId(1L);
        governorate.setDisplayNameEn("Test Governorate");

        List<CarListing> listings = List.of(testListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        when(governorateRepository.findById(1L)).thenReturn(Optional.of(governorate));
        when(carListingRepository.findAll(anySpecification(), eq(pageable))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

        // When
        Page<CarListingResponse> result = queryService.getFilteredListings(filterRequest, pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(governorateRepository).findById(1L);
        verify(carListingRepository).findAll(anySpecification(), eq(pageable));
    }

    @Test
    void getFilteredListings_WithInvalidLocationId_ShouldReturnEmptyPage() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setLocationId(999L);

        when(governorateRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        Page<CarListingResponse> result = queryService.getFilteredListings(filterRequest, pageable);

        // Then
        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
        assertTrue(result.getContent().isEmpty());

        verify(governorateRepository).findById(999L);
        verify(carListingRepository, never()).findAll(anySpecification(), any(Pageable.class));
    }

    @Test
    void getFilteredListings_WithLocationSlugs_ShouldApplyGovernorateFilter() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setLocations(List.of("test-slug"));

        Governorate governorate = new Governorate();
        governorate.setId(1L);
        governorate.setSlug("test-slug");

        List<CarListing> listings = List.of(testListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        when(governorateRepository.findBySlug("test-slug")).thenReturn(Optional.of(governorate));
        when(carListingRepository.findAll(anySpecification(), eq(pageable))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

        // When
        Page<CarListingResponse> result = queryService.getFilteredListings(filterRequest, pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(governorateRepository).findBySlug("test-slug");
    }

    @Test
    void getFilteredListings_WithInvalidSortField_ShouldThrowException() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        Pageable pageableWithInvalidSort = PageRequest.of(0, 10, Sort.by("invalidField"));

        // When & Then
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> queryService.getFilteredListings(filterRequest, pageableWithInvalidSort));

        assertEquals("Sorting by field 'invalidField' is not allowed.", exception.getMessage());
    }

    @Test
    void getFilteredListings_WithValidSortField_ShouldNotThrowException() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        Pageable pageableWithValidSort = PageRequest.of(0, 10, Sort.by("price"));

        List<CarListing> listings = List.of(testListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        when(carListingRepository.findAll(anySpecification(), eq(pageableWithValidSort))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

        // When
        Page<CarListingResponse> result = queryService.getFilteredListings(filterRequest, pageableWithValidSort);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getFilteredListings_WithComplexFilter_ShouldApplyAllFilters() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setMinPrice(BigDecimal.valueOf(10000));
        filterRequest.setMaxPrice(BigDecimal.valueOf(50000));
        filterRequest.setBrandSlugs(List.of("toyota"));
        filterRequest.setIsSold(false);

        List<CarListing> listings = List.of(testListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        when(carListingRepository.findAll(anySpecification(), eq(pageable))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

        // When
        Page<CarListingResponse> result = queryService.getFilteredListings(filterRequest, pageable);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(carListingRepository).findAll(anySpecification(), eq(pageable));
    }

    @Test
    void getFilteredListingsCount_WithValidFilters_ShouldReturnCount() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrandSlugs(List.of("toyota"));

        when(carListingRepository.count(anySpecification())).thenReturn(15L);

        // When
        long result = queryService.getFilteredListingsCount(filterRequest);

        // Then
        assertEquals(15L, result);
        verify(carListingRepository).count(anySpecification());
    }

    @Test
    void getFilteredListingsCount_WithInvalidLocationId_ShouldReturnZero() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setLocationId(999L);

        when(governorateRepository.findById(999L)).thenReturn(Optional.empty());

        // When
        long result = queryService.getFilteredListingsCount(filterRequest);

        // Then
        assertEquals(0L, result);
        verify(governorateRepository).findById(999L);
        verify(carListingRepository, never()).count(anySpecification());
    }

    @Test
    void getAllApprovedListings_WithEmptyResults_ShouldReturnEmptyPage() {
        // Given
        Page<CarListing> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(carListingRepository.findAll(anySpecification(), eq(pageable))).thenReturn(emptyPage);

        // When
        Page<CarListingResponse> result = queryService.getAllApprovedListings(pageable);

        // Then
        assertNotNull(result);
        assertEquals(0, result.getTotalElements());
        assertTrue(result.getContent().isEmpty());
    }

    @Test
    void getApprovedListingsCount_WithZeroResults_ShouldReturnZero() {
        // Given
        when(carListingRepository.count(anySpecification())).thenReturn(0L);

        // When
        long result = queryService.getApprovedListingsCount();

        // Then
        assertEquals(0L, result);
    }

    @Test
    void getFilteredListings_WithNullFilterRequest_ShouldHandleGracefully() {
        // Given
        ListingFilterRequest filterRequest = null;
        List<CarListing> listings = List.of(testListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        when(carListingRepository.findAll(anySpecification(), eq(pageable))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

        // When & Then - This should not throw an exception
        assertDoesNotThrow(() -> {
            Page<CarListingResponse> result = queryService.getFilteredListings(filterRequest, pageable);
            assertNotNull(result);
        });
    }

    @Test
    void getFilteredListings_WithCompoundSortField_ShouldValidateCorrectly() {
        // Given
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        Pageable pageableWithCompoundSort = PageRequest.of(0, 10, Sort.by("price,desc"));

        List<CarListing> listings = List.of(testListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        when(carListingRepository.findAll(anySpecification(), eq(pageableWithCompoundSort))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

        // When
        Page<CarListingResponse> result = queryService.getFilteredListings(filterRequest, pageableWithCompoundSort);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}

package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Full-Text Search Service Tests")
class FullTextSearchServiceTest extends BaseCarListingTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private GovernorateRepository governorateRepository;

    @Mock
    private CarListingMapper carListingMapper;

    @InjectMocks
    private CarListingQueryService queryService;

    private Pageable pageable;
    private CarListing testListing;
    private CarListingResponse testResponse;

    @BeforeEach
    void setUp() {
        pageable = PageRequest.of(0, 10);

        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Toyota Camry");

        testResponse = new CarListingResponse();
        testResponse.setId(1L);
        testResponse.setTitle("Toyota Camry");
    }

    @Nested
    @DisplayName("When FTS is enabled")
    class FtsEnabled {

        @BeforeEach
        void enableFts() {
            ReflectionTestUtils.setField(queryService, "fullTextSearchEnabled", true);
            ReflectionTestUtils.setField(queryService, "fullTextSearchMaxResults", 1000);
        }

        @Test
        @DisplayName("Should use FTS IDs to filter results when searchQuery is present")
        void getFilteredListings_withSearchQuery_shouldUseFtsIds() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("Toyota");

            when(carListingRepository.findIdsByFullTextSearch(eq("Toyota"), eq(1000)))
                    .thenReturn(List.of(1L, 2L));
            Page<CarListing> listingPage = new PageImpl<>(List.of(testListing), pageable, 1);
            when(carListingRepository.findAll(anySpecification(), eq(pageable)))
                    .thenReturn(listingPage);
            when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

            Page<CarListingResponse> result = queryService.getFilteredListings(filter, pageable);

            assertThat(result.getTotalElements()).isEqualTo(1);
            verify(carListingRepository).findIdsByFullTextSearch(eq("Toyota"), eq(1000));
            verify(carListingRepository).findAll(anySpecification(), eq(pageable));
        }

        @Test
        @DisplayName("Should return empty page when FTS finds no matches")
        void getFilteredListings_withNoFtsMatches_shouldReturnEmpty() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("NonExistentBrand");

            when(carListingRepository.findIdsByFullTextSearch(eq("NonExistentBrand"), eq(1000)))
                    .thenReturn(Collections.emptyList());

            Page<CarListingResponse> result = queryService.getFilteredListings(filter, pageable);

            assertThat(result.getTotalElements()).isEqualTo(0);
            assertThat(result.getContent()).isEmpty();
            verify(carListingRepository).findIdsByFullTextSearch(eq("NonExistentBrand"), eq(1000));
            verify(carListingRepository, never()).findAll(anySpecification(), any(Pageable.class));
        }

        @Test
        @DisplayName("Should NOT mutate the original filter's searchQuery")
        void getFilteredListings_withFts_shouldNotMutateOriginalFilter() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("Toyota");

            when(carListingRepository.findIdsByFullTextSearch(eq("Toyota"), eq(1000)))
                    .thenReturn(List.of(1L));
            Page<CarListing> listingPage = new PageImpl<>(List.of(testListing), pageable, 1);
            when(carListingRepository.findAll(anySpecification(), eq(pageable)))
                    .thenReturn(listingPage);
            when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

            queryService.getFilteredListings(filter, pageable);

            // Original filter should NOT be mutated
            assertThat(filter.getSearchQuery()).isEqualTo("Toyota");
        }

        @Test
        @DisplayName("Should not use FTS when searchQuery is null")
        void getFilteredListings_withNullSearchQuery_shouldSkipFts() {
            ListingFilterRequest filter = new ListingFilterRequest();

            Page<CarListing> listingPage = new PageImpl<>(List.of(testListing), pageable, 1);
            when(carListingRepository.findAll(anySpecification(), eq(pageable)))
                    .thenReturn(listingPage);
            when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

            queryService.getFilteredListings(filter, pageable);

            verify(carListingRepository, never()).findIdsByFullTextSearch(anyString(), anyInt());
        }

        @Test
        @DisplayName("Should not use FTS when searchQuery is blank")
        void getFilteredListings_withBlankSearchQuery_shouldSkipFts() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("   ");

            Page<CarListing> listingPage = new PageImpl<>(List.of(testListing), pageable, 1);
            when(carListingRepository.findAll(anySpecification(), eq(pageable)))
                    .thenReturn(listingPage);
            when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

            queryService.getFilteredListings(filter, pageable);

            verify(carListingRepository, never()).findIdsByFullTextSearch(anyString(), anyInt());
        }

        @Test
        @DisplayName("Should trim searchQuery before FTS lookup")
        void getFilteredListings_withWhitespaceInQuery_shouldTrim() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("  Toyota  ");

            when(carListingRepository.findIdsByFullTextSearch(eq("Toyota"), eq(1000)))
                    .thenReturn(List.of(1L));
            Page<CarListing> listingPage = new PageImpl<>(List.of(testListing), pageable, 1);
            when(carListingRepository.findAll(anySpecification(), eq(pageable)))
                    .thenReturn(listingPage);
            when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

            queryService.getFilteredListings(filter, pageable);

            verify(carListingRepository).findIdsByFullTextSearch(eq("Toyota"), eq(1000));
        }

        @Test
        @DisplayName("Should use FTS for count queries too")
        void getFilteredListingsCount_withSearchQuery_shouldUseFts() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("BMW");

            when(carListingRepository.findIdsByFullTextSearch(eq("BMW"), eq(1000)))
                    .thenReturn(List.of(1L, 2L, 3L));
            when(carListingRepository.count(anySpecification())).thenReturn(3L);

            long count = queryService.getFilteredListingsCount(filter);

            assertThat(count).isEqualTo(3L);
            verify(carListingRepository).findIdsByFullTextSearch(eq("BMW"), eq(1000));
        }

        @Test
        @DisplayName("Should return 0 count when FTS finds no matches")
        void getFilteredListingsCount_withNoFtsMatches_shouldReturnZero() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("NonExistent");

            when(carListingRepository.findIdsByFullTextSearch(eq("NonExistent"), eq(1000)))
                    .thenReturn(Collections.emptyList());

            long count = queryService.getFilteredListingsCount(filter);

            assertThat(count).isEqualTo(0L);
            verify(carListingRepository, never()).count(anySpecification());
        }

        @Test
        @DisplayName("Should preserve other filter fields when FTS is used")
        void getFilteredListings_withFtsAndOtherFilters_shouldPreserveFilters() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("Toyota");
            filter.setBrandSlugs(List.of("toyota"));
            filter.setMinYear(2020);

            when(carListingRepository.findIdsByFullTextSearch(eq("Toyota"), eq(1000)))
                    .thenReturn(List.of(1L));
            Page<CarListing> listingPage = new PageImpl<>(List.of(testListing), pageable, 1);
            when(carListingRepository.findAll(anySpecification(), eq(pageable)))
                    .thenReturn(listingPage);
            when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

            queryService.getFilteredListings(filter, pageable);

            // Original filter keeps all its non-search fields
            assertThat(filter.getBrandSlugs()).containsExactly("toyota");
            assertThat(filter.getMinYear()).isEqualTo(2020);
        }
    }

    @Nested
    @DisplayName("When FTS is disabled (H2 / fallback)")
    class FtsDisabled {

        @BeforeEach
        void disableFts() {
            ReflectionTestUtils.setField(queryService, "fullTextSearchEnabled", false);
            ReflectionTestUtils.setField(queryService, "fullTextSearchMaxResults", 1000);
        }

        @Test
        @DisplayName("Should use LIKE-based search when FTS is disabled")
        void getFilteredListings_withFtsDisabled_shouldUseLikeSearch() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("Toyota");

            Page<CarListing> listingPage = new PageImpl<>(List.of(testListing), pageable, 1);
            when(carListingRepository.findAll(anySpecification(), eq(pageable)))
                    .thenReturn(listingPage);
            when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testResponse);

            Page<CarListingResponse> result = queryService.getFilteredListings(filter, pageable);

            verify(carListingRepository, never()).findIdsByFullTextSearch(anyString(), anyInt());
            verify(carListingRepository).findAll(anySpecification(), eq(pageable));
            // searchQuery should NOT be cleared (LIKE still needs it)
            assertThat(filter.getSearchQuery()).isEqualTo("Toyota");
        }

        @Test
        @DisplayName("Should not call FTS for count queries when disabled")
        void getFilteredListingsCount_withFtsDisabled_shouldNotCallFts() {
            ListingFilterRequest filter = new ListingFilterRequest();
            filter.setSearchQuery("BMW");

            when(carListingRepository.count(anySpecification())).thenReturn(5L);

            long count = queryService.getFilteredListingsCount(filter);

            assertThat(count).isEqualTo(5L);
            verify(carListingRepository, never()).findIdsByFullTextSearch(anyString(), anyInt());
        }
    }
}

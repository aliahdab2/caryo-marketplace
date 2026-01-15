package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.dealer.DealerNotFoundException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Dealer;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.PublicDealerResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.DealerRepository;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicDealerServiceTest {

    @Mock
    private DealerRepository dealerRepository;

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private CarListingMapper carListingMapper;

    @InjectMocks
    private PublicDealerService publicDealerService;

    private Dealer testDealer;
    private User testUser;
    private final Long testDealerId = 1L;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("dealer1");
        testUser.setEmail("dealer@example.com");

        testDealer = Dealer.builder()
            .id(testDealerId)
            .user(testUser)
            .businessName("Damascus Motors")
            .businessPhone("+963-11-XXX-XXXX")
            .tradingAddress("Damascus, Syria")
            .logoUrl("https://example.com/logo.png")
            .bannerUrl("https://example.com/banner.png")
            .description("Trusted dealer since 2012")
            .descriptionAr("وكيل موثوق منذ 2012")
            .workingHours("{\"weekdays\":\"9:00 AM - 6:00 PM\"}")
            .socialLinks("{\"facebook\":\"https://facebook.com/test\"}")
            .build();
        testDealer.setCreatedAt(LocalDateTime.now().minusYears(1));
    }

    @Test
    void getPublicDealerProfile_Success() {
        // Arrange
        when(dealerRepository.findById(testDealerId)).thenReturn(Optional.of(testDealer));
        when(carListingRepository.countBySellerAndApprovedTrue(testUser)).thenReturn(10L);
        when(carListingRepository.countBySellerAndApprovedTrueAndSoldTrue(testUser)).thenReturn(2L);
        when(carListingRepository.countBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(testUser)).thenReturn(8L);

        // Act
        PublicDealerResponse result = publicDealerService.getPublicDealerProfile(testDealerId);

        // Assert
        assertNotNull(result);
        assertEquals(testDealerId, result.getId());
        assertEquals("Damascus Motors", result.getBusinessName());
        assertEquals("+963-11-XXX-XXXX", result.getBusinessPhone());
        assertEquals("Trusted dealer since 2012", result.getDescription());
        assertNotNull(result.getStats());
        assertEquals(10L, result.getStats().getTotalListings());
        assertEquals(8L, result.getStats().getActiveListings());
        assertEquals(2L, result.getStats().getSoldCount());
        
        verify(dealerRepository).findById(testDealerId);
        verify(carListingRepository).countBySellerAndApprovedTrue(testUser);
    }

    @Test
    void getPublicDealerProfile_NotFound() {
        // Arrange
        when(dealerRepository.findById(testDealerId)).thenReturn(Optional.empty());

        // Act & Assert
        DealerNotFoundException exception = assertThrows(
            DealerNotFoundException.class,
            () -> publicDealerService.getPublicDealerProfile(testDealerId)
        );
        
        assertTrue(exception.getMessage().contains("Dealer not found"));
        verify(dealerRepository).findById(testDealerId);
        verifyNoInteractions(carListingRepository);
    }

    @Test
    void getPublicDealerProfile_WithNoListings() {
        // Arrange
        when(dealerRepository.findById(testDealerId)).thenReturn(Optional.of(testDealer));
        when(carListingRepository.countBySellerAndApprovedTrue(testUser)).thenReturn(0L);
        when(carListingRepository.countBySellerAndApprovedTrueAndSoldTrue(testUser)).thenReturn(0L);
        when(carListingRepository.countBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(testUser)).thenReturn(0L);

        // Act
        PublicDealerResponse result = publicDealerService.getPublicDealerProfile(testDealerId);

        // Assert
        assertNotNull(result);
        assertEquals(0L, result.getStats().getTotalListings());
        assertEquals(0L, result.getStats().getActiveListings());
        assertEquals(0L, result.getStats().getSoldCount());
    }

    @Test
    void getPublicDealerListings_Success() {
        // Arrange
        CarListing listing = new CarListing();
        listing.setId(1L);
        listing.setTitle("2020 Toyota Camry");
        
        CarListingResponse listingResponse = new CarListingResponse();
        listingResponse.setId(1L);
        listingResponse.setTitle("2020 Toyota Camry");
        
        Page<CarListing> listingsPage = new PageImpl<>(
            List.of(listing),
            PageRequest.of(0, 12),
            1
        );
        
        when(dealerRepository.findById(testDealerId)).thenReturn(Optional.of(testDealer));
        when(carListingRepository.findBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(
            any(User.class), any(Pageable.class)
        )).thenReturn(listingsPage);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(listingResponse);

        // Act
        Pageable pageable = PageRequest.of(0, 12);
        Page<CarListingResponse> result = publicDealerService.getPublicDealerListings(testDealerId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("2020 Toyota Camry", result.getContent().get(0).getTitle());
        
        verify(dealerRepository).findById(testDealerId);
        verify(carListingRepository).findBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(
            any(User.class), any(Pageable.class)
        );
    }

    @Test
    void getPublicDealerListings_DealerNotFound() {
        // Arrange
        when(dealerRepository.findById(testDealerId)).thenReturn(Optional.empty());

        // Act & Assert
        Pageable pageable = PageRequest.of(0, 12);
        assertThrows(
            DealerNotFoundException.class,
            () -> publicDealerService.getPublicDealerListings(testDealerId, pageable)
        );
        
        verify(dealerRepository).findById(testDealerId);
        verifyNoInteractions(carListingRepository);
    }

    @Test
    void getPublicDealerListings_EmptyList() {
        // Arrange
        Page<CarListing> emptyPage = new PageImpl<>(Collections.emptyList());
        
        when(dealerRepository.findById(testDealerId)).thenReturn(Optional.of(testDealer));
        when(carListingRepository.findBySellerAndApprovedTrueAndSoldFalseAndArchivedFalse(
            any(User.class), any(Pageable.class)
        )).thenReturn(emptyPage);

        // Act
        Pageable pageable = PageRequest.of(0, 12);
        Page<CarListingResponse> result = publicDealerService.getPublicDealerListings(testDealerId, pageable);

        // Assert
        assertNotNull(result);
        assertTrue(result.isEmpty());
        assertEquals(0, result.getTotalElements());
    }
}

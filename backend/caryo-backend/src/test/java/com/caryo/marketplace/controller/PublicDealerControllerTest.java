package com.caryo.marketplace.controller;

import com.caryo.marketplace.exception.dealer.DealerNotFoundException;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.payload.response.DealerStatsResponse;
import com.caryo.marketplace.payload.response.PublicDealerResponse;
import com.caryo.marketplace.service.PublicDealerService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PublicDealerControllerTest {

    @Mock
    private PublicDealerService publicDealerService;

    @InjectMocks
    private PublicDealerController publicDealerController;

    private PublicDealerResponse testDealerResponse;
    private final Long testDealerId = 1L;

    @BeforeEach
    void setUp() {
        DealerStatsResponse stats = new DealerStatsResponse(10L, 8L, 2L);
        
        testDealerResponse = new PublicDealerResponse(
            testDealerId,
            "Damascus Motors",
            "+963-11-XXX-XXXX",
            "Damascus, Syria",
            "https://example.com/logo.png",
            "https://example.com/banner.png",
            LocalDateTime.now().minusYears(1),
            "Trusted dealer since 2012",
            "وكيل موثوق منذ 2012",
            "{\"weekdays\":\"9:00 AM - 6:00 PM\"}",
            "{\"facebook\":\"https://facebook.com/test\"}",
            stats
        );
    }

    @Test
    void getPublicDealerProfile_Success() {
        // Arrange
        when(publicDealerService.getPublicDealerProfile(testDealerId)).thenReturn(testDealerResponse);

        // Act
        ResponseEntity<?> response = publicDealerController.getPublicDealerProfile(testDealerId);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof PublicDealerResponse);
        PublicDealerResponse body = (PublicDealerResponse) response.getBody();
        assertEquals("Damascus Motors", body.getBusinessName());
        assertEquals(10L, body.getStats().getTotalListings());
        verify(publicDealerService).getPublicDealerProfile(testDealerId);
    }

    @Test
    void getPublicDealerProfile_NotFound() {
        // Arrange
        when(publicDealerService.getPublicDealerProfile(testDealerId))
            .thenThrow(new DealerNotFoundException("Dealer not found", testDealerId));

        // Act
        ResponseEntity<?> response = publicDealerController.getPublicDealerProfile(testDealerId);

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        verify(publicDealerService).getPublicDealerProfile(testDealerId);
    }

    @Test
    void getPublicDealerListings_Success() {
        // Arrange
        CarListingResponse listing = new CarListingResponse();
        listing.setId(1L);
        listing.setTitle("2020 Toyota Camry");
        
        Page<CarListingResponse> page = new PageImpl<>(
            List.of(listing),
            PageRequest.of(0, 12),
            1
        );
        
        when(publicDealerService.getPublicDealerListings(eq(testDealerId), any(Pageable.class)))
            .thenReturn(page);

        // Act
        ResponseEntity<?> response = publicDealerController.getPublicDealerListings(
            testDealerId, 0, 12, "createdAt", "desc"
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof Page);
        @SuppressWarnings("unchecked")
        Page<CarListingResponse> resultPage = (Page<CarListingResponse>) response.getBody();
        assertEquals(1, resultPage.getTotalElements());
        assertEquals("2020 Toyota Camry", resultPage.getContent().get(0).getTitle());
        verify(publicDealerService).getPublicDealerListings(eq(testDealerId), any(Pageable.class));
    }

    @Test
    void getPublicDealerListings_EmptyPage() {
        // Arrange
        Page<CarListingResponse> emptyPage = new PageImpl<>(
            Collections.emptyList(),
            PageRequest.of(0, 12),
            0
        );
        
        when(publicDealerService.getPublicDealerListings(eq(testDealerId), any(Pageable.class)))
            .thenReturn(emptyPage);

        // Act
        ResponseEntity<?> response = publicDealerController.getPublicDealerListings(
            testDealerId, 0, 12, "createdAt", "desc"
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        @SuppressWarnings("unchecked")
        Page<CarListingResponse> resultPage = (Page<CarListingResponse>) response.getBody();
        assertTrue(resultPage.isEmpty());
    }

    @Test
    void getPublicDealerListings_DealerNotFound() {
        // Arrange
        when(publicDealerService.getPublicDealerListings(eq(testDealerId), any(Pageable.class)))
            .thenThrow(new DealerNotFoundException("Dealer not found", testDealerId));

        // Act
        ResponseEntity<?> response = publicDealerController.getPublicDealerListings(
            testDealerId, 0, 12, "createdAt", "desc"
        );

        // Assert
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void getPublicDealerListings_SortAscending() {
        // Arrange
        Page<CarListingResponse> page = new PageImpl<>(Collections.emptyList());
        when(publicDealerService.getPublicDealerListings(eq(testDealerId), any(Pageable.class)))
            .thenReturn(page);

        // Act
        ResponseEntity<?> response = publicDealerController.getPublicDealerListings(
            testDealerId, 0, 12, "price", "asc"
        );

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(publicDealerService).getPublicDealerListings(eq(testDealerId), any(Pageable.class));
    }
}

package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingApprovedEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingApprovedListenerTest {

    @Mock
    private ListingEventUtils eventUtils;
    
    private ListingApprovedListener listener;
    private CarListing testListing;
    private User testUser;
    
    @BeforeEach
    void setUp() {
        listener = new ListingApprovedListener(eventUtils);
        
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setSeller(testUser);
        testListing.setBrand("Toyota"); // Changed from setMake
        testListing.setModel("Camry");
        testListing.setModelYear(2020); // Changed from setYear
        testListing.setPrice(BigDecimal.valueOf(25000.0)); // Changed to BigDecimal
    }
    
    @Test
    void shouldHandleListingApprovedEvent() {
        // Arrange
        when(eventUtils.getListingInfo(any(CarListing.class))).thenReturn("listing ID 1 by 'testuser' (ID: 1)");
        ListingApprovedEvent event = new ListingApprovedEvent(this, testListing);
        
        // Act
        listener.handleListingApproved(event);
        
        // Assert
        verify(eventUtils).getListingInfo(testListing);
        
        // In a real implementation with email service:
        // verify(emailService).sendListingApprovedEmail(eq("test@example.com"), eq(testListing));
    }
}

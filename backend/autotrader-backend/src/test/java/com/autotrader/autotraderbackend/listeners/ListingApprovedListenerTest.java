package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingApprovedEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.service.AsyncTransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
// UUID import removed since we're using Long for IDs

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ListingApprovedListener}
 */
@ExtendWith(MockitoExtension.class)
class ListingApprovedListenerTest {

    @Mock
    private AsyncTransactionService txService;

    @Mock
    private ListingEventUtils eventUtils;

    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;

    private ListingApprovedListener listener;
    private CarListing listing;
    private User seller;
    private ListingApprovedEvent event;

    @BeforeEach
    void setUp() {
        listener = new ListingApprovedListener(eventUtils, txService);
        
        seller = new User();
        seller.setId(1L);
        seller.setUsername("testuser");
        
        listing = new CarListing();
        listing.setId(1L);
        listing.setBrand("Toyota");
        listing.setModel("Camry");
        listing.setModelYear(2022);
        listing.setPrice(BigDecimal.valueOf(25000));
        listing.setSeller(seller);
        
        event = new ListingApprovedEvent(this, listing);
    }

    @Test
    void handleListingApproved_shouldExecuteInTransaction() {
        // Arrange
        when(eventUtils.getListingInfo(any())).thenReturn("listing info");
        
        // Act
        listener.handleListingApproved(event);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable
        runnableCaptor.getValue().run();
        
        verify(eventUtils).getListingInfo(listing);
    }
    
    @Test
    void handleListingApproved_withNullEvent_shouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> listener.handleListingApproved(null));
        verifyNoInteractions(txService);
    }
    
    @Test
    void handleListingApproved_withNullSeller_shouldHandleGracefully() {
        // Arrange
        listing.setSeller(null);
        when(eventUtils.getListingInfo(any())).thenReturn("listing info");
        
        // Act
        listener.handleListingApproved(event);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable - should not throw exception despite null seller
        runnableCaptor.getValue().run();
        
        verify(eventUtils).getListingInfo(listing);
    }
}

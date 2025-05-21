package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingExpiredEvent;
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

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingExpiredListenerTest {

    @Mock
    private ListingEventUtils eventUtils;
    
    @Mock
    private AsyncTransactionService txService;
    
    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;

    private ListingExpiredListener listener;
    private CarListing carListing;
    private User seller;
    private ListingExpiredEvent event;

    @BeforeEach
    void setUp() {
        listener = new ListingExpiredListener(eventUtils, txService);
        
        seller = new User();
        seller.setId(1L);
        seller.setEmail("seller@example.com");

        carListing = new CarListing();
        carListing.setId(1L);
        carListing.setTitle("Expired Test Car");
        carListing.setSeller(seller);
    }

    @Test
    void handleListingExpired_shouldExecuteInTransaction() {
        // Arrange
        ListingExpiredEvent event = new ListingExpiredEvent(this, carListing, false);
        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
            
        // Act
        listener.handleListingExpired(event);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable
        runnableCaptor.getValue().run();
        
        // Verify that the transaction block executed correctly
        verify(eventUtils).getListingInfo(carListing);
    }
    
    @Test
    void handleListingExpired_withNullEvent_shouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> listener.handleListingExpired(null));
        verifyNoInteractions(txService);
    }
    
    @Test
    void handleListingExpired_withNullSeller_shouldHandleGracefully() {
        // Arrange
        carListing.setSeller(null);
        ListingExpiredEvent event = new ListingExpiredEvent(this, carListing, false);
        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
        
        // Act
        listener.handleListingExpired(event);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable - should not throw exception despite null seller
        runnableCaptor.getValue().run();
        
        verify(eventUtils).getListingInfo(carListing);
    }
}

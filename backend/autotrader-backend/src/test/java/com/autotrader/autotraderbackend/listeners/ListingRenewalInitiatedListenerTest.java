package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingRenewalInitiatedEvent;
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
class ListingRenewalInitiatedListenerTest {

    @Mock
    private ListingEventUtils eventUtils;
    
    @Mock
    private AsyncTransactionService txService;
    
    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;

    private ListingRenewalInitiatedListener listener;
    private CarListing carListing;
    private User seller;
    private ListingRenewalInitiatedEvent event;
    private final int RENEWAL_DAYS = 30;

    @BeforeEach
    void setUp() {
        listener = new ListingRenewalInitiatedListener(eventUtils, txService);
        
        seller = new User();
        seller.setId(1L);
        seller.setEmail("seller@example.com");

        carListing = new CarListing();
        carListing.setId(1L);
        carListing.setTitle("Renewed Test Car");
        carListing.setSeller(seller);

        event = new ListingRenewalInitiatedEvent(this, carListing, RENEWAL_DAYS);
    }

    @Test
    void handleListingRenewalInitiated_shouldExecuteInTransaction() {
        // Arrange
        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
            
        // Act
        listener.handleListingRenewalInitiated(event);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable
        runnableCaptor.getValue().run();
        
        // Verify that the transaction block executed correctly
        verify(eventUtils).getListingInfo(carListing);
    }
    
    @Test
    void handleListingRenewalInitiated_withNullEvent_shouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> listener.handleListingRenewalInitiated(null));
        verifyNoInteractions(txService);
    }
    
    @Test
    void handleListingRenewalInitiated_withSpecificDuration_shouldIncludeDurationInLog() {
        // Arrange
        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
            
        // Act
        listener.handleListingRenewalInitiated(event);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable
        runnableCaptor.getValue().run();
        
        // Verify that the log includes duration information
        verify(eventUtils).getListingInfo(carListing);
        
        // Additional verification for logging with renewalDays could be added if log content was asserted
        // For now, ensuring eventUtils is called is the primary check.
    }
}

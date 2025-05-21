package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
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
class ListingArchivedListenerTest {

    @Mock
    private ListingEventUtils eventUtils;
    
    @Mock
    private AsyncTransactionService txService;
    
    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;

    private ListingArchivedListener listener;
    private CarListing carListing;
    private User seller;
    private ListingArchivedEvent eventAdminAction;
    private ListingArchivedEvent eventSellerAction;

    @BeforeEach
    void setUp() {
        listener = new ListingArchivedListener(eventUtils, txService);
        
        seller = new User();
        seller.setId(1L);
        seller.setEmail("seller@example.com");

        carListing = new CarListing();
        carListing.setId(1L);
        carListing.setTitle("Test Car for Archival");
        carListing.setSeller(seller);

        eventAdminAction = new ListingArchivedEvent(this, carListing, true);
        eventSellerAction = new ListingArchivedEvent(this, carListing, false);
    }

    @Test
    void handleListingArchived_adminAction_shouldExecuteInTransaction() {
        // Arrange
        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
            
        // Act
        listener.handleListingArchived(eventAdminAction);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable
        runnableCaptor.getValue().run();
        
        // Verify specific admin action logic was executed
        verify(eventUtils, times(2)).getListingInfo(carListing);
    }
    
    @Test
    void handleListingArchived_sellerAction_shouldExecuteInTransaction() {
        // Arrange
        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
            
        // Act
        listener.handleListingArchived(eventSellerAction);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable
        runnableCaptor.getValue().run();
        
        // Verify specific seller action logic was executed
        verify(eventUtils, times(1)).getListingInfo(carListing);
    }
    
    @Test
    void handleListingArchived_withNullEvent_shouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> listener.handleListingArchived(null));
        verifyNoInteractions(txService);
    }
}

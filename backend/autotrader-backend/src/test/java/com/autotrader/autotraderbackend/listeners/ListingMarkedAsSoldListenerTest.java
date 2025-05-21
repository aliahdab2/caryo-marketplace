package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingMarkedAsSoldEvent;
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
class ListingMarkedAsSoldListenerTest {

    @Mock
    private ListingEventUtils eventUtils;
    
    @Mock
    private AsyncTransactionService txService;
    
    @Captor
    private ArgumentCaptor<Runnable> runnableCaptor;

    private ListingMarkedAsSoldListener listener;
    private CarListing carListing;
    private User seller;
    private ListingMarkedAsSoldEvent event;

    @BeforeEach
    void setUp() {
        listener = new ListingMarkedAsSoldListener(eventUtils, txService);
        
        seller = new User();
        seller.setId(1L);
        seller.setEmail("seller@example.com");

        carListing = new CarListing();
        carListing.setId(1L);
        carListing.setTitle("Sold Test Car");
        carListing.setSeller(seller);
    }

    @Test
    void handleListingMarkedAsSold_shouldExecuteInTransaction() {
        // Arrange
        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
            
        // Act
        listener.handleListingMarkedAsSold(event);
        
        // Assert
        verify(txService).executeInTransaction(runnableCaptor.capture());
        
        // Execute the captured runnable
        runnableCaptor.getValue().run();
        
        // Verify that the transaction block executed correctly
        verify(eventUtils).getListingInfo(carListing);
    }
    
    @Test
    void handleListingMarkedAsSold_withNullEvent_shouldThrowException() {
        // Act & Assert
        assertThrows(NullPointerException.class, () -> listener.handleListingMarkedAsSold(null));
        verifyNoInteractions(txService);
    }
}

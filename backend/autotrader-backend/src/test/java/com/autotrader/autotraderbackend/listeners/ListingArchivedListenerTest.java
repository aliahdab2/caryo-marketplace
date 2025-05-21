package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingArchivedEvent;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ListingArchivedListenerTest {

    @Mock
    private ListingEventUtils eventUtils;

    @InjectMocks
    private ListingArchivedListener listener;

    private CarListing carListing;
    private User seller;
    private ListingArchivedEvent eventAdminAction;
    private ListingArchivedEvent eventSellerAction;

    @BeforeEach
    void setUp() {
        seller = new User();
        seller.setId(1L); // Changed from UUID.randomUUID()
        seller.setEmail("seller@example.com");

        carListing = new CarListing();
        carListing.setId(1L); // Changed from UUID.randomUUID()
        carListing.setTitle("Test Car for Archival");
        carListing.setSeller(seller);

        eventAdminAction = new ListingArchivedEvent(this, carListing, true);
        eventSellerAction = new ListingArchivedEvent(this, carListing, false);
        
        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
    }

    @Test
    void handleListingArchived_WhenAdminAction_LogsAppropriateMessages() {
        listener.handleListingArchived(eventAdminAction);
        verify(eventUtils, times(2)).getListingInfo(carListing);
    }

    @Test
    void handleListingArchived_WhenSellerAction_LogsAppropriateMessages() {
        listener.handleListingArchived(eventSellerAction);
        verify(eventUtils, times(1)).getListingInfo(carListing);
    }
}

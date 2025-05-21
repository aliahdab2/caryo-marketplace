package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingMarkedAsSoldEvent;
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
class ListingMarkedAsSoldListenerTest {

    @Mock
    private ListingEventUtils eventUtils;

    @InjectMocks
    private ListingMarkedAsSoldListener listener;

    private CarListing carListing;
    private User seller;
    private ListingMarkedAsSoldEvent event;

    @BeforeEach
    void setUp() {
        seller = new User();
        seller.setId(1L); // Changed from UUID.randomUUID()
        seller.setEmail("seller@example.com");

        carListing = new CarListing();
        carListing.setId(1L); // Changed from UUID.randomUUID()
        carListing.setTitle("Sold Test Car");
        carListing.setSeller(seller);

        event = new ListingMarkedAsSoldEvent(this, carListing, false); // Added boolean parameter

        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
    }

    @Test
    void handleListingMarkedAsSold_LogsCorrectly() {
        listener.handleListingMarkedAsSold(event);

        verify(eventUtils, times(1)).getListingInfo(carListing);
    }
}

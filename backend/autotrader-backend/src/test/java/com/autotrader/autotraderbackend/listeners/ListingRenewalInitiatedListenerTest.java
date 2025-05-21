package com.autotrader.autotraderbackend.listeners;

import com.autotrader.autotraderbackend.events.ListingRenewalInitiatedEvent;
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
class ListingRenewalInitiatedListenerTest {

    @Mock
    private ListingEventUtils eventUtils;

    @InjectMocks
    private ListingRenewalInitiatedListener listener;

    private CarListing carListing;
    private User seller;
    private ListingRenewalInitiatedEvent event;
    private final int RENEWAL_DAYS = 30;

    @BeforeEach
    void setUp() {
        seller = new User();
        seller.setId(1L); // Changed from UUID.randomUUID()
        seller.setEmail("seller@example.com");

        carListing = new CarListing();
        carListing.setId(1L); // Changed from UUID.randomUUID()
        carListing.setTitle("Renewed Test Car");
        carListing.setSeller(seller);

        event = new ListingRenewalInitiatedEvent(this, carListing, RENEWAL_DAYS);

        when(eventUtils.getListingInfo(any(CarListing.class)))
            .thenReturn("listing ID: " + carListing.getId() + ", Title: " + carListing.getTitle());
    }

    @Test
    void handleListingRenewalInitiated_LogsCorrectly() {
        listener.handleListingRenewalInitiated(event);

        verify(eventUtils, times(1)).getListingInfo(carListing);
        // Additional verification for logging with renewalDays could be added if log content was asserted
        // For now, ensuring eventUtils is called is the primary check.
    }
}

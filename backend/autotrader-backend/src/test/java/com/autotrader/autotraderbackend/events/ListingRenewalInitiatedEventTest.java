package com.autotrader.autotraderbackend.events;

import com.autotrader.autotraderbackend.model.CarListing;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ListingRenewalInitiatedEventTest {

    @Mock
    private CarListing mockListing;

    @Test
    void constructor_ShouldSetSourceListingAndDuration() {
        // Arrange
        Object source = new Object();
        int durationDays = 30;

        // Act
        ListingRenewalInitiatedEvent event = new ListingRenewalInitiatedEvent(source, mockListing, durationDays);

        // Assert
        assertNotNull(event);
        assertEquals(source, event.getSource());
        assertEquals(mockListing, event.getListing());
        assertEquals(durationDays, event.getDurationDays());
    }

    @Test
    void getListing_ShouldReturnListing() {
        // Arrange
        ListingRenewalInitiatedEvent event = new ListingRenewalInitiatedEvent(new Object(), mockListing, 30);

        // Act
        CarListing listing = event.getListing();

        // Assert
        assertEquals(mockListing, listing);
    }

    @Test
    void getDurationDays_ShouldReturnDuration() {
        // Arrange
        int expectedDuration = 60;
        ListingRenewalInitiatedEvent event = new ListingRenewalInitiatedEvent(new Object(), mockListing, expectedDuration);

        // Act
        int actualDuration = event.getDurationDays();

        // Assert
        assertEquals(expectedDuration, actualDuration);
    }

    @Test
    void constructor_ShouldRejectNegativeDuration() {
        // Arrange
        Object source = new Object();
        int negativeDuration = -1;

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            new ListingRenewalInitiatedEvent(source, mockListing, negativeDuration),
            "Should reject negative duration"
        );
    }

    @Test
    void constructor_ShouldRejectZeroDuration() {
        // Arrange
        Object source = new Object();
        int zeroDuration = 0;

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            new ListingRenewalInitiatedEvent(source, mockListing, zeroDuration),
            "Should reject zero duration"
        );
    }

    @Test
    void constructor_ShouldRejectNullListing() {
        // Arrange
        Object source = new Object();
        int duration = 30;

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            new ListingRenewalInitiatedEvent(source, null, duration),
            "Should reject null listing"
        );
    }

    @Test
    void constructor_ShouldRejectNullSource() {
        // Arrange
        int duration = 30;

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            new ListingRenewalInitiatedEvent(null, mockListing, duration),
            "Should reject null source"
        );
    }

    @Test
    void constructor_ShouldAcceptMaximumDuration() {
        // Arrange
        Object source = new Object();
        int maxDuration = 365; // Maximum allowed duration in days

        // Act
        ListingRenewalInitiatedEvent event = new ListingRenewalInitiatedEvent(source, mockListing, maxDuration);

        // Assert
        assertEquals(maxDuration, event.getDurationDays());
    }

    @Test
    void constructor_ShouldRejectExcessiveDuration() {
        // Arrange
        Object source = new Object();
        int excessiveDuration = 366; // More than maximum allowed

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> 
            new ListingRenewalInitiatedEvent(source, mockListing, excessiveDuration),
            "Should reject durations longer than 365 days"
        );
    }
}

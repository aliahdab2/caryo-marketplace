package com.autotrader.autotraderbackend.events;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingApprovedEventTest {

    @Mock private CarListing mockListing;
    @Mock private User mockSeller;

    private Object source;
    private static final Long LISTING_ID = 1L;
    private static final String SELLER_USERNAME = "testSeller";

    @BeforeEach
    void setUp() {
        source = new Object();
    }

    @Test
    void constructor_ShouldSetPropertiesCorrectly() {
        // Act
        ListingApprovedEvent event = new ListingApprovedEvent(source, mockListing);

        // Assert
        assertAll(
            () -> assertNotNull(event),
            () -> assertEquals(source, event.getSource()),
            () -> assertEquals(mockListing, event.getListing())
        );
    }

    @Test
    void constructor_ShouldThrowIllegalArgumentException_WhenListingIsNull() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> new ListingApprovedEvent(source, null));
        assertEquals("CarListing cannot be null", exception.getMessage());
    }

    @Test
    void constructor_ShouldThrowIllegalArgumentException_WhenSourceIsNull() {
        // Act & Assert
        // Note: Spring ApplicationEvent itself throws this for a null source.
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> new ListingApprovedEvent(null, mockListing));
        assertEquals("null source", exception.getMessage());
    }

    @Test
    void toString_ShouldReturnFormattedString_WithAllValues() {
        // Arrange
        when(mockListing.getId()).thenReturn(LISTING_ID);
        when(mockListing.getSeller()).thenReturn(mockSeller);
        when(mockSeller.getUsername()).thenReturn(SELLER_USERNAME);

        // Act
        ListingApprovedEvent event = new ListingApprovedEvent(source, mockListing);

        // Assert
        assertEquals(
            String.format("ListingApprovedEvent[listingId=%d, seller=%s]",
                LISTING_ID, SELLER_USERNAME),
            event.toString()
        );
    }

    @Test
    void toString_ShouldHandleNullSeller() {
        // Arrange
        when(mockListing.getId()).thenReturn(LISTING_ID);
        when(mockListing.getSeller()).thenReturn(null);

        // Act
        ListingApprovedEvent event = new ListingApprovedEvent(source, mockListing);

        // Assert
        assertEquals(
            String.format("ListingApprovedEvent[listingId=%d, seller=%s]",
                LISTING_ID, "unknown"),
            event.toString()
        );
    }

    @Test
    void toString_ShouldHandleNullListingId() {
        // Arrange
        when(mockListing.getId()).thenReturn(null);
        when(mockListing.getSeller()).thenReturn(mockSeller);
        when(mockSeller.getUsername()).thenReturn(SELLER_USERNAME);

        // Act
        ListingApprovedEvent event = new ListingApprovedEvent(source, mockListing);

        // Assert
        assertEquals(
            String.format("ListingApprovedEvent[listingId=%s, seller=%s]",
                "null", SELLER_USERNAME),
            event.toString()
        );
    }

    @Test
    void toString_ShouldHandleNullListingIdAndNullSeller() {
        // Arrange
        when(mockListing.getId()).thenReturn(null);
        when(mockListing.getSeller()).thenReturn(null);

        // Act
        ListingApprovedEvent event = new ListingApprovedEvent(source, mockListing);

        // Assert
        assertEquals(
            String.format("ListingApprovedEvent[listingId=%s, seller=%s]",
                "null", "unknown"),
            event.toString()
        );
    }
}

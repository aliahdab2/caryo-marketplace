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
class ListingArchivedEventTest {

    @Mock private CarListing mockListing;
    @Mock private User mockSeller;
    
    private Object source;
    private static final Long LISTING_ID = 1L;
    private static final String SELLER_USERNAME = "testSeller";

    @BeforeEach
    void setUp() {
        source = new Object(); // Initialize source here
    }

    @Test
    void constructor_ShouldSetProperties_WhenUserAction() {
        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, false);

        // Assert
        assertAll(
            () -> assertNotNull(event),
            () -> assertEquals(source, event.getSource()),
            () -> assertEquals(mockListing, event.getListing()), // Changed to getListing()
            () -> assertFalse(event.isAdminAction())
        );
    }

    @Test
    void constructor_ShouldSetProperties_WhenAdminAction() {
        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, true);

        // Assert
        assertAll(
            () -> assertNotNull(event),
            () -> assertEquals(source, event.getSource()),
            () -> assertEquals(mockListing, event.getListing()), // Changed to getListing()
            () -> assertTrue(event.isAdminAction())
        );
    }

    @Test
    void constructor_ShouldThrowIllegalArgumentException_WhenListingIsNull() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, 
            () -> new ListingArchivedEvent(source, null, false));
        assertEquals("CarListing cannot be null", exception.getMessage());
    }

    @Test
    void constructor_ShouldThrowIllegalArgumentException_WhenSourceIsNull() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
            () -> new ListingArchivedEvent(null, mockListing, false));
        assertEquals("null source", exception.getMessage());
    }

    @Test
    void toString_ShouldReturnFormattedString_WithAllValues() {
        // Arrange
        when(mockListing.getId()).thenReturn(LISTING_ID);
        when(mockListing.getSeller()).thenReturn(mockSeller);
        when(mockSeller.getUsername()).thenReturn(SELLER_USERNAME);

        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, false);

        // Assert
        assertEquals(
            String.format("ListingArchivedEvent[listingId=%d, isAdminAction=%s, seller=%s]", // Changed to listingId
                LISTING_ID, false, SELLER_USERNAME),
            event.toString()
        );
    }

    @Test
    void toString_ShouldHandleNullSeller() { // Renamed for clarity
        // Arrange
        when(mockListing.getId()).thenReturn(LISTING_ID);
        when(mockListing.getSeller()).thenReturn(null);

        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, true);

        // Assert
        assertEquals(
            String.format("ListingArchivedEvent[listingId=%d, isAdminAction=%s, seller=%s]", // Changed to listingId
                LISTING_ID, true, "unknown"),
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
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, false);

        // Assert
        assertEquals(
            String.format("ListingArchivedEvent[listingId=%s, isAdminAction=%s, seller=%s]",
                "null", false, SELLER_USERNAME),
            event.toString()
        );
    }

    @Test
    void toString_ShouldHandleNullListingIdAndNullSeller() {
        // Arrange
        when(mockListing.getId()).thenReturn(null);
        when(mockListing.getSeller()).thenReturn(null);

        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, true);

        // Assert
        assertEquals(
            String.format("ListingArchivedEvent[listingId=%s, isAdminAction=%s, seller=%s]",
                "null", true, "unknown"),
            event.toString()
        );
    }
}

package com.caryo.marketplace.events;

import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.User;
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
        source = new Object();

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
    void constructor_ShouldThrowNullPointerException_WhenListingIsNull() {
        // Act & Assert
        NullPointerException exception = assertThrows(NullPointerException.class,
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
        when(mockSeller.getId()).thenReturn(0L);

        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, false);

        // Assert
        String expectedStart = String.format("ListingArchivedEvent[listingId=%d, action=Seller archived their own listing, seller='%s'(ID:0), source='unknown', timestamp=",
                LISTING_ID, SELLER_USERNAME);
        assertTrue(event.toString().startsWith(expectedStart),
                "toString should start with expected format: " + expectedStart);
    }

    @Test
    void toString_ShouldHandleNullSeller() {
        // Arrange
        when(mockListing.getId()).thenReturn(LISTING_ID);
        when(mockListing.getSeller()).thenReturn(null);

        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, true);

        // Assert
        String expectedStart = String.format("ListingArchivedEvent[listingId=%d, action=Admin archived listing, seller='unknown'(ID:null), source='unknown', timestamp=",
                LISTING_ID);
        assertTrue(event.toString().startsWith(expectedStart),
                "toString should start with expected format: " + expectedStart);
    }

    @Test
    void toString_ShouldHandleNullListingId() {
        // Arrange
        when(mockListing.getId()).thenReturn(null);
        when(mockListing.getSeller()).thenReturn(mockSeller);
        when(mockSeller.getUsername()).thenReturn(SELLER_USERNAME);
        when(mockSeller.getId()).thenReturn(0L);

        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, false);

        // Assert
        String expectedStart = "ListingArchivedEvent[listingId=null, action=Seller archived their own listing, seller='testSeller'(ID:0), source='unknown', timestamp=";
        assertTrue(event.toString().startsWith(expectedStart),
                "toString should start with expected format: " + expectedStart);
    }

    @Test
    void toString_ShouldHandleNullListingIdAndNullSeller() {
        // Arrange
        when(mockListing.getId()).thenReturn(null);
        when(mockListing.getSeller()).thenReturn(null);

        // Act
        ListingArchivedEvent event = new ListingArchivedEvent(source, mockListing, true);

        // Assert
        String expectedStart = "ListingArchivedEvent[listingId=null, action=Admin archived listing, seller='unknown'(ID:null), source='unknown', timestamp=";
        assertTrue(event.toString().startsWith(expectedStart),
                "toString should start with expected format: " + expectedStart);
    }
}

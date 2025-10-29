package com.autotrader.autotraderbackend.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversationStatus Enum Tests")
class ConversationStatusTest {

    @Test
    @DisplayName("Should have correct enum values")
    void shouldHaveCorrectEnumValues() {
        assertEquals("ACTIVE", ConversationStatus.ACTIVE.name());
        assertEquals("ARCHIVED", ConversationStatus.ARCHIVED.name());
        assertEquals("BLOCKED", ConversationStatus.BLOCKED.name());
    }

    @Test
    @DisplayName("Should convert from string values correctly")
    void shouldConvertFromStringValuesCorrectly() {
        assertEquals(ConversationStatus.ACTIVE, ConversationStatus.valueOf("ACTIVE"));
        assertEquals(ConversationStatus.ARCHIVED, ConversationStatus.valueOf("ARCHIVED"));
        assertEquals(ConversationStatus.BLOCKED, ConversationStatus.valueOf("BLOCKED"));
    }

    @Test
    @DisplayName("Should throw exception for invalid string values")
    void shouldThrowExceptionForInvalidStringValues() {
        assertThrows(IllegalArgumentException.class, () -> {
            ConversationStatus.valueOf("invalid");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            ConversationStatus.valueOf("active");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            ConversationStatus.valueOf("");
        });

        assertThrows(NullPointerException.class, () -> {
            ConversationStatus.valueOf(null);
        });
    }

    @Test
    @DisplayName("Should handle case sensitivity correctly")
    void shouldHandleCaseSensitivityCorrectly() {
        assertThrows(IllegalArgumentException.class, () -> {
            ConversationStatus.valueOf("Active");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            ConversationStatus.valueOf("active");
        });
    }

    @Test
    @DisplayName("Should have all expected enum values")
    void shouldHaveAllExpectedEnumValues() {
        ConversationStatus[] values = ConversationStatus.values();

        assertEquals(3, values.length);

        boolean hasActive = false;
        boolean hasArchived = false;
        boolean hasBlocked = false;

        for (ConversationStatus status : values) {
            switch (status) {
                case ACTIVE:
                    hasActive = true;
                    break;
                case ARCHIVED:
                    hasArchived = true;
                    break;
                case BLOCKED:
                    hasBlocked = true;
                    break;
            }
        }

        assertTrue(hasActive, "Should have ACTIVE status");
        assertTrue(hasArchived, "Should have ARCHIVED status");
        assertTrue(hasBlocked, "Should have BLOCKED status");
    }

    @Test
    @DisplayName("Should support enum ordinal values")
    void shouldSupportEnumOrdinalValues() {
        assertEquals(0, ConversationStatus.ACTIVE.ordinal());
        assertEquals(1, ConversationStatus.ARCHIVED.ordinal());
        assertEquals(2, ConversationStatus.BLOCKED.ordinal());
    }

    @Test
    @DisplayName("Should support enum name values")
    void shouldSupportEnumNameValues() {
        assertEquals("ACTIVE", ConversationStatus.ACTIVE.name());
        assertEquals("ARCHIVED", ConversationStatus.ARCHIVED.name());
        assertEquals("BLOCKED", ConversationStatus.BLOCKED.name());
    }

    @Test
    @DisplayName("Should handle toString method")
    void shouldHandleToStringMethod() {
        assertNotNull(ConversationStatus.ACTIVE.toString());
        assertNotNull(ConversationStatus.ARCHIVED.toString());
        assertNotNull(ConversationStatus.BLOCKED.toString());
    }
}

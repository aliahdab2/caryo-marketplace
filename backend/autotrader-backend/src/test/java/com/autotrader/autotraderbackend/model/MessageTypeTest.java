package com.autotrader.autotraderbackend.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("MessageType Enum Tests")
class MessageTypeTest {

    @Test
    @DisplayName("Should have correct values for all message types")
    void shouldHaveCorrectValuesForAllMessageTypes() {
        // Assert
        assertEquals("text", MessageType.TEXT.getValue());
        assertEquals("image", MessageType.IMAGE.getValue());
        assertEquals("system", MessageType.SYSTEM.getValue());
    }

    @Test
    @DisplayName("Should convert from valid string values")
    void shouldConvertFromValidStringValues() {
        // Act & Assert
        assertEquals(MessageType.TEXT, MessageType.fromValue("text"));
        assertEquals(MessageType.IMAGE, MessageType.fromValue("image"));
        assertEquals(MessageType.SYSTEM, MessageType.fromValue("system"));
    }

    @Test
    @DisplayName("Should throw exception for invalid string values")
    void shouldThrowExceptionForInvalidStringValues() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue("invalid");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue("TEXT");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue("");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue(null);
        });
    }

    @Test
    @DisplayName("Should handle case sensitivity correctly")
    void shouldHandleCaseSensitivityCorrectly() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue("Text");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue("TEXT");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue("Image");
        });
    }

    @Test
    @DisplayName("Should have all expected enum values")
    void shouldHaveAllExpectedEnumValues() {
        // Act
        MessageType[] values = MessageType.values();

        // Assert
        assertEquals(3, values.length);

        // Check that all expected values are present
        boolean hasText = false;
        boolean hasImage = false;
        boolean hasSystem = false;

        for (MessageType type : values) {
            switch (type) {
                case TEXT:
                    hasText = true;
                    break;
                case IMAGE:
                    hasImage = true;
                    break;
                case SYSTEM:
                    hasSystem = true;
                    break;
            }
        }

        assertTrue(hasText, "Should have TEXT type");
        assertTrue(hasImage, "Should have IMAGE type");
        assertTrue(hasSystem, "Should have SYSTEM type");
    }

    @Test
    @DisplayName("Should maintain value consistency")
    void shouldMaintainValueConsistency() {
        // Test that values are consistent
        assertEquals("text", MessageType.TEXT.getValue());
        assertEquals("image", MessageType.IMAGE.getValue());
        assertEquals("system", MessageType.SYSTEM.getValue());

        // Test that the same instance is returned
        MessageType text1 = MessageType.fromValue("text");
        MessageType text2 = MessageType.fromValue("text");
        assertSame(text1, text2);
    }

    @Test
    @DisplayName("Should handle edge case values")
    void shouldHandleEdgeCaseValues() {
        // Test with whitespace (should fail)
        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue(" text ");
        });

        // Test with numbers (should fail)
        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue("123");
        });

        // Test with special characters (should fail)
        assertThrows(IllegalArgumentException.class, () -> {
            MessageType.fromValue("text!");
        });
    }

    @Test
    @DisplayName("Should have meaningful type descriptions")
    void shouldHaveMeaningfulTypeDescriptions() {
        // Test that each type has a meaningful value
        assertNotNull(MessageType.TEXT.getValue());
        assertFalse(MessageType.TEXT.getValue().isEmpty());

        assertNotNull(MessageType.IMAGE.getValue());
        assertFalse(MessageType.IMAGE.getValue().isEmpty());

        assertNotNull(MessageType.SYSTEM.getValue());
        assertFalse(MessageType.SYSTEM.getValue().isEmpty());
    }

    @Test
    @DisplayName("Should support enum ordinal values")
    void shouldSupportEnumOrdinalValues() {
        // Test ordinal values (order of declaration)
        assertEquals(0, MessageType.TEXT.ordinal());
        assertEquals(1, MessageType.IMAGE.ordinal());
        assertEquals(2, MessageType.SYSTEM.ordinal());
    }

    @Test
    @DisplayName("Should support enum name values")
    void shouldSupportEnumNameValues() {
        // Test name values
        assertEquals("TEXT", MessageType.TEXT.name());
        assertEquals("IMAGE", MessageType.IMAGE.name());
        assertEquals("SYSTEM", MessageType.SYSTEM.name());
    }

    @Test
    @DisplayName("Should handle toString method")
    void shouldHandleToStringMethod() {
        // Test toString method
        assertNotNull(MessageType.TEXT.toString());
        assertNotNull(MessageType.IMAGE.toString());
        assertNotNull(MessageType.SYSTEM.toString());
    }

    @Test
    @DisplayName("Should have appropriate default value")
    void shouldHaveAppropriateDefaultValue() {
        // Test that TEXT is the default (most common) type
        assertEquals("text", MessageType.TEXT.getValue());
        assertTrue(MessageType.TEXT.getValue().equals("text"));
    }

    @Test
    @DisplayName("Should handle type-specific validation")
    void shouldHandleTypeSpecificValidation() {
        // Test that each type is distinct
        assertNotEquals(MessageType.TEXT, MessageType.IMAGE);
        assertNotEquals(MessageType.TEXT, MessageType.SYSTEM);
        assertNotEquals(MessageType.IMAGE, MessageType.SYSTEM);

        // Test that values are distinct
        assertNotEquals(MessageType.TEXT.getValue(), MessageType.IMAGE.getValue());
        assertNotEquals(MessageType.TEXT.getValue(), MessageType.SYSTEM.getValue());
        assertNotEquals(MessageType.IMAGE.getValue(), MessageType.SYSTEM.getValue());
    }
}

package com.autotrader.autotraderbackend.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ParticipantRole Enum Tests")
class ParticipantRoleTest {

    @Test
    @DisplayName("Should have correct values for all participant roles")
    void shouldHaveCorrectValuesForAllParticipantRoles() {
        // Assert
        assertEquals("buyer", ParticipantRole.BUYER.getValue());
        assertEquals("seller", ParticipantRole.SELLER.getValue());
        assertEquals("participant", ParticipantRole.PARTICIPANT.getValue());
    }

    @Test
    @DisplayName("Should convert from valid string values")
    void shouldConvertFromValidStringValues() {
        // Act & Assert
        assertEquals(ParticipantRole.BUYER, ParticipantRole.fromValue("buyer"));
        assertEquals(ParticipantRole.SELLER, ParticipantRole.fromValue("seller"));
        assertEquals(ParticipantRole.PARTICIPANT, ParticipantRole.fromValue("participant"));
    }

    @Test
    @DisplayName("Should throw exception for invalid string values")
    void shouldThrowExceptionForInvalidStringValues() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue("invalid");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue("BUYER");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue("");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue(null);
        });
    }

    @Test
    @DisplayName("Should handle case sensitivity correctly")
    void shouldHandleCaseSensitivityCorrectly() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue("Buyer");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue("BUYER");
        });

        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue("Seller");
        });
    }

    @Test
    @DisplayName("Should have all expected enum values")
    void shouldHaveAllExpectedEnumValues() {
        // Act
        ParticipantRole[] values = ParticipantRole.values();

        // Assert
        assertEquals(3, values.length);

        // Check that all expected values are present
        boolean hasBuyer = false;
        boolean hasSeller = false;
        boolean hasParticipant = false;

        for (ParticipantRole role : values) {
            switch (role) {
                case BUYER:
                    hasBuyer = true;
                    break;
                case SELLER:
                    hasSeller = true;
                    break;
                case PARTICIPANT:
                    hasParticipant = true;
                    break;
            }
        }

        assertTrue(hasBuyer, "Should have BUYER role");
        assertTrue(hasSeller, "Should have SELLER role");
        assertTrue(hasParticipant, "Should have PARTICIPANT role");
    }

    @Test
    @DisplayName("Should maintain value consistency")
    void shouldMaintainValueConsistency() {
        // Test that values are consistent
        assertEquals("buyer", ParticipantRole.BUYER.getValue());
        assertEquals("seller", ParticipantRole.SELLER.getValue());
        assertEquals("participant", ParticipantRole.PARTICIPANT.getValue());

        // Test that the same instance is returned
        ParticipantRole buyer1 = ParticipantRole.fromValue("buyer");
        ParticipantRole buyer2 = ParticipantRole.fromValue("buyer");
        assertSame(buyer1, buyer2);
    }

    @Test
    @DisplayName("Should handle edge case values")
    void shouldHandleEdgeCaseValues() {
        // Test with whitespace (should fail)
        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue(" buyer ");
        });

        // Test with numbers (should fail)
        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue("123");
        });

        // Test with special characters (should fail)
        assertThrows(IllegalArgumentException.class, () -> {
            ParticipantRole.fromValue("buyer!");
        });
    }

    @Test
    @DisplayName("Should have meaningful role descriptions")
    void shouldHaveMeaningfulRoleDescriptions() {
        // Test that each role has a meaningful value
        assertNotNull(ParticipantRole.BUYER.getValue());
        assertFalse(ParticipantRole.BUYER.getValue().isEmpty());

        assertNotNull(ParticipantRole.SELLER.getValue());
        assertFalse(ParticipantRole.SELLER.getValue().isEmpty());

        assertNotNull(ParticipantRole.PARTICIPANT.getValue());
        assertFalse(ParticipantRole.PARTICIPANT.getValue().isEmpty());
    }

    @Test
    @DisplayName("Should support enum ordinal values")
    void shouldSupportEnumOrdinalValues() {
        // Test ordinal values (order of declaration)
        assertEquals(0, ParticipantRole.BUYER.ordinal());
        assertEquals(1, ParticipantRole.SELLER.ordinal());
        assertEquals(2, ParticipantRole.PARTICIPANT.ordinal());
    }

    @Test
    @DisplayName("Should support enum name values")
    void shouldSupportEnumNameValues() {
        // Test name values
        assertEquals("BUYER", ParticipantRole.BUYER.name());
        assertEquals("SELLER", ParticipantRole.SELLER.name());
        assertEquals("PARTICIPANT", ParticipantRole.PARTICIPANT.name());
    }

    @Test
    @DisplayName("Should handle toString method")
    void shouldHandleToStringMethod() {
        // Test toString method
        assertNotNull(ParticipantRole.BUYER.toString());
        assertNotNull(ParticipantRole.SELLER.toString());
        assertNotNull(ParticipantRole.PARTICIPANT.toString());
    }

    @Test
    @DisplayName("Should have appropriate default value")
    void shouldHaveAppropriateDefaultValue() {
        // Test that PARTICIPANT is the default (most flexible) role
        assertEquals("participant", ParticipantRole.PARTICIPANT.getValue());
        assertTrue(ParticipantRole.PARTICIPANT.getValue().equals("participant"));
    }

    @Test
    @DisplayName("Should handle role-specific validation")
    void shouldHandleRoleSpecificValidation() {
        // Test that each role is distinct
        assertNotEquals(ParticipantRole.BUYER, ParticipantRole.SELLER);
        assertNotEquals(ParticipantRole.BUYER, ParticipantRole.PARTICIPANT);
        assertNotEquals(ParticipantRole.SELLER, ParticipantRole.PARTICIPANT);

        // Test that values are distinct
        assertNotEquals(ParticipantRole.BUYER.getValue(), ParticipantRole.SELLER.getValue());
        assertNotEquals(ParticipantRole.BUYER.getValue(), ParticipantRole.PARTICIPANT.getValue());
        assertNotEquals(ParticipantRole.SELLER.getValue(), ParticipantRole.PARTICIPANT.getValue());
    }

    @Test
    @DisplayName("Should handle business logic roles")
    void shouldHandleBusinessLogicRoles() {
        // Test that BUYER and SELLER are the primary business roles
        assertTrue(ParticipantRole.BUYER.getValue().equals("buyer"));
        assertTrue(ParticipantRole.SELLER.getValue().equals("seller"));

        // Test that PARTICIPANT is the generic role
        assertTrue(ParticipantRole.PARTICIPANT.getValue().equals("participant"));
    }

    @Test
    @DisplayName("Should support role hierarchy")
    void shouldSupportRoleHierarchy() {
        // Test that BUYER and SELLER are specific roles
        assertTrue(ParticipantRole.BUYER.getValue().equals("buyer"));
        assertTrue(ParticipantRole.SELLER.getValue().equals("seller"));

        // Test that PARTICIPANT is the generic role that can represent either
        assertTrue(ParticipantRole.PARTICIPANT.getValue().equals("participant"));
    }
}

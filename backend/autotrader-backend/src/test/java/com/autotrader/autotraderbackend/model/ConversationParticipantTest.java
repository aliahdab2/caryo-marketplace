package com.autotrader.autotraderbackend.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("ConversationParticipant Entity Tests")
class ConversationParticipantTest {

    private ConversationParticipant participant;
    private Conversation conversation;
    private User user;

    @BeforeEach
    void setUp() {
        // Create test conversation
        conversation = Conversation.builder()
                .id(1L)
                .status(ConversationStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Create test user
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");

        // Create test participant
        participant = ConversationParticipant.builder()
                .id(1L)
                .conversation(conversation)
                .user(user)
                .role(ParticipantRole.BUYER)
                .joinedAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create participant with required fields")
    void shouldCreateParticipantWithRequiredFields() {
        // Assert
        assertNotNull(participant);
        assertEquals(1L, participant.getId());
        assertEquals(conversation, participant.getConversation());
        assertEquals(user, participant.getUser());
        assertEquals(ParticipantRole.BUYER, participant.getRole());
        assertNotNull(participant.getJoinedAt());
        assertNull(participant.getLeftAt());
    }

    @Test
    @DisplayName("Should identify active participant correctly")
    void shouldIdentifyActiveParticipantCorrectly() {
        // Initially active
        assertTrue(participant.isActive());
        assertNull(participant.getLeftAt());

        // Leave conversation
        participant.leave();
        assertFalse(participant.isActive());
        assertNotNull(participant.getLeftAt());

        // Rejoin conversation
        participant.rejoin();
        assertTrue(participant.isActive());
        assertNull(participant.getLeftAt());
    }

    @Test
    @DisplayName("Should identify buyer role correctly")
    void shouldIdentifyBuyerRoleCorrectly() {
        // Test buyer role
        participant.setRole(ParticipantRole.BUYER);
        assertTrue(participant.isBuyer());
        assertFalse(participant.isSeller());

        // Test seller role
        participant.setRole(ParticipantRole.SELLER);
        assertFalse(participant.isBuyer());
        assertTrue(participant.isSeller());

        // Test participant role
        participant.setRole(ParticipantRole.PARTICIPANT);
        assertFalse(participant.isBuyer());
        assertFalse(participant.isSeller());
    }

    @Test
    @DisplayName("Should handle role changes")
    void shouldHandleRoleChanges() {
        // Test role changes
        participant.setRole(ParticipantRole.SELLER);
        assertEquals(ParticipantRole.SELLER, participant.getRole());
        assertTrue(participant.isSeller());

        participant.setRole(ParticipantRole.PARTICIPANT);
        assertEquals(ParticipantRole.PARTICIPANT, participant.getRole());
        assertFalse(participant.isSeller());
        assertFalse(participant.isBuyer());

        participant.setRole(ParticipantRole.BUYER);
        assertEquals(ParticipantRole.BUYER, participant.getRole());
        assertTrue(participant.isBuyer());
    }

    @Test
    @DisplayName("Should handle leave and rejoin operations")
    void shouldHandleLeaveAndRejoinOperations() {
        // Initially active
        assertTrue(participant.isActive());
        assertNull(participant.getLeftAt());

        // Leave conversation
        LocalDateTime beforeLeave = LocalDateTime.now();
        participant.leave();

        assertFalse(participant.isActive());
        assertNotNull(participant.getLeftAt());
        assertTrue(participant.getLeftAt().isAfter(beforeLeave) || participant.getLeftAt().equals(beforeLeave));

        // Rejoin conversation
        participant.rejoin();

        assertTrue(participant.isActive());
        assertNull(participant.getLeftAt());
    }

    @Test
    @DisplayName("Should handle multiple leave and rejoin operations")
    void shouldHandleMultipleLeaveAndRejoinOperations() {
        // First leave
        participant.leave();
        assertFalse(participant.isActive());
        assertNotNull(participant.getLeftAt());

        // First rejoin
        participant.rejoin();
        assertTrue(participant.isActive());
        assertNull(participant.getLeftAt());

        // Second leave
        participant.leave();
        assertFalse(participant.isActive());
        assertNotNull(participant.getLeftAt());

        // Second rejoin
        participant.rejoin();
        assertTrue(participant.isActive());
        assertNull(participant.getLeftAt());
    }

    @Test
    @DisplayName("Should handle timestamp updates")
    void shouldHandleTimestampUpdates() {
        // Test joinedAt update
        LocalDateTime newJoinedAt = LocalDateTime.now().plusHours(1);
        participant.setJoinedAt(newJoinedAt);
        assertEquals(newJoinedAt, participant.getJoinedAt());

        // Test leftAt update
        LocalDateTime newLeftAt = LocalDateTime.now().plusHours(2);
        participant.setLeftAt(newLeftAt);
        assertEquals(newLeftAt, participant.getLeftAt());
    }

    @Test
    @DisplayName("Should handle null conversation")
    void shouldHandleNullConversation() {
        // Act
        participant.setConversation(null);

        // Assert
        assertNull(participant.getConversation());
    }

    @Test
    @DisplayName("Should handle null user")
    void shouldHandleNullUser() {
        // Act
        participant.setUser(null);

        // Assert
        assertNull(participant.getUser());
    }

    @Test
    @DisplayName("Should handle null role")
    void shouldHandleNullRole() {
        // Act
        participant.setRole(null);

        // Assert
        assertNull(participant.getRole());
        assertFalse(participant.isBuyer());
        assertFalse(participant.isSeller());
    }

    @Test
    @DisplayName("Should handle null timestamps")
    void shouldHandleNullTimestamps() {
        // Test null joinedAt
        participant.setJoinedAt(null);
        assertNull(participant.getJoinedAt());

        // Test null leftAt
        participant.setLeftAt(null);
        assertNull(participant.getLeftAt());
        assertTrue(participant.isActive());
    }

    @Test
    @DisplayName("Should handle all participant roles")
    void shouldHandleAllParticipantRoles() {
        // Test BUYER role
        participant.setRole(ParticipantRole.BUYER);
        assertEquals(ParticipantRole.BUYER, participant.getRole());
        assertTrue(participant.isBuyer());
        assertFalse(participant.isSeller());

        // Test SELLER role
        participant.setRole(ParticipantRole.SELLER);
        assertEquals(ParticipantRole.SELLER, participant.getRole());
        assertFalse(participant.isBuyer());
        assertTrue(participant.isSeller());

        // Test PARTICIPANT role
        participant.setRole(ParticipantRole.PARTICIPANT);
        assertEquals(ParticipantRole.PARTICIPANT, participant.getRole());
        assertFalse(participant.isBuyer());
        assertFalse(participant.isSeller());
    }

    @Test
    @DisplayName("Should handle edge case timestamps")
    void shouldHandleEdgeCaseTimestamps() {
        // Test very old timestamp
        LocalDateTime oldTimestamp = LocalDateTime.of(2000, 1, 1, 0, 0);
        participant.setJoinedAt(oldTimestamp);
        assertEquals(oldTimestamp, participant.getJoinedAt());

        // Test future timestamp
        LocalDateTime futureTimestamp = LocalDateTime.now().plusYears(1);
        participant.setLeftAt(futureTimestamp);
        assertEquals(futureTimestamp, participant.getLeftAt());
        assertFalse(participant.isActive());
    }

    @Test
    @DisplayName("Should handle role validation")
    void shouldHandleRoleValidation() {
        // Test all valid roles
        assertDoesNotThrow(() -> participant.setRole(ParticipantRole.BUYER));
        assertDoesNotThrow(() -> participant.setRole(ParticipantRole.SELLER));
        assertDoesNotThrow(() -> participant.setRole(ParticipantRole.PARTICIPANT));
    }

    @Test
    @DisplayName("Should maintain state consistency")
    void shouldMaintainStateConsistency() {
        // Test that active state is consistent with leftAt
        assertTrue(participant.isActive());
        assertNull(participant.getLeftAt());

        // Leave conversation
        participant.leave();
        assertFalse(participant.isActive());
        assertNotNull(participant.getLeftAt());

        // Manually set leftAt to null (should make active)
        participant.setLeftAt(null);
        assertTrue(participant.isActive());

        // Manually set leftAt to a timestamp (should make inactive)
        participant.setLeftAt(LocalDateTime.now());
        assertFalse(participant.isActive());
    }
}

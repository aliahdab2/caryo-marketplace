package com.caryo.marketplace.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OptimisticLocking;
import org.hibernate.annotations.OptimisticLockType;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entity representing a participant in a conversation with their role.
 * Follows the existing model patterns in the project.
 */
@Entity
@Table(name = "conversation_participants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@OptimisticLocking(type = OptimisticLockType.VERSION)
public class ConversationParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Conversation is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @NotNull(message = "User is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotNull(message = "Role is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ParticipantRole role = ParticipantRole.PARTICIPANT;

    @CreationTimestamp
    @Column(name = "joined_at", nullable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "is_muted")
    @Builder.Default
    private boolean isMuted = false;

    @Column(name = "muted_until")
    private LocalDateTime mutedUntil;

    @Column(name = "last_read_message_id")
    private Long lastReadMessageId;

    @Column(name = "last_read_at")
    private LocalDateTime lastReadAt;

    // Helper methods
    public boolean isActive() {
        return leftAt == null && deletedAt == null;
    }

    public boolean isBuyer() {
        return role == ParticipantRole.BUYER;
    }

    public boolean isSeller() {
        return role == ParticipantRole.SELLER;
    }

    public boolean isParticipant() {
        return role == ParticipantRole.PARTICIPANT;
    }

    public void leave() {
        if (leftAt == null) {
            this.leftAt = LocalDateTime.now();
        }
    }

    public void rejoin() {
        this.leftAt = null;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.deletedAt = null;
    }

    public boolean isMuted() {
        if (!isMuted) {
            return false;
        }

        // Check if mute period has expired
        if (mutedUntil != null && LocalDateTime.now().isAfter(mutedUntil)) {
            this.isMuted = false;
            this.mutedUntil = null;
            return false;
        }

        return true;
    }

    public void mute(LocalDateTime until) {
        this.isMuted = true;
        this.mutedUntil = until;
    }

    public void unmute() {
        this.isMuted = false;
        this.mutedUntil = null;
    }

    public void muteIndefinitely() {
        this.isMuted = true;
        this.mutedUntil = null;
    }

    public void updateLastRead(Long messageId) {
        this.lastReadMessageId = messageId;
        this.lastReadAt = LocalDateTime.now();
    }

    public boolean hasUnreadMessages() {
        return lastReadMessageId == null ||
               (conversation != null && conversation.getLastMessage() != null &&
                !Objects.equals(lastReadMessageId, conversation.getLastMessage().getId()));
    }

    public long getUnreadCount() {
        if (conversation == null || lastReadMessageId == null) {
            return 0;
        }

        return conversation.getMessages().stream()
                .filter(message -> message.getId() > lastReadMessageId && !message.isFromUser(user))
                .count();
    }

    public boolean canSendMessages() {
        return isActive() && !isMuted() && !isDeleted();
    }

    public boolean canReceiveMessages() {
        return isActive() && !isDeleted();
    }

    public boolean canModerate() {
        return isActive() && (isSeller() || role == ParticipantRole.PARTICIPANT);
    }

    public boolean canInviteOthers() {
        return isActive() && isSeller();
    }

    public String getStatusDescription() {
        if (isDeleted()) {
            return "Deleted";
        }

        if (leftAt != null) {
            return "Left";
        }

        if (isMuted()) {
            if (mutedUntil != null) {
                return "Muted until " + mutedUntil.format(java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy"));
            } else {
                return "Muted indefinitely";
            }
        }

        return "Active";
    }

    @PrePersist
    protected void onCreate() {
        if (joinedAt == null) {
            joinedAt = LocalDateTime.now();
        }
        if (version == null) {
            version = 0L;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ConversationParticipant that = (ConversationParticipant) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(conversation, that.conversation) &&
               Objects.equals(user, that.user);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, conversation, user);
    }
}

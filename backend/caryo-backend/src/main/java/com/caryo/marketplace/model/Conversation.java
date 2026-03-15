package com.caryo.marketplace.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.annotations.OptimisticLocking;
import org.hibernate.annotations.OptimisticLockType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Entity representing a conversation between a buyer and seller about a specific car listing.
 * Follows the existing model patterns in the project.
 */
@Entity
@Table(name = "conversations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@OptimisticLocking(type = OptimisticLockType.VERSION)
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Listing is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private CarListing listing;

    @NotNull(message = "Buyer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;

    @NotNull(message = "Seller is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ConversationStatus status = ConversationStatus.ACTIVE;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // Relationships
    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<Message> messages = new ArrayList<>();

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<ConversationParticipant> participants = new ArrayList<>();

    // Helper methods
    public boolean isParticipant(User user) {
        if (user == null || user.getId() == null) {
            return false;
        }
        return Objects.equals(buyer.getId(), user.getId()) || Objects.equals(seller.getId(), user.getId());
    }

    public User getOtherParticipant(User user) {
        if (user == null || user.getId() == null) {
            throw new IllegalArgumentException("User cannot be null");
        }

        if (Objects.equals(buyer.getId(), user.getId())) {
            return seller;
        } else if (Objects.equals(seller.getId(), user.getId())) {
            return buyer;
        }
        throw new IllegalArgumentException("User with ID " + user.getId() + " is not a participant in this conversation");
    }

    public void addMessage(Message message) {
        if (message == null) {
            throw new IllegalArgumentException("Message cannot be null");
        }

        messages.add(message);
        message.setConversation(this);
        this.lastMessageAt = message.getCreatedAt();
    }

    public void addParticipant(ConversationParticipant participant) {
        if (participant == null) {
            throw new IllegalArgumentException("Participant cannot be null");
        }

        participants.add(participant);
        participant.setConversation(this);
    }

    public void removeMessage(Message message) {
        if (message != null) {
            messages.remove(message);
            message.setConversation(null);
        }
    }

    public void removeParticipant(ConversationParticipant participant) {
        if (participant != null) {
            participants.remove(participant);
            participant.setConversation(null);
        }
    }

    public boolean isActive() {
        return status == ConversationStatus.ACTIVE && deletedAt == null;
    }

    public boolean isArchived() {
        return status == ConversationStatus.ARCHIVED;
    }

    public boolean isBlocked() {
        return status == ConversationStatus.BLOCKED;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void archive() {
        this.status = ConversationStatus.ARCHIVED;
    }

    public void block() {
        this.status = ConversationStatus.BLOCKED;
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.deletedAt = null;
    }

    public boolean canSendMessages() {
        return isActive() && !isBlocked();
    }

    public int getUnreadCountForUser(User user) {
        if (!isParticipant(user)) {
            return 0;
        }

        return (int) messages.stream()
                .filter(message -> !message.isFromUser(user) && !message.isRead())
                .count();
    }

    public Message getLastMessage() {
        if (messages.isEmpty()) {
            return null;
        }
        return messages.get(messages.size() - 1);
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (version == null) {
            version = 0L;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

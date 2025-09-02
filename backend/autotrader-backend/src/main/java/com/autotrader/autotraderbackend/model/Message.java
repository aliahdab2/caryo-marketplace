package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OptimisticLocking;
import org.hibernate.annotations.OptimisticLockType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Entity representing a message within a conversation.
 * Follows the existing model patterns in the project.
 */
@Entity
@Table(name = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@OptimisticLocking(type = OptimisticLockType.VERSION)
public class Message {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotNull(message = "Conversation is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;
    
    @NotNull(message = "Sender is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;
    
    @Size(max = 1000, message = "Message content cannot exceed 1000 characters")
    @Column(nullable = true, columnDefinition = "TEXT")
    private String content;
    
    @NotNull(message = "Message type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;
    
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;
    
    @Column(name = "read_at")
    private LocalDateTime readAt;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Version
    @Column(name = "version")
    private Long version;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "edited_at")
    private LocalDateTime editedAt;
    
    @Column(name = "is_edited")
    @Builder.Default
    private boolean isEdited = false;
    
    // Relationships
    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @Builder.Default
    private List<MessageAttachment> attachments = new ArrayList<>();
    
    // Helper methods
    public void markAsRead() {
        if (!this.isRead) {
            this.isRead = true;
            this.readAt = LocalDateTime.now();
        }
    }
    
    public void markAsUnread() {
        this.isRead = false;
        this.readAt = null;
    }
    
    // Setter method for backward compatibility with tests
    public void setIsRead(boolean isRead) {
        this.isRead = isRead;
        if (isRead) {
            this.readAt = LocalDateTime.now();
        } else {
            this.readAt = null;
        }
    }
    
    public void addAttachment(MessageAttachment attachment) {
        if (attachment == null) {
            throw new IllegalArgumentException("Attachment cannot be null");
        }
        
        attachments.add(attachment);
        attachment.setMessage(this);
    }
    
    public void removeAttachment(MessageAttachment attachment) {
        if (attachment != null) {
            attachments.remove(attachment);
            attachment.setMessage(null);
        }
    }
    
    public boolean hasAttachments() {
        return !attachments.isEmpty();
    }
    
    public boolean isFromUser(User user) {
        if (user == null || user.getId() == null) {
            return false;
        }
        return Objects.equals(sender.getId(), user.getId());
    }
    
    public boolean isTextMessage() {
        return messageType == MessageType.TEXT;
    }
    
    public boolean isImageMessage() {
        return messageType == MessageType.IMAGE;
    }
    
    public boolean isSystemMessage() {
        return messageType == MessageType.SYSTEM;
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
    
    public void edit(String newContent) {
        if (newContent == null || newContent.trim().isEmpty()) {
            throw new IllegalArgumentException("New content cannot be null or empty");
        }
        
        if (newContent.length() > 1000) {
            throw new IllegalArgumentException("Message content cannot exceed 1000 characters");
        }
        
        this.content = newContent.trim();
        this.isEdited = true;
        this.editedAt = LocalDateTime.now();
    }
    
    public boolean canBeEdited() {
        // Messages can be edited within 5 minutes of creation
        if (createdAt == null) {
            return false;
        }
        
        LocalDateTime editDeadline = createdAt.plusMinutes(5);
        return LocalDateTime.now().isBefore(editDeadline) && !isDeleted();
    }
    
    public boolean canBeDeleted() {
        // Messages can be deleted within 1 hour of creation
        if (createdAt == null) {
            return false;
        }
        
        LocalDateTime deleteDeadline = createdAt.plusHours(1);
        return LocalDateTime.now().isBefore(deleteDeadline);
    }
    
    public String getDisplayContent() {
        if (isDeleted()) {
            return "[Message deleted]";
        }
        
        if (isEdited) {
            return content + " (edited)";
        }
        
        return content;
    }
    
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (version == null) {
            version = 0L;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        if (editedAt == null && isEdited) {
            editedAt = LocalDateTime.now();
        }
    }
}

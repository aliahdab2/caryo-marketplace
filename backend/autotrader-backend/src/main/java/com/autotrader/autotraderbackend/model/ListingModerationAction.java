package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity representing moderation actions performed on car listings.
 * This table tracks all admin moderation activities including hide/unhide, approve/reject, etc.
 * 
 * This approach keeps the CarListing table lean while providing complete audit trail
 * for all moderation activities, following industry best practices.
 */
@Entity
@Table(name = "listing_moderation_actions", indexes = {
    @Index(name = "idx_moderation_listing_id", columnList = "listing_id"),
    @Index(name = "idx_moderation_active", columnList = "listing_id, is_active"),
    @Index(name = "idx_moderation_action_type", columnList = "action_type"),
    @Index(name = "idx_moderation_performed_at", columnList = "performed_at")
})
@Getter
@Setter
@NoArgsConstructor
public class ListingModerationAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private CarListing listing;

    /**
     * Type of moderation action performed.
     * Examples: HIDE, UNHIDE, APPROVE, REJECT, REQUEST_CHANGES, etc.
     */
    @NotBlank
    @Size(max = 50)
    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    /**
     * Reason for the moderation action.
     * Optional for some actions, required for others (like REJECT).
     */
    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    /**
     * Admin user who performed the action.
     */
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by", nullable = false)
    private User performedBy;

    /**
     * Timestamp when the action was performed.
     */
    @CreationTimestamp
    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    /**
     * Whether this action is currently active.
     * For example, if a listing is hidden then unhidden, 
     * only the latest action should be active.
     */
    @Column(name = "is_active", nullable = false, columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean isActive = true;

    /**
     * Additional metadata in JSON format for flexibility.
     * Can store action-specific data without schema changes.
     */
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    // Convenience constructor
    public ListingModerationAction(CarListing listing, String actionType, String reason, User performedBy) {
        this.listing = listing;
        this.actionType = actionType;
        this.reason = reason;
        this.performedBy = performedBy;
        this.isActive = true;
    }

    // Business logic methods
    public boolean isHideAction() {
        return "HIDE".equals(actionType);
    }

    public boolean isUnhideAction() {
        return "UNHIDE".equals(actionType);
    }

    public boolean isApprovalAction() {
        return "APPROVE".equals(actionType);
    }

    public boolean isRejectionAction() {
        return "REJECT".equals(actionType);
    }
}

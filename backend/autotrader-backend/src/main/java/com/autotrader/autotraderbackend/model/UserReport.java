package com.autotrader.autotraderbackend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Model representing a user report submitted by one user against another.
 * Used to report abusive, inappropriate, or suspicious behavior.
 */
@Entity
@Table(name = "user_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * The user who submitted the report (reporter)
     */
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    /**
     * The user being reported (reported user)
     */
    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id", nullable = false)
    private User reportedUser;

    /**
     * The conversation context (if the report is related to a conversation)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    /**
     * Type/category of the report
     */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ReportType reportType;

    /**
     * Detailed reason/description of the report
     */
    @NotBlank
    @Size(max = 1000)
    @Column(nullable = false, length = 1000)
    private String reason;

    /**
     * Status of the report (PENDING, REVIEWED, RESOLVED, DISMISSED)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    /**
     * Admin notes or resolution details
     */
    @Size(max = 500)
    @Column(length = 500)
    private String adminNotes;

    /**
     * Timestamp when the report was created
     */
    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Timestamp when the report was last updated
     */
    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Timestamp when the report was resolved (if resolved)
     */
    private LocalDateTime resolvedAt;

    /**
     * Admin user who resolved the report (if resolved)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by_id")
    private User resolvedBy;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = ReportStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (status == ReportStatus.RESOLVED && resolvedAt == null) {
            resolvedAt = LocalDateTime.now();
        }
    }

    /**
     * Enum for report status
     */
    public enum ReportStatus {
        PENDING,
        REVIEWED,
        RESOLVED,
        DISMISSED
    }
}

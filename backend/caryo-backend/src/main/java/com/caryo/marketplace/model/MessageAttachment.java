package com.caryo.marketplace.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
 * Entity representing file attachments for messages (images, documents, etc.).
 * Follows the existing ListingMedia pattern in the project.
 */
@Entity
@Table(name = "message_attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@OptimisticLocking(type = OptimisticLockType.VERSION)
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "Message is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    private Message message;

    @NotBlank(message = "File key is required")
    @Size(max = 255, message = "File key cannot exceed 255 characters")
    @Column(name = "file_key", nullable = false)
    private String fileKey;

    @NotBlank(message = "File name is required")
    @Size(max = 255, message = "File name cannot exceed 255 characters")
    @Column(name = "file_name", nullable = false)
    private String fileName;

    @NotBlank(message = "Content type is required")
    @Size(max = 100, message = "Content type cannot exceed 100 characters")
    @Column(name = "content_type", nullable = false)
    private String contentType;

    @NotNull(message = "File size is required")
    @Positive(message = "File size must be positive")
    @Column(nullable = false)
    private Long size;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Version
    @Column(name = "version")
    private Long version;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "upload_status")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UploadStatus uploadStatus = UploadStatus.COMPLETED;

    @Column(name = "error_message")
    private String errorMessage;

    // Helper methods
    public String getFileUrl() {
        // This will be transformed by your existing MinIO URL transformation utilities
        return fileKey;
    }

    public boolean isImage() {
        return contentType != null && contentType.startsWith("image/");
    }

    public boolean isDocument() {
        return contentType != null && (
            contentType.startsWith("application/pdf") ||
            contentType.startsWith("application/msword") ||
            contentType.startsWith("application/vnd.openxmlformats-officedocument")
        );
    }

    public boolean isVideo() {
        return contentType != null && contentType.startsWith("video/");
    }

    public boolean isAudio() {
        return contentType != null && contentType.startsWith("audio/");
    }

    public String getFileExtension() {
        if (fileName != null && fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
        }
        return "";
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

    public boolean isUploadCompleted() {
        return uploadStatus == UploadStatus.COMPLETED;
    }

    public boolean isUploadFailed() {
        return uploadStatus == UploadStatus.FAILED;
    }

    public boolean isUploadPending() {
        return uploadStatus == UploadStatus.PENDING;
    }

    public void markUploadFailed(String errorMessage) {
        this.uploadStatus = UploadStatus.FAILED;
        this.errorMessage = errorMessage;
    }

    public void markUploadCompleted() {
        this.uploadStatus = UploadStatus.COMPLETED;
        this.errorMessage = null;
    }

    public void markUploadPending() {
        this.uploadStatus = UploadStatus.PENDING;
        this.errorMessage = null;
    }

    public String getHumanReadableSize() {
        if (size == null) {
            return "Unknown size";
        }

        if (size < 1024) {
            return size + " B";
        } else if (size < 1024 * 1024) {
            return String.format("%.1f KB", size / 1024.0);
        } else if (size < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", size / (1024.0 * 1024.0));
        } else {
            return String.format("%.1f GB", size / (1024.0 * 1024.0 * 1024.0));
        }
    }

    public boolean isValidFileType() {
        if (contentType == null) {
            return false;
        }

        // Allow common file types
        return isImage() || isDocument() || isVideo() || isAudio() ||
               contentType.equals("text/plain") ||
               contentType.equals("application/zip") ||
               contentType.equals("application/x-rar-compressed");
    }

    public boolean isFileSizeAcceptable(long maxSizeInBytes) {
        return size != null && size <= maxSizeInBytes;
    }

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (version == null) {
            version = 0L;
        }
        if (uploadStatus == null) {
            uploadStatus = UploadStatus.COMPLETED;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MessageAttachment that = (MessageAttachment) o;
        return Objects.equals(id, that.id) && Objects.equals(fileKey, that.fileKey);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, fileKey);
    }

    /**
     * Enum representing the upload status of an attachment
     */
    public enum UploadStatus {
        PENDING("pending"),
        COMPLETED("completed"),
        FAILED("failed");

        private final String value;

        UploadStatus(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static UploadStatus fromValue(String value) {
            for (UploadStatus status : values()) {
                if (status.value.equals(value)) {
                    return status;
                }
            }
            throw new IllegalArgumentException("Unknown upload status: " + value);
        }
    }
}

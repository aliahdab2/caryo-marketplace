package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.BadRequestException;
import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.Conversation;
import com.caryo.marketplace.model.Message;
import com.caryo.marketplace.model.MessageAttachment;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.response.MessageResponse;
import com.caryo.marketplace.repository.ConversationRepository;
import com.caryo.marketplace.repository.MessageAttachmentRepository;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.service.storage.StorageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.context.MessageSource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

/**
 * Service for handling message file attachments (upload, validation, mapping).
 * Extracted from ConversationService for better separation of concerns.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MessageAttachmentService {

    private final StorageService storageService;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final MessageSource messageSource;

    /**
     * Upload file attachment for a message.
     * The attachment is created without a message link; it will be linked when the message is sent.
     */
    public Map<String, Object> uploadMessageAttachment(Long conversationId, MultipartFile file, Long userId) {
        log.info("Uploading attachment for conversation {} by user {}", conversationId, userId);

        // Validate conversation exists and user has access
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        validateUserParticipation(conversation, user);

        // Validate file
        if (file == null) {
            throw new BadRequestException(getMessage("error.file.null", Locale.ENGLISH));
        }
        if (file.isEmpty()) {
            throw new BadRequestException(getMessage("error.file.empty", Locale.ENGLISH));
        }

        String contentType = file.getContentType();

        // Check file size first (before expensive Tika validation)
        long maxFileSize = getMaxFileSize(contentType);
        if (file.getSize() > maxFileSize) {
            if (contentType != null && contentType.startsWith("image/")) {
                throw new BadRequestException(getMessage("error.file.size.image.too.large", Locale.ENGLISH));
            } else {
                throw new BadRequestException(getMessage("error.file.size.document.too.large", Locale.ENGLISH));
            }
        }

        // Check file type using Apache Tika for security
        if (!isAllowedFileType(file)) {
            throw new BadRequestException(getMessage("error.file.type.unsupported", Locale.ENGLISH));
        }

        // Generate file key
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String fileKey = "messages/" + conversationId + "/" + UUID.randomUUID().toString() + fileExtension;

        // Store file
        String fileUrl = storageService.store(file, fileKey);

        // Create attachment record (without message for now - will be linked when message is sent)
        MessageAttachment attachment = MessageAttachment.builder()
                .fileKey(fileKey)
                .fileName(originalFilename != null ? originalFilename : "unknown")
                .contentType(contentType)
                .size(file.getSize())
                .uploadStatus(MessageAttachment.UploadStatus.COMPLETED)
                .build();

        attachment = messageAttachmentRepository.save(attachment);

        if (attachment == null) {
            throw new BadRequestException("Failed to save attachment");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", attachment.getId());
        result.put("fileName", attachment.getFileName());
        result.put("fileUrl", fileUrl);
        result.put("fileKey", fileKey);
        result.put("contentType", contentType);
        result.put("size", file.getSize());
        result.put("isImage", attachment.isImage());

        return result;
    }

    /**
     * Create and persist a message attachment linked to a specific message.
     */
    public MessageAttachment createMessageAttachment(Message message, MultipartFile file) {
        // Validate file
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedFileType(file)) {
            throw new BadRequestException(getMessage("error.file.type.unsupported", Locale.ENGLISH));
        }

        // Check file size using the proper size limits (10MB for images, 25MB for documents)
        long maxFileSize = getMaxFileSize(contentType);
        if (file.getSize() > maxFileSize) {
            if (contentType.startsWith("image/")) {
                throw new BadRequestException(getMessage("error.file.size.image.too.large", Locale.ENGLISH));
            } else {
                throw new BadRequestException(getMessage("error.file.size.document.too.large", Locale.ENGLISH));
            }
        }

        // Generate file key
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String fileKey = "messages/" + message.getConversation().getId() + "/" + UUID.randomUUID().toString() + fileExtension;

        // Store file
        storageService.store(file, fileKey);

        // Create and save attachment
        MessageAttachment attachment = MessageAttachment.builder()
                .message(message)
                .fileKey(fileKey)
                .fileName(originalFilename != null ? originalFilename : "unknown")
                .contentType(contentType)
                .size(file.getSize())
                .uploadStatus(MessageAttachment.UploadStatus.COMPLETED)
                .build();

        return messageAttachmentRepository.save(attachment);
    }

    /**
     * Map a MessageAttachment entity to an attachment response DTO.
     */
    public MessageResponse.MessageAttachmentResponse mapToAttachmentSummary(MessageAttachment attachment) {
        return MessageResponse.MessageAttachmentResponse.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .contentType(attachment.getContentType())
                .size(attachment.getSize())
                .fileUrl(attachment.getFileUrl())
                .uploadStatus(attachment.getUploadStatus().name())
                .errorMessage(attachment.getErrorMessage())
                .createdAt(attachment.getCreatedAt())
                .isDeleted(attachment.isDeleted())
                .humanReadableSize(attachment.getHumanReadableSize())
                .image(attachment.isImage())
                .document(attachment.isDocument())
                .video(attachment.isVideo())
                .audio(attachment.isAudio())
                .fileExtension(attachment.getFileExtension())
                .validFileType(attachment.isValidFileType())
                .build();
    }

    /**
     * Check if the file type is allowed for message attachments using Apache Tika for security.
     * Following best practices from Blocket and AutoTrader UK.
     */
    private boolean isAllowedFileType(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }

        String declaredContentType = file.getContentType();

        // First check declared content type for obvious rejections
        if (declaredContentType != null) {
            String normalizedDeclared = declaredContentType.toLowerCase().trim();
            // Reject obviously dangerous types based on declared content type
            if (normalizedDeclared.contains("javascript") ||
                normalizedDeclared.contains("executable") ||
                normalizedDeclared.contains("script") ||
                normalizedDeclared.equals("text/html") ||
                normalizedDeclared.startsWith("video/") ||
                normalizedDeclared.startsWith("audio/")) {
                log.warn("Rejected file based on declared content type: {} for file: {}", declaredContentType, file.getOriginalFilename());
                return false;
            }
        }

        try {
            // Use Apache Tika for deep file inspection (security best practice)
            Tika tika = new Tika();
            String detectedType = tika.detect(file.getInputStream()).toLowerCase().trim();

            log.info("File type detection - Declared: {}, Detected: {} for file: {}",
                     declaredContentType, detectedType, file.getOriginalFilename());

            // Reset input stream for later use
            try {
                file.getInputStream().reset();
            } catch (Exception resetException) {
                // Input stream might not support reset, that's okay
                log.debug("Could not reset input stream for file: {}", file.getOriginalFilename());
            }

            // Image types (existing support)
            if (detectedType.startsWith("image/")) {
                return detectedType.equals("image/jpeg") ||
                       detectedType.equals("image/jpg") ||
                       detectedType.equals("image/png") ||
                       detectedType.equals("image/webp") ||
                       detectedType.equals("image/gif");
            }

            // Document types (new support)
            switch (detectedType) {
                // PDF documents
                case "application/pdf":
                    return true;

                // Microsoft Word documents
                case "application/msword": // .doc
                case "application/vnd.openxmlformats-officedocument.wordprocessingml.document": // .docx
                    return true;

                // Microsoft Excel spreadsheets (for service records, etc.)
                case "application/vnd.ms-excel": // .xls
                case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": // .xlsx
                case "application/x-tika-ooxml": // Sometimes detected by Tika for Office files
                case "application/x-tika-msoffice": // Sometimes detected by Tika for older Office files
                    return true;

                // Plain text files
                case "text/plain":
                    return true;

                // Rich Text Format
                case "application/rtf":
                    return true;

                default:
                    log.warn("Rejected file type: {} for file: {}", detectedType, file.getOriginalFilename());
                    return false;
            }
        } catch (Exception e) {
            log.error("Error detecting file type for: {}, error: {}", file.getOriginalFilename(), e.getMessage());
            return false;
        }
    }

    /**
     * Get maximum file size based on file type.
     */
    private long getMaxFileSize(String contentType) {
        if (contentType == null) {
            return 10 * 1024 * 1024; // 10MB default
        }

        String normalizedType = contentType.toLowerCase().trim();

        // Images: 10MB limit
        if (normalizedType.startsWith("image/")) {
            return 10 * 1024 * 1024;
        }

        // Documents: 25MB limit (larger for comprehensive documents)
        return 25 * 1024 * 1024;
    }

    /**
     * Validate that a user is a participant in the conversation.
     */
    private void validateUserParticipation(Conversation conversation, User user) {
        if (!conversation.getBuyer().getId().equals(user.getId()) &&
            !conversation.getSeller().getId().equals(user.getId())) {
            throw new BadRequestException("User is not a participant in this conversation");
        }
    }

    /**
     * Helper method to retrieve localized messages from the message source.
     */
    private String getMessage(String key, Locale locale) {
        return messageSource.getMessage(key, null, key, locale);
    }
}

package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.payload.request.CreateConversationRequest;
import com.autotrader.autotraderbackend.payload.request.SendMessageRequest;
import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import com.autotrader.autotraderbackend.payload.response.ConversationResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.service.ConversationService;
import com.autotrader.autotraderbackend.service.I18nService;
import com.autotrader.autotraderbackend.service.MessageSanitizationService;
import com.autotrader.autotraderbackend.security.ratelimit.RateLimit;
import com.autotrader.autotraderbackend.security.ratelimit.RateLimitKeyType;

import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;



/**
 * REST controller for managing conversations and messages.
 * Provides endpoints for the messaging system.
 */
@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
@Slf4j
public class ConversationController {

    private final ConversationService conversationService;
    private final I18nService i18nService;
    private final MessageSanitizationService messageSanitizationService;

    /**
     * Create a new conversation
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ConversationResponse>> createConversation(
            @Valid @RequestBody CreateConversationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Creating conversation for listing {} by user {}",
                request.getListingId(), userDetails.getId());

        ConversationResponse response = conversationService.createConversation(request, userDetails.getId());

        String message = i18nService.getMessage("conversation.created.success", acceptLanguage);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, message));
    }

    /**
     * Get user's conversations with pagination
     */
    @GetMapping("/my-conversations")
    public ResponseEntity<Page<ConversationResponse>> getUserConversations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "lastMessageAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        log.info("Getting conversations for user {}", userDetails.getId());

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<ConversationResponse> conversations = conversationService.getUserConversations(
                userDetails.getId(), pageable);

        return ResponseEntity.ok(conversations);
    }

    /**
     * Get a specific conversation by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ConversationResponse> getConversation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        log.info("Getting conversation {} for user {}", id, userDetails.getId());

        ConversationResponse response = conversationService.getConversation(id, userDetails.getId());
        return ResponseEntity.ok(response);
    }

    /**
     * Get messages in a conversation with pagination
     */
    @GetMapping("/{id}/messages")
    public ResponseEntity<Page<MessageResponse>> getConversationMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {

        log.info("Getting messages for conversation {} by user {}", id, userDetails.getId());

        Sort sort = sortDir.equalsIgnoreCase("desc") ?
                Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<MessageResponse> messages = conversationService.getConversationMessages(
                id, userDetails.getId(), pageable);

        return ResponseEntity.ok(messages);
    }

    /**
     * Send a message in a conversation
     */
    @RateLimit(maxRequests = 20, windowSeconds = 60, keyType = RateLimitKeyType.USER,
        message = "Too many messages sent. Please wait a moment before sending more.")
    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @PathVariable Long id,
            @Valid @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Sending message in conversation {} by user {}", id, userDetails.getId());

        MessageResponse response = conversationService.sendMessage(id, request, userDetails.getId());

        String message = i18nService.getMessage("message.sent.success", acceptLanguage);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, message));
    }

    /**
     * Mark a message as read
     */
        @PatchMapping("/messages/{messageId}/read")
    public ResponseEntity<ApiResponse<Void>> markMessageAsRead(
            @PathVariable Long messageId,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Marking message {} as read by user {}", messageId, userDetails.getId());

        conversationService.markMessageAsRead(messageId, userDetails.getId());

        String message = i18nService.getMessage("message.marked.read.success", acceptLanguage);

        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /**
     * Mark all messages in a conversation as read
     */
    @PatchMapping("/{id}/messages/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllMessagesAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Marking all messages as read in conversation {} by user {}", id, userDetails.getId());

        conversationService.markAllMessagesAsRead(id, userDetails.getId());

        String message = i18nService.getMessage("messages.marked.read.all.success", acceptLanguage);

        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /**
     * Archive a conversation
     */
    @PatchMapping("/{id}/archive")
    public ResponseEntity<ApiResponse<Void>> archiveConversation(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Archiving conversation {} by user {}", id, userDetails.getId());

        conversationService.archiveConversation(id, userDetails.getId());

        String message = i18nService.getMessage("conversation.archived.success", acceptLanguage);

        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /**
     * Block a user in a conversation
     */
    @PatchMapping("/{id}/block")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Blocking user in conversation {} by user {}", id, userDetails.getId());

        conversationService.blockUser(id, userDetails.getId());

        String message = i18nService.getMessage("conversation.user.blocked.success", acceptLanguage, "User has been blocked successfully");

        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /**
     * Update conversation status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> updateConversationStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Updating conversation {} status to {} by user {}", id, status, userDetails.getId());

        conversationService.updateConversationStatus(id, status, userDetails.getId());

        String message = i18nService.getMessage("conversation.status.updated.success", acceptLanguage);

        return ResponseEntity.ok(ApiResponse.success(message));
    }

    /**
     * Upload file attachment for a message
     */
    @PostMapping("/{id}/messages/attachments")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadMessageAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Uploading attachment for conversation {} by user {}", id, userDetails.getId());

        Map<String, Object> result = conversationService.uploadMessageAttachment(id, file, userDetails.getId());

        String message = i18nService.getMessage("message.attachment.uploaded.success", acceptLanguage);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result, message));
    }

    /**
     * Send message with attachments
     */
    @PostMapping("/{id}/messages/with-attachments")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessageWithAttachments(
            @PathVariable Long id,
            @RequestParam("content") String content,
            @RequestParam("messageType") String messageType,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @RequestHeader(value = "Accept-Language", defaultValue = "en") String acceptLanguage) {

        log.info("Sending message with attachments in conversation {} by user {}", id, userDetails.getId());

        // Validate that either content or files are provided
        if ((content == null || content.trim().isEmpty()) && (files == null || files.length == 0)) {
            String errorMessage = i18nService.getMessage("error.message.content.required", acceptLanguage);
            throw new BadRequestException(errorMessage);
        }

        // Validate content length if provided
        if (content != null && content.length() > 1000) {
            String errorMessage = i18nService.getMessage("error.message.content.too.long", acceptLanguage);
            throw new BadRequestException(errorMessage);
        }

        // Sanitize content to prevent XSS attacks
        String sanitizedContent = content != null ? messageSanitizationService.sanitize(content) : null;

        MessageResponse response = conversationService.sendMessageWithAttachments(
            id, sanitizedContent, messageType, files, userDetails.getId());

        String message = i18nService.getMessage("message.sent.success", acceptLanguage);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, message));
    }
}

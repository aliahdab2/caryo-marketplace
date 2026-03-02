package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.payload.request.CreateConversationRequest;
import com.autotrader.autotraderbackend.payload.request.SendMessageRequest;
import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import com.autotrader.autotraderbackend.payload.response.ConversationResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.service.ConversationService;
import com.autotrader.autotraderbackend.service.I18nService;
import com.autotrader.autotraderbackend.service.MessageSanitizationService;
import com.autotrader.autotraderbackend.security.ratelimit.RateLimit;
import com.autotrader.autotraderbackend.security.ratelimit.RateLimitKeyType;

import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Conversations", description = "Messaging system for buyer-seller communication")
@SecurityRequirement(name = "bearer-token")
public class ConversationController {

    private final ConversationService conversationService;
    private final I18nService i18nService;
    private final MessageSanitizationService messageSanitizationService;

    /**
     * Create a new conversation
     */
    @Operation(summary = "Create conversation", description = "Start a new conversation about a listing with the seller")
    @ApiResponses({
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Conversation created"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Not authenticated")
    })
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
    @Operation(summary = "Get my conversations", description = "Retrieve all conversations for the authenticated user with pagination")
    @GetMapping("/my-conversations")
    public ResponseEntity<PageResponse<ConversationResponse>> getUserConversations(
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

        PageResponse<ConversationResponse> response = new PageResponse<>(
                conversations.getContent(),
                conversations.getNumber(),
                conversations.getSize(),
                conversations.getTotalElements(),
                conversations.getTotalPages(),
                conversations.isLast());

        return ResponseEntity.ok(response);
    }

    /**
     * Get a specific conversation by ID
     */
    @Operation(summary = "Get conversation", description = "Retrieve a specific conversation by ID")
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
    @Operation(summary = "Get messages", description = "Retrieve messages in a conversation with pagination")
    @GetMapping("/{id}/messages")
    public ResponseEntity<PageResponse<MessageResponse>> getConversationMessages(
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

        PageResponse<MessageResponse> response = new PageResponse<>(
                messages.getContent(),
                messages.getNumber(),
                messages.getSize(),
                messages.getTotalElements(),
                messages.getTotalPages(),
                messages.isLast());

        return ResponseEntity.ok(response);
    }

    /**
     * Send a message in a conversation
     */
    @Operation(summary = "Send message", description = "Send a text message in a conversation (rate limited: 20/min)")
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
    @Operation(summary = "Mark message as read", description = "Mark a specific message as read")
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
    @Operation(summary = "Mark all as read", description = "Mark all messages in a conversation as read")
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
    @Operation(summary = "Archive conversation", description = "Archive a conversation to hide it from the main list")
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
    @Operation(summary = "Block user", description = "Block the other user in a conversation to prevent further messages")
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
    @Operation(summary = "Update status", description = "Update conversation status (active, archived, closed)")
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
    @Operation(summary = "Upload attachment", description = "Upload a file attachment to use in a message")
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
    @Operation(summary = "Send message with attachments", description = "Send a message with one or more file attachments")
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

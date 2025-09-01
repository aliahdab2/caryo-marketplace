package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.payload.request.CreateConversationRequest;
import com.autotrader.autotraderbackend.payload.request.SendMessageRequest;
import com.autotrader.autotraderbackend.payload.response.ConversationResponse;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.repository.ConversationRepository;
import com.autotrader.autotraderbackend.repository.MessageRepository;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.MessageAttachmentRepository;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;
import org.apache.tika.Tika;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing conversations between buyers and sellers.
 * Implements business logic for the messaging system.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final StorageService storageService;

    /**
     * Create a new conversation or return existing one
     */
    public ConversationResponse createConversation(CreateConversationRequest request, Long buyerId) {
        log.info("Creating conversation for listing {} by buyer {}", request.getListingId(), buyerId);

        // Validate listing exists and is active
        CarListing listing = carListingRepository.findById(request.getListingId())
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", request.getListingId()));

        if (!listing.getApproved() || listing.getSold()) {
            throw new BadRequestException("Cannot start conversation for inactive listing");
        }

        // Get buyer and seller
        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", buyerId));
        
        User seller = listing.getSeller();
        
        // Prevent self-conversation
        if (buyer.getId().equals(seller.getId())) {
            throw new BadRequestException("Cannot start conversation with yourself");
        }

        // Check if conversation already exists
        Conversation conversation = conversationRepository
                .findByListingIdAndBuyerIdAndSellerId(listing.getId(), buyer.getId(), seller.getId())
                .orElse(null);

        if (conversation == null) {
            // Create new conversation
            conversation = Conversation.builder()
                    .listing(listing)
                    .buyer(buyer)
                    .seller(seller)
                    .status(ConversationStatus.ACTIVE)
                    .build();
            
            conversation = conversationRepository.save(conversation);
            
            // Create participants
            ConversationParticipant buyerParticipant = ConversationParticipant.builder()
                    .conversation(conversation)
                    .user(buyer)
                    .role(ParticipantRole.BUYER)
                    .build();
            
            ConversationParticipant sellerParticipant = ConversationParticipant.builder()
                    .conversation(conversation)
                    .user(seller)
                    .role(ParticipantRole.SELLER)
                    .build();
            
            conversation.addParticipant(buyerParticipant);
            conversation.addParticipant(sellerParticipant);
        }

        // Create initial message
        Message initialMessage = Message.builder()
                .conversation(conversation)
                .sender(buyer)
                .content(request.getTrimmedMessage())
                .messageType(MessageType.valueOf(request.getMessageType().toUpperCase()))
                .build();

        conversation.addMessage(initialMessage);
        messageRepository.save(initialMessage);
        
        log.info("Conversation created successfully with ID: {}", conversation.getId());
        return mapToConversationResponse(conversation, buyer);
    }

    /**
     * Get user's conversations with pagination
     */
    @Transactional(readOnly = true)
    public Page<ConversationResponse> getUserConversations(Long userId, Pageable pageable) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Only return active conversations (exclude archived and blocked)
        Page<Conversation> conversations = conversationRepository.findActiveConversationsByUser(user, ConversationStatus.ACTIVE, pageable);
        
        return conversations.map(conversation -> mapToConversationResponse(conversation, user));
    }

    /**
     * Get conversation by ID
     */
    @Transactional(readOnly = true)
    public ConversationResponse getConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Check if user is participant
        if (!conversation.isParticipant(user)) {
            throw new BadRequestException("Access denied: Not a participant in this conversation");
        }

        return mapToConversationResponse(conversation, user);
    }

    /**
     * Send a message in a conversation
     */
    public MessageResponse sendMessage(Long conversationId, SendMessageRequest request, Long senderId) {
        log.info("Sending message in conversation {} by user {}", conversationId, senderId);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", senderId));

        // Validate sender is participant
        if (!conversation.isParticipant(sender)) {
            throw new BadRequestException("Access denied: Not a participant in this conversation");
        }

        // Check conversation status
        if (!conversation.canSendMessages()) {
            throw new BadRequestException("Cannot send messages in this conversation");
        }

        // Create message
        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent() != null ? request.getContent().trim() : "")
                .messageType(MessageType.valueOf(request.getMessageType().toUpperCase()))
                .build();

        message = messageRepository.save(message);
        conversation.addMessage(message);
        
        log.info("Message sent successfully with ID: {}", message.getId());
        return mapToMessageResponse(message);
    }

    /**
     * Mark message as read
     */
    public void markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // Validate user is participant and not the sender
        if (!message.getConversation().isParticipant(user) || message.isFromUser(user)) {
            throw new BadRequestException("Cannot mark this message as read");
        }

        message.markAsRead();
        messageRepository.save(message);
    }

    /**
     * Mark all messages in conversation as read
     */
    public void markAllMessagesAsRead(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!conversation.isParticipant(user)) {
            throw new BadRequestException("Access denied: Not a participant in this conversation");
        }

        List<Message> unreadMessages = messageRepository.findByConversationIdAndIsReadFalseOrderByCreatedAtAsc(conversationId);
        unreadMessages.stream()
                .filter(message -> !message.isFromUser(user))
                .forEach(Message::markAsRead);
        messageRepository.saveAll(unreadMessages);
    }

    /**
     * Get messages in a conversation with pagination
     */
    @Transactional(readOnly = true)
    public Page<MessageResponse> getConversationMessages(Long conversationId, Long userId, Pageable pageable) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!conversation.isParticipant(user)) {
            throw new BadRequestException("Access denied: Not a participant in this conversation");
        }

        Page<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId, pageable);
        
        // Batch load attachments for all messages to avoid N+1 queries
        List<Long> messageIds = messages.getContent().stream()
                .map(Message::getId)
                .collect(Collectors.toList());
        
        final Map<Long, List<MessageAttachment>> attachmentsByMessageId;
        if (!messageIds.isEmpty()) {
            List<MessageAttachment> allAttachments = messageAttachmentRepository.findByMessageIdInOrderByCreatedAtAsc(messageIds);
            attachmentsByMessageId = allAttachments.stream()
                    .collect(Collectors.groupingBy(attachment -> attachment.getMessage().getId()));
        } else {
            attachmentsByMessageId = new HashMap<>();
        }
        
        return messages.map(message -> mapToMessageResponseWithAttachments(message, attachmentsByMessageId.get(message.getId())));
    }

    /**
     * Update conversation status
     */
    public void updateConversationStatus(Long conversationId, String status, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!conversation.isParticipant(user)) {
            throw new BadRequestException("Access denied: Not a participant in this conversation");
        }

        try {
            ConversationStatus newStatus = ConversationStatus.valueOf(status.toUpperCase());
            conversation.setStatus(newStatus);
            conversationRepository.save(conversation);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid conversation status: " + status);
        }
    }

    /**
     * Archive a conversation
     */
    public void archiveConversation(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!conversation.isParticipant(user)) {
            throw new BadRequestException("Access denied: Not a participant in this conversation");
        }

        conversation.archive();
        conversationRepository.save(conversation);
    }

    // Helper methods for mapping entities to DTOs
    private ConversationResponse mapToConversationResponse(Conversation conversation, User currentUser) {
        User otherUser = conversation.getOtherParticipant(currentUser);
        Message lastMessage = conversation.getLastMessage();

        return ConversationResponse.builder()
                .id(conversation.getId())
                .listingId(conversation.getListing().getId())
                .listingTitle(conversation.getListing().getTitle())
                .listingImageUrl(getListingImageUrl(conversation.getListing()))
                .listingPrice(conversation.getListing().getPrice().toString())
                .listingCurrency(conversation.getListing().getCurrency())
                .listingBrand(conversation.getListing().getModel().getBrand().getName())
                .listingModel(conversation.getListing().getModel().getName())
                .listingYear(conversation.getListing().getModelYear())
                .buyer(mapToUserSummary(conversation.getBuyer()))
                .seller(mapToUserSummary(conversation.getSeller()))
                .status(conversation.getStatus().name())
                .lastMessageAt(conversation.getLastMessageAt())
                .unreadCount(conversation.getUnreadCountForUser(currentUser))
                .createdAt(conversation.getCreatedAt())
                .updatedAt(conversation.getUpdatedAt())
                .isActive(conversation.isActive())
                .isArchived(conversation.isArchived())
                .isBlocked(conversation.isBlocked())
                .build();
    }

    private MessageResponse mapToMessageResponse(Message message) {
        // Load attachments for this message
        List<MessageAttachment> attachments = messageAttachmentRepository.findByMessageIdOrderByCreatedAtAsc(message.getId());
        log.debug("Message {} has {} attachments", message.getId(), attachments != null ? attachments.size() : 0);
        
        MessageResponse response = MessageResponse.builder()
                .id(message.getId())
                .conversationId(message.getConversation().getId())
                .content(message.getContent())
                .displayContent(message.getContent())
                .messageType(message.getMessageType().name())
                .isRead(message.isRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .isEdited(message.isEdited())
                .editedAt(message.getEditedAt())
                .isDeleted(message.isDeleted())
                .sender(mapToMessageUserSummary(message.getSender()))
                .build();
        
        // Add attachments if any exist
        if (attachments != null && !attachments.isEmpty()) {
            List<MessageResponse.MessageAttachmentResponse> attachmentSummaries = attachments.stream()
                    .map(this::mapToAttachmentSummary)
                    .collect(Collectors.toList());
            response.setAttachments(attachmentSummaries);
        }
        
        return response;
    }

    private MessageResponse.UserSummary mapToMessageUserSummary(User user) {
        return MessageResponse.UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    private ConversationResponse.UserSummary mapToUserSummary(User user) {
        return ConversationResponse.UserSummary.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    private String getListingImageUrl(CarListing listing) {
        // Get the primary media and return the file key - frontend will handle URL transformation
        if (listing.getMedia() != null && !listing.getMedia().isEmpty()) {
            ListingMedia primaryMedia = listing.getMedia().stream()
                    .filter(m -> Boolean.TRUE.equals(m.getIsPrimary()))
                    .findFirst()
                    .orElse(listing.getMedia().get(0));
            return primaryMedia.getFileKey();
        }
        return null;
    }

    /**
     * Upload file attachment for a message
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
        if (file.isEmpty()) {
            throw new BadRequestException("File cannot be empty");
        }

        // Check file type and size using Apache Tika for security
        if (!isAllowedFileType(file)) {
            throw new BadRequestException("Unsupported file type: " + file.getContentType());
        }

        long maxFileSize = getMaxFileSize(file.getContentType());
        if (file.getSize() > maxFileSize) {
            String maxSizeMB = String.valueOf(maxFileSize / (1024 * 1024));
            throw new BadRequestException("File size cannot exceed " + maxSizeMB + "MB for this file type");
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
     * Send message with attachments
     */
    public MessageResponse sendMessageWithAttachments(Long conversationId, String content, 
                                                    String messageType, MultipartFile[] files, Long userId) {
        log.info("Sending message with attachments in conversation {} by user {}", conversationId, userId);

        // First send the message
        SendMessageRequest request = new SendMessageRequest();
        request.setContent(content);
        request.setMessageType(messageType);
        
        MessageResponse messageResponse = sendMessage(conversationId, request, userId);

        // If there are files, upload them and link to the message
        if (files != null && files.length > 0) {
            final Long messageId = messageResponse.getId();
            Message message = messageRepository.findById(messageId)
                    .orElseThrow(() -> new ResourceNotFoundException("Message", "id", messageId));

            List<MessageAttachment> attachments = new ArrayList<>();
            
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    MessageAttachment attachment = createMessageAttachment(message, file);
                    attachments.add(attachment);
                }
            }

            // Update message response with attachments
            messageResponse = mapToMessageResponseWithAttachments(message, attachments);
        }

        return messageResponse;
    }

    private MessageAttachment createMessageAttachment(Message message, MultipartFile file) {
        // Validate file
        String contentType = file.getContentType();
        if (contentType == null || !isAllowedFileType(contentType)) {
            throw new BadRequestException("Unsupported file type: " + contentType);
        }

        if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
            throw new BadRequestException("File size cannot exceed 10MB");
        }

        // Generate file key
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        String fileKey = "messages/" + message.getConversation().getId() + "/" + UUID.randomUUID().toString() + fileExtension;

        // Store file
        String fileUrl = storageService.store(file, fileKey);

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

    private MessageResponse mapToMessageResponseWithAttachments(Message message, List<MessageAttachment> attachments) {
        MessageResponse response = mapToMessageResponse(message);
        
        if (attachments != null && !attachments.isEmpty()) {
            List<MessageResponse.MessageAttachmentResponse> attachmentSummaries = attachments.stream()
                    .map(this::mapToAttachmentSummary)
                    .collect(Collectors.toList());
            response.setAttachments(attachmentSummaries);
        }
        
        return response;
    }

    private MessageResponse.MessageAttachmentResponse mapToAttachmentSummary(MessageAttachment attachment) {
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
     * Validate that a user is a participant in the conversation
     */
    private void validateUserParticipation(Conversation conversation, User user) {
        if (!conversation.getBuyer().getId().equals(user.getId()) && 
            !conversation.getSeller().getId().equals(user.getId())) {
            throw new BadRequestException("User is not a participant in this conversation");
        }
    }

    /**
     * Check if the file type is allowed for message attachments using Apache Tika for security
     * Following best practices from Blocket and AutoTrader UK
     */
    private boolean isAllowedFileType(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }
        
        try {
            // Use Apache Tika for deep file inspection (security best practice)
            Tika tika = new Tika();
            String detectedType = tika.detect(file.getInputStream()).toLowerCase().trim();
            
            // Reset input stream for later use
            file.getInputStream().reset();
            
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
     * Get maximum file size based on file type
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
}

package com.caryo.marketplace.service;

import com.caryo.marketplace.model.*;
import com.caryo.marketplace.payload.request.CreateConversationRequest;
import com.caryo.marketplace.payload.request.SendMessageRequest;
import com.caryo.marketplace.payload.response.ConversationResponse;
import com.caryo.marketplace.payload.response.ConversationStatsResponse;
import com.caryo.marketplace.payload.response.MessageResponse;
import com.caryo.marketplace.repository.ConversationRepository;
import com.caryo.marketplace.repository.MessageRepository;
import com.caryo.marketplace.repository.CarListingRepository;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.repository.MessageAttachmentRepository;
import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.exception.BadRequestException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

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
    private final MessageAttachmentService messageAttachmentService;
    private final UserBlockService userBlockService;

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

        // Check if users have blocked each other
        if (userBlockService.isBlockedBidirectional(buyerId, seller.getId())) {
            throw new BadRequestException("Cannot create conversation: users have blocked each other");
        }

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
                .messageType(MessageType.fromValue(request.getMessageType().toLowerCase()))
                .build();

        conversation.addMessage(initialMessage);
        messageRepository.save(initialMessage);

        log.info("Conversation created successfully with ID: {}", conversation.getId());
        return mapToConversationResponse(conversation, buyer);
    }

    /**
     * Aggregate messaging counters for the user's dashboard.
     */
    @Transactional(readOnly = true)
    public ConversationStatsResponse getConversationStats(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        long total = conversationRepository.countByUser(user);
        long active = conversationRepository.countByUserAndStatus(user, ConversationStatus.ACTIVE);
        long archived = conversationRepository.countByUserAndStatus(user, ConversationStatus.ARCHIVED);
        long unread = messageRepository.countAllUnreadMessagesForUser(user);

        return new ConversationStatsResponse(total, active, unread, archived);
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

        // Check if users have blocked each other
        Long receiverId = conversation.getBuyer().getId().equals(senderId)
            ? conversation.getSeller().getId()
            : conversation.getBuyer().getId();

        if (userBlockService.isBlockedBidirectional(senderId, receiverId)) {
            throw new BadRequestException("Cannot send message: users have blocked each other");
        }

        // Create message
        Message message = Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(request.getContent() != null ? request.getContent().trim() : "")
                .messageType(MessageType.fromValue(request.getMessageType().toLowerCase()))
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

    /**
     * Block a user in a conversation
     */
    public void blockUser(Long conversationId, Long userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", conversationId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (!conversation.isParticipant(user)) {
            throw new BadRequestException("Access denied: Not a participant in this conversation");
        }

        // Block the conversation (prevents further messaging)
        conversation.block();
        conversationRepository.save(conversation);

        log.info("User {} blocked in conversation {}", userId, conversationId);
    }

    /**
     * Upload file attachment for a message.
     * Delegates to MessageAttachmentService.
     */
    public Map<String, Object> uploadMessageAttachment(Long conversationId, MultipartFile file, Long userId) {
        return messageAttachmentService.uploadMessageAttachment(conversationId, file, userId);
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
                    MessageAttachment attachment = messageAttachmentService.createMessageAttachment(message, file);
                    attachments.add(attachment);
                }
            }

            // Update message response with attachments
            messageResponse = mapToMessageResponseWithAttachments(message, attachments);
        }

        return messageResponse;
    }

    // Helper methods for mapping entities to DTOs
    private ConversationResponse mapToConversationResponse(Conversation conversation, User currentUser) {

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
                    .map(messageAttachmentService::mapToAttachmentSummary)
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

    private MessageResponse mapToMessageResponseWithAttachments(Message message, List<MessageAttachment> attachments) {
        MessageResponse response = mapToMessageResponse(message);

        if (attachments != null && !attachments.isEmpty()) {
            List<MessageResponse.MessageAttachmentResponse> attachmentSummaries = attachments.stream()
                    .map(messageAttachmentService::mapToAttachmentSummary)
                    .collect(Collectors.toList());
            response.setAttachments(attachmentSummaries);
        }

        return response;
    }
}

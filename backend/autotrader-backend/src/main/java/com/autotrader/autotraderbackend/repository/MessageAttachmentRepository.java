package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.Message;
import com.autotrader.autotraderbackend.model.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for MessageAttachment entities.
 * Provides data access methods for message attachments.
 */
@Repository
public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {
    
    /**
     * Find all attachments for a specific message
     */
    List<MessageAttachment> findByMessageOrderByCreatedAtAsc(Message message);
    
    /**
     * Find all attachments for a specific message by message ID
     */
    List<MessageAttachment> findByMessageIdOrderByCreatedAtAsc(Long messageId);
    
    /**
     * Find all attachments for multiple messages by message IDs (batch loading)
     */
    List<MessageAttachment> findByMessageIdInOrderByCreatedAtAsc(List<Long> messageIds);
    
    /**
     * Find all non-deleted attachments for a message
     */
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.message.id = :messageId AND ma.deletedAt IS NULL ORDER BY ma.createdAt ASC")
    List<MessageAttachment> findActiveAttachmentsByMessageId(@Param("messageId") Long messageId);
    
    /**
     * Find all attachments in a conversation
     */
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.message.conversation.id = :conversationId ORDER BY ma.createdAt DESC")
    List<MessageAttachment> findByConversationIdOrderByCreatedAtDesc(@Param("conversationId") Long conversationId);
    
    /**
     * Find all image attachments in a conversation
     */
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.message.conversation.id = :conversationId AND ma.contentType LIKE 'image/%' AND ma.deletedAt IS NULL ORDER BY ma.createdAt DESC")
    List<MessageAttachment> findImageAttachmentsByConversationId(@Param("conversationId") Long conversationId);
    
    /**
     * Count attachments for a message
     */
    long countByMessageId(Long messageId);
    
    /**
     * Count non-deleted attachments for a message
     */
    @Query("SELECT COUNT(ma) FROM MessageAttachment ma WHERE ma.message.id = :messageId AND ma.deletedAt IS NULL")
    long countActiveAttachmentsByMessageId(@Param("messageId") Long messageId);
    
    /**
     * Find attachments by file key
     */
    List<MessageAttachment> findByFileKey(String fileKey);
    
    /**
     * Find orphaned attachments (not linked to any message) older than specified date
     */
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.message IS NULL AND ma.createdAt < :cutoffDate")
    List<MessageAttachment> findOrphanedAttachmentsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Find failed uploads
     */
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.uploadStatus = 'FAILED'")
    List<MessageAttachment> findFailedUploads();
    
    /**
     * Find pending uploads older than specified date
     */
    @Query("SELECT ma FROM MessageAttachment ma WHERE ma.uploadStatus = 'PENDING' AND ma.createdAt < :cutoffDate")
    List<MessageAttachment> findPendingUploadsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}

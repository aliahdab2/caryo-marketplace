package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.Message;
import com.autotrader.autotraderbackend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository interface for Message entities.
 * Follows the existing repository patterns in the project.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /**
     * Find messages by conversation ID, ordered by creation time
     */
    Page<Message> findByConversationIdOrderByCreatedAtAsc(Long conversationId, Pageable pageable);

    /**
     * Find recent messages by conversation ID (for conversation list)
     */
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId ORDER BY m.createdAt DESC")
    List<Message> findRecentMessagesByConversationId(@Param("conversationId") Long conversationId, Pageable pageable);

    /**
     * Find unread messages by conversation ID
     */
    List<Message> findByConversationIdAndIsReadFalseOrderByCreatedAtAsc(Long conversationId);

    /**
     * Find unread messages for a user in a conversation
     */
    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.sender != :user AND m.isRead = false ORDER BY m.createdAt ASC")
    List<Message> findUnreadMessagesForUser(@Param("conversationId") Long conversationId, @Param("user") User user);

    /**
     * Count unread messages for a user in a conversation
     */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.id = :conversationId AND m.sender != :user AND m.isRead = false")
    long countUnreadMessagesForUser(@Param("conversationId") Long conversationId, @Param("user") User user);

    /**
     * Find messages by sender
     */
    Page<Message> findBySenderOrderByCreatedAtDesc(User sender, Pageable pageable);

    /**
     * Find messages by conversation and sender
     */
    List<Message> findByConversationIdAndSenderIdOrderByCreatedAtAsc(Long conversationId, Long senderId);

    /**
     * Mark messages as read
     */
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = :readAt WHERE m.id = :messageId")
    void markMessageAsRead(@Param("messageId") Long messageId, @Param("readAt") LocalDateTime readAt);

    /**
     * Mark all messages in a conversation as read for a user
     */
    @Modifying
    @Query("UPDATE Message m SET m.isRead = true, m.readAt = :readAt WHERE m.conversation.id = :conversationId AND m.sender != :user AND m.isRead = false")
    void markAllMessagesAsReadInConversation(@Param("conversationId") Long conversationId, @Param("user") User user, @Param("readAt") LocalDateTime readAt);

    /**
     * Find messages created after a specific time
     */
    List<Message> findByConversationIdAndCreatedAtAfterOrderByCreatedAtAsc(Long conversationId, LocalDateTime after);
}

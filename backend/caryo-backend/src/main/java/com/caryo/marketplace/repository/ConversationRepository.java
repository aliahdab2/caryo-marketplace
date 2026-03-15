package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.Conversation;
import com.caryo.marketplace.model.ConversationStatus;
import com.caryo.marketplace.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for Conversation entities.
 * Follows the existing repository patterns in the project.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /**
     * Find conversations where the user is either buyer or seller
     */
    @Query("SELECT c FROM Conversation c WHERE c.buyer = :user OR c.seller = :user ORDER BY c.lastMessageAt DESC")
    Page<Conversation> findByUser(@Param("user") User user, Pageable pageable);

    /**
     * Find conversations where the user is the buyer
     */
    Page<Conversation> findByBuyerOrderByLastMessageAtDesc(User buyer, Pageable pageable);

    /**
     * Find conversations where the user is the seller
     */
    Page<Conversation> findBySellerOrderByLastMessageAtDesc(User seller, Pageable pageable);

    /**
     * Find active conversations for a user
     */
    @Query("SELECT c FROM Conversation c WHERE (c.buyer = :user OR c.seller = :user) AND c.status = :status ORDER BY c.lastMessageAt DESC")
    Page<Conversation> findActiveConversationsByUser(@Param("user") User user, @Param("status") ConversationStatus status, Pageable pageable);

    /**
     * Find conversation by listing and participants
     */
    Optional<Conversation> findByListingIdAndBuyerIdAndSellerId(Long listingId, Long buyerId, Long sellerId);

    /**
     * Check if conversation exists between buyer and seller for a listing
     */
    boolean existsByListingIdAndBuyerIdAndSellerId(Long listingId, Long buyerId, Long sellerId);

    /**
     * Find conversations by listing ID
     */
    List<Conversation> findByListingId(Long listingId);

    /**
     * Count active conversations for a user
     */
    @Query("SELECT COUNT(c) FROM Conversation c WHERE (c.buyer = :user OR c.seller = :user) AND c.status = :status")
    long countActiveConversationsByUser(@Param("user") User user, @Param("status") ConversationStatus status);
}

package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.UserBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for UserBlock entities.
 */
@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    /**
     * Check if user A has blocked user B
     */
    boolean existsByBlockerAndBlocked(User blocker, User blocked);

    /**
     * Check if either user has blocked the other (bidirectional check)
     */
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN TRUE ELSE FALSE END FROM UserBlock b " +
           "WHERE (b.blocker = :user1 AND b.blocked = :user2) OR (b.blocker = :user2 AND b.blocked = :user1)")
    boolean existsBlockBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

    /**
     * Get block between two users
     */
    Optional<UserBlock> findByBlockerAndBlocked(User blocker, User blocked);

    /**
     * Get all users blocked by a specific user
     */
    List<UserBlock> findByBlockerOrderByCreatedAtDesc(User blocker);

    /**
     * Get all users who blocked a specific user
     */
    List<UserBlock> findByBlockedOrderByCreatedAtDesc(User blocked);

    /**
     * Count how many users a specific user has blocked
     */
    long countByBlocker(User blocker);
}


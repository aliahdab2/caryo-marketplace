package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.UserBlock;
import com.autotrader.autotraderbackend.repository.UserBlockRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service for managing user-level blocking.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserBlockService {

    private final UserBlockRepository userBlockRepository;
    private final UserRepository userRepository;

    /**
     * Block a user
     */
    public UserBlock blockUser(Long blockerId, Long blockedId) {
        log.info("User {} blocking user {}", blockerId, blockedId);

        // Validate users exist
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockerId));

        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockedId));

        // Prevent self-blocking
        if (blocker.getId().equals(blocked.getId())) {
            throw new BadRequestException("Cannot block yourself");
        }

        // Check if already blocked
        if (userBlockRepository.existsByBlockerAndBlocked(blocker, blocked)) {
            throw new BadRequestException("User is already blocked");
        }

        // Create block
        UserBlock userBlock = UserBlock.builder()
                .blocker(blocker)
                .blocked(blocked)
                .build();

        userBlock = userBlockRepository.save(userBlock);

        log.info("User {} successfully blocked user {}", blockerId, blockedId);
        return userBlock;
    }

    /**
     * Unblock a user
     */
    public void unblockUser(Long blockerId, Long blockedId) {
        log.info("User {} unblocking user {}", blockerId, blockedId);

        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockerId));

        User blocked = userRepository.findById(blockedId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockedId));

        UserBlock userBlock = userBlockRepository.findByBlockerAndBlocked(blocker, blocked)
                .orElseThrow(() -> new BadRequestException("User is not blocked"));

        userBlockRepository.delete(userBlock);

        log.info("User {} successfully unblocked user {}", blockerId, blockedId);
    }

    /**
     * Check if user A has blocked user B
     */
    @Transactional(readOnly = true)
    public boolean isBlocked(Long blockerId, Long blockedId) {
        User blocker = userRepository.findById(blockerId).orElse(null);
        User blocked = userRepository.findById(blockedId).orElse(null);

        if (blocker == null || blocked == null) {
            return false;
        }

        return userBlockRepository.existsByBlockerAndBlocked(blocker, blocked);
    }

    /**
     * Check if either user has blocked the other (bidirectional)
     */
    @Transactional(readOnly = true)
    public boolean isBlockedBidirectional(Long user1Id, Long user2Id) {
        User user1 = userRepository.findById(user1Id).orElse(null);
        User user2 = userRepository.findById(user2Id).orElse(null);

        if (user1 == null || user2 == null) {
            return false;
        }

        return userBlockRepository.existsBlockBetweenUsers(user1, user2);
    }

    /**
     * Get all users blocked by a specific user
     */
    @Transactional(readOnly = true)
    public List<UserBlock> getBlockedUsers(Long blockerId) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockerId));

        return userBlockRepository.findByBlockerOrderByCreatedAtDesc(blocker);
    }

    /**
     * Get count of blocked users
     */
    @Transactional(readOnly = true)
    public long getBlockedUserCount(Long blockerId) {
        User blocker = userRepository.findById(blockerId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", blockerId));

        return userBlockRepository.countByBlocker(blocker);
    }
}


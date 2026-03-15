package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.ListingMedia;
import com.caryo.marketplace.model.ListingMedia.ModerationStatus;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.repository.ListingMediaRepository;
import com.caryo.marketplace.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Service for media moderation operations.
 * Encapsulates all moderation logic previously in AdminMediaModerationController,
 * and uses batch queries to avoid N+1 problems in bulk operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MediaModerationService {

    private final ListingMediaRepository mediaRepository;
    private final UserRepository userRepository;

    public Page<ListingMedia> getPendingMedia(Pageable pageable) {
        return mediaRepository.findPendingMedia(pageable);
    }

    public Map<String, Long> getModerationStats() {
        return Map.of(
                "pending", mediaRepository.countByModerationStatus(ModerationStatus.PENDING),
                "approved", mediaRepository.countByModerationStatus(ModerationStatus.APPROVED),
                "rejected", mediaRepository.countByModerationStatus(ModerationStatus.REJECTED)
        );
    }

    @Transactional
    public ListingMedia approveMedia(Long mediaId, Long moderatorId) {
        ListingMedia media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media", "id", mediaId));

        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", moderatorId));

        media.approve(moderator);
        return mediaRepository.save(media);
    }

    @Transactional
    public ListingMedia rejectMedia(Long mediaId, Long moderatorId, String reason) {
        ListingMedia media = mediaRepository.findById(mediaId)
                .orElseThrow(() -> new ResourceNotFoundException("Media", "id", mediaId));

        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", moderatorId));

        media.reject(moderator, reason);
        return mediaRepository.save(media);
    }

    /**
     * Bulk approve media items using a single batch query instead of N individual lookups.
     *
     * @return the number of items successfully approved
     */
    @Transactional
    public int bulkApprove(List<Long> ids, Long moderatorId) {
        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", moderatorId));

        List<ListingMedia> pendingItems = mediaRepository.findPendingByIdIn(ids);

        for (ListingMedia media : pendingItems) {
            media.approve(moderator);
        }

        mediaRepository.saveAll(pendingItems);

        log.info("Bulk approved {} of {} requested media items", pendingItems.size(), ids.size());
        return pendingItems.size();
    }

    /**
     * Bulk reject media items using a single batch query instead of N individual lookups.
     *
     * @return the number of items successfully rejected
     */
    @Transactional
    public int bulkReject(List<Long> ids, Long moderatorId, String reason) {
        User moderator = userRepository.findById(moderatorId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", moderatorId));

        List<ListingMedia> pendingItems = mediaRepository.findPendingByIdIn(ids);

        for (ListingMedia media : pendingItems) {
            media.reject(moderator, reason);
        }

        mediaRepository.saveAll(pendingItems);

        log.info("Bulk rejected {} of {} requested media items", pendingItems.size(), ids.size());
        return pendingItems.size();
    }
}

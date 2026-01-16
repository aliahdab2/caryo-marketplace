package com.autotrader.autotraderbackend.controller.admin;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.ListingMedia.ModerationStatus;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.ListingMediaRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Admin controller for image/media moderation.
 * Allows admins to approve or reject uploaded images before they become visible.
 */
@RestController
@RequestMapping("/api/admin/media-moderation")
@Tag(name = "Admin Media Moderation", description = "Admin endpoints for image approval workflow")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
@Slf4j
public class AdminMediaModerationController {

    private final ListingMediaRepository mediaRepository;
    private final UserRepository userRepository;

    /**
     * Get pending media for moderation queue
     */
    @GetMapping("/pending")
    @Operation(
        summary = "Get pending media queue",
        description = "Returns all media items awaiting moderation, sorted by upload date",
        responses = {
            @ApiResponse(responseCode = "200", description = "List of pending media"),
            @ApiResponse(responseCode = "403", description = "Access denied - admin role required")
        }
    )
    public ResponseEntity<Page<MediaModerationResponse>> getPendingMedia(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<ListingMedia> pendingMedia = mediaRepository.findPendingMedia(pageable);
        
        Page<MediaModerationResponse> response = pendingMedia.map(this::toResponse);
        return ResponseEntity.ok(response);
    }

    /**
     * Get moderation statistics for dashboard
     */
    @GetMapping("/stats")
    @Operation(
        summary = "Get moderation statistics",
        description = "Returns counts of pending, approved, and rejected media"
    )
    public ResponseEntity<Map<String, Long>> getModerationStats() {
        Map<String, Long> stats = new HashMap<>();
        stats.put("pending", mediaRepository.countByModerationStatus(ModerationStatus.PENDING));
        stats.put("approved", mediaRepository.countByModerationStatus(ModerationStatus.APPROVED));
        stats.put("rejected", mediaRepository.countByModerationStatus(ModerationStatus.REJECTED));
        return ResponseEntity.ok(stats);
    }

    /**
     * Approve a media item
     */
    @PostMapping("/{id}/approve")
    @Operation(
        summary = "Approve media",
        description = "Approves a pending media item, making it visible to public",
        responses = {
            @ApiResponse(responseCode = "200", description = "Media approved"),
            @ApiResponse(responseCode = "404", description = "Media not found")
        }
    )
    public ResponseEntity<MediaModerationResponse> approveMedia(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        ListingMedia media = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media", "id", id));
        
        User moderator = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
        
        media.approve(moderator);
        mediaRepository.save(media);
        
        log.info("Media {} approved by admin {}", id, userDetails.getUsername());
        
        return ResponseEntity.ok(toResponse(media));
    }

    /**
     * Reject a media item
     */
    @PostMapping("/{id}/reject")
    @Operation(
        summary = "Reject media",
        description = "Rejects a media item with optional reason. Rejected images are hidden from public.",
        responses = {
            @ApiResponse(responseCode = "200", description = "Media rejected"),
            @ApiResponse(responseCode = "404", description = "Media not found")
        }
    )
    public ResponseEntity<MediaModerationResponse> rejectMedia(
            @PathVariable Long id,
            @RequestBody(required = false) @Valid RejectMediaRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        ListingMedia media = mediaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Media", "id", id));
        
        User moderator = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
        
        String notes = request != null ? request.getReason() : null;
        media.reject(moderator, notes);
        mediaRepository.save(media);
        
        log.info("Media {} rejected by admin {} - reason: {}", id, userDetails.getUsername(), notes);
        
        return ResponseEntity.ok(toResponse(media));
    }

    /**
     * Bulk approve multiple media items
     */
    @PostMapping("/bulk-approve")
    @Operation(
        summary = "Bulk approve media",
        description = "Approves multiple media items at once"
    )
    public ResponseEntity<Map<String, Object>> bulkApprove(
            @RequestBody @Valid BulkModerationRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        User moderator = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
        
        int approved = 0;
        for (Long id : request.getIds()) {
            try {
                ListingMedia media = mediaRepository.findById(id).orElse(null);
                if (media != null && media.isPending()) {
                    media.approve(moderator);
                    mediaRepository.save(media);
                    approved++;
                }
            } catch (Exception e) {
                log.warn("Failed to approve media {}: {}", id, e.getMessage());
            }
        }
        
        log.info("Bulk approved {} media items by admin {}", approved, userDetails.getUsername());
        
        Map<String, Object> response = new HashMap<>();
        response.put("approved", approved);
        response.put("total", request.getIds().size());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Bulk reject multiple media items
     */
    @PostMapping("/bulk-reject")
    @Operation(
        summary = "Bulk reject media",
        description = "Rejects multiple media items at once with optional reason"
    )
    public ResponseEntity<Map<String, Object>> bulkReject(
            @RequestBody @Valid BulkRejectRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails) {
        
        User moderator = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userDetails.getId()));
        
        int rejected = 0;
        for (Long id : request.getIds()) {
            try {
                ListingMedia media = mediaRepository.findById(id).orElse(null);
                if (media != null && media.isPending()) {
                    media.reject(moderator, request.getReason());
                    mediaRepository.save(media);
                    rejected++;
                }
            } catch (Exception e) {
                log.warn("Failed to reject media {}: {}", id, e.getMessage());
            }
        }
        
        log.info("Bulk rejected {} media items by admin {}", rejected, userDetails.getUsername());
        
        Map<String, Object> response = new HashMap<>();
        response.put("rejected", rejected);
        response.put("total", request.getIds().size());
        
        return ResponseEntity.ok(response);
    }

    // ============ DTOs ============

    private MediaModerationResponse toResponse(ListingMedia media) {
        MediaModerationResponse response = new MediaModerationResponse();
        response.setId(media.getId());
        response.setFileKey(media.getFileKey());
        response.setFileName(media.getFileName());
        response.setContentType(media.getContentType());
        response.setMediaType(media.getMediaType());
        response.setListingId(media.getListingId());
        response.setModerationStatus(media.getModerationStatus().name());
        response.setCreatedAt(media.getCreatedAt() != null ? media.getCreatedAt().toString() : null);
        response.setModeratedAt(media.getModeratedAt() != null ? media.getModeratedAt().toString() : null);
        response.setModerationNotes(media.getModerationNotes());
        if (media.getModeratedBy() != null) {
            response.setModeratedByUsername(media.getModeratedBy().getUsername());
        }
        return response;
    }

    @Data
    public static class MediaModerationResponse {
        private Long id;
        private String fileKey;
        private String fileName;
        private String contentType;
        private String mediaType;
        private Long listingId;
        private String moderationStatus;
        private String createdAt;
        private String moderatedAt;
        private String moderatedByUsername;
        private String moderationNotes;
    }

    @Data
    public static class RejectMediaRequest {
        private String reason;
    }

    @Data
    public static class BulkModerationRequest {
        @NotNull
        private java.util.List<Long> ids;
    }

    @Data
    public static class BulkRejectRequest {
        @NotNull
        private java.util.List<Long> ids;
        private String reason;
    }
}

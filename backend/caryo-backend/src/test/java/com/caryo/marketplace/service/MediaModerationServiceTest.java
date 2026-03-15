package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.ListingMedia;
import com.caryo.marketplace.model.ListingMedia.ModerationStatus;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.repository.ListingMediaRepository;
import com.caryo.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MediaModerationServiceTest {

    @Mock
    private ListingMediaRepository mediaRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private MediaModerationService mediaModerationService;

    private User moderator;

    @BeforeEach
    void setUp() {
        moderator = new User();
        moderator.setId(1L);
        moderator.setUsername("admin");
    }

    @Test
    void getPendingMedia_ShouldReturnPagedResults() {
        Pageable pageable = PageRequest.of(0, 20);
        ListingMedia media = createPendingMedia(1L);
        Page<ListingMedia> page = new PageImpl<>(List.of(media));
        when(mediaRepository.findPendingMedia(pageable)).thenReturn(page);

        Page<ListingMedia> result = mediaModerationService.getPendingMedia(pageable);

        assertEquals(1, result.getTotalElements());
        verify(mediaRepository).findPendingMedia(pageable);
    }

    @Test
    void getModerationStats_ShouldReturnAllCounts() {
        when(mediaRepository.countByModerationStatus(ModerationStatus.PENDING)).thenReturn(5L);
        when(mediaRepository.countByModerationStatus(ModerationStatus.APPROVED)).thenReturn(10L);
        when(mediaRepository.countByModerationStatus(ModerationStatus.REJECTED)).thenReturn(2L);

        Map<String, Long> stats = mediaModerationService.getModerationStats();

        assertEquals(5L, stats.get("pending"));
        assertEquals(10L, stats.get("approved"));
        assertEquals(2L, stats.get("rejected"));
    }

    @Test
    void approveMedia_ShouldApproveAndSave() {
        ListingMedia media = createPendingMedia(1L);
        when(mediaRepository.findById(1L)).thenReturn(Optional.of(media));
        when(userRepository.findById(1L)).thenReturn(Optional.of(moderator));
        when(mediaRepository.save(any(ListingMedia.class))).thenReturn(media);

        ListingMedia result = mediaModerationService.approveMedia(1L, 1L);

        assertNotNull(result);
        verify(mediaRepository).save(media);
    }

    @Test
    void approveMedia_WhenMediaNotFound_ShouldThrow() {
        when(mediaRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> mediaModerationService.approveMedia(99L, 1L));
    }

    @Test
    void rejectMedia_ShouldRejectWithReasonAndSave() {
        ListingMedia media = createPendingMedia(1L);
        when(mediaRepository.findById(1L)).thenReturn(Optional.of(media));
        when(userRepository.findById(1L)).thenReturn(Optional.of(moderator));
        when(mediaRepository.save(any(ListingMedia.class))).thenReturn(media);

        ListingMedia result = mediaModerationService.rejectMedia(1L, 1L, "Inappropriate content");

        assertNotNull(result);
        verify(mediaRepository).save(media);
    }

    @Test
    void bulkApprove_ShouldUseBatchQuery() {
        List<Long> ids = List.of(1L, 2L, 3L);
        ListingMedia m1 = createPendingMedia(1L);
        ListingMedia m2 = createPendingMedia(2L);
        // id 3 is not pending, so not returned by findPendingByIdIn

        when(userRepository.findById(1L)).thenReturn(Optional.of(moderator));
        when(mediaRepository.findPendingByIdIn(ids)).thenReturn(List.of(m1, m2));
        when(mediaRepository.saveAll(any())).thenReturn(List.of(m1, m2));

        int approved = mediaModerationService.bulkApprove(ids, 1L);

        assertEquals(2, approved);
        verify(mediaRepository).findPendingByIdIn(ids);
        verify(mediaRepository).saveAll(any());
        // Verify no individual findById calls were made
        verify(mediaRepository, never()).findById(any());
    }

    @Test
    void bulkReject_ShouldUseBatchQuery() {
        List<Long> ids = List.of(1L, 2L);
        ListingMedia m1 = createPendingMedia(1L);
        ListingMedia m2 = createPendingMedia(2L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(moderator));
        when(mediaRepository.findPendingByIdIn(ids)).thenReturn(List.of(m1, m2));
        when(mediaRepository.saveAll(any())).thenReturn(List.of(m1, m2));

        int rejected = mediaModerationService.bulkReject(ids, 1L, "Policy violation");

        assertEquals(2, rejected);
        verify(mediaRepository).findPendingByIdIn(ids);
        verify(mediaRepository).saveAll(any());
    }

    @Test
    void bulkApprove_WhenModeratorNotFound_ShouldThrow() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> mediaModerationService.bulkApprove(List.of(1L), 99L));
    }

    private ListingMedia createPendingMedia(Long id) {
        ListingMedia media = new ListingMedia();
        media.setId(id);
        media.setFileKey("file-key-" + id);
        media.setFileName("image-" + id + ".jpg");
        media.setContentType("image/jpeg");
        media.setModerationStatus(ModerationStatus.PENDING);
        return media;
    }
}

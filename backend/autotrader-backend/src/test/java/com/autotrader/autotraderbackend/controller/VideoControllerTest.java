package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.ArrayList;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VideoControllerTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private VideoController videoController;

    @Mock
    private UserDetails userDetails;

    private User testUser;
    private CarListing testListing;

    private static final Long TEST_LISTING_ID = 1L;
    private static final Long TEST_USER_ID = 10L;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(videoController, "videoUrlEnabled", true);

        testUser = new User();
        testUser.setId(TEST_USER_ID);
        testUser.setUsername("seller");

        testListing = new CarListing();
        testListing.setId(TEST_LISTING_ID);
        testListing.setSeller(testUser);
        testListing.setMedia(new ArrayList<>());
    }

    @Nested
    @DisplayName("POST /api/listings/{listingId}/videos/external")
    class AddExternalVideo {

        @Test
        @DisplayName("Should add YouTube video successfully")
        void addYouTubeVideo_Success() {
            VideoController.ExternalVideoRequest request = new VideoController.ExternalVideoRequest();
            request.setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
            request.setTitle("Car walkthrough");

            when(userDetails.getUsername()).thenReturn("seller");
            when(userRepository.findByUsername("seller")).thenReturn(Optional.of(testUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));
            when(carListingRepository.save(testListing)).thenReturn(testListing);

            ResponseEntity<Map<String, Object>> response =
                    videoController.addExternalVideo(TEST_LISTING_ID, request, userDetails);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("youtube", response.getBody().get("videoSource"));
            assertEquals("video", response.getBody().get("mediaType"));
            verify(carListingRepository).save(testListing);
        }

        @Test
        @DisplayName("Should add Vimeo video successfully")
        void addVimeoVideo_Success() {
            VideoController.ExternalVideoRequest request = new VideoController.ExternalVideoRequest();
            request.setUrl("https://vimeo.com/123456789");

            when(userDetails.getUsername()).thenReturn("seller");
            when(userRepository.findByUsername("seller")).thenReturn(Optional.of(testUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));
            when(carListingRepository.save(testListing)).thenReturn(testListing);

            ResponseEntity<Map<String, Object>> response =
                    videoController.addExternalVideo(TEST_LISTING_ID, request, userDetails);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("vimeo", response.getBody().get("videoSource"));
        }

        @Test
        @DisplayName("Should throw when video URLs are disabled")
        void addExternalVideo_Disabled() {
            ReflectionTestUtils.setField(videoController, "videoUrlEnabled", false);

            VideoController.ExternalVideoRequest request = new VideoController.ExternalVideoRequest();
            request.setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

            assertThrows(RuntimeException.class, () ->
                    videoController.addExternalVideo(TEST_LISTING_ID, request, userDetails));
        }

        @Test
        @DisplayName("Should throw when user is not the listing owner")
        void addExternalVideo_NotOwner() {
            User otherUser = new User();
            otherUser.setId(999L);
            otherUser.setUsername("other");

            VideoController.ExternalVideoRequest request = new VideoController.ExternalVideoRequest();
            request.setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

            when(userDetails.getUsername()).thenReturn("other");
            when(userRepository.findByUsername("other")).thenReturn(Optional.of(otherUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

            assertThrows(RuntimeException.class, () ->
                    videoController.addExternalVideo(TEST_LISTING_ID, request, userDetails));
        }

        @Test
        @DisplayName("Should throw when listing not found")
        void addExternalVideo_ListingNotFound() {
            VideoController.ExternalVideoRequest request = new VideoController.ExternalVideoRequest();
            request.setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

            when(userDetails.getUsername()).thenReturn("seller");
            when(userRepository.findByUsername("seller")).thenReturn(Optional.of(testUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.empty());

            assertThrows(RuntimeException.class, () ->
                    videoController.addExternalVideo(TEST_LISTING_ID, request, userDetails));
        }

        @Test
        @DisplayName("Should throw when video duration exceeds 3 minutes")
        void addExternalVideo_DurationExceeded() {
            VideoController.ExternalVideoRequest request = new VideoController.ExternalVideoRequest();
            request.setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
            request.setDurationSeconds(200);

            when(userDetails.getUsername()).thenReturn("seller");
            when(userRepository.findByUsername("seller")).thenReturn(Optional.of(testUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

            assertThrows(RuntimeException.class, () ->
                    videoController.addExternalVideo(TEST_LISTING_ID, request, userDetails));
        }

        @Test
        @DisplayName("Should throw when external video limit reached")
        void addExternalVideo_LimitReached() {
            ListingMedia existingVideo = new ListingMedia();
            existingVideo.setMediaType("video");
            existingVideo.setVideoSource("youtube");
            existingVideo.setExternalUrl("https://www.youtube.com/watch?v=existing123");
            testListing.getMedia().add(existingVideo);

            VideoController.ExternalVideoRequest request = new VideoController.ExternalVideoRequest();
            request.setUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

            when(userDetails.getUsername()).thenReturn("seller");
            when(userRepository.findByUsername("seller")).thenReturn(Optional.of(testUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

            assertThrows(RuntimeException.class, () ->
                    videoController.addExternalVideo(TEST_LISTING_ID, request, userDetails));
        }

        @Test
        @DisplayName("Should throw for invalid video URL")
        void addExternalVideo_InvalidUrl() {
            VideoController.ExternalVideoRequest request = new VideoController.ExternalVideoRequest();
            request.setUrl("not-a-valid-url");

            when(userDetails.getUsername()).thenReturn("seller");
            when(userRepository.findByUsername("seller")).thenReturn(Optional.of(testUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

            assertThrows(RuntimeException.class, () ->
                    videoController.addExternalVideo(TEST_LISTING_ID, request, userDetails));
        }
    }

    @Nested
    @DisplayName("DELETE /api/listings/{listingId}/videos/external/{mediaId}")
    class RemoveExternalVideo {

        @Test
        @DisplayName("Should remove external video successfully")
        void removeVideo_Success() {
            ListingMedia videoMedia = new ListingMedia();
            videoMedia.setId(5L);
            videoMedia.setMediaType("video");
            videoMedia.setVideoSource("youtube");
            videoMedia.setExternalUrl("https://www.youtube.com/watch?v=abc12345678");
            testListing.getMedia().add(videoMedia);

            when(userDetails.getUsername()).thenReturn("seller");
            when(userRepository.findByUsername("seller")).thenReturn(Optional.of(testUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

            ResponseEntity<Map<String, String>> response =
                    videoController.removeExternalVideo(TEST_LISTING_ID, 5L, userDetails);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertEquals("External video removed successfully", response.getBody().get("message"));
            verify(carListingRepository).save(testListing);
        }

        @Test
        @DisplayName("Should throw when video not found")
        void removeVideo_NotFound() {
            when(userDetails.getUsername()).thenReturn("seller");
            when(userRepository.findByUsername("seller")).thenReturn(Optional.of(testUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

            assertThrows(RuntimeException.class, () ->
                    videoController.removeExternalVideo(TEST_LISTING_ID, 999L, userDetails));
        }

        @Test
        @DisplayName("Should throw when not the listing owner")
        void removeVideo_NotOwner() {
            User otherUser = new User();
            otherUser.setId(999L);
            otherUser.setUsername("other");

            when(userDetails.getUsername()).thenReturn("other");
            when(userRepository.findByUsername("other")).thenReturn(Optional.of(otherUser));
            when(carListingRepository.findById(TEST_LISTING_ID)).thenReturn(Optional.of(testListing));

            assertThrows(RuntimeException.class, () ->
                    videoController.removeExternalVideo(TEST_LISTING_ID, 5L, userDetails));
        }
    }
}

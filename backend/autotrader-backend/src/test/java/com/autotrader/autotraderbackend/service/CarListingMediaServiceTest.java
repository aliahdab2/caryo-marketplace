package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.model.AccountStatus;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.storage.StorageKeyGenerator;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingMediaServiceTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private StorageKeyGenerator storageKeyGenerator;

    @InjectMocks
    private CarListingMediaService carListingMediaService;

    private User testUser;
    private CarListing testListing;

    @BeforeEach
    void setUp() {
        // Setup test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setEmailVerified(true);
        testUser.setAccountStatus(AccountStatus.VERIFIED);

        // Setup test listing
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Test Car");
        testListing.setSeller(testUser);
        testListing.setMedia(new ArrayList<>());

        // Mock the storage key generator
        lenient().when(storageKeyGenerator.generateListingMediaKey(anyLong(), anyString()))
            .thenAnswer(invocation -> {
                Long listingId = invocation.getArgument(0);
                String filename = invocation.getArgument(1);
                if (filename == null || filename.trim().isEmpty()) {
                    return "listings/" + listingId + "/123456_";
                }
                return "listings/" + listingId + "/" + filename;
            });
    }

    // --- Tests for uploadListingImage ---

    @Test
    void uploadListingImage_Success() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile(
                "file", "hello.jpg", "image/jpeg", "Hello, World!".getBytes()
        );

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));
        when(storageService.store(eq(file), keyCaptor.capture())).thenAnswer(invocation -> keyCaptor.getValue());
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(invocation -> {
            CarListing listingToSave = invocation.getArgument(0);
            assertNotNull(listingToSave.getMedia());
            assertFalse(listingToSave.getMedia().isEmpty());
            assertEquals(keyCaptor.getValue(), listingToSave.getMedia().get(0).getFileKey());
            return listingToSave;
        });

        // Act
        String returnedKey = carListingMediaService.uploadListingImage(listingId, file, username);

        // Assert
        assertNotNull(returnedKey);
        assertEquals(returnedKey, keyCaptor.getValue());

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(storageService).store(eq(file), keyCaptor.capture());
        verify(carListingRepository).save(argThat(l -> {
            if (l.getId().equals(listingId) && !l.getMedia().isEmpty()) {
                ListingMedia media = l.getMedia().get(0);
                return returnedKey.equals(media.getFileKey());
            }
            return false;
        }));
    }

    @Test
    void uploadListingImage_ListingNotFound_ThrowsResourceNotFoundException() throws IOException {
        // Arrange
        Long nonExistentId = 999L;
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingMediaService.uploadListingImage(nonExistentId, file, username);
        });
        assertEquals("CarListing not found with id : '999'", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(nonExistentId);
        verify(storageService, never()).store(any(MultipartFile.class), anyString());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_UnauthorizedUser_ThrowsSecurityException() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String wrongUsername = "wronguser";
        User wrongUser = new User();
        wrongUser.setId(99L);
        wrongUser.setUsername(wrongUsername);

        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        when(userRepository.findByUsername(wrongUsername)).thenReturn(Optional.of(wrongUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));

        // Act & Assert
        SecurityException exception = assertThrows(SecurityException.class, () -> {
            carListingMediaService.uploadListingImage(listingId, file, wrongUsername);
        });
        assertEquals("User does not have permission to modify this listing.", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(wrongUsername);
        verify(carListingRepository).findById(listingId);
        verify(storageService, never()).store(any(MultipartFile.class), anyString());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_EmptyFile_ThrowsStorageException() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]); // Empty file

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));

        // Act & Assert
        StorageException exception = assertThrows(StorageException.class, () -> {
            carListingMediaService.uploadListingImage(listingId, emptyFile, username);
        });

        assertEquals("File provided for upload is null or empty.", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository, never()).findById(anyLong());
        verify(storageService, never()).store(any(MultipartFile.class), anyString());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_StorageFailure_ThrowsStorageException() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));
        doThrow(new StorageException("Disk full")).when(storageService).store(eq(file), keyCaptor.capture());

        // Act & Assert
        StorageException exception = assertThrows(StorageException.class, () -> {
            carListingMediaService.uploadListingImage(listingId, file, username);
        });

        assertEquals("Disk full", exception.getMessage()); // Corrected expected message

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(storageService).store(eq(file), anyString());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_WithNullOriginalFilename_ShouldGenerateSafeKey() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        // File with null original filename
        MockMultipartFile file = new MockMultipartFile("file", null, "image/png", "content".getBytes());
        String expectedKey = "listings/" + listingId + "/123456_";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));
        when(storageService.store(eq(file), anyString())).thenReturn(expectedKey);
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        String returnedKey = carListingMediaService.uploadListingImage(listingId, file, username);

        // Assert
        assertNotNull(returnedKey);
        assertEquals(expectedKey, returnedKey);

        // Verify store was called with the expected key
        verify(storageService).store(eq(file), eq(expectedKey));

        // Assert the format of the returned key
        assertTrue(returnedKey.startsWith("listings/" + listingId + "/"));
        assertTrue(returnedKey.matches("listings/" + listingId + "/\\d+_"),
                   "Generated key '" + returnedKey + "' did not match expected pattern.");

        // Verify save was called with the correct key
        verify(carListingRepository).save(argThat(l -> {
            if (!l.getMedia().isEmpty()) {
                ListingMedia media = l.getMedia().get(0);
                return expectedKey.equals(media.getFileKey());
            }
            return false;
        }));
    }

    // --- Tests for uploadListingVideo ---

    @Test
    void uploadListingVideo_Success() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile videoFile = new MockMultipartFile(
                "video", "test.mp4", "video/mp4", "video content".getBytes()
        );

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));
        when(storageService.store(eq(videoFile), keyCaptor.capture())).thenAnswer(invocation -> keyCaptor.getValue());
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(invocation -> {
            CarListing listingToSave = invocation.getArgument(0);
            assertNotNull(listingToSave.getMedia());
            assertFalse(listingToSave.getMedia().isEmpty());
            assertEquals("video", listingToSave.getMedia().get(0).getMediaType());
            assertEquals("upload", listingToSave.getMedia().get(0).getVideoSource());
            return listingToSave;
        });

        // Act
        String returnedKey = carListingMediaService.uploadListingVideo(listingId, videoFile, username);

        // Assert
        assertNotNull(returnedKey);
        assertEquals(returnedKey, keyCaptor.getValue());

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(storageService).store(eq(videoFile), anyString());
        verify(carListingRepository).save(any(CarListing.class));
    }

    @Test
    void uploadListingVideo_ExceedsLimit_ThrowsIllegalArgumentException() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile videoFile = new MockMultipartFile(
                "video", "test.mp4", "video/mp4", "video content".getBytes()
        );

        // Add existing video to exceed limit
        ListingMedia existingVideo = new ListingMedia();
        existingVideo.setMediaType("video");
        existingVideo.setVideoSource("upload");
        testListing.getMedia().add(existingVideo);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            carListingMediaService.uploadListingVideo(listingId, videoFile, username);
        });

        assertEquals("Maximum 1 uploaded video per listing allowed. Following AutoTrader best practices.", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(storageService, never()).store(any(MultipartFile.class), anyString());
        verify(carListingRepository, never()).save(any());
    }

    // --- Tests for deleteListingMedia ---

    @Test
    void deleteListingMedia_WithMedia_Success() {
        // Arrange
        Long listingId = testListing.getId();

        // Add some media to the listing
        ListingMedia media1 = new ListingMedia();
        media1.setFileKey("key1");
        ListingMedia media2 = new ListingMedia();
        media2.setFileKey("key2");
        testListing.getMedia().addAll(Arrays.asList(media1, media2));

        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));

        // Act
        carListingMediaService.deleteListingMedia(listingId);

        // Verify interactions
        verify(storageService).delete("key1");
        verify(storageService).delete("key2");
        verify(carListingRepository).findById(listingId);
    }

    @Test
    void deleteListingMedia_NoMedia_Success() {
        // Arrange
        Long listingId = testListing.getId();
        testListing.setMedia(new ArrayList<>()); // Empty media list

        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));

        // Act
        carListingMediaService.deleteListingMedia(listingId);

        // Verify interactions
        verify(storageService, never()).delete(anyString());
        verify(carListingRepository).findById(listingId);
    }

    @Test
    void deleteListingMedia_StorageDeleteFails_Continues() {
        // Arrange
        Long listingId = testListing.getId();

        // Add some media to the listing
        ListingMedia media1 = new ListingMedia();
        media1.setFileKey("key1");
        ListingMedia media2 = new ListingMedia();
        media2.setFileKey("key2");
        testListing.getMedia().addAll(Arrays.asList(media1, media2));

        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));
        doThrow(new StorageException("Delete failed")).when(storageService).delete("key1");

        // Act
        carListingMediaService.deleteListingMedia(listingId);

        // Verify interactions - should still try to delete both files
        verify(storageService).delete("key1");
        verify(storageService).delete("key2");
        verify(carListingRepository).findById(listingId);
    }
}

package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.InvalidFileException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import com.autotrader.autotraderbackend.util.FileValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImageServiceTest {

    @Mock
    private FileValidator fileValidator;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ImageService imageService;

    private MockMultipartFile mockFile;

    @BeforeEach
    void setUp() {
        mockFile = new MockMultipartFile(
            "test.jpg",
            "test.jpg",
            "image/jpeg",
            "test content".getBytes()
        );
    }

    @Test
    void uploadImage_withValidFile_shouldReturnKey() {
        // Given
        when(storageService.store(any(MultipartFile.class), anyString())).thenReturn(null);

        // When
        String key = imageService.uploadImage(mockFile, "test-prefix");

        // Then
        assertNotNull(key);
        assertTrue(key.startsWith("test-prefix/"));
        assertTrue(key.endsWith(".jpg"));
        verify(fileValidator).validateImageFile(mockFile);
        verify(storageService).store(eq(mockFile), anyString());
    }

    @Test
    void uploadImage_withInvalidFile_shouldThrowException() {
        // Given
        doThrow(new InvalidFileException("Invalid file"))
            .when(fileValidator).validateImageFile(any(MultipartFile.class));

        // When/Then
        assertThrows(InvalidFileException.class,
            () -> imageService.uploadImage(mockFile, "test-prefix"));
        verify(storageService, never()).store(any(), any());
    }

    @Test
    void deleteImage_withValidKey_shouldDeleteSuccessfully() {
        // Given
        String imageKey = "test-prefix/image.jpg";

        // When
        imageService.deleteImage(imageKey);

        // Then
        verify(storageService).delete(imageKey);
    }

    @Test
    void deleteImage_withNullOrEmptyKey_shouldNotCallStorage() {
        // When
        imageService.deleteImage(null);
        imageService.deleteImage("");
        imageService.deleteImage("   ");

        // Then
        verify(storageService, never()).delete(any());
    }

    @Test
    void deleteImage_withStorageError_shouldThrowException() {
        // Given
        String imageKey = "test-prefix/image.jpg";
        doThrow(new StorageException("Storage error"))
            .when(storageService).delete(anyString());

        // When/Then
        assertThrows(StorageException.class,
            () -> imageService.deleteImage(imageKey));
    }
}

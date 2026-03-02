package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.service.I18nService;
import jakarta.servlet.http.HttpServletRequest;
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
import org.springframework.web.multipart.MultipartFile;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingImageControllerTest {

    @Mock
    private CarListingService carListingService;

    @Mock
    private I18nService i18nService;

    @InjectMocks
    private CarListingImageController carListingImageController;

    @Mock
    private UserDetails userDetails;

    @Mock
    private HttpServletRequest request;

    private static final Long TEST_LISTING_ID = 1L;

    @Nested
    @DisplayName("POST /api/listings/{listingId}/upload-image")
    class UploadListingImage {

        @Test
        @DisplayName("Should upload image successfully")
        void uploadImage_Success() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(userDetails.getUsername()).thenReturn("testuser");
            when(carListingService.uploadListingImage(TEST_LISTING_ID, file, "testuser"))
                    .thenReturn("listings/1/image.jpg");
            when(i18nService.getMessage("image.upload.success", request)).thenReturn("Upload successful");

            ResponseEntity<?> response =
                    carListingImageController.uploadListingImage(TEST_LISTING_ID, file, userDetails, request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(carListingService).uploadListingImage(TEST_LISTING_ID, file, "testuser");
        }

        @Test
        @DisplayName("Should throw BadRequestException when file is empty")
        void uploadImage_EmptyFile() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(true);
            when(i18nService.getMessage("error.image.upload.empty", request)).thenReturn("File cannot be empty");

            assertThrows(BadRequestException.class, () ->
                    carListingImageController.uploadListingImage(TEST_LISTING_ID, file, userDetails, request));

            verify(carListingService, never()).uploadListingImage(anyLong(), any(), anyString());
        }

        @Test
        @DisplayName("Should propagate service exceptions")
        void uploadImage_ServiceException() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(userDetails.getUsername()).thenReturn("testuser");
            when(carListingService.uploadListingImage(TEST_LISTING_ID, file, "testuser"))
                    .thenThrow(new RuntimeException("Storage error"));

            assertThrows(RuntimeException.class, () ->
                    carListingImageController.uploadListingImage(TEST_LISTING_ID, file, userDetails, request));
        }
    }
}

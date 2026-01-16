package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.service.PublicUploadRateLimitService;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ImageControllerTest {

    @Mock
    private StorageService storageService;

    @Mock
    private PublicUploadRateLimitService rateLimitService;

    private ImageController imageController;
    private MockHttpServletRequest request;
    private AutoCloseable closeable;

    @BeforeEach
    void setUp() {
        closeable = MockitoAnnotations.openMocks(this);
        imageController = new ImageController(storageService, rateLimitService);

        // Mock the HTTP request context needed by ServletUriComponentsBuilder
        request = new MockHttpServletRequest();
        request.setContextPath("");
        request.setRequestURI("/api/images/upload");
        request.setServerName("localhost");
        request.setServerPort(8080);
        request.setScheme("http");
        request.setRemoteAddr("192.168.1.100");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        // Default: allow uploads
        when(rateLimitService.canUpload(anyString())).thenReturn(true);
        when(rateLimitService.getRemainingUploads(anyString())).thenReturn(9);
    }

    @AfterEach
    void tearDown() throws Exception {
        RequestContextHolder.resetRequestAttributes();
        closeable.close();
    }

    @Test
    void shouldUploadImage() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test-image.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "test image content".getBytes()
        );

        when(storageService.store(any(), anyString())).thenReturn("public/images/uuid.jpg");

        ResponseEntity<Map<String, String>> response = imageController.uploadImage(file, "public/images", request);

        assertNotNull(response, "Response should not be null");
        assertEquals(200, response.getStatusCode().value(), "Status code should be 200");

        Map<String, String> body = response.getBody();
        assertNotNull(body, "Response body should not be null");

        assertNotNull(body.get("fileName"), "fileName should not be null");
        assertNotNull(body.get("fileDownloadUri"), "fileDownloadUri should not be null");
        assertNotNull(body.get("key"), "key should not be null");
        assertEquals("9", body.get("remainingUploads"), "remainingUploads should be 9");

        // Verify storage was called
        verify(storageService).store(any(), anyString());
        verify(rateLimitService).recordUpload("192.168.1.100");
    }

    @Test
    void shouldRejectWhenRateLimited() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test-image.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "test image content".getBytes()
        );

        // Rate limit exceeded
        when(rateLimitService.canUpload(anyString())).thenReturn(false);

        ResponseEntity<Map<String, String>> response = imageController.uploadImage(file, "public/images", request);

        assertEquals(HttpStatus.TOO_MANY_REQUESTS.value(), response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().containsKey("error"));

        // Verify storage was NOT called
        verify(storageService, never()).store(any(), anyString());
    }

    @Test
    void shouldRejectNonImageFile() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "document.pdf",
            "application/pdf",
            "pdf content".getBytes()
        );

        StorageException exception = assertThrows(StorageException.class, () -> {
            imageController.uploadImage(file, "public/images", request);
        });

        assertTrue(exception.getMessage().contains("Only image files are allowed"));
    }

    @Test
    void shouldRejectOversizedFile() {
        // Create a file larger than 5MB
        byte[] largeContent = new byte[6 * 1024 * 1024]; // 6MB
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "large-image.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            largeContent
        );

        StorageException exception = assertThrows(StorageException.class, () -> {
            imageController.uploadImage(file, "public/images", request);
        });

        assertTrue(exception.getMessage().contains("exceeds maximum"));
    }

    @Test
    void shouldRejectEmptyFile() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "empty.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            new byte[0]
        );

        StorageException exception = assertThrows(StorageException.class, () -> {
            imageController.uploadImage(file, "public/images", request);
        });

        assertTrue(exception.getMessage().contains("empty file"));
    }

    @Test
    void shouldRejectInvalidFilePath() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "../../../etc/passwd.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "test content".getBytes()
        );

        StorageException exception = assertThrows(StorageException.class, () -> {
            imageController.uploadImage(file, "public/images", request);
        });

        assertTrue(exception.getMessage().contains("invalid path sequence"));
    }

    @Test
    void shouldGetImage() {
        ByteArrayResource resource = new ByteArrayResource("image data".getBytes()) {
            @Override
            public String getFilename() {
                return "test.jpg";
            }
        };

        when(storageService.loadAsResource("public/images/test.jpg")).thenReturn(resource);

        ResponseEntity<?> response = imageController.getImage("public/images/test.jpg");

        assertEquals(200, response.getStatusCode().value());
        assertEquals(MediaType.IMAGE_JPEG, response.getHeaders().getContentType());
    }

    @Test
    void shouldExtractClientIpFromXForwardedFor() {
        request.addHeader("X-Forwarded-For", "10.0.0.1, 192.168.1.1");

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "content".getBytes()
        );

        when(storageService.store(any(), anyString())).thenReturn("key");

        imageController.uploadImage(file, "public/images", request);

        // Should use the first IP from X-Forwarded-For
        verify(rateLimitService).canUpload("10.0.0.1");
        verify(rateLimitService).recordUpload("10.0.0.1");
    }

    @Test
    void shouldExtractClientIpFromXRealIp() {
        request.addHeader("X-Real-IP", "10.0.0.2");

        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "content".getBytes()
        );

        when(storageService.store(any(), anyString())).thenReturn("key");

        imageController.uploadImage(file, "public/images", request);

        verify(rateLimitService).canUpload("10.0.0.2");
    }

    @Test
    void shouldSanitizeFolderPath() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "content".getBytes()
        );

        when(storageService.store(any(), anyString())).thenReturn("key");

        imageController.uploadImage(file, "dealers/../../../etc", request);

        // Verify the folder was sanitized (special chars removed)
        verify(storageService).store(any(), argThat(key -> 
            !key.contains("..") && key.startsWith("dealers")
        ));
    }
}

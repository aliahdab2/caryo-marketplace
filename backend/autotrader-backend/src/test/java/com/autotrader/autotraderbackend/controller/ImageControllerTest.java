package com.autotrader.autotraderbackend.controller;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ImageControllerTest {
    
    private ImageController imageController;
    
    @TempDir
    Path tempDir;
    
    @BeforeEach
    void setUp() {
        // Create the controller with a temp directory
        imageController = new ImageController(tempDir.toString());
        
        // Mock the HTTP request context needed by ServletUriComponentsBuilder
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setContextPath("");
        request.setRequestURI("/api/images/upload");
        request.setServerName("localhost");
        request.setServerPort(8080);
        request.setScheme("http");
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
    }
    
    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }
    
    @Test
    void shouldUploadImage() {
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test-image.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "test image content".getBytes()
        );

        // Upload the image
        ResponseEntity<Map<String, String>> response = imageController.uploadImage(file);

        // Assertions
        assertNotNull(response, "Response should not be null");
        assertEquals(200, response.getStatusCode().value(), "Status code should be 200");

        Map<String, String> body = response.getBody();
        assertNotNull(body, "Response body should not be null");

        System.out.println("Response body contains: " + body);

        // Check if fileName exists and has a correct format
        assertNotNull(body.get("fileName"), "fileName should not be null");
        assertTrue(body.get("fileName").toLowerCase().endsWith(".jpg"), "fileName should end with .jpg");

        // Check that fileDownloadUri exists (this was previously failing)
        assertNotNull(body.get("fileDownloadUri"), "fileDownloadUri should not be null");
    }
    
    @Test
    void shouldRejectInvalidFilePath() {
        // Create a file with path traversal attempt
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "../../../etc/passwd",
            "text/plain",
            "test content".getBytes()
        );

        // Should throw exception for path traversal attempt
        Exception exception = assertThrows(RuntimeException.class, () -> {
            imageController.uploadImage(file);
        });

        // Print the actual message for debugging
        System.out.println("Exception message: " + exception.getMessage());
        assertTrue(exception.getMessage().toLowerCase().contains("invalid path sequence"),
                "Exception message should mention invalid path sequence");
    }
}

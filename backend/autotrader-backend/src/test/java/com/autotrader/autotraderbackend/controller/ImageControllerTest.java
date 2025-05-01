package com.autotrader.autotraderbackend.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ImageControllerTest {
    
    private ImageController imageController;
    
    @TempDir
    Path tempDir;
    
    @BeforeEach
    void setUp() {
        imageController = new ImageController(tempDir.toString());
    }
    
    @Test
    void shouldUploadImage() {
        // Create a mock file
        MockMultipartFile file = new MockMultipartFile(
            "file",
            "test-image.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "test image content".getBytes()
        );
        
        // Upload the image
        ResponseEntity<Map<String, String>> response = imageController.uploadImage(file);
        
        // Assertions
        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        
        Map<String, String> body = response.getBody();
        assertNotNull(body);
        
        // Print the actual contents of the response for debugging
        System.out.println("Response body contains: " + body);
        
        // Check if fileName exists and has correct format
        assertNotNull(body.get("fileName"));
        assertTrue(body.get("fileName").endsWith(".jpg"));
        
        // Check that fileDownloadUri exists (this was previously failing)
        assertNotNull(body.get("fileDownloadUri"));
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
        
        assertTrue(exception.getMessage().contains("invalid path sequence"));
    }
}

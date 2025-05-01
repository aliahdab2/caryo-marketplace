package com.autotrader.autotraderbackend.service.storage;

import com.autotrader.autotraderbackend.config.StorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class LocalStorageServiceTest {

    private LocalStorageService storageService;
    private StorageProperties properties;
    
    @TempDir
    Path tempDir;
    
    @BeforeEach
    void setUp() {
        properties = new StorageProperties();
        properties.setLocation(tempDir.toString());
        properties.setBaseUrl("http://localhost:8080/api/files");
        
        storageService = new LocalStorageService(properties);
        storageService.init();
    }
    
    @Test
    void testStoreAndLoadFile() throws IOException {
        // Create test file
        MockMultipartFile file = new MockMultipartFile(
            "test-file",
            "test-file.txt",
            MediaType.TEXT_PLAIN_VALUE,
            "Hello, World!".getBytes()
        );
        
        // Store file
        String url = storageService.store(file, "test-folder/test-file.txt");
        
        // Check that URL is correct
        assertEquals("http://localhost:8080/api/files/test-folder/test-file.txt", url);
        
        // Check that file exists on disk
        Path storedFile = tempDir.resolve("test-folder/test-file.txt");
        assertTrue(Files.exists(storedFile));
        
        // Check content
        String content = new String(Files.readAllBytes(storedFile));
        assertEquals("Hello, World!", content);
        
        // Test loadAsResource
        var resource = storageService.loadAsResource("test-folder/test-file.txt");
        assertTrue(resource.exists());
    }
    
    @Test
    void testDelete() throws IOException {
        // Create test file
        MockMultipartFile file = new MockMultipartFile(
            "test-file",
            "test-file.txt",
            MediaType.TEXT_PLAIN_VALUE,
            "Hello, World!".getBytes()
        );
        
        // Store file
        storageService.store(file, "test-file.txt");
        
        // Check that file exists
        Path storedFile = tempDir.resolve("test-file.txt");
        assertTrue(Files.exists(storedFile));
        
        // Delete file
        boolean deleted = storageService.delete("test-file.txt");
        
        // Check that delete was successful
        assertTrue(deleted);
        
        // Check that file no longer exists
        assertFalse(Files.exists(storedFile));
    }
    
    @Test
    void testGetSignedUrl() {
        // For local storage, getSignedUrl should just return the base URL + key
        String url = storageService.getSignedUrl("test-file.txt", 3600);
        assertEquals("http://localhost:8080/api/files/test-file.txt", url);
    }
}

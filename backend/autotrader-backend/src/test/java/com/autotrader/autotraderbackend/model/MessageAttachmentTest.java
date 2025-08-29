package com.autotrader.autotraderbackend.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("MessageAttachment Entity Tests")
class MessageAttachmentTest {

    private MessageAttachment attachment;
    private Message message;

    @BeforeEach
    void setUp() {
        // Create test message
        message = Message.builder()
                .id(1L)
                .content("Test message")
                .build();

        // Create test attachment
        attachment = MessageAttachment.builder()
                .id(1L)
                .message(message)
                .fileKey("test-file-key.jpg")
                .fileName("test-image.jpg")
                .contentType("image/jpeg")
                .size(1024L)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should create attachment with required fields")
    void shouldCreateAttachmentWithRequiredFields() {
        // Assert
        assertNotNull(attachment);
        assertEquals(1L, attachment.getId());
        assertEquals(message, attachment.getMessage());
        assertEquals("test-file-key.jpg", attachment.getFileKey());
        assertEquals("test-image.jpg", attachment.getFileName());
        assertEquals("image/jpeg", attachment.getContentType());
        assertEquals(1024L, attachment.getSize());
        assertNotNull(attachment.getCreatedAt());
    }

    @Test
    @DisplayName("Should identify image content type correctly")
    void shouldIdentifyImageContentTypeCorrectly() {
        // Test various image types
        attachment.setContentType("image/jpeg");
        assertTrue(attachment.isImage());
        
        attachment.setContentType("image/png");
        assertTrue(attachment.isImage());
        
        attachment.setContentType("image/gif");
        assertTrue(attachment.isImage());
        
        attachment.setContentType("image/webp");
        assertTrue(attachment.isImage());
        
        // Test non-image types
        attachment.setContentType("text/plain");
        assertFalse(attachment.isImage());
        
        attachment.setContentType("application/pdf");
        assertFalse(attachment.isImage());
    }

    @Test
    @DisplayName("Should identify document content type correctly")
    void shouldIdentifyDocumentContentTypeCorrectly() {
        // Test PDF
        attachment.setContentType("application/pdf");
        assertTrue(attachment.isDocument());
        
        // Test Word documents
        attachment.setContentType("application/msword");
        assertTrue(attachment.isDocument());
        
        attachment.setContentType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        assertTrue(attachment.isDocument());
        
        // Test non-document types
        attachment.setContentType("image/jpeg");
        assertFalse(attachment.isDocument());
        
        attachment.setContentType("text/plain");
        assertFalse(attachment.isDocument());
    }

    @Test
    @DisplayName("Should extract file extension correctly")
    void shouldExtractFileExtensionCorrectly() {
        // Test various file extensions
        attachment.setFileName("test.jpg");
        assertEquals("jpg", attachment.getFileExtension());
        
        attachment.setFileName("document.pdf");
        assertEquals("pdf", attachment.getFileExtension());
        
        attachment.setFileName("image.png");
        assertEquals("png", attachment.getFileExtension());
        
        attachment.setFileName("file.with.multiple.dots.txt");
        assertEquals("txt", attachment.getFileExtension());
        
        attachment.setFileName("noextension");
        assertEquals("", attachment.getFileExtension());
        
        attachment.setFileName(".hiddenfile");
        assertEquals("hiddenfile", attachment.getFileExtension());
    }

    @Test
    @DisplayName("Should handle file URL generation")
    void shouldHandleFileUrlGeneration() {
        // Act
        String fileUrl = attachment.getFileUrl();
        
        // Assert
        assertEquals("test-file-key.jpg", fileUrl);
        // Note: In production, this would be transformed by MinIO URL utilities
    }

    @Test
    @DisplayName("Should handle different file sizes")
    void shouldHandleDifferentFileSizes() {
        // Test small file
        attachment.setSize(100L);
        assertEquals(100L, attachment.getSize());
        
        // Test large file
        attachment.setSize(1048576L); // 1MB
        assertEquals(1048576L, attachment.getSize());
        
        // Test zero size
        attachment.setSize(0L);
        assertEquals(0L, attachment.getSize());
    }

    @Test
    @DisplayName("Should handle different content types")
    void shouldHandleDifferentContentTypes() {
        // Test image types
        attachment.setContentType("image/jpeg");
        assertTrue(attachment.isImage());
        assertFalse(attachment.isDocument());
        
        attachment.setContentType("image/png");
        assertTrue(attachment.isImage());
        assertFalse(attachment.isDocument());
        
        // Test document types
        attachment.setContentType("application/pdf");
        assertFalse(attachment.isImage());
        assertTrue(attachment.isDocument());
        
        // Test other types
        attachment.setContentType("text/plain");
        assertFalse(attachment.isImage());
        assertFalse(attachment.isDocument());
        
        attachment.setContentType("video/mp4");
        assertFalse(attachment.isImage());
        assertFalse(attachment.isDocument());
    }

    @Test
    @DisplayName("Should handle file name changes")
    void shouldHandleFileNameChanges() {
        // Arrange
        String newFileName = "updated-image.png";
        
        // Act
        attachment.setFileName(newFileName);
        
        // Assert
        assertEquals(newFileName, attachment.getFileName());
        assertEquals("png", attachment.getFileExtension());
    }

    @Test
    @DisplayName("Should handle content type changes")
    void shouldHandleContentTypeChanges() {
        // Arrange
        String newContentType = "image/png";
        
        // Act
        attachment.setContentType(newContentType);
        
        // Assert
        assertEquals(newContentType, attachment.getContentType());
        assertTrue(attachment.isImage());
        assertFalse(attachment.isDocument());
    }

    @Test
    @DisplayName("Should handle file key changes")
    void shouldHandleFileKeyChanges() {
        // Arrange
        String newFileKey = "new-file-key.png";
        
        // Act
        attachment.setFileKey(newFileKey);
        
        // Assert
        assertEquals(newFileKey, attachment.getFileKey());
        assertEquals(newFileKey, attachment.getFileUrl());
    }

    @Test
    @DisplayName("Should handle timestamp updates")
    void shouldHandleTimestampUpdates() {
        // Arrange
        LocalDateTime newTimestamp = LocalDateTime.now().plusHours(1);
        
        // Act
        attachment.setCreatedAt(newTimestamp);
        
        // Assert
        assertEquals(newTimestamp, attachment.getCreatedAt());
    }

    @Test
    @DisplayName("Should handle null message")
    void shouldHandleNullMessage() {
        // Act
        attachment.setMessage(null);
        
        // Assert
        assertNull(attachment.getMessage());
    }

    @Test
    @DisplayName("Should handle null file name")
    void shouldHandleNullFileName() {
        // Act
        attachment.setFileName(null);
        
        // Assert
        assertNull(attachment.getFileName());
        assertEquals("", attachment.getFileExtension());
    }

    @Test
    @DisplayName("Should handle null content type")
    void shouldHandleNullContentType() {
        // Act
        attachment.setContentType(null);
        
        // Assert
        assertNull(attachment.getContentType());
        assertFalse(attachment.isImage());
        assertFalse(attachment.isDocument());
    }

    @Test
    @DisplayName("Should handle empty file name")
    void shouldHandleEmptyFileName() {
        // Act
        attachment.setFileName("");
        
        // Assert
        assertEquals("", attachment.getFileName());
        assertEquals("", attachment.getFileExtension());
    }

    @Test
    @DisplayName("Should handle special characters in file name")
    void shouldHandleSpecialCharactersInFileName() {
        // Arrange
        String specialFileName = "test-file_123 (copy).jpg";
        
        // Act
        attachment.setFileName(specialFileName);
        
        // Assert
        assertEquals(specialFileName, attachment.getFileName());
        assertEquals("jpg", attachment.getFileExtension());
    }

    @Test
    @DisplayName("Should handle very long file names")
    void shouldHandleVeryLongFileNames() {
        // Arrange
        String longFileName = "a".repeat(255) + ".txt";
        
        // Act
        attachment.setFileName(longFileName);
        
        // Assert
        assertEquals(longFileName, attachment.getFileName());
        assertEquals("txt", attachment.getFileExtension());
    }
}

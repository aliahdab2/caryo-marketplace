package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.repository.*;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Test class for ConversationService file validation functionality
 * Tests the improvements made to file type validation and error handling
 */
@ExtendWith(MockitoExtension.class)
public class ConversationServiceFileValidationTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MessageAttachmentRepository messageAttachmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ConversationService conversationService;

    private MessageAttachment mockAttachment;
    private Conversation testConversation;
    private User testUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        mockAttachment = new MessageAttachment();
        mockAttachment.setId(1L);
        mockAttachment.setFileName("test.jpg");
        mockAttachment.setFileKey("test-key");
        mockAttachment.setContentType("image/jpeg");
        mockAttachment.setSize(1024L);

        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");

        testConversation = new Conversation();
        testConversation.setId(1L);
        testConversation.setBuyer(testUser);
        testConversation.setSeller(otherUser);
    }

    @Test
    void shouldValidateFileSizeBeforeFileType() {
        // Given: A file that exceeds size limit
        byte[] largeContent = new byte[15 * 1024 * 1024]; // 15MB
        MockMultipartFile largeFile = new MockMultipartFile(
            "file", 
            "large-image.jpg", 
            "image/jpeg", 
            largeContent
        );

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // When & Then: Should reject due to file size before checking file type
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            conversationService.uploadMessageAttachment(1L, largeFile, 1L);
        });

        assertTrue(exception.getMessage().contains("File size cannot exceed"));
        assertTrue(exception.getMessage().contains("10MB"));
    }

    @Test
    void shouldHandleNullAttachmentFromRepository() {
        // Given: Repository returns null (simulating save failure)
        MockMultipartFile validFile = new MockMultipartFile(
            "file", 
            "test.jpg", 
            "image/jpeg", 
            "fake-image-content".getBytes()
        );

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(storageService.store(any(), any())).thenReturn("test-url");
        when(messageAttachmentRepository.save(any())).thenReturn(null);

        // When & Then: Should handle null attachment gracefully
        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            conversationService.uploadMessageAttachment(1L, validFile, 1L);
        });

        assertEquals("Failed to save attachment", exception.getMessage());
    }

    @Test
    void shouldHandleEmptyOrNullFiles() {
        // Test null file
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        
        assertThrows(BadRequestException.class, () -> {
            conversationService.uploadMessageAttachment(1L, null, 1L);
        });

        // Test empty file
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file", 
            "empty.jpg", 
            "image/jpeg", 
            new byte[0]
        );

        BadRequestException exception = assertThrows(BadRequestException.class, () -> {
            conversationService.uploadMessageAttachment(1L, emptyFile, 1L);
        });

        assertTrue(exception.getMessage().contains("empty") || 
                  exception.getMessage().contains("File size cannot exceed"));
    }

    @Test
    void shouldValidateDifferentImageFormats() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(storageService.store(any(), any())).thenReturn("test-url");
        when(messageAttachmentRepository.save(any())).thenReturn(mockAttachment);

        // Test various image formats
        String[] validImageTypes = {
            "image/jpeg", "image/jpg", "image/png", "image/gif", 
            "image/webp", "image/bmp", "image/tiff"
        };

        for (String contentType : validImageTypes) {
            MockMultipartFile imageFile = new MockMultipartFile(
                "file", 
                "test." + contentType.split("/")[1], 
                contentType, 
                "fake-image-content".getBytes()
            );

            // Should not throw exception for valid image types
            assertDoesNotThrow(() -> {
                conversationService.uploadMessageAttachment(1L, imageFile, 1L);
            }, "Failed for content type: " + contentType);
        }
    }

    @Test
    void shouldValidateDifferentDocumentFormats() {
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(storageService.store(any(), any())).thenReturn("test-url");
        when(messageAttachmentRepository.save(any())).thenReturn(mockAttachment);

        // Test various document formats
        String[] validDocTypes = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/plain"
        };

        for (String contentType : validDocTypes) {
            MockMultipartFile docFile = new MockMultipartFile(
                "file", 
                "test.doc", 
                contentType, 
                "fake-document-content".getBytes()
            );

            // Should not throw exception for valid document types
            assertDoesNotThrow(() -> {
                conversationService.uploadMessageAttachment(1L, docFile, 1L);
            }, "Failed for content type: " + contentType);
        }
    }
}

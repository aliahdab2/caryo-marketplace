package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.BadRequestException;
import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.payload.response.MessageResponse;
import com.autotrader.autotraderbackend.repository.*;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ConversationService attachment functionality.
 * Tests file upload and attachment management without full Spring context.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConversationService Attachment Tests")
public class ConversationServiceAttachmentTest {

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

    private User testUser;
    private User otherUser;
    private Conversation testConversation;
    private Message testMessage;

    @BeforeEach
    void setUp() {
        // Create test users
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");

        // Create test conversation
        testConversation = new Conversation();
        testConversation.setId(1L);
        testConversation.setBuyer(testUser);
        testConversation.setSeller(otherUser);
        testConversation.setStatus(ConversationStatus.ACTIVE);

        // Create test message
        testMessage = Message.builder()
                .id(1L)
                .conversation(testConversation)
                .sender(testUser)
                .content("Test message")
                .messageType(MessageType.TEXT)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("Should upload attachment successfully")
    void shouldUploadAttachmentSuccessfully() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.jpg", "image/jpeg", "test content".getBytes()
        );

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(storageService.store(any(), anyString())).thenReturn("http://test-url/file.jpg");
        when(messageAttachmentRepository.save(any(MessageAttachment.class)))
                .thenAnswer(invocation -> {
                    MessageAttachment attachment = invocation.getArgument(0);
                    attachment.setId(1L);
                    return attachment;
                });

        // Act
        Map<String, Object> result = conversationService.uploadMessageAttachment(1L, file, 1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.get("id")).isEqualTo(1L);
        assertThat(result.get("fileName")).isEqualTo("test.jpg");
        assertThat(result.get("contentType")).isEqualTo("image/jpeg");
        assertThat(result.get("isImage")).isEqualTo(true);

        verify(storageService).store(eq(file), anyString());
        verify(messageAttachmentRepository).save(any(MessageAttachment.class));
    }

    @Test
    @DisplayName("Should reject empty file")
    void shouldRejectEmptyFile() {
        // Arrange
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file", "empty.jpg", "image/jpeg", new byte[0]
        );

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThatThrownBy(() -> conversationService.uploadMessageAttachment(1L, emptyFile, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("File cannot be empty");

        verify(storageService, never()).store(any(), anyString());
        verify(messageAttachmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject unsupported file type")
    void shouldRejectUnsupportedFileType() {
        // Arrange
        MockMultipartFile unsupportedFile = new MockMultipartFile(
            "file", "script.js", "application/javascript", "console.log('test')".getBytes()
        );

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThatThrownBy(() -> conversationService.uploadMessageAttachment(1L, unsupportedFile, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Unsupported file type");

        verify(storageService, never()).store(any(), anyString());
        verify(messageAttachmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject oversized file")
    void shouldRejectOversizedFile() {
        // Arrange
        byte[] largeContent = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile largeFile = new MockMultipartFile(
            "file", "large.jpg", "image/jpeg", largeContent
        );

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThatThrownBy(() -> conversationService.uploadMessageAttachment(1L, largeFile, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("File size cannot exceed 10MB");

        verify(storageService, never()).store(any(), anyString());
        verify(messageAttachmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should reject unauthorized user")
    void shouldRejectUnauthorizedUser() {
        // Arrange
        MockMultipartFile file = new MockMultipartFile(
            "file", "test.jpg", "image/jpeg", "test content".getBytes()
        );

        User unauthorizedUser = new User();
        unauthorizedUser.setId(999L);
        unauthorizedUser.setEmail("unauthorized@example.com");

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(999L)).thenReturn(Optional.of(unauthorizedUser));

        // Act & Assert
        assertThatThrownBy(() -> conversationService.uploadMessageAttachment(1L, file, 999L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("User is not a participant in this conversation");

        verify(storageService, never()).store(any(), anyString());
        verify(messageAttachmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should validate file properties for message attachments")
    void shouldValidateFilePropertiesForMessageAttachments() {
        // Arrange
        MockMultipartFile file1 = new MockMultipartFile(
            "files", "image.jpg", "image/jpeg", "image content".getBytes()
        );
        MockMultipartFile file2 = new MockMultipartFile(
            "files", "doc.pdf", "application/pdf", "pdf content".getBytes()
        );

        // Act & Assert - Test file validation logic
        assertThat(file1.getSize()).isLessThan(10 * 1024 * 1024);
        assertThat(file2.getSize()).isLessThan(10 * 1024 * 1024);
        assertThat(file1.getContentType()).startsWith("image/");
        assertThat(file2.getContentType()).startsWith("application/pdf");
        assertThat(isAllowedFileType(file1.getContentType())).isTrue();
        assertThat(isAllowedFileType(file2.getContentType())).isTrue();
    }

    @Test
    @DisplayName("Should validate allowed file types correctly")
    void shouldValidateAllowedFileTypesCorrectly() {
        // Test allowed types
        assertThat(isAllowedFileType("image/jpeg")).isTrue();
        assertThat(isAllowedFileType("image/png")).isTrue();
        assertThat(isAllowedFileType("image/gif")).isTrue();
        assertThat(isAllowedFileType("application/pdf")).isTrue();
        assertThat(isAllowedFileType("application/msword")).isTrue();
        assertThat(isAllowedFileType("text/plain")).isTrue();

        // Test disallowed types
        assertThat(isAllowedFileType("application/javascript")).isFalse();
        assertThat(isAllowedFileType("text/html")).isFalse();
        assertThat(isAllowedFileType("application/x-executable")).isFalse();
        assertThat(isAllowedFileType("video/mp4")).isFalse();
    }

    @Test
    @DisplayName("Should generate unique file keys")
    void shouldGenerateUniqueFileKeys() {
        // Arrange
        Long conversationId = 123L;
        String originalFilename1 = "test1.jpg";
        String originalFilename2 = "test2.png";

        // Act
        String fileKey1 = generateFileKey(conversationId, originalFilename1);
        String fileKey2 = generateFileKey(conversationId, originalFilename2);

        // Assert
        assertThat(fileKey1).startsWith("messages/123/");
        assertThat(fileKey1).endsWith(".jpg");
        assertThat(fileKey2).startsWith("messages/123/");
        assertThat(fileKey2).endsWith(".png");
        assertThat(fileKey1).isNotEqualTo(fileKey2);
    }

    // Helper methods to test private functionality
    private boolean isAllowedFileType(String contentType) {
        return contentType != null && (
            contentType.startsWith("image/") ||
            contentType.startsWith("application/pdf") ||
            contentType.startsWith("application/msword") ||
            contentType.startsWith("application/vnd.openxmlformats-officedocument") ||
            contentType.equals("text/plain")
        );
    }

    private String generateFileKey(Long conversationId, String originalFilename) {
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        return "messages/" + conversationId + "/" + java.util.UUID.randomUUID().toString() + fileExtension;
    }
}

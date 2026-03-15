package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.BadRequestException;
import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.*;
import com.caryo.marketplace.repository.*;
import com.caryo.marketplace.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.MessageSource;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ConversationService block user functionality.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConversationService Block User Tests")
public class ConversationServiceBlockTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private MessageAttachmentRepository messageAttachmentRepository;

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private MessageSource messageSource;

    @InjectMocks
    private ConversationService conversationService;

    private User testUser;
    private User otherUser;
    private Conversation testConversation;
    private CarListing testListing;

    @BeforeEach
    void setUp() {
        // Create test users
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setUsername("testuser");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");
        otherUser.setUsername("otheruser");

        // Create test listing
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Test Car");
        testListing.setSeller(otherUser);

        // Create test conversation
        testConversation = Conversation.builder()
                .id(1L)
                .listing(testListing)
                .buyer(testUser)
                .seller(otherUser)
                .status(ConversationStatus.ACTIVE)
                .build();

        lenient().when(messageSource.getMessage(anyString(), any(), anyString(), any())).thenReturn("Mocked message");
    }

    @Test
    @DisplayName("Should block user successfully")
    void shouldBlockUserSuccessfully() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(conversationRepository.save(any(Conversation.class))).thenReturn(testConversation);

        // Act
        conversationService.blockUser(1L, 1L);

        // Assert
        assertThat(testConversation.getStatus()).isEqualTo(ConversationStatus.BLOCKED);
        verify(conversationRepository).findById(1L);
        verify(userRepository).findById(1L);
        verify(conversationRepository).save(testConversation);
    }

    @Test
    @DisplayName("Should throw exception when conversation not found")
    void shouldThrowExceptionWhenConversationNotFound() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> conversationService.blockUser(1L, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Conversation");

        verify(conversationRepository).findById(1L);
        verify(userRepository, never()).findById(any());
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when user not found")
    void shouldThrowExceptionWhenUserNotFound() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> conversationService.blockUser(1L, 1L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User");

        verify(conversationRepository).findById(1L);
        verify(userRepository).findById(1L);
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when user is not participant")
    void shouldThrowExceptionWhenUserNotParticipant() {
        // Arrange
        User nonParticipant = new User();
        nonParticipant.setId(999L);

        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(999L)).thenReturn(Optional.of(nonParticipant));

        // Act & Assert
        assertThatThrownBy(() -> conversationService.blockUser(1L, 999L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Not a participant");

        verify(conversationRepository).findById(1L);
        verify(userRepository).findById(999L);
        verify(conversationRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should block conversation from buyer perspective")
    void shouldBlockConversationFromBuyerPerspective() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(conversationRepository.save(any(Conversation.class))).thenReturn(testConversation);

        // Act
        conversationService.blockUser(1L, 1L);

        // Assert
        assertThat(testConversation.getStatus()).isEqualTo(ConversationStatus.BLOCKED);
        verify(conversationRepository).save(testConversation);
    }

    @Test
    @DisplayName("Should block conversation from seller perspective")
    void shouldBlockConversationFromSellerPerspective() {
        // Arrange
        when(conversationRepository.findById(1L)).thenReturn(Optional.of(testConversation));
        when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
        when(conversationRepository.save(any(Conversation.class))).thenReturn(testConversation);

        // Act
        conversationService.blockUser(1L, 2L);

        // Assert
        assertThat(testConversation.getStatus()).isEqualTo(ConversationStatus.BLOCKED);
        verify(conversationRepository).save(testConversation);
    }
}


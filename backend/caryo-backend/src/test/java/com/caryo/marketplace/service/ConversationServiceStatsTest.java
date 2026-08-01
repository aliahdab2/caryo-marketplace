package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.ConversationStatus;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.response.ConversationStatsResponse;
import com.caryo.marketplace.repository.CarListingRepository;
import com.caryo.marketplace.repository.ConversationRepository;
import com.caryo.marketplace.repository.MessageAttachmentRepository;
import com.caryo.marketplace.repository.MessageRepository;
import com.caryo.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit tests for ConversationService conversation stats aggregation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConversationService Stats Tests")
class ConversationServiceStatsTest {

    @Mock
    private ConversationRepository conversationRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private MessageAttachmentRepository messageAttachmentRepository;

    @Mock
    private MessageAttachmentService messageAttachmentService;

    @Mock
    private UserBlockService userBlockService;

    @InjectMocks
    private ConversationService conversationService;

    private User testUser;

    private static final Long TEST_USER_ID = 1L;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(TEST_USER_ID);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
    }

    @Test
    @DisplayName("Should aggregate total, active, unread and archived counters")
    void getConversationStats_Success() {
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        when(conversationRepository.countByUser(testUser)).thenReturn(7L);
        when(conversationRepository.countByUserAndStatus(testUser, ConversationStatus.ACTIVE)).thenReturn(4L);
        when(conversationRepository.countByUserAndStatus(testUser, ConversationStatus.ARCHIVED)).thenReturn(2L);
        when(messageRepository.countAllUnreadMessagesForUser(testUser)).thenReturn(5L);

        ConversationStatsResponse stats = conversationService.getConversationStats(TEST_USER_ID);

        assertThat(stats.getTotalConversations()).isEqualTo(7L);
        assertThat(stats.getActiveConversations()).isEqualTo(4L);
        assertThat(stats.getArchivedConversations()).isEqualTo(2L);
        assertThat(stats.getUnreadMessages()).isEqualTo(5L);

        verify(conversationRepository).countByUser(testUser);
        verify(conversationRepository).countByUserAndStatus(testUser, ConversationStatus.ACTIVE);
        verify(conversationRepository).countByUserAndStatus(testUser, ConversationStatus.ARCHIVED);
        verify(messageRepository).countAllUnreadMessagesForUser(testUser);
    }

    @Test
    @DisplayName("Should return zeros for a user with no conversations")
    void getConversationStats_NoConversations() {
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.of(testUser));
        when(conversationRepository.countByUser(testUser)).thenReturn(0L);
        when(conversationRepository.countByUserAndStatus(testUser, ConversationStatus.ACTIVE)).thenReturn(0L);
        when(conversationRepository.countByUserAndStatus(testUser, ConversationStatus.ARCHIVED)).thenReturn(0L);
        when(messageRepository.countAllUnreadMessagesForUser(testUser)).thenReturn(0L);

        ConversationStatsResponse stats = conversationService.getConversationStats(TEST_USER_ID);

        assertThat(stats.getTotalConversations()).isZero();
        assertThat(stats.getActiveConversations()).isZero();
        assertThat(stats.getArchivedConversations()).isZero();
        assertThat(stats.getUnreadMessages()).isZero();
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException for unknown user")
    void getConversationStats_UserNotFound() {
        when(userRepository.findById(TEST_USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> conversationService.getConversationStats(TEST_USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verifyNoInteractions(conversationRepository, messageRepository);
    }
}

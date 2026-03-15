package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.BadRequestException;
import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.model.UserBlock;
import com.caryo.marketplace.repository.UserBlockRepository;
import com.caryo.marketplace.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link UserBlockService}
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserBlockService Tests")
public class UserBlockServiceTest {

    @Mock
    private UserBlockRepository userBlockRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserBlockService userBlockService;

    private User blocker;
    private User blocked;

    @BeforeEach
    void setUp() {
        blocker = new User();
        blocker.setId(1L);
        blocker.setUsername("blocker");
        blocker.setEmail("blocker@example.com");

        blocked = new User();
        blocked.setId(2L);
        blocked.setUsername("blocked");
        blocked.setEmail("blocked@example.com");
    }

    @Test
    @DisplayName("Should block user successfully")
    void shouldBlockUserSuccessfully() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));
        when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
        when(userBlockRepository.existsByBlockerAndBlocked(blocker, blocked)).thenReturn(false);

        UserBlock savedBlock = UserBlock.builder()
                .id(1L)
                .blocker(blocker)
                .blocked(blocked)
                .build();

        when(userBlockRepository.save(any(UserBlock.class))).thenReturn(savedBlock);

        // Act
        UserBlock result = userBlockService.blockUser(1L, 2L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getBlocker().getId()).isEqualTo(1L);
        assertThat(result.getBlocked().getId()).isEqualTo(2L);

        verify(userBlockRepository).save(any(UserBlock.class));
    }

    @Test
    @DisplayName("Should throw exception when blocker not found")
    void shouldThrowExceptionWhenBlockerNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userBlockService.blockUser(1L, 2L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User");

        verify(userBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when blocked user not found")
    void shouldThrowExceptionWhenBlockedUserNotFound() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));
        when(userRepository.findById(2L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userBlockService.blockUser(1L, 2L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User");

        verify(userBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when trying to block yourself")
    void shouldThrowExceptionWhenBlockingYourself() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));

        // Act & Assert
        assertThatThrownBy(() -> userBlockService.blockUser(1L, 1L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Cannot block yourself");

        verify(userBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when user already blocked")
    void shouldThrowExceptionWhenUserAlreadyBlocked() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));
        when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
        when(userBlockRepository.existsByBlockerAndBlocked(blocker, blocked)).thenReturn(true);

        // Act & Assert
        assertThatThrownBy(() -> userBlockService.blockUser(1L, 2L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("already blocked");

        verify(userBlockRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should unblock user successfully")
    void shouldUnblockUserSuccessfully() {
        // Arrange
        UserBlock existingBlock = UserBlock.builder()
                .id(1L)
                .blocker(blocker)
                .blocked(blocked)
                .build();

        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));
        when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
        when(userBlockRepository.findByBlockerAndBlocked(blocker, blocked)).thenReturn(Optional.of(existingBlock));

        // Act
        userBlockService.unblockUser(1L, 2L);

        // Assert
        verify(userBlockRepository).delete(existingBlock);
    }

    @Test
    @DisplayName("Should throw exception when trying to unblock non-existent block")
    void shouldThrowExceptionWhenUnblockingNonExistentBlock() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));
        when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
        when(userBlockRepository.findByBlockerAndBlocked(blocker, blocked)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> userBlockService.unblockUser(1L, 2L))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not blocked");

        verify(userBlockRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Should check if user is blocked correctly")
    void shouldCheckIfUserIsBlocked() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));
        when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
        when(userBlockRepository.existsByBlockerAndBlocked(blocker, blocked)).thenReturn(true);

        // Act
        boolean isBlocked = userBlockService.isBlocked(1L, 2L);

        // Assert
        assertThat(isBlocked).isTrue();
        verify(userBlockRepository).existsByBlockerAndBlocked(blocker, blocked);
    }

    @Test
    @DisplayName("Should check bidirectional block correctly")
    void shouldCheckBidirectionalBlock() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));
        when(userRepository.findById(2L)).thenReturn(Optional.of(blocked));
        when(userBlockRepository.existsBlockBetweenUsers(blocker, blocked)).thenReturn(true);

        // Act
        boolean isBlocked = userBlockService.isBlockedBidirectional(1L, 2L);

        // Assert
        assertThat(isBlocked).isTrue();
        verify(userBlockRepository).existsBlockBetweenUsers(blocker, blocked);
    }

    @Test
    @DisplayName("Should get blocked users")
    void shouldGetBlockedUsers() {
        // Arrange
        User blocked1 = new User();
        blocked1.setId(2L);
        blocked1.setUsername("blocked1");

        User blocked2 = new User();
        blocked2.setId(3L);
        blocked2.setUsername("blocked2");

        UserBlock block1 = UserBlock.builder()
                .id(1L)
                .blocker(blocker)
                .blocked(blocked1)
                .build();

        UserBlock block2 = UserBlock.builder()
                .id(2L)
                .blocker(blocker)
                .blocked(blocked2)
                .build();

        List<UserBlock> blocks = List.of(block1, block2);

        when(userRepository.findById(1L)).thenReturn(Optional.of(blocker));
        when(userBlockRepository.findByBlockerOrderByCreatedAtDesc(blocker)).thenReturn(blocks);

        // Act
        List<UserBlock> result = userBlockService.getBlockedUsers(1L);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getBlocked().getId()).isEqualTo(2L);
        assertThat(result.get(1).getBlocked().getId()).isEqualTo(3L);
    }
}


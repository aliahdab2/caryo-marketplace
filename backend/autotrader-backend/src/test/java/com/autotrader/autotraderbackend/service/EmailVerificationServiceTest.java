package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.AccountStatus;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for EmailVerificationService.
 * Tests email verification functionality including token generation, validation, and rate limiting.
 */
@ExtendWith(MockitoExtension.class)
class EmailVerificationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private EmailVerificationService emailVerificationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("testuser", "test@example.com", "password123");
        testUser.setId(1L);
        testUser.setEmailVerified(false);
        testUser.setAccountStatus(AccountStatus.PENDING_VERIFICATION);

        // Set test configuration values
        ReflectionTestUtils.setField(emailVerificationService, "tokenExpiryHours", 24);
        ReflectionTestUtils.setField(emailVerificationService, "maxVerificationAttempts", 3);
    }

    @Test
    void sendVerificationEmail_Success() {
        // Given
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doNothing().when(emailService).sendEmailVerificationEmail(any(User.class), anyString());

        // When
        boolean result = emailVerificationService.sendVerificationEmail(testUser);

        // Then
        assertTrue(result);
        assertNotNull(testUser.getEmailVerificationToken());
        assertNotNull(testUser.getEmailVerificationSentAt());
        verify(userRepository).save(testUser);
        verify(emailService).sendEmailVerificationEmail(eq(testUser), anyString());
    }

    @Test
    void sendVerificationEmail_EmailServiceFailure() {
        // Given
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doThrow(new RuntimeException("Email service error"))
                .when(emailService).sendEmailVerificationEmail(any(User.class), anyString());

        // When
        boolean result = emailVerificationService.sendVerificationEmail(testUser);

        // Then
        assertFalse(result);
        verify(userRepository).save(testUser);
        verify(emailService).sendEmailVerificationEmail(eq(testUser), anyString());
    }

    @Test
    void verifyEmail_Success() {
        // Given
        String token = "valid-token-123";
        testUser.setEmailVerificationToken(token);
        testUser.setEmailVerificationSentAt(LocalDateTime.now().minusHours(1));

        when(userRepository.findByEmailVerificationToken(token)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // When
        var result = emailVerificationService.verifyEmail(token);

        // Then
        assertTrue(result.isSuccess());
        assertNotNull(result.getMessage());
        assertTrue(testUser.isEmailVerified());
        assertEquals(AccountStatus.VERIFIED, testUser.getAccountStatus());
        assertNull(testUser.getEmailVerificationToken());
        assertNotNull(testUser.getEmailVerifiedAt());
        verify(userRepository).save(testUser);
    }

    @Test
    void verifyEmail_InvalidToken() {
        // Given
        String token = "invalid-token";
        when(userRepository.findByEmailVerificationToken(token)).thenReturn(Optional.empty());
        when(userRepository.findTopByEmailVerifiedTrueAndEmailVerifiedAtAfterOrderByEmailVerifiedAtDesc(any())).thenReturn(Optional.empty());

        // When
        var result = emailVerificationService.verifyEmail(token);

        // Then
        assertFalse(result.isSuccess());
        assertNotNull(result.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void verifyEmail_ExpiredToken() {
        // Given
        String token = "expired-token-123";
        testUser.setEmailVerificationToken(token);
        testUser.setEmailVerificationSentAt(LocalDateTime.now().minusHours(25)); // Expired

        when(userRepository.findByEmailVerificationToken(token)).thenReturn(Optional.of(testUser));

        // When
        var result = emailVerificationService.verifyEmail(token);

        // Then
        assertFalse(result.isSuccess());
        assertNotNull(result.getMessage());
        assertTrue(result.getMessage().contains("expired"));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void verifyEmail_AlreadyVerified() {
        // Given
        String token = "valid-token-123";
        testUser.setEmailVerificationToken(token);
        testUser.setEmailVerificationSentAt(LocalDateTime.now().minusHours(1));
        testUser.setEmailVerified(true); // Already verified
        testUser.setAccountStatus(AccountStatus.VERIFIED);

        when(userRepository.findByEmailVerificationToken(token)).thenReturn(Optional.of(testUser));

        // When
        var result = emailVerificationService.verifyEmail(token);

        // Then
        assertTrue(result.isSuccess()); // Should return true since email is already verified
        assertNotNull(result.getMessage());
        assertTrue(result.getMessage().contains("already verified"));
        verify(userRepository, times(1)).save(any(User.class)); // Should save to clear verification token for security
    }

    @Test
    void resendVerificationEmail_Success() {
        // Given
        String email = "test@example.com";
        testUser.setEmailVerificationSentAt(LocalDateTime.now().minusMinutes(10)); // Not rate limited

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doNothing().when(emailService).sendEmailVerificationEmail(any(User.class), anyString());

        // When
        boolean result = emailVerificationService.resendVerificationEmail(email);

        // Then
        assertTrue(result);
        verify(userRepository).save(testUser);
        verify(emailService).sendEmailVerificationEmail(eq(testUser), anyString());
    }

    @Test
    void resendVerificationEmail_UserNotFound() {
        // Given
        String email = "nonexistent@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // When
        boolean result = emailVerificationService.resendVerificationEmail(email);

        // Then
        assertFalse(result);
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendEmailVerificationEmail(any(User.class), anyString());
    }

    @Test
    void resendVerificationEmail_AlreadyVerified() {
        // Given
        String email = "test@example.com";
        testUser.setEmailVerified(true);
        testUser.setAccountStatus(AccountStatus.VERIFIED);

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

        // When
        boolean result = emailVerificationService.resendVerificationEmail(email);

        // Then
        assertFalse(result);
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendEmailVerificationEmail(any(User.class), anyString());
    }

    @Test
    void resendVerificationEmail_RateLimited() {
        // Given
        String email = "test@example.com";
        testUser.setEmailVerificationSentAt(LocalDateTime.now().minusMinutes(2)); // Recently sent

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));

        // When
        boolean result = emailVerificationService.resendVerificationEmail(email);

        // Then
        assertFalse(result);
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendEmailVerificationEmail(any(User.class), anyString());
    }

    @Test
    void isEmailVerified_UserExists() {
        // Given
        Long userId = 1L;
        testUser.setEmailVerified(true);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // When
        boolean result = emailVerificationService.isEmailVerified(userId);

        // Then
        assertTrue(result);
    }

    @Test
    void isEmailVerified_UserNotExists() {
        // Given
        Long userId = 999L;
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When
        boolean result = emailVerificationService.isEmailVerified(userId);

        // Then
        assertFalse(result);
    }

    @Test
    void isEmailVerified_UserNotVerified() {
        // Given
        Long userId = 1L;
        testUser.setEmailVerified(false);
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // When
        boolean result = emailVerificationService.isEmailVerified(userId);

        // Then
        assertFalse(result);
    }

    @Test
    void verifyEmail_NullToken() {
        // When
        var result = emailVerificationService.verifyEmail(null);

        // Then
        assertFalse(result.isSuccess());
        assertNotNull(result.getMessage());
        verify(userRepository, never()).findByEmailVerificationToken(any());
    }

    @Test
    void verifyEmail_EmptyToken() {
        // When
        var result = emailVerificationService.verifyEmail("");

        // Then
        assertFalse(result.isSuccess());
        assertNotNull(result.getMessage());
        verify(userRepository, never()).findByEmailVerificationToken(any());
    }

    @Test
    void verifyEmail_InvalidToken_WithRecentlyVerifiedUser() {
        // Given
        String token = "invalid-token";
        User recentlyVerifiedUser = new User();
        recentlyVerifiedUser.setUsername("recentuser");
        recentlyVerifiedUser.setEmail("recent@example.com");
        recentlyVerifiedUser.setEmailVerified(true);
        recentlyVerifiedUser.setEmailVerifiedAt(LocalDateTime.now().minusMinutes(2));

        when(userRepository.findByEmailVerificationToken(token)).thenReturn(Optional.empty());
        when(userRepository.findTopByEmailVerifiedTrueAndEmailVerifiedAtAfterOrderByEmailVerifiedAtDesc(any()))
            .thenReturn(Optional.of(recentlyVerifiedUser));

        // When
        var result = emailVerificationService.verifyEmail(token);

        // Then
        assertTrue(result.isSuccess());
        assertNotNull(result.getMessage());
        assertTrue(result.getMessage().contains("successfully verified"));
        assertEquals("recent@example.com", result.getEmail());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void sendVerificationEmail_NullUser() {
        // When
        boolean result = emailVerificationService.sendVerificationEmail(null);

        // Then
        assertFalse(result);
        verify(userRepository, never()).save(any(User.class));
        verify(emailService, never()).sendEmailVerificationEmail(any(User.class), anyString());
    }
}

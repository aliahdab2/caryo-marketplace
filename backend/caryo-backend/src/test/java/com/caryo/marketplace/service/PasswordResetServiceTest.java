package com.caryo.marketplace.service;

import com.caryo.marketplace.model.PasswordResetToken;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.repository.PasswordResetTokenRepository;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.util.PasswordValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordValidator passwordValidator;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User testUser;
    private PasswordResetToken testToken;

    @BeforeEach
    void setUp() {
        // Set frontend URL for testing
        ReflectionTestUtils.setField(passwordResetService, "frontendUrl", "http://localhost:3000");

        // Create test user
        testUser = new User("testuser", "test@example.com", "encodedPassword");
        testUser.setId(1L);

        // Create test token
        testToken = new PasswordResetToken("test-token", testUser, LocalDateTime.now().plusHours(1));
        testToken.setId(1L);
    }

    @Test
    void initiatePasswordReset_WithValidEmail_ShouldCreateTokenAndSendEmail() {
        // Arrange
        String email = "test@example.com";
        String clientIp = "192.168.1.1";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(tokenRepository.findValidTokenByUser(eq(testUser), any(LocalDateTime.class)))
            .thenReturn(Optional.empty());
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);
        doNothing().when(emailService).sendPasswordResetEmail(anyString(), anyString(), anyString(), anyString());

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(email, clientIp);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("If the email exists, a password reset link has been sent.", result.getMessage());

        verify(userRepository).findByEmail(email);
        verify(tokenRepository).invalidateAllUserTokens(testUser);
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq(testUser.getEmail()), eq(testUser.getUsername()), anyString(), anyString());
    }

    @Test
    void initiatePasswordReset_WithNonExistentEmail_ShouldReturnSuccessWithoutCreatingToken() {
        // Arrange
        String email = "nonexistent@example.com";
        String clientIp = "192.168.1.1";

        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(email, clientIp);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("If the email exists, a password reset link has been sent.", result.getMessage());

        verify(userRepository).findByEmail(email);
        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
        verify(emailService, never()).sendPasswordResetEmail(anyString(), anyString(), anyString());
    }

    @Test
    void initiatePasswordReset_WithEmptyEmail_ShouldReturnError() {
        // Arrange
        String email = "";
        String clientIp = "192.168.1.1";

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(email, clientIp);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Invalid email address", result.getMessage());

        verify(userRepository, never()).findByEmail(anyString());
    }

    @Test
    void initiatePasswordReset_WithExistingValidToken_ShouldNotCreateNewToken() {
        // Arrange
        String email = "test@example.com";
        String clientIp = "192.168.1.1";

        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(tokenRepository.findValidTokenByUser(eq(testUser), any(LocalDateTime.class)))
            .thenReturn(Optional.of(testToken));

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(email, clientIp);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("If the email exists, a password reset link has been sent.", result.getMessage());

        verify(tokenRepository, never()).save(any(PasswordResetToken.class));
    }

    @Test
    void initiatePasswordReset_RateLimitExceeded_ShouldReturnRateLimited() {
        // Arrange
        String email = "test@example.com";
        String clientIp = "192.168.1.1";

        // Simulate rate limit exceeded by calling the method multiple times
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(tokenRepository.findValidTokenByUser(eq(testUser), any(LocalDateTime.class)))
            .thenReturn(Optional.empty());
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);

        // First 3 calls should succeed (MAX_ATTEMPTS_PER_EMAIL = 3)
        for (int i = 0; i < 3; i++) {
            PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(email, clientIp);
            assertTrue(result.isSuccess());
        }

        // 4th call should be rate limited
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(email, clientIp);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.isRateLimited());
        assertTrue(result.getMessage().contains("Too many password reset attempts"));
    }

    @Test
    void validateResetToken_WithValidToken_ShouldReturnTrue() {
        // Arrange
        String token = "valid-token";
        PasswordResetToken validToken = new PasswordResetToken(token, testUser, LocalDateTime.now().plusHours(1));

        when(tokenRepository.findByTokenAndUsedFalse(token)).thenReturn(Optional.of(validToken));

        // Act
        boolean result = passwordResetService.validateResetToken(token);

        // Assert
        assertTrue(result);
        verify(tokenRepository).findByTokenAndUsedFalse(token);
    }

    @Test
    void validateResetToken_WithInvalidToken_ShouldReturnFalse() {
        // Arrange
        String token = "invalid-token";

        when(tokenRepository.findByTokenAndUsedFalse(token)).thenReturn(Optional.empty());

        // Act
        boolean result = passwordResetService.validateResetToken(token);

        // Assert
        assertFalse(result);
        verify(tokenRepository).findByTokenAndUsedFalse(token);
    }

    @Test
    void validateResetToken_WithExpiredToken_ShouldReturnFalse() {
        // Arrange
        String token = "expired-token";
        PasswordResetToken expiredToken = new PasswordResetToken(token, testUser, LocalDateTime.now().minusHours(1));

        when(tokenRepository.findByTokenAndUsedFalse(token)).thenReturn(Optional.of(expiredToken));

        // Act
        boolean result = passwordResetService.validateResetToken(token);

        // Assert
        assertFalse(result);
    }

    @Test
    void resetPassword_WithValidTokenAndPassword_ShouldResetPassword() {
        // Arrange
        String token = "valid-token";
        String newPassword = "NewPassword123!";
        String clientIp = "192.168.1.1";
        String encodedPassword = "encodedNewPassword";

        PasswordResetToken validToken = new PasswordResetToken(token, testUser, LocalDateTime.now().plusHours(1));

        when(tokenRepository.findByTokenAndUsedFalse(token)).thenReturn(Optional.of(validToken));
        when(passwordValidator.validatePassword(newPassword))
            .thenReturn(new PasswordValidator.PasswordValidationResult(true, java.util.Collections.emptyList()));
        when(passwordEncoder.matches(newPassword, testUser.getPassword())).thenReturn(false);
        when(passwordEncoder.encode(newPassword)).thenReturn(encodedPassword);
        when(userRepository.save(testUser)).thenReturn(testUser);
        when(tokenRepository.save(validToken)).thenReturn(validToken);
        doNothing().when(emailService).sendPasswordResetConfirmationEmail(anyString(), anyString(), anyString());

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.resetPassword(token, newPassword, clientIp);

        // Assert
        assertTrue(result.isSuccess());
        assertEquals("Password has been reset successfully!", result.getMessage());
        assertTrue(validToken.isUsed());

        verify(passwordValidator).validatePassword(newPassword);
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(testUser);
        verify(tokenRepository).save(validToken);
        verify(tokenRepository).invalidateAllUserTokens(testUser);
        verify(emailService).sendPasswordResetConfirmationEmail(eq(testUser.getEmail()), eq(testUser.getUsername()), anyString());
    }

    @Test
    void resetPassword_WithInvalidToken_ShouldReturnError() {
        // Arrange
        String token = "invalid-token";
        String newPassword = "NewPassword123!";
        String clientIp = "192.168.1.1";

        when(passwordValidator.validatePassword(newPassword))
            .thenReturn(new PasswordValidator.PasswordValidationResult(true, java.util.Collections.emptyList()));
        when(tokenRepository.findByTokenAndUsedFalse(token)).thenReturn(Optional.empty());

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.resetPassword(token, newPassword, clientIp);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Invalid or expired reset token", result.getMessage());

        verify(passwordValidator).validatePassword(newPassword);
        verify(tokenRepository).findByTokenAndUsedFalse(token);
    }

    @Test
    void resetPassword_WithWeakPassword_ShouldReturnError() {
        // Arrange
        String token = "valid-token";
        String weakPassword = "123";
        String clientIp = "192.168.1.1";

        when(passwordValidator.validatePassword(weakPassword))
            .thenReturn(new PasswordValidator.PasswordValidationResult(false,
                java.util.Arrays.asList("Password too short", "Missing uppercase letter")));

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.resetPassword(token, weakPassword, clientIp);

        // Assert
        assertFalse(result.isSuccess());
        assertTrue(result.getMessage().contains("Password does not meet security requirements"));

        verify(passwordValidator).validatePassword(weakPassword);
        verify(tokenRepository, never()).findByTokenAndUsedFalse(anyString());
    }

    @Test
    void resetPassword_WithSamePassword_ShouldReturnError() {
        // Arrange
        String token = "valid-token";
        String samePassword = "SamePassword123!";
        String clientIp = "192.168.1.1";

        PasswordResetToken validToken = new PasswordResetToken(token, testUser, LocalDateTime.now().plusHours(1));

        when(tokenRepository.findByTokenAndUsedFalse(token)).thenReturn(Optional.of(validToken));
        when(passwordValidator.validatePassword(samePassword))
            .thenReturn(new PasswordValidator.PasswordValidationResult(true, java.util.Collections.emptyList()));
        when(passwordEncoder.matches(samePassword, testUser.getPassword())).thenReturn(true);

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.resetPassword(token, samePassword, clientIp);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("New password must be different from your current password", result.getMessage());

        verify(passwordValidator).validatePassword(samePassword);
        verify(passwordEncoder).matches(samePassword, testUser.getPassword());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void resetPassword_WithExpiredToken_ShouldReturnError() {
        // Arrange
        String token = "expired-token";
        String newPassword = "NewPassword123!";
        String clientIp = "192.168.1.1";

        PasswordResetToken expiredToken = new PasswordResetToken(token, testUser, LocalDateTime.now().minusHours(1));

        when(passwordValidator.validatePassword(newPassword))
            .thenReturn(new PasswordValidator.PasswordValidationResult(true, java.util.Collections.emptyList()));
        when(tokenRepository.findByTokenAndUsedFalse(token)).thenReturn(Optional.of(expiredToken));

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.resetPassword(token, newPassword, clientIp);

        // Assert
        assertFalse(result.isSuccess());
        assertEquals("Invalid or expired reset token", result.getMessage());

        verify(passwordValidator).validatePassword(newPassword);
        verify(tokenRepository).findByTokenAndUsedFalse(token);
    }

    @Test
    void cleanupExpiredTokens_ShouldCallRepository() {
        // Arrange
        doNothing().when(tokenRepository).deleteExpiredAndUsedTokens(any(LocalDateTime.class));

        // Act
        passwordResetService.cleanupExpiredTokens();

        // Assert
        verify(tokenRepository).deleteExpiredAndUsedTokens(any(LocalDateTime.class));
    }

    @Test
    void getEmailAttemptCount_WithNoAttempts_ShouldReturnZero() {
        // Act
        int count = passwordResetService.getEmailAttemptCount("test@example.com");

        // Assert
        assertEquals(0, count);
    }

    @Test
    void getIpAttemptCount_WithNoAttempts_ShouldReturnZero() {
        // Act
        int count = passwordResetService.getIpAttemptCount("192.168.1.1");

        // Assert
        assertEquals(0, count);
    }

    // ==========================================
    // LANGUAGE DETECTION TESTS
    // ==========================================

    @Test
    void passwordReset_WithArabicEmail_ShouldSendArabicEmail() {
        // Arrange
        String arabicEmail = "test@test.sa"; // Saudi domain should trigger Arabic
        when(userRepository.findByEmail(arabicEmail)).thenReturn(Optional.of(testUser));
        when(tokenRepository.findValidTokenByUser(any(), any())).thenReturn(Optional.empty());
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);
        doNothing().when(emailService).sendPasswordResetEmail(any(), any(), any(), any());

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(arabicEmail, "5.1.1.1");

        // Assert
        assertTrue(result.isSuccess());
        verify(emailService).sendPasswordResetEmail(
            eq(testUser.getEmail()),
            eq(testUser.getUsername()),
            anyString(),
            eq("ar") // Should detect Arabic from Saudi domain
        );
    }

    @Test
    void passwordReset_WithMiddleEastIp_ShouldSendArabicEmail() {
        // Arrange
        String internationalEmail = "test@gmail.com";
        when(userRepository.findByEmail(internationalEmail)).thenReturn(Optional.of(testUser));
        when(tokenRepository.findValidTokenByUser(any(), any())).thenReturn(Optional.empty());
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);
        doNothing().when(emailService).sendPasswordResetEmail(any(), any(), any(), any());

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(internationalEmail, "5.1.1.1"); // Saudi IP

        // Assert
        assertTrue(result.isSuccess());
        verify(emailService).sendPasswordResetEmail(
            eq(testUser.getEmail()),
            eq(testUser.getUsername()),
            anyString(),
            eq("ar") // Should detect Arabic from Middle East IP
        );
    }

    @Test
    void passwordReset_WithInternationalEmailAndIp_ShouldSendEnglishEmail() {
        // Arrange
        String internationalEmail = "test@gmail.com";
        when(userRepository.findByEmail(internationalEmail)).thenReturn(Optional.of(testUser));
        when(tokenRepository.findValidTokenByUser(any(), any())).thenReturn(Optional.empty());
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);
        doNothing().when(emailService).sendPasswordResetEmail(any(), any(), any(), any());

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(internationalEmail, "8.8.8.8"); // Google DNS (International)

        // Assert
        assertTrue(result.isSuccess());
        verify(emailService).sendPasswordResetEmail(
            eq(testUser.getEmail()),
            eq(testUser.getUsername()),
            anyString(),
            eq("en") // Should default to English for international
        );
    }

    @Test
    void passwordReset_WithUserHavingArabicPreference_ShouldSendArabicEmail() {
        // Arrange
        User userWithArabicPreference = new User();
        userWithArabicPreference.setId(2L);
        userWithArabicPreference.setUsername("arabic-user");
        userWithArabicPreference.setEmail("user@test.com");
        userWithArabicPreference.setPreferredLanguage("ar");

        String internationalEmail = "user@test.com";
        when(userRepository.findByEmail(internationalEmail)).thenReturn(Optional.of(userWithArabicPreference));
        when(tokenRepository.findValidTokenByUser(any(), any())).thenReturn(Optional.empty());
        when(tokenRepository.save(any(PasswordResetToken.class))).thenReturn(testToken);
        doNothing().when(emailService).sendPasswordResetEmail(any(), any(), any(), any());

        // Act
        PasswordResetService.PasswordResetResult result = passwordResetService.initiatePasswordReset(internationalEmail, "8.8.8.8");

        // Assert
        assertTrue(result.isSuccess());
        verify(emailService).sendPasswordResetEmail(
            eq(userWithArabicPreference.getEmail()),
            eq(userWithArabicPreference.getUsername()),
            anyString(),
            eq("ar") // Should use user's Arabic preference
        );
    }
}

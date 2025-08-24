package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.model.PasswordResetToken;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.ForgotPasswordRequest;
import com.autotrader.autotraderbackend.payload.request.ResetPasswordRequest;
import com.autotrader.autotraderbackend.repository.PasswordResetTokenRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.PasswordResetService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.containsString;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PasswordResetIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PasswordResetService passwordResetService;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Clean up any existing data
        tokenRepository.deleteAll();
        userRepository.deleteAll();
        
        // Clear rate limiting cache
        passwordResetService.clearRateLimitCache();

        // Create test user
        testUser = new User("testuser", "test@example.com", passwordEncoder.encode("OldSecureP@ssw0rd!"));
        testUser = userRepository.save(testUser);
    }

    @Test
    void forgotPassword_WithValidEmail_ShouldReturn200AndCreateToken() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email exists, a password reset link has been sent."));

        // Verify token was created
        Optional<PasswordResetToken> token = tokenRepository.findValidTokenByUser(testUser, LocalDateTime.now());
        assertTrue(token.isPresent());
        assertFalse(token.get().isUsed());
        assertTrue(token.get().getExpiryDate().isAfter(LocalDateTime.now()));
    }

    @Test
    void forgotPassword_WithNonExistentEmail_ShouldReturn200WithoutCreatingToken() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("nonexistent@example.com");

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If the email exists, a password reset link has been sent."));

        // Verify no token was created
        assertEquals(0, tokenRepository.count());
    }

    @Test
    void forgotPassword_WithInvalidEmail_ShouldReturn400() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("invalid-email");

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void forgotPassword_RateLimitExceeded_ShouldReturn429() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest();
        request.setEmail("test@example.com");

        // Act - Make multiple requests to exceed rate limit (MAX_ATTEMPTS_PER_EMAIL = 3)
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/forgot-password")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk());
        }

        // 4th request should be rate limited
        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(containsString("Too many password reset attempts")));
    }

    @Test
    void validateResetToken_WithValidToken_ShouldReturn200() throws Exception {
        // Arrange
        PasswordResetToken token = new PasswordResetToken("valid-token", testUser, LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);

        // Act & Assert
        mockMvc.perform(get("/api/auth/reset-password/validate")
                .param("token", "valid-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Token is valid"));
    }

    @Test
    void validateResetToken_WithInvalidToken_ShouldReturn400() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/auth/reset-password/validate")
                .param("token", "invalid-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Invalid or expired reset token"));
    }

    @Test
    void validateResetToken_WithExpiredToken_ShouldReturn400() throws Exception {
        // Arrange
        PasswordResetToken expiredToken = new PasswordResetToken("expired-token", testUser, LocalDateTime.now().minusHours(1));
        tokenRepository.save(expiredToken);

        // Act & Assert
        mockMvc.perform(get("/api/auth/reset-password/validate")
                .param("token", "expired-token"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Error: Invalid or expired reset token"));
    }

    @Test
    void resetPassword_WithValidTokenAndPassword_ShouldReturn200AndUpdatePassword() throws Exception {
        // Arrange
        PasswordResetToken token = new PasswordResetToken("valid-token", testUser, LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("NewSecureP@ssw0rd!");

        String oldPasswordHash = testUser.getPassword();

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password has been reset successfully!"));

        // Verify password was changed
        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertNotEquals(oldPasswordHash, updatedUser.getPassword());
        assertTrue(passwordEncoder.matches("NewSecureP@ssw0rd!", updatedUser.getPassword()));

        // Verify token was marked as used
        PasswordResetToken updatedToken = tokenRepository.findByToken("valid-token").orElseThrow();
        assertTrue(updatedToken.isUsed());
    }

    @Test
    void resetPassword_WithInvalidToken_ShouldReturn400() throws Exception {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("invalid-token");
        request.setNewPassword("NewSecureP@ssw0rd!");

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired reset token"));
    }

    @Test
    void resetPassword_WithWeakPassword_ShouldReturn400() throws Exception {
        // Arrange
        PasswordResetToken token = new PasswordResetToken("valid-token", testUser, LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("weak");

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("Password must be between 8 and 128 characters")));
    }

    @Test
    void resetPassword_WithSamePassword_ShouldReturn400() throws Exception {
        // Arrange
        PasswordResetToken token = new PasswordResetToken("valid-token", testUser, LocalDateTime.now().plusHours(1));
        tokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("valid-token");
        request.setNewPassword("OldSecureP@ssw0rd!"); // Same as current password

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("New password must be different from your current password"));
    }

    @Test
    void resetPassword_WithUsedToken_ShouldReturn400() throws Exception {
        // Arrange
        PasswordResetToken usedToken = new PasswordResetToken("used-token", testUser, LocalDateTime.now().plusHours(1));
        usedToken.setUsed(true);
        tokenRepository.save(usedToken);

        ResetPasswordRequest request = new ResetPasswordRequest();
        request.setToken("used-token");
        request.setNewPassword("NewSecureP@ssw0rd!");

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired reset token"));
    }

    @Test
    void completePasswordResetFlow_ShouldWorkEndToEnd() throws Exception {
        // Step 1: Request password reset
        ForgotPasswordRequest forgotRequest = new ForgotPasswordRequest();
        forgotRequest.setEmail("test@example.com");

        mockMvc.perform(post("/api/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(forgotRequest)))
                .andExpect(status().isOk());

        // Step 2: Get the generated token
        PasswordResetToken token = tokenRepository.findValidTokenByUser(testUser, LocalDateTime.now()).orElseThrow();

        // Step 3: Validate the token
        mockMvc.perform(get("/api/auth/reset-password/validate")
                .param("token", token.getToken()))
                .andExpect(status().isOk());

        // Step 4: Reset the password
        ResetPasswordRequest resetRequest = new ResetPasswordRequest();
        resetRequest.setToken(token.getToken());
        resetRequest.setNewPassword("NewSecureP@ssw0rd2!");

        String oldPasswordHash = testUser.getPassword();

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(resetRequest)))
                .andExpect(status().isOk());

        // Step 5: Verify password was changed and token was invalidated
        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertNotEquals(oldPasswordHash, updatedUser.getPassword());
        assertTrue(passwordEncoder.matches("NewSecureP@ssw0rd2!", updatedUser.getPassword()));

        PasswordResetToken updatedToken = tokenRepository.findByToken(token.getToken()).orElseThrow();
        assertTrue(updatedToken.isUsed());

        // Step 6: Verify token cannot be used again
        ResetPasswordRequest secondResetRequest = new ResetPasswordRequest();
        secondResetRequest.setToken(token.getToken());
        secondResetRequest.setNewPassword("AnotherSecureP@ssw0rd!");

        mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(secondResetRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid or expired reset token"));
    }
}

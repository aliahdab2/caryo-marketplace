package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.Role;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.response.JwtResponse;
import com.caryo.marketplace.payload.response.MessageResponse;
import com.caryo.marketplace.security.jwt.JwtUtils;
import com.caryo.marketplace.service.EmailVerificationService;
import com.caryo.marketplace.service.EmailVerificationService.VerificationResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmailVerificationControllerTest {

    @Mock
    private EmailVerificationService emailVerificationService;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private EmailVerificationController emailVerificationController;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setEmailVerified(true);

        Role userRole = new Role();
        userRole.setName("ROLE_USER");
        testUser.setRoles(Set.of(userRole));
    }

    @Nested
    @DisplayName("GET /api/auth/verify-email")
    class VerifyEmail {

        @Test
        @DisplayName("Should verify email and return JWT for auto-login")
        void verifyEmail_Success() {
            VerificationResult result = mock(VerificationResult.class);
            when(result.isSuccess()).thenReturn(true);
            when(result.getUser()).thenReturn(testUser);
            when(emailVerificationService.verifyEmail("valid-token")).thenReturn(result);
            when(jwtUtils.generateJwtTokenForUser(testUser)).thenReturn("jwt-token-123");

            ResponseEntity<?> response = emailVerificationController.verifyEmail("valid-token");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertInstanceOf(JwtResponse.class, response.getBody());
        }

        @Test
        @DisplayName("Should fallback to message when JWT generation fails")
        void verifyEmail_JwtGenerationFails() {
            VerificationResult result = mock(VerificationResult.class);
            when(result.isSuccess()).thenReturn(true);
            when(result.getUser()).thenReturn(testUser);
            when(emailVerificationService.verifyEmail("valid-token")).thenReturn(result);
            when(jwtUtils.generateJwtTokenForUser(testUser)).thenThrow(new RuntimeException("JWT error"));

            ResponseEntity<?> response = emailVerificationController.verifyEmail("valid-token");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertInstanceOf(MessageResponse.class, response.getBody());
        }

        @Test
        @DisplayName("Should handle already verified user with auto-login")
        void verifyEmail_AlreadyVerified_WithAutoLogin() {
            VerificationResult result = mock(VerificationResult.class);
            when(result.isSuccess()).thenReturn(true);
            when(result.getUser()).thenReturn(null);
            when(emailVerificationService.verifyEmail("already-used-token")).thenReturn(result);
            when(emailVerificationService.getUserByVerificationToken("already-used-token")).thenReturn(testUser);
            when(jwtUtils.generateJwtTokenForUser(testUser)).thenReturn("jwt-token-456");

            ResponseEntity<?> response = emailVerificationController.verifyEmail("already-used-token");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertInstanceOf(JwtResponse.class, response.getBody());
        }

        @Test
        @DisplayName("Should return error for invalid token")
        void verifyEmail_InvalidToken() {
            VerificationResult result = mock(VerificationResult.class);
            when(result.isSuccess()).thenReturn(false);
            when(result.getMessage()).thenReturn("Invalid or expired token");
            when(emailVerificationService.verifyEmail("bad-token")).thenReturn(result);

            ResponseEntity<?> response = emailVerificationController.verifyEmail("bad-token");

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
            assertInstanceOf(MessageResponse.class, response.getBody());
        }

        @Test
        @DisplayName("Should return error for empty token")
        void verifyEmail_EmptyToken() {
            ResponseEntity<?> response = emailVerificationController.verifyEmail("");

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/verify-email/resend")
    class ResendVerificationEmail {

        @Test
        @DisplayName("Should resend verification email successfully")
        void resend_Success() {
            when(emailVerificationService.resendVerificationEmail("test@example.com")).thenReturn(true);

            ResponseEntity<?> response = emailVerificationController.resendVerificationEmail("test@example.com");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            verify(emailVerificationService).resendVerificationEmail("test@example.com");
        }

        @Test
        @DisplayName("Should return error when resend fails")
        void resend_Failed() {
            when(emailVerificationService.resendVerificationEmail("verified@example.com")).thenReturn(false);

            ResponseEntity<?> response = emailVerificationController.resendVerificationEmail("verified@example.com");

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        }

        @Test
        @DisplayName("Should return error for empty email")
        void resend_EmptyEmail() {
            ResponseEntity<?> response = emailVerificationController.resendVerificationEmail("");

            assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        }
    }

    @Nested
    @DisplayName("GET /api/auth/verify-email/verification-status")
    class CheckVerificationStatus {

        @Test
        @DisplayName("Should return status response")
        void checkStatus_Success() {
            ResponseEntity<?> response = emailVerificationController.checkVerificationStatus("test@example.com");

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }
    }
}

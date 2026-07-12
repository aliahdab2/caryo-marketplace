package com.caryo.marketplace.security.jwt;

import com.caryo.marketplace.exception.jwt.ExpiredJwtTokenException;
import com.caryo.marketplace.exception.jwt.MalformedJwtTokenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.lenient;

@ExtendWith(MockitoExtension.class)
public class JwtUtilsTest {

    @Mock
    private Authentication authentication;

    private JwtUtils jwtUtils;

    private UserDetails userDetails;
    private final String testSecret = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA=="; // Base64 encoded secret for testing

    @BeforeEach
    void setUp() {
        // Create JwtUtils instance
        jwtUtils = new JwtUtils();

        // Set up the required fields using ReflectionTestUtils
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 60000); // 1 minute
        ReflectionTestUtils.setField(jwtUtils, "jwtRefreshExpirationMs", 3600000L); // 1 hour

        // Set up the UserDetails
        userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("testuser")
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        lenient().when(authentication.getPrincipal()).thenReturn(userDetails);
    }

    @Test
    void generateJwtToken_ShouldReturnValidJwtToken() {
        // Act
        String token = jwtUtils.generateJwtToken(authentication);

        // Assert
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void generateRefreshToken_ShouldProduceValidRefreshToken() {
        // Act
        String refreshToken = jwtUtils.generateRefreshToken("testuser", 3);

        // Assert
        assertTrue(jwtUtils.validateJwtToken(refreshToken));
        assertTrue(jwtUtils.isRefreshToken(refreshToken));
        assertEquals("testuser", jwtUtils.getUserNameFromJwtToken(refreshToken));
        assertEquals(3, jwtUtils.getTokenVersionFromJwtToken(refreshToken));
    }

    @Test
    void isRefreshToken_WithAccessToken_ShouldReturnFalse() {
        // Access tokens carry no type claim and must never be treated as refresh tokens
        String accessToken = jwtUtils.generateJwtToken(authentication);

        assertFalse(jwtUtils.isRefreshToken(accessToken));
    }

    @Test
    void isRefreshToken_WithBlankToken_ShouldReturnFalse() {
        assertFalse(jwtUtils.isRefreshToken(null));
        assertFalse(jwtUtils.isRefreshToken(""));
    }

    @Test
    void getUserNameFromJwtToken_ShouldReturnCorrectUsername() {
        // Arrange
        String token = jwtUtils.generateJwtToken(authentication);

        // Act
        String username = jwtUtils.getUserNameFromJwtToken(token);

        // Assert
        assertEquals("testuser", username);
    }

    @Test
    void validateJwtToken_WithValidToken_ShouldReturnTrue() {
        // Arrange
        String token = jwtUtils.generateJwtToken(authentication);

        // Act & Assert
        assertDoesNotThrow(() -> jwtUtils.validateJwtToken(token));
    }

    @Test
    void validateJwtToken_WithInvalidToken_ShouldThrowMalformedJwtTokenException() {
        // Arrange
        String invalidToken = "invalid.token.here";

        // Act & Assert
        assertThrows(MalformedJwtTokenException.class, () -> {
            jwtUtils.validateJwtToken(invalidToken);
        });
    }

    @Test
    void validateJwtToken_WithExpiredToken_ShouldThrowExpiredJwtTokenException() throws Exception {
        // Arrange
        // Set a very short expiration time for the test
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 1); // 1 millisecond

        String token = jwtUtils.generateJwtToken(authentication);

        // Wait for the token to expire with enhanced retry logic for CI stability
        int maxRetries = 20; // Increased retries for CI environments
        int retryCount = 0;
        boolean tokenExpired = false;

        while (retryCount < maxRetries && !tokenExpired) {
            try {
                Thread.sleep(100); // Slightly longer sleep for CI stability
                jwtUtils.validateJwtToken(token);
                retryCount++;
            } catch (ExpiredJwtTokenException e) {
                tokenExpired = true;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }

        // Ensure we actually waited for expiration
        assertTrue(tokenExpired, "Token should have expired within the retry period");

        // Act & Assert - Now test that the token is definitely expired
        assertThrows(ExpiredJwtTokenException.class, () -> {
            jwtUtils.validateJwtToken(token);
        });
    }
}

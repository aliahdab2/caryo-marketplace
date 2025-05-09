package com.autotrader.autotraderbackend.security.jwt;

import com.autotrader.autotraderbackend.exception.jwt.ExpiredJwtTokenException;
import com.autotrader.autotraderbackend.exception.jwt.MalformedJwtTokenException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
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

    @InjectMocks
    private JwtUtils jwtUtils;

    private UserDetails userDetails;
    private final String testSecret = "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU2Nzg5MA=="; // Base64 encoded secret for testing

    @BeforeEach
    void setUp() {
        // Set up the UserDetails
        userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("testuser")
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();
        
        lenient().when(authentication.getPrincipal()).thenReturn(userDetails);
        
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 60000); // 1 minute
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
        
        // Wait for the token to expire
        Thread.sleep(100); // Increased sleep time to ensure expiration
        
        // Act & Assert
        assertThrows(ExpiredJwtTokenException.class, () -> {
            jwtUtils.validateJwtToken(token);
        });
    }
}

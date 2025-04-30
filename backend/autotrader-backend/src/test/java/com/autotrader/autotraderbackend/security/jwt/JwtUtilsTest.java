package com.autotrader.autotraderbackend.security.jwt;

import io.jsonwebtoken.ExpiredJwtException;
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
import static org.mockito.Mockito.when;

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
        
        when(authentication.getPrincipal()).thenReturn(userDetails);
        
        // Set values for the properties annotated with @Value
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 60000); // 1 minute
    }

    @Test
    void generateJwtToken_ShouldReturnValidJwtToken() {
        // Act
        String token = jwtUtils.generateJwtToken(authentication);
        
        // Assert
        assertNotNull(token);
        assertTrue(token.length() > 0);
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
        
        // Act
        boolean isValid = jwtUtils.validateJwtToken(token);
        
        // Assert
        assertTrue(isValid);
    }

    @Test
    void validateJwtToken_WithInvalidToken_ShouldReturnFalse() {
        // Arrange
        String invalidToken = "invalid.token.here";
        
        // Act
        boolean isValid = jwtUtils.validateJwtToken(invalidToken);
        
        // Assert
        assertFalse(isValid);
    }

    @Test
    void validateJwtToken_WithExpiredToken_ShouldReturnFalse() throws Exception {
        // Arrange
        // Set a very short expiration time for the test
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 1); // 1 millisecond
        
        String token = jwtUtils.generateJwtToken(authentication);
        
        // Wait for the token to expire
        Thread.sleep(10);
        
        // Act
        boolean isValid = jwtUtils.validateJwtToken(token);
        
        // Assert
        assertFalse(isValid);
    }
}

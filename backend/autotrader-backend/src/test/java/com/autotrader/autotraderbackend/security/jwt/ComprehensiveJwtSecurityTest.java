package com.autotrader.autotraderbackend.security.jwt;

import com.autotrader.autotraderbackend.exception.jwt.ExpiredJwtTokenException;
import com.autotrader.autotraderbackend.exception.jwt.InvalidJwtSignatureException;
import com.autotrader.autotraderbackend.exception.jwt.MalformedJwtTokenException;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.autotrader.autotraderbackend.security.services.UserDetailsServiceImpl;
import org.apache.commons.lang3.StringUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Comprehensive tests for JWT security components including edge cases
 * and security vulnerabilities
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JWT Security Components")
class ComprehensiveJwtSecurityTest {

    // Constants for test data
    private static final String TEST_USERNAME = "testuser";
    private static final String TEST_PASSWORD = "password";
    private static final String TEST_EMAIL = "test@example.com";
    private static final String TEST_SECRET = "ThisIsAVeryLongSecretKeyForTestingJwtSecurityThisIsAVeryLongSecretKeyForTestingJwtSecurityThisIsAVeryLongSecretKey==";
    private static final String DIFFERENT_SECRET = "DifferentSecretKeyForTestingInvalidSignatureDifferentSecretKeyForTestingInvalidSignature==";
    private static final int JWT_EXPIRATION_MS = 60000; // 1 minute
    private static final int SHORT_EXPIRATION_MS = 1; // 1ms for testing expiration
    private static final String MALFORMED_TOKEN = "eyJhbGciOiJIUzI1NiIsIn.malformed.token";
    private static final String INVALID_TOKEN = "invalid.token.here";
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @InjectMocks
    private JwtUtils jwtUtils;

    private AuthTokenFilter authTokenFilter;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain filterChain;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        // Clear security context before each test
        SecurityContextHolder.clearContext();
        
        // Initialize HTTP components
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = mock(MockFilterChain.class);
        
        // Create user details
        userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(TEST_USERNAME)
                .password(TEST_PASSWORD)
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        // Configure JWT utils
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", JWT_EXPIRATION_MS);
        
        // Initialize auth token filter with dependencies
        authTokenFilter = new AuthTokenFilter(jwtUtils, userDetailsService);
    }
    
    @AfterEach
    void tearDown() {
        // Ensure we reset JWT settings after each test
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", JWT_EXPIRATION_MS);
    }

    /**
     * Helper method to create authentication token
     */
    private UsernamePasswordAuthenticationToken createAuthentication() {
        return new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
    }
    
    /**
     * Helper method to generate a valid JWT token
     */
    private String generateValidToken() {
        return jwtUtils.generateJwtToken(createAuthentication());
    }

    @Nested
    @DisplayName("JWT Token Generation Tests")
    class TokenGenerationTests {
        
        @Test
        @DisplayName("Should generate valid token and verify it")
        void generateValidToken_AndVerify() {
            // Generate token
            String token = generateValidToken();
            
            // Verify token is not null or empty
            assertNotNull(token, "Generated token should not be null");
            assertFalse(token.isEmpty(), "Generated token should not be empty");
            
            // Verify username can be extracted
            String extractedUsername = jwtUtils.getUserNameFromJwtToken(token);
            assertEquals(TEST_USERNAME, extractedUsername, "Extracted username should match test username");
            
            // Verify token is valid
            assertDoesNotThrow(() -> jwtUtils.validateJwtToken(token),
                    "Token validation should not throw an exception");
        }
        
        @Test
        @DisplayName("Should generate token with custom claims")
        void generateToken_WithCustomClaims() {
            // Create a user with additional information
            User user = new User();
            user.setId(1L);
            user.setUsername(TEST_USERNAME);
            user.setEmail(TEST_EMAIL);
            user.setPassword(TEST_PASSWORD);
            
            UserDetailsImpl userDetailsImpl = UserDetailsImpl.build(user);
            
            // Create authentication with UserDetailsImpl
            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetailsImpl, null, userDetailsImpl.getAuthorities()
            );
            
            // Generate token with the custom user details
            String token = jwtUtils.generateJwtToken(authentication);
            
            // Verify username can be extracted
            String extractedUsername = jwtUtils.getUserNameFromJwtToken(token);
            assertEquals(TEST_USERNAME, extractedUsername, "Extracted username should match the user's username");
        }
    }
    
    @Nested
    @DisplayName("JWT Token Validation Tests")
    class TokenValidationTests {
        
        @Test
        @DisplayName("Should throw exception for malformed token")
        void validateToken_WithMalformedToken() {
            // Validation should throw MalformedJwtTokenException
            MalformedJwtTokenException exception = assertThrows(
                    MalformedJwtTokenException.class,
                    () -> jwtUtils.validateJwtToken(MALFORMED_TOKEN),
                    "Validation should throw MalformedJwtTokenException for malformed token"
            );
            
            // Additional assertion on exception message could be added here
            assertNotNull(exception.getMessage(), "Exception message should not be null");
        }
        
        @Test
        @DisplayName("Should throw exception for expired token")
        void validateToken_WithExpiredToken() {
            // Temporarily set expiration to 1ms
            ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", SHORT_EXPIRATION_MS);
            
            // Generate token with very short expiration
            String token = generateValidToken();
            
            // Wait for token to expire
            try {
                Thread.sleep(100); // Ensure expiration
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            
            // Validation should throw ExpiredJwtTokenException
            ExpiredJwtTokenException exception = assertThrows(
                    ExpiredJwtTokenException.class,
                    () -> jwtUtils.validateJwtToken(token),
                    "Validation should throw ExpiredJwtTokenException for expired token"
            );
            
            assertNotNull(exception.getMessage(), "Exception message should not be null");
        }
        
        @Test
        @DisplayName("Should throw exception for invalid signature")
        void validateToken_WithInvalidSignature() {
            // Generate token with correct signature
            String token = generateValidToken();
            
            // Change the secret to simulate invalid signature
            ReflectionTestUtils.setField(jwtUtils, "jwtSecret", DIFFERENT_SECRET);
            
            // Validation should throw InvalidJwtSignatureException
            InvalidJwtSignatureException exception = assertThrows(
                    InvalidJwtSignatureException.class,
                    () -> jwtUtils.validateJwtToken(token),
                    "Validation should throw InvalidJwtSignatureException for invalid signature"
            );
            
            assertNotNull(exception.getMessage(), "Exception message should not be null");
        }
        
    @ParameterizedTest
    @ValueSource(strings = {"", "   ", "\t", "\n", " \t\n"})
    @DisplayName("Should throw exception for empty or whitespace token")
    void validateToken_WithEmptyOrWhitespace(String emptyOrWhitespaceToken) {
        // Test with empty or whitespace token
        MalformedJwtTokenException exception = assertThrows(
                MalformedJwtTokenException.class,
                () -> jwtUtils.validateJwtToken(emptyOrWhitespaceToken),
                "Validation should throw MalformedJwtTokenException for empty or whitespace token"
        );
        
        assertEquals("JWT token is null or empty", exception.getMessage(),
                "Exception message should indicate empty token");
        
        // Verify that StringUtils would also consider this blank
        assertTrue(StringUtils.isBlank(emptyOrWhitespaceToken),
                "StringUtils.isBlank should return true for this token");
    }
    
    @Test
    @DisplayName("Should throw exception for null character token")
    void validateToken_WithNullCharacter() {
        // Null character is a special case - StringUtils.isBlank does NOT treat it as blank
        String nullCharToken = "\u0000";
        
        // Should throw MalformedJwtTokenException with the specific message about null characters
        Exception exception = assertThrows(
                MalformedJwtTokenException.class,
                () -> jwtUtils.validateJwtToken(nullCharToken),
                "Validation should throw MalformedJwtTokenException for null character token"
        );
        
        // Check for the specific error message about null characters
        assertEquals("JWT token contains null characters", exception.getMessage(),
                "Exception message should indicate null characters in token");
        
        // Verify that StringUtils actually does NOT consider this blank
        assertFalse(StringUtils.isBlank(nullCharToken),
                "StringUtils.isBlank should return false for null character token");
    }
        
        @Test
        @DisplayName("Should throw exception for null token")
        void validateToken_WithNull() {
            // Test with null token
            MalformedJwtTokenException exception = assertThrows(
                    MalformedJwtTokenException.class,
                    () -> jwtUtils.validateJwtToken(null),
                    "Validation should throw MalformedJwtTokenException for null token"
            );
            
            assertEquals("JWT token is null or empty", exception.getMessage(),
                    "Exception message should indicate empty token");
        }
    }
    
    @Nested
    @DisplayName("AuthTokenFilter Tests")
    class AuthTokenFilterTests {
        
        @Test
        @DisplayName("Should set authentication for valid token")
        void doFilter_WithValidToken() throws Exception {
            // Generate token
            String token = generateValidToken();
            
            // Set up request with token
            request.addHeader(AUTHORIZATION_HEADER, BEARER_PREFIX + token);
            
            // Mock userDetailsService to return our user
            when(userDetailsService.loadUserByUsername(TEST_USERNAME)).thenReturn(userDetails);
            
            // Run filter
            authTokenFilter.doFilterInternal(request, response, filterChain);
            
            // Verify authentication was set in SecurityContext
            assertNotNull(SecurityContextHolder.getContext().getAuthentication(),
                    "Authentication should be set in SecurityContext");
            assertEquals(TEST_USERNAME, SecurityContextHolder.getContext().getAuthentication().getName(),
                    "Authentication name should match the username");
            
            // Verify service interactions
            verify(filterChain).doFilter(request, response);
            verify(userDetailsService).loadUserByUsername(TEST_USERNAME);
        }
        
        @Test
        @DisplayName("Should not set authentication when no token is provided")
        void doFilter_WithNoToken() throws Exception {
            // Run filter without token
            authTokenFilter.doFilterInternal(request, response, filterChain);
            
            // Verify no authentication was set
            assertNull(SecurityContextHolder.getContext().getAuthentication(),
                    "Authentication should not be set in SecurityContext");
            
            // Verify service interactions
            verify(filterChain).doFilter(request, response);
            verify(userDetailsService, never()).loadUserByUsername(anyString());
        }
        
        @Test
        @DisplayName("Should not set authentication for invalid token")
        void doFilter_WithInvalidToken() throws Exception {
            // Set up request with invalid token
            request.addHeader(AUTHORIZATION_HEADER, BEARER_PREFIX + INVALID_TOKEN);
            
            // Run filter
            authTokenFilter.doFilterInternal(request, response, filterChain);
            
            // Verify no authentication was set
            assertNull(SecurityContextHolder.getContext().getAuthentication(),
                    "Authentication should not be set in SecurityContext for invalid token");
            
            // Verify service interactions
            verify(filterChain).doFilter(request, response);
            verify(userDetailsService, never()).loadUserByUsername(anyString());
        }
        
        @ParameterizedTest
        @ValueSource(strings = {"Token xyz", "bearer token", "Bearer", "Bearer "})
        @DisplayName("Should not set authentication for malformed header")
        void doFilter_WithMalformedHeader(String malformedHeader) throws Exception {
            // Reset for each test
            SecurityContextHolder.clearContext();
            reset(filterChain, userDetailsService);
            
            // Set up request with malformed header
            request = new MockHttpServletRequest();
            request.addHeader(AUTHORIZATION_HEADER, malformedHeader);
            
            // Run filter
            authTokenFilter.doFilterInternal(request, response, filterChain);
            
            // Verify no authentication was set
            assertNull(SecurityContextHolder.getContext().getAuthentication(),
                    "Authentication should not be set in SecurityContext for malformed header");
            
            // Verify service interactions
            verify(filterChain).doFilter(request, response);
            verify(userDetailsService, never()).loadUserByUsername(anyString());
        }
        
        @Test
        @DisplayName("Should not set authentication when user is not found")
        void doFilter_UserNotFound() throws Exception {
            // Generate token
            String token = generateValidToken();
            
            // Set up request with token
            request.addHeader(AUTHORIZATION_HEADER, BEARER_PREFIX + token);
            
            // Mock userDetailsService to throw exception
            when(userDetailsService.loadUserByUsername(TEST_USERNAME))
                    .thenThrow(new RuntimeException("User not found"));
            
            // Run filter
            authTokenFilter.doFilterInternal(request, response, filterChain);
            
            // Verify no authentication was set
            assertNull(SecurityContextHolder.getContext().getAuthentication(),
                    "Authentication should not be set in SecurityContext when user is not found");
            
            // Verify service interactions
            verify(filterChain).doFilter(request, response);
            verify(userDetailsService).loadUserByUsername(TEST_USERNAME);
        }
    }
}

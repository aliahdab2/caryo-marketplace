package com.autotrader.autotraderbackend.security.jwt;

import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.security.services.UserDetailsImpl;
import com.autotrader.autotraderbackend.security.services.UserDetailsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import com.autotrader.autotraderbackend.exception.jwt.MalformedJwtTokenException;
import com.autotrader.autotraderbackend.exception.jwt.ExpiredJwtTokenException;
import com.autotrader.autotraderbackend.exception.jwt.InvalidJwtSignatureException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Comprehensive tests for JWT security components including edge cases
 * and security vulnerabilities
 */
@ExtendWith(MockitoExtension.class)
public class ComprehensiveJwtSecurityTest {

    @InjectMocks
    private JwtUtils jwtUtils;

    private AuthTokenFilter authTokenFilter;

    @Mock
    private UserDetailsServiceImpl userDetailsService;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain filterChain;
    private UserDetails userDetails;
    
    private final String testSecret = "ThisIsAVeryLongSecretKeyForTestingJwtSecurityThisIsAVeryLongSecretKeyForTestingJwtSecurityThisIsAVeryLongSecretKey==";
    private final int jwtExpirationMs = 60000; // 1 minute

    @BeforeEach
    void setUp() {
        // Clear security context before each test
        SecurityContextHolder.clearContext();
        
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = mock(MockFilterChain.class);
        
        // Create user details
        userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("testuser")
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();

        // Set JWT configuration via reflection
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", jwtExpirationMs);
        
        // Create AuthTokenFilter with proper dependencies
        authTokenFilter = new AuthTokenFilter(jwtUtils, userDetailsService);
    }

    @Test
    public void generateValidToken_AndVerify() {
        // Create authentication object
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        
        // Generate token
        String token = jwtUtils.generateJwtToken(authentication);
        
        // Verify token is not null or empty
        assertNotNull(token);
        assertFalse(token.isEmpty());
        
        // Verify username can be extracted
        String username = jwtUtils.getUserNameFromJwtToken(token);
        assertEquals("testuser", username);
        
        // Verify token is valid by ensuring no exception is thrown
        assertDoesNotThrow(() -> jwtUtils.validateJwtToken(token));
    }

    @Test
    public void validateToken_WithMalformedToken() {
        // Test with malformed token
        String malformedToken = "eyJhbGciOiJIUzI1NiIsIn.malformed.token";
        
        // Validation should throw MalformedJwtTokenException
        assertThrows(MalformedJwtTokenException.class, () -> {
            jwtUtils.validateJwtToken(malformedToken);
        });
        
        // Verify error logging (would need to use a logging test framework for better testing)
    }
    
    @Test
    public void validateToken_WithExpiredToken() {
        // Temporarily set expiration to 1ms for testing expiration
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", 1);
        
        // Create authentication
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        
        // Generate token with 1ms expiration
        String token = jwtUtils.generateJwtToken(authentication);
        
        // Wait for token to expire
        try {
            Thread.sleep(100); // Increased sleep time to ensure expiration
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        // Validation should throw ExpiredJwtTokenException
        assertThrows(ExpiredJwtTokenException.class, () -> {
            jwtUtils.validateJwtToken(token);
        });
        
        // Reset expiration
        ReflectionTestUtils.setField(jwtUtils, "jwtExpirationMs", jwtExpirationMs);
    }
    
    @Test
    public void validateToken_WithInvalidSignature() {
        // Generate token with correct signature
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        String token = jwtUtils.generateJwtToken(authentication);
        
        // Change the secret to simulate invalid signature
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", "DifferentSecretKeyForTestingInvalidSignatureDifferentSecretKeyForTestingInvalidSignature==");
        
        // Validation should throw InvalidJwtSignatureException
        assertThrows(InvalidJwtSignatureException.class, () -> {
            jwtUtils.validateJwtToken(token);
        });
        
        // Reset secret
        ReflectionTestUtils.setField(jwtUtils, "jwtSecret", testSecret);
    }
    
    @Test
    public void generateToken_WithCustomClaims() {
        // Setup UserDetailsImpl with additional claims
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");
        
        UserDetailsImpl userDetailsImpl = UserDetailsImpl.build(user);
        
        // Create authentication with UserDetailsImpl
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetailsImpl, null, userDetailsImpl.getAuthorities()
        );
        
        // Generate token
        String token = jwtUtils.generateJwtToken(authentication);
        
        // Verify username
        String username = jwtUtils.getUserNameFromJwtToken(token);
        assertEquals("testuser", username);
    }
    
    @Test
    public void doFilter_WithValidToken() throws Exception {
        // Generate token
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        String token = jwtUtils.generateJwtToken(authentication);
        
        // Set up request with token
        request.addHeader("Authorization", "Bearer " + token);
        
        // Mock userDetailsService to return our user
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        
        // Run filter
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Verify authentication was set in SecurityContext
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("testuser", SecurityContextHolder.getContext().getAuthentication().getName());
        
        // Verify filterChain was called
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService).loadUserByUsername("testuser");
    }
    
    @Test
    public void doFilter_WithNoToken() throws Exception {
        // Run filter without token
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Verify no authentication was set
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        
        // Verify filterChain was still called
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }
    
    @Test
    public void doFilter_WithInvalidToken() throws Exception {
        // Set up request with invalid token
        request.addHeader("Authorization", "Bearer invalid.token.here");
        
        // Run filter
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Verify no authentication was set
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        
        // Verify filterChain was still called
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        // We expect JwtUtils.validateJwtToken to be called and throw an exception,
        // which is caught and logged by AuthTokenFilter.
        // To verify this properly, we might need to spy on JwtUtils or check logs.
        // For now, we ensure no authentication is set.
    }
    
    @Test
    public void doFilter_WithMalformedHeader() throws Exception {
        // Test various malformed headers
        String[] malformedHeaders = {
            "Token xyz",
            "bearer token",
            "Bearer",
            "Bearer "
        };
        
        for (String header : malformedHeaders) {
            // Reset for each test
            SecurityContextHolder.clearContext();
            reset(filterChain, userDetailsService);
            
            // Set up request with malformed header
            request = new MockHttpServletRequest();
            request.addHeader("Authorization", header);
            
            // Run filter
            authTokenFilter.doFilterInternal(request, response, filterChain);
            
            // Verify no authentication was set
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            
            // Verify filterChain was still called
            verify(filterChain).doFilter(request, response);
            verify(userDetailsService, never()).loadUserByUsername(anyString());
        }
    }
    
    @Test
    public void doFilter_UserNotFound() throws Exception {
        // Generate token
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        String token = jwtUtils.generateJwtToken(authentication);
        
        // Set up request with token
        request.addHeader("Authorization", "Bearer " + token);
        
        // Mock userDetailsService to throw exception
        when(userDetailsService.loadUserByUsername("testuser")).thenThrow(new RuntimeException("User not found"));
        
        // Run filter
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Verify no authentication was set
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        
        // Verify filterChain was still called
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService).loadUserByUsername("testuser");
    }
    
    @Test
    public void validateToken_WithEmptyOrNull() {
        // Test with null token
        Exception exceptionNull = assertThrows(MalformedJwtTokenException.class, () -> {
            jwtUtils.validateJwtToken(null);
        });
        assertEquals("JWT token is null or empty", exceptionNull.getMessage());
        
        // Test with empty token
        Exception exceptionEmpty = assertThrows(MalformedJwtTokenException.class, () -> {
            jwtUtils.validateJwtToken("");
        });
        assertEquals("JWT token is null or empty", exceptionEmpty.getMessage());
        
        // Test with whitespace token
        Exception exceptionWhitespace = assertThrows(MalformedJwtTokenException.class, () -> {
            jwtUtils.validateJwtToken("   ");
        });
        // The message for whitespace might be different if it passes the initial null/empty check
        // and fails later in the parsing. Let's check the behavior of JwtUtils.
        // Based on current JwtUtils, it should also be "JWT token is null or empty" due to StringUtils.hasText check.
        assertEquals("JWT token is null or empty", exceptionWhitespace.getMessage());
    }
}

package com.autotrader.autotraderbackend.security.jwt;

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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Enhanced JWT token filter tests with better coverage of edge cases
 */
@ExtendWith(MockitoExtension.class)
public class EnhancedAuthTokenFilterTest {

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private com.autotrader.autotraderbackend.security.services.UserDetailsServiceImpl userDetailsService;

    @InjectMocks
    private AuthTokenFilter authTokenFilter;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private MockFilterChain filterChain;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        // Clear security context before each test
        SecurityContextHolder.clearContext();
        
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
        filterChain = mock(MockFilterChain.class);
        
        // Setup user details
        userDetails = User.builder()
                .username("testuser")
                .password("password")
                .authorities(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .build();
        
        // Create filter with direct constructor injection instead of reflection
        authTokenFilter = new AuthTokenFilter(jwtUtils, userDetailsService);
    }

    @Test
    void doFilterInternal_WithValidToken_ShouldSetAuthentication() throws Exception {
        // Arrange
        String token = "valid.jwt.token";
        when(jwtUtils.validateJwtToken(token)).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken(token)).thenReturn("testuser");
        when(userDetailsService.loadUserByUsername("testuser")).thenReturn(userDetails);
        
        request.addHeader("Authorization", "Bearer " + token);
        
        // Act
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Assert
        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("testuser", SecurityContextHolder.getContext().getAuthentication().getName());
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService).loadUserByUsername("testuser");
    }

    @Test
    void doFilterInternal_WithNoHeader_ShouldNotSetAuthentication() throws Exception {
        // Act
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(jwtUtils, never()).validateJwtToken(anyString());
    }

    @Test
    void doFilterInternal_WithNonBearerToken_ShouldNotSetAuthentication() throws Exception {
        // Arrange
        request.addHeader("Authorization", "Basic dGVzdHVzZXI6cGFzc3dvcmQ=");
        
        // Act
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(jwtUtils, never()).validateJwtToken(anyString());
    }

    @Test
    void doFilterInternal_WithEmptyBearerToken_ShouldNotSetAuthentication() throws Exception {
        // Arrange
        request.addHeader("Authorization", "Bearer ");
        
        // Act
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
        verify(jwtUtils, never()).validateJwtToken(anyString());
    }

    @Test
    void doFilterInternal_WithInvalidToken_ShouldNotSetAuthentication() throws Exception {
        // Arrange
        String token = "invalid.jwt.token";
        when(jwtUtils.validateJwtToken(token)).thenReturn(false);
        
        request.addHeader("Authorization", "Bearer " + token);
        
        // Act
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(jwtUtils).validateJwtToken(token);
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    void doFilterInternal_WithValidTokenButUserNotFound_ShouldNotSetAuthentication() throws Exception {
        // Arrange
        String token = "valid.jwt.token";
        when(jwtUtils.validateJwtToken(token)).thenReturn(true);
        when(jwtUtils.getUserNameFromJwtToken(token)).thenReturn("testuser");
        when(userDetailsService.loadUserByUsername("testuser")).thenThrow(new RuntimeException("User not found"));
        
        request.addHeader("Authorization", "Bearer " + token);
        
        // Act
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
        verify(jwtUtils).validateJwtToken(token);
        verify(jwtUtils).getUserNameFromJwtToken(token);
        verify(userDetailsService).loadUserByUsername("testuser");
    }

    @Test
    void doFilterInternal_WithMalformedAuthorizationHeader_ShouldNotSetAuthentication() throws Exception {
        // Arrange - Testing different malformed headers
        String[] malformedHeaders = {
            "Token xyz",
            "bearer token",
            "Bearer",
            "Bearer  "
        };
        
        for (String header : malformedHeaders) {
            // Reset for each test
            SecurityContextHolder.clearContext();
            reset(jwtUtils, userDetailsService, filterChain);
            
            // Setup request with current header
            request = new MockHttpServletRequest();
            request.addHeader("Authorization", header);
            
            // Act
            authTokenFilter.doFilterInternal(request, response, filterChain);
            
            // Assert
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            verify(filterChain).doFilter(request, response);
            verify(jwtUtils, never()).validateJwtToken(anyString());
            verify(userDetailsService, never()).loadUserByUsername(anyString());
        }
    }

    @Test
    void doFilterInternal_WhenJWTValidationThrowsException_ShouldNotSetAuthentication() throws Exception {
        // Arrange
        String token = "exception.token";
        when(jwtUtils.validateJwtToken(token)).thenThrow(new RuntimeException("JWT validation error"));
        
        request.addHeader("Authorization", "Bearer " + token);
        
        // Act
        authTokenFilter.doFilterInternal(request, response, filterChain);
        
        // Assert
        assertNull(SecurityContextHolder.getContext().getAuthentication());
        verify(filterChain).doFilter(request, response);
    }
}

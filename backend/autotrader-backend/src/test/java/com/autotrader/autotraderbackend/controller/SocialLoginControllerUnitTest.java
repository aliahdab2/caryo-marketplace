package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.dto.SocialLoginRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the AuthController's social login functionality
 */
@ExtendWith(MockitoExtension.class)
public class SocialLoginControllerUnitTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private JwtUtils jwtUtils;

    @InjectMocks
    private AuthController authController;

    private SocialLoginRequest socialLoginRequest;

    @BeforeEach
    void setUp() {
        socialLoginRequest = new SocialLoginRequest();
        socialLoginRequest.setEmail("test.user@gmail.com");
        socialLoginRequest.setName("Test User");
        socialLoginRequest.setProvider("google");
        socialLoginRequest.setProviderAccountId("google123456");
        socialLoginRequest.setImage("https://example.com/photo.jpg");
    }

    @Test
    void socialLogin_WithExistingUser_ShouldReturnToken() {
        // Arrange
        User existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUsername("test.user");
        existingUser.setEmail("test.user@gmail.com");
        existingUser.setPassword("encodedPassword");
        
        Set<Role> roles = new HashSet<>();
        Role userRole = new Role("ROLE_USER");
        roles.add(userRole);
        existingUser.setRoles(roles);
        
        when(userRepository.existsByEmail("test.user@gmail.com")).thenReturn(true);
        when(userRepository.findByEmail("test.user@gmail.com")).thenReturn(Optional.of(existingUser));
        when(jwtUtils.generateJwtTokenForUser(existingUser)).thenReturn("test-jwt-token");

        // Act
        ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof JwtResponse);
        
        JwtResponse jwtResponse = (JwtResponse) response.getBody();
        assertNotNull(jwtResponse);
        assertEquals("test-jwt-token", jwtResponse.getToken());
        assertEquals("test.user", jwtResponse.getUsername());
        assertEquals("test.user@gmail.com", jwtResponse.getEmail());
        assertTrue(jwtResponse.getRoles().contains("ROLE_USER"));
        
        // Verify the user was looked up but not saved (existing user)
        verify(userRepository).existsByEmail("test.user@gmail.com");
        verify(userRepository).findByEmail("test.user@gmail.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void socialLogin_WithNewUser_ShouldCreateUserAndReturnToken() {
        // Arrange
        when(userRepository.existsByEmail("test.user@gmail.com")).thenReturn(false);
        
        // Username doesn't exist check
        when(userRepository.existsByUsername("test.user")).thenReturn(false);
        
        // Role setup
        Role userRole = new Role("ROLE_USER");
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        
        // Password encoding
        when(encoder.encode(any())).thenReturn("encodedRandomPassword");
        
        // Mock saving the new user
        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setUsername("test.user");
        savedUser.setEmail("test.user@gmail.com");
        savedUser.setPassword("encodedRandomPassword");
        
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        savedUser.setRoles(roles);
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        
        // JWT generation
        when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("test-jwt-token");

        // Act
        ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof JwtResponse);
        
        JwtResponse jwtResponse = (JwtResponse) response.getBody();
        assertNotNull(jwtResponse);
        assertEquals("test-jwt-token", jwtResponse.getToken());
        assertEquals("test.user@gmail.com", jwtResponse.getEmail());
        assertTrue(jwtResponse.getRoles().contains("ROLE_USER"));
        
        // Verify new user was created
        verify(userRepository).existsByEmail("test.user@gmail.com");
        verify(userRepository).existsByUsername("test.user");
        verify(encoder).encode(any());
        verify(roleRepository).findByName("ROLE_USER");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void socialLogin_WithUsernameConflict_ShouldCreateUniqueUsername() {
        // Arrange
        when(userRepository.existsByEmail("test.user@gmail.com")).thenReturn(false);
        
        // First username exists, second doesn't
        when(userRepository.existsByUsername("test.user")).thenReturn(true);
        when(userRepository.existsByUsername("test.user1")).thenReturn(false);
        
        // Role setup
        Role userRole = new Role("ROLE_USER");
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        
        // Password encoding
        when(encoder.encode(any())).thenReturn("encodedRandomPassword");
        
        // Mock saving the new user with a suffixed username
        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setUsername("test.user1"); // Notice the number suffix
        savedUser.setEmail("test.user@gmail.com");
        savedUser.setPassword("encodedRandomPassword");
        
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        savedUser.setRoles(roles);
        
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        
        // JWT generation
        when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("test-jwt-token");

        // Act
        ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof JwtResponse);
        
        JwtResponse jwtResponse = (JwtResponse) response.getBody();
        assertEquals("test.user1", jwtResponse.getUsername(), "Username should be suffixed when there's a conflict");
        
        // Verify both username checks were performed
        verify(userRepository).existsByUsername("test.user");
        verify(userRepository).existsByUsername("test.user1");
    }
}

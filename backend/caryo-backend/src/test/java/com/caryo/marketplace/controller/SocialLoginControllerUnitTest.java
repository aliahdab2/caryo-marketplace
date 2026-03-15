package com.caryo.marketplace.controller;

import com.caryo.marketplace.model.Role;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.model.dto.SocialLoginRequest;
import com.caryo.marketplace.payload.response.JwtResponse;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.security.jwt.JwtUtils;
import com.caryo.marketplace.service.EmailService;
import com.caryo.marketplace.service.RoleService;
import com.caryo.marketplace.service.SellerTypeService;
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
    private RoleService roleService;

    @Mock
    private PasswordEncoder encoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private EmailService emailService;

    @Mock
    private SellerTypeService sellerTypeService;

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

        // Set user as already verified to avoid OAuth verification save
        existingUser.setEmailVerified(true);
        existingUser.setAccountStatus(com.caryo.marketplace.model.AccountStatus.VERIFIED);

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

        // Verify NO welcome email was sent to existing user
        verify(emailService, never()).sendWelcomeEmail(any(User.class));
    }

    @Test
    void socialLogin_WithNewUser_ShouldCreateUserAndReturnToken() {
        // Arrange
        when(userRepository.existsByEmail("test.user@gmail.com")).thenReturn(false);

        // Username doesn't exist check
        when(userRepository.existsByUsername("test.user")).thenReturn(false);

        // Role setup
        Role userRole = new Role("ROLE_USER");
        when(roleService.getOrCreateRole("ROLE_USER")).thenReturn(userRole);

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
        verify(roleService).getOrCreateRole("ROLE_USER");
        verify(userRepository).save(any(User.class));

        // Verify welcome email was sent to new user
        verify(emailService).sendWelcomeEmail(any(User.class));
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
        when(roleService.getOrCreateRole("ROLE_USER")).thenReturn(userRole);

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

    @Test
    void socialLogin_WithNewUser_WhenEmailServiceFails_ShouldStillSucceed() {
        // Arrange
        when(userRepository.existsByEmail("test.user@gmail.com")).thenReturn(false);
        when(userRepository.existsByUsername("test.user")).thenReturn(false);

        // Role setup
        Role userRole = new Role("ROLE_USER");
        when(roleService.getOrCreateRole("ROLE_USER")).thenReturn(userRole);

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
        when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("test-jwt-token");

        // Mock email service to throw exception
        doThrow(new RuntimeException("Email service unavailable")).when(emailService).sendWelcomeEmail(any(User.class));

        // Act
        ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode(), "Registration should succeed even if email fails");
        assertTrue(response.getBody() instanceof JwtResponse);

        JwtResponse jwtResponse = (JwtResponse) response.getBody();
        assertNotNull(jwtResponse);
        assertEquals("test-jwt-token", jwtResponse.getToken());
        assertEquals("test.user@gmail.com", jwtResponse.getEmail());

        // Verify user was still created and email was attempted
        verify(userRepository).save(any(User.class));
        verify(emailService).sendWelcomeEmail(any(User.class));
    }

    @Test
    void socialLogin_WithNewUser_ShouldSendWelcomeEmailWithCorrectUser() {
        // Arrange
        when(userRepository.existsByEmail("test.user@gmail.com")).thenReturn(false);
        when(userRepository.existsByUsername("test.user")).thenReturn(false);

        // Role setup
        Role userRole = new Role("ROLE_USER");
        when(roleService.getOrCreateRole("ROLE_USER")).thenReturn(userRole);

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
        when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("test-jwt-token");

        // Act
        ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());

        // Verify welcome email was sent with the saved user (not just any user)
        verify(emailService).sendWelcomeEmail(argThat(user ->
            user.getEmail().equals("test.user@gmail.com") &&
            user.getUsername().equals("test.user") &&
            user.getId() != null
        ));
    }
}

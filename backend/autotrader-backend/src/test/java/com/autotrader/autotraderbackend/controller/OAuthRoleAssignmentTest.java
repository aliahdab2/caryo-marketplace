package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.dto.SocialLoginRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Comprehensive tests for OAuth role assignment functionality
 * Tests the critical bug fix where existing OAuth users weren't getting roles assigned
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OAuth Role Assignment Tests")
public class OAuthRoleAssignmentTest {

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
    private Role userRole;

    @BeforeEach
    void setUp() {
        socialLoginRequest = new SocialLoginRequest();
        socialLoginRequest.setProvider("google");
        socialLoginRequest.setEmail("test@example.com");
        socialLoginRequest.setName("Test User");
        socialLoginRequest.setProviderAccountId("123456789");
        socialLoginRequest.setImage("https://example.com/avatar.jpg");

        userRole = new Role("ROLE_USER");
        userRole.setId(1);
    }

    @Nested
    @DisplayName("New OAuth User Tests")
    class NewOAuthUserTests {

        @Test
        @DisplayName("Should create new user with ROLE_USER when user doesn't exist")
        void shouldCreateNewUserWithRoleUser() {
            // Given
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
            when(encoder.encode(anyString())).thenReturn("encoded_password");
            when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("jwt_token");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(1L);
                return user;
            });

            // When
            ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody() instanceof JwtResponse);
            
            JwtResponse jwtResponse = (JwtResponse) response.getBody();
            assertNotNull(jwtResponse.getToken());
            assertEquals("test@example.com", jwtResponse.getEmail());
            assertEquals(List.of("ROLE_USER"), jwtResponse.getRoles());

            // Verify user was saved with correct role
            verify(userRepository).save(argThat(user -> 
                user.getRoles().contains(userRole) && 
                user.getRoles().size() == 1
            ));
        }

        @Test
        @DisplayName("Should create ROLE_USER if it doesn't exist in database")
        void shouldCreateRoleUserIfNotExists() {
            // Given
            when(userRepository.existsByEmail(anyString())).thenReturn(false);
            when(userRepository.existsByUsername(anyString())).thenReturn(false);
            when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.empty());
            when(roleRepository.save(any(Role.class))).thenReturn(userRole);
            when(encoder.encode(anyString())).thenReturn("encoded_password");
            when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("jwt_token");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                user.setId(1L);
                return user;
            });

            // When
            ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            
            // Verify ROLE_USER was created
            verify(roleRepository).save(argThat(role -> 
                "ROLE_USER".equals(role.getName())
            ));
        }
    }

    @Nested
    @DisplayName("Existing OAuth User Tests - Critical Bug Fix")
    class ExistingOAuthUserTests {

        @Test
        @DisplayName("Should assign ROLE_USER to existing user with no roles")
        void shouldAssignRoleUserToExistingUserWithNoRoles() {
            // Given - Existing user with no roles (the bug scenario)
            User existingUser = new User("testuser", "test@example.com", "encoded_password");
            existingUser.setId(1L);
            existingUser.setRoles(new HashSet<>()); // Empty roles - this was the bug!

            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
            when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
            when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("jwt_token");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody() instanceof JwtResponse);
            
            JwtResponse jwtResponse = (JwtResponse) response.getBody();
            assertEquals(List.of("ROLE_USER"), jwtResponse.getRoles());

            // Verify the user was updated with roles
            verify(userRepository).save(argThat(user -> 
                user.getRoles().contains(userRole) && 
                user.getRoles().size() == 1
            ));
        }

        @Test
        @DisplayName("Should assign ROLE_USER to existing user with null roles")
        void shouldAssignRoleUserToExistingUserWithNullRoles() {
            // Given - Existing user with null roles (another bug scenario)
            User existingUser = new User("testuser", "test@example.com", "encoded_password");
            existingUser.setId(1L);
            existingUser.setRoles(null); // Null roles - this was also part of the bug!

            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
            when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
            when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("jwt_token");
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody() instanceof JwtResponse);
            
            JwtResponse jwtResponse = (JwtResponse) response.getBody();
            assertEquals(List.of("ROLE_USER"), jwtResponse.getRoles());

            // Verify the user was updated with roles
            verify(userRepository).save(argThat(user -> 
                user.getRoles() != null &&
                user.getRoles().contains(userRole) && 
                user.getRoles().size() == 1
            ));
        }

        @Test
        @DisplayName("Should NOT modify existing user who already has roles")
        void shouldNotModifyExistingUserWithExistingRoles() {
            // Given - Existing user with existing roles
            User existingUser = new User("testuser", "test@example.com", "encoded_password");
            existingUser.setId(1L);
            Set<Role> existingRoles = new HashSet<>();
            existingRoles.add(userRole);
            existingUser.setRoles(existingRoles);

            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
            when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("jwt_token");

            // When
            ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody() instanceof JwtResponse);
            
            JwtResponse jwtResponse = (JwtResponse) response.getBody();
            assertEquals(List.of("ROLE_USER"), jwtResponse.getRoles());

            // Verify the user was NOT saved again (no role modification needed)
            verify(userRepository, never()).save(any(User.class));
            verify(roleRepository, never()).findByName(anyString());
        }

        @Test
        @DisplayName("Should handle existing user with multiple roles correctly")
        void shouldHandleExistingUserWithMultipleRoles() {
            // Given - Existing user with multiple roles
            User existingUser = new User("admin", "admin@example.com", "encoded_password");
            existingUser.setId(1L);
            
            Role adminRole = new Role("ROLE_ADMIN");
            adminRole.setId(2);
            
            Set<Role> existingRoles = new HashSet<>();
            existingRoles.add(userRole);
            existingRoles.add(adminRole);
            existingUser.setRoles(existingRoles);

            socialLoginRequest.setEmail("admin@example.com");

            when(userRepository.existsByEmail("admin@example.com")).thenReturn(true);
            when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(existingUser));
            when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("jwt_token");

            // When
            ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertTrue(response.getBody() instanceof JwtResponse);
            
            JwtResponse jwtResponse = (JwtResponse) response.getBody();
            assertEquals(2, jwtResponse.getRoles().size());
            assertTrue(jwtResponse.getRoles().contains("ROLE_USER"));
            assertTrue(jwtResponse.getRoles().contains("ROLE_ADMIN"));

            // Verify no modification was made
            verify(userRepository, never()).save(any(User.class));
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling")
    class EdgeCasesTests {

        @Test
        @DisplayName("Should handle case when ROLE_USER creation fails")
        void shouldHandleRoleUserCreationFailure() {
            // Given
            User existingUser = new User("testuser", "test@example.com", "encoded_password");
            existingUser.setId(1L);
            existingUser.setRoles(new HashSet<>());

            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
            when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.empty());
            when(roleRepository.save(any(Role.class))).thenThrow(new RuntimeException("Database error"));

            // When & Then
            assertThrows(RuntimeException.class, () -> {
                authController.socialLogin(socialLoginRequest);
            });
        }

        @Test
        @DisplayName("Should handle user not found after existence check")
        void shouldHandleUserNotFoundAfterExistenceCheck() {
            // Given - Edge case where user exists but then disappears
            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.empty());

            // When & Then
            assertThrows(RuntimeException.class, () -> {
                authController.socialLogin(socialLoginRequest);
            });
        }
    }

    @Nested
    @DisplayName("JWT Token Generation Tests")
    class JwtTokenTests {

        @Test
        @DisplayName("Should generate JWT token with correct roles for OAuth user")
        void shouldGenerateJwtTokenWithCorrectRoles() {
            // Given
            User existingUser = new User("testuser", "test@example.com", "encoded_password");
            existingUser.setId(1L);
            existingUser.setRoles(new HashSet<>());

            when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(existingUser));
            when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
            when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
                User user = invocation.getArgument(0);
                // Simulate the role assignment
                Set<Role> roles = new HashSet<>();
                roles.add(userRole);
                user.setRoles(roles);
                return user;
            });
            when(jwtUtils.generateJwtTokenForUser(any(User.class))).thenReturn("jwt_token_with_roles");

            // When
            ResponseEntity<?> response = authController.socialLogin(socialLoginRequest);

            // Then
            assertEquals(HttpStatus.OK, response.getStatusCode());
            
            JwtResponse jwtResponse = (JwtResponse) response.getBody();
            assertEquals("jwt_token_with_roles", jwtResponse.getToken());
            assertEquals("Bearer", jwtResponse.getType());
            
            // Verify JWT was generated with the user that has roles
            verify(jwtUtils).generateJwtTokenForUser(argThat(user -> 
                user.getRoles() != null && 
                user.getRoles().size() == 1 &&
                user.getRoles().iterator().next().getName().equals("ROLE_USER")
            ));
        }
    }
}

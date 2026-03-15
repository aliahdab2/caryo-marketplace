package com.caryo.marketplace.config;

import com.caryo.marketplace.model.AccountStatus;
import com.caryo.marketplace.model.Role;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.model.VerificationMethod;
import com.caryo.marketplace.repository.RoleRepository;
import com.caryo.marketplace.repository.UserRepository;
import com.caryo.marketplace.security.jwt.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DataInitializerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private RoleRepository roleRepository;

    @InjectMocks
    private DataInitializer dataInitializer;

    @BeforeEach
    void setUp() {
        // Common mocking setup
        when(passwordEncoder.encode(anyString())).thenReturn("encoded_password");
        when(jwtUtils.generateJwtToken(any(Authentication.class))).thenReturn("test.jwt.token");

        // Mock roles
        Role userRole = new Role("ROLE_USER");
        Role adminRole = new Role("ROLE_ADMIN");
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(roleRepository.findByName("ROLE_ADMIN")).thenReturn(Optional.of(adminRole));

        // Setup findByUsername mock for all usernames
        User mockUser = new User("user", "user@caryo.sy", "encoded_password");
        Set<Role> userRoles = new HashSet<>();
        userRoles.add(userRole);
        mockUser.setRoles(userRoles);

        User mockAdmin = new User("admin", "admin@caryo.sy", "encoded_password");
        Set<Role> adminRoles = new HashSet<>();
        adminRoles.add(userRole);
        adminRoles.add(adminRole);
        mockAdmin.setRoles(adminRoles);

        when(userRepository.findByUsername("user")).thenReturn(Optional.of(mockUser));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(mockAdmin));
    }

    @Test
    void shouldCreateRegularUserWhenNotExists() {
        // Given
        when(userRepository.existsByUsername("user")).thenReturn(false);
        when(userRepository.existsByUsername("admin")).thenReturn(true);

        // When
        dataInitializer.run();

        // Then
        verify(userRepository).existsByUsername("user");
        verify(passwordEncoder).encode("Password123!");
        verify(userRepository, times(2)).saveAndFlush(any(User.class)); // Regular user created, admin user updated
    }

    @Test
    void shouldCreateAdminUserWhenNotExists() {
        // Given
        when(userRepository.existsByUsername("user")).thenReturn(true);
        when(userRepository.existsByUsername("admin")).thenReturn(false);

        // When
        dataInitializer.run();

        // Then
        verify(userRepository).existsByUsername("admin");
        verify(passwordEncoder).encode("Admin123!");
        verify(userRepository, times(2)).saveAndFlush(any(User.class)); // Admin user created, regular user updated
    }

    @Test
    void shouldCreateUserWithCorrectRoles() {
        // Given
        when(userRepository.existsByUsername("user")).thenReturn(false);
        when(userRepository.existsByUsername("admin")).thenReturn(true);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        dataInitializer.run();

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).saveAndFlush(userCaptor.capture()); // Both users are processed

        // Find the regular user (not admin)
        User savedUser = userCaptor.getAllValues().stream()
            .filter(user -> "user".equals(user.getUsername()))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Regular user not found"));

        assertEquals("user", savedUser.getUsername());

        // Check for ROLE_USER
        boolean hasUserRole = savedUser.getRoles().stream()
            .anyMatch(role -> role.getName().equals("ROLE_USER"));
        assertTrue(hasUserRole);
        assertEquals(1, savedUser.getRoles().size());

        // Check that user is verified (development mode)
        assertTrue(savedUser.isEmailVerified());
        assertEquals(AccountStatus.VERIFIED, savedUser.getAccountStatus());
        assertEquals(VerificationMethod.OAUTH, savedUser.getVerificationMethod());
    }

    @Test
    void shouldCreateAdminWithCorrectRoles() {
        // Given
        when(userRepository.existsByUsername("user")).thenReturn(true);
        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        dataInitializer.run();

        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, times(2)).saveAndFlush(userCaptor.capture()); // Both users are processed

        // Find the admin user
        User savedUser = userCaptor.getAllValues().stream()
            .filter(user -> "admin".equals(user.getUsername()))
            .findFirst()
            .orElseThrow(() -> new AssertionError("Admin user not found"));

        assertEquals("admin", savedUser.getUsername());

        // Check for both roles
        boolean hasUserRole = savedUser.getRoles().stream()
            .anyMatch(role -> role.getName().equals("ROLE_USER"));
        boolean hasAdminRole = savedUser.getRoles().stream()
            .anyMatch(role -> role.getName().equals("ROLE_ADMIN"));

        assertTrue(hasUserRole);
        assertTrue(hasAdminRole);
        assertEquals(2, savedUser.getRoles().size());

        // Check that admin is verified (development mode)
        assertTrue(savedUser.isEmailVerified());
        assertEquals(AccountStatus.VERIFIED, savedUser.getAccountStatus());
        assertEquals(VerificationMethod.OAUTH, savedUser.getVerificationMethod());
    }

    @Test
    void shouldGenerateTokensForBothUsers() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.saveAndFlush(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        dataInitializer.run();

        // Then
        verify(jwtUtils, times(2)).generateJwtToken(any(Authentication.class));
    }

    @Test
    void shouldNotCreateUsersWhenTheyAlreadyExist() {
        // Given - users exist but are not verified
        when(userRepository.existsByUsername("user")).thenReturn(true);
        when(userRepository.existsByUsername("admin")).thenReturn(true);

        // Mock existing users that need to be updated (not verified)
        User existingUser = new User("user", "user@caryo.sy", "old_password");
        existingUser.setEmailVerified(false); // Not verified
        existingUser.setAccountStatus(AccountStatus.PENDING_VERIFICATION);

        User existingAdmin = new User("admin", "admin@caryo.sy", "old_password");
        existingAdmin.setEmailVerified(false); // Not verified
        existingAdmin.setAccountStatus(AccountStatus.PENDING_VERIFICATION);

        when(userRepository.findByUsername("user")).thenReturn(Optional.of(existingUser));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(existingAdmin));

        // When
        dataInitializer.run();

        // Then - existing users should be updated (not created), so saveAndFlush should be called twice
        verify(userRepository).existsByUsername("user");
        verify(userRepository).existsByUsername("admin");
        verify(userRepository, times(2)).saveAndFlush(any(User.class)); // Both users will be saved to update verification
    }
}

package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
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
        User mockUser = new User("user", "user@autotrader.com", "encoded_password");
        Set<Role> userRoles = new HashSet<>();
        userRoles.add(userRole);
        mockUser.setRoles(userRoles);
        
        User mockAdmin = new User("admin", "admin@autotrader.com", "encoded_password");
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
        verify(userRepository).save(any(User.class));
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
        verify(userRepository).save(any(User.class));
    }

    @Test
    void shouldCreateUserWithCorrectRoles() {
        // Given
        when(userRepository.existsByUsername("user")).thenReturn(false);
        when(userRepository.existsByUsername("admin")).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        // When
        dataInitializer.run();
        
        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        
        User savedUser = userCaptor.getValue();
        assertEquals("user", savedUser.getUsername());
        
        // Check for ROLE_USER
        boolean hasUserRole = savedUser.getRoles().stream()
            .anyMatch(role -> role.getName().equals("ROLE_USER"));
        assertTrue(hasUserRole);
        assertEquals(1, savedUser.getRoles().size());
    }
    
    @Test
    void shouldCreateAdminWithCorrectRoles() {
        // Given
        when(userRepository.existsByUsername("user")).thenReturn(true);
        when(userRepository.existsByUsername("admin")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        // When
        dataInitializer.run();
        
        // Then
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        
        User savedUser = userCaptor.getValue();
        assertEquals("admin", savedUser.getUsername());
        
        // Check for both roles
        boolean hasUserRole = savedUser.getRoles().stream()
            .anyMatch(role -> role.getName().equals("ROLE_USER"));
        boolean hasAdminRole = savedUser.getRoles().stream()
            .anyMatch(role -> role.getName().equals("ROLE_ADMIN"));
            
        assertTrue(hasUserRole);
        assertTrue(hasAdminRole);
        assertEquals(2, savedUser.getRoles().size());
    }
    
    @Test
    void shouldGenerateTokensForBothUsers() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        // When
        dataInitializer.run();
        
        // Then
        verify(jwtUtils, times(2)).generateJwtToken(any(Authentication.class));
    }
    
    @Test
    void shouldNotCreateUsersWhenTheyAlreadyExist() {
        // Given
        when(userRepository.existsByUsername("user")).thenReturn(true);
        when(userRepository.existsByUsername("admin")).thenReturn(true);
        
        // When
        dataInitializer.run();
        
        // Then
        verify(userRepository).existsByUsername("user");
        verify(userRepository).existsByUsername("admin");
        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any(User.class));
    }
}

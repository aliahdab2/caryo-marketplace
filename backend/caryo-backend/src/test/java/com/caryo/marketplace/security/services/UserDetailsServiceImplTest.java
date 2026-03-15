package com.caryo.marketplace.security.services;

import com.caryo.marketplace.model.Role;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserDetailsServiceImpl userDetailsService;

    @Test
    void loadUserByUsername_WithExistingUsername_ShouldReturnUserDetails() {
        // Arrange
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("password");

        Set<Role> roles = new HashSet<>();
        Role userRole = new Role("ROLE_USER");
        roles.add(userRole);
        user.setRoles(roles);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));

        // Act
        UserDetails userDetails = userDetailsService.loadUserByUsername("testuser");

        // Assert
        assertNotNull(userDetails);
        assertEquals("testuser", userDetails.getUsername());
        assertEquals("password", userDetails.getPassword());

        boolean hasUserRole = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_USER"));

        assertTrue(hasUserRole);
    }

    @Test
    void loadUserByUsername_WithNonExistentUsername_ShouldThrowException() {
        // Arrange
        when(userRepository.findByUsername("nonexistentuser")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("nonexistentuser")).thenReturn(Optional.empty()); // Also mock email lookup

        // Act & Assert
        Exception exception = assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername("nonexistentuser");
        });

        String expectedMessage = "User Not Found with username or email: nonexistentuser";
        String actualMessage = exception.getMessage();

        assertTrue(actualMessage.contains(expectedMessage));
    }

    @Test
    void loadUserByUsername_WithEmail_ShouldReturnUserDetails() {
        // Arrange - simulate dealer login with email
        User user = new User();
        user.setUsername("dealer_12345");
        user.setEmail("dealer@example.com");
        user.setPassword("password");

        Set<Role> roles = new HashSet<>();
        Role dealerRole = new Role("ROLE_DEALER");
        roles.add(dealerRole);
        user.setRoles(roles);

        // Username not found, but email found
        when(userRepository.findByUsername("dealer@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("dealer@example.com")).thenReturn(Optional.of(user));

        // Act
        UserDetails userDetails = userDetailsService.loadUserByUsername("dealer@example.com");

        // Assert
        assertNotNull(userDetails);
        assertEquals("dealer_12345", userDetails.getUsername()); // Returns actual username
        assertEquals("password", userDetails.getPassword());

        boolean hasDealerRole = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(authority -> authority.equals("ROLE_DEALER"));

        assertTrue(hasDealerRole);
    }
}

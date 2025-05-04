package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Initializes default data in the database at application startup.
 * This ensures development users are always available, even after rebuilds.
 * Creates two users: one with regular user role and one with admin role.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    
    // Regular user credentials
    private static final String USER_USERNAME = "user";
    private static final String USER_EMAIL = "user@autotrader.com";
    private static final String USER_PASSWORD = "Password123!";
    
    // Admin user credentials
    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL = "admin@autotrader.com";
    private static final String ADMIN_PASSWORD = "Admin123!";

    @Override
    public void run(String... args) {
        User regularUser = createRegularUser();
        User adminUser = createAdminUser();
        generateAndPrintDevTokens(regularUser, adminUser);
    }
    
    private User createRegularUser() {
        // Check if user already exists
        User user;
        
        if (!userRepository.existsByUsername(USER_USERNAME)) {
            log.info("Creating regular development user: {}", USER_USERNAME);
            
            // Create the user
            user = new User(USER_USERNAME, USER_EMAIL, passwordEncoder.encode(USER_PASSWORD));
            
            // Set role (only USER role)
            Set<String> roles = new HashSet<>();
            roles.add("ROLE_USER");
            user.setRoles(roles);
            
            // Save the user
            user = userRepository.save(user);
            
            log.info("Regular user created successfully");
        } else {
            log.info("Regular user already exists: {}", USER_USERNAME);
            user = userRepository.findByUsername(USER_USERNAME)
                    .orElseThrow(() -> new RuntimeException("User exists but couldn't be retrieved: " + USER_USERNAME));
        }
        
        return user;
    }
    
    private User createAdminUser() {
        // Check if admin user already exists
        User admin;
        
        if (!userRepository.existsByUsername(ADMIN_USERNAME)) {
            log.info("Creating admin development user: {}", ADMIN_USERNAME);
            
            // Create the user
            admin = new User(ADMIN_USERNAME, ADMIN_EMAIL, passwordEncoder.encode(ADMIN_PASSWORD));
            
            // Set roles (ADMIN and USER roles)
            Set<String> roles = new HashSet<>();
            roles.add("ROLE_USER");
            roles.add("ROLE_ADMIN");
            admin.setRoles(roles);
            
            // Save the user
            admin = userRepository.save(admin);
            
            log.info("Admin user created successfully");
        } else {
            log.info("Admin user already exists: {}", ADMIN_USERNAME);
            admin = userRepository.findByUsername(ADMIN_USERNAME)
                    .orElseThrow(() -> new RuntimeException("User exists but couldn't be retrieved: " + ADMIN_USERNAME));
        }
        
        return admin;
    }
    
    private void generateAndPrintDevTokens(User regularUser, User adminUser) {
        try {
            // Generate token for regular user
            String regularUserToken = generateTokenForUser(regularUser);
            
            // Generate token for admin user
            String adminUserToken = generateTokenForUser(adminUser);
            
            // Print tokens in a nice format
            log.info("\n\n====== DEVELOPMENT AUTHENTICATION TOKENS ======");
            log.info("These tokens can be used for testing without login:");
            log.info("");
            log.info("REGULAR USER TOKEN ({})", regularUser.getUsername());
            log.info("--------------------------------------------");
            log.info("{}", regularUserToken);
            log.info("");
            log.info("ADMIN USER TOKEN ({})", adminUser.getUsername());
            log.info("--------------------------------------------");
            log.info("{}", adminUserToken);
            log.info("");
            log.info("To use: Add the following header to your HTTP requests:");
            log.info("Authorization: Bearer <token>");
            log.info("==============================================\n");
        } catch (Exception e) {
            log.error("Error generating development tokens", e);
        }
    }
    
    private String generateTokenForUser(User user) {
        // Create authorities from roles
        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
        
        // Create a UserDetails object
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities
        );
        
        // Create Authentication object
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                userDetails,
                null,
                authorities
        );
        
        // Generate JWT token
        return jwtUtils.generateJwtToken(authentication);
    }
}

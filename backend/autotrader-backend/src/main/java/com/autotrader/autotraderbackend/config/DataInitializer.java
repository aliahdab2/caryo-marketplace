package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.security.jwt.JwtUtils;
import com.autotrader.autotraderbackend.service.DealerService;
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
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Initializes default data in the database at application startup.
 * This ensures development users are always available, even after rebuilds.
 * Creates three test users: regular user, admin user, and dealer user.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final DealerService dealerService;

    // Regular user credentials
    private static final String USER_USERNAME = "user";
    private static final String USER_EMAIL = "user@caryo.sy";
    private static final String USER_PASSWORD = "Password123!";

    // Admin user credentials
    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL = "admin@caryo.sy";
    private static final String ADMIN_PASSWORD = "Admin123!";

    // Dealer user credentials
    private static final String DEALER_USERNAME = "dealer";
    private static final String DEALER_EMAIL = "dealer@caryo.sy";
    private static final String DEALER_PASSWORD = "Dealer123!";
    private static final String DEALER_BUSINESS_NAME = "Test Dealership Syria";
    private static final String DEALER_BUSINESS_EMAIL = "business@testdealer.sy";
    private static final String DEALER_BUSINESS_PHONE = "+963-11-234-5678";

    @Override
    public void run(String... args) {
        User regularUser = createRegularUser();
        User adminUser = createAdminUser();
        User dealerUser = createDealerUser();
        generateAndPrintDevTokens(regularUser, adminUser, dealerUser);
    }

    private User createRegularUser() {
        // Check if user already exists
        User user = null;

        try {
            if (!userRepository.existsByUsername(USER_USERNAME)) {
                log.info("Creating regular development user: {}", USER_USERNAME);

                // Create the user
                user = new User(USER_USERNAME, USER_EMAIL, passwordEncoder.encode(USER_PASSWORD));

                // For development, mark regular user as fully verified and active
                user.markEmailVerifiedByOAuth("development", "user-setup");

                // Set role (only USER role)
                Set<Role> roles = new HashSet<>();
                roleRepository.findByName("ROLE_USER").ifPresent(roles::add);
                // If role doesn't exist, create it
                if (roles.isEmpty()) {
                    try {
                        Role userRole = new Role("ROLE_USER");
                        userRole = Objects.requireNonNull(roleRepository.save(userRole),
                            "Failed to save ROLE_USER");
                        roles.add(userRole);
                    } catch (Exception e) {
                        // Role might have been created by another process
                        log.warn("Error creating ROLE_USER, trying to fetch it again: {}", e.getMessage());
                        roleRepository.findByName("ROLE_USER").ifPresent(roles::add);
                    }
                }

                if (roles.isEmpty()) {
                    log.error("Failed to create or retrieve ROLE_USER");
                    return null;
                }

                user.setRoles(roles);

                // Save the user
                user = Objects.requireNonNull(userRepository.saveAndFlush(user),
                    "Failed to save regular user");
                log.info("Regular user created successfully");
            } else {
                log.info("Regular user already exists: {}", USER_USERNAME);
                try {
                    user = userRepository.findByUsername(USER_USERNAME).orElse(null);
                    if (user == null) {
                        log.error("User exists but couldn't be retrieved: {}", USER_USERNAME);
                    } else {
                        // For development, ensure existing regular user is fully verified and active
                        if (!user.isEmailVerified() ||
                            user.getAccountStatus() != com.autotrader.autotraderbackend.model.AccountStatus.VERIFIED) {
                            user.markEmailVerifiedByOAuth("development", "user-setup");
                            user = userRepository.saveAndFlush(user);
                            log.info("Updated existing regular user to verified status");
                        }
                    }
                } catch (Exception e) {
                    log.error("Error retrieving existing user {}: {}", USER_USERNAME, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error creating or retrieving regular user: {}", e.getMessage());
        }

        return user;
    }

    private User createAdminUser() {
        // Check if admin user already exists
        User adminUser = null;

        try {
            if (!userRepository.existsByUsername(ADMIN_USERNAME)) {
                log.info("Creating admin development user: {}", ADMIN_USERNAME);

                // Create the user
                adminUser = new User(ADMIN_USERNAME, ADMIN_EMAIL, passwordEncoder.encode(ADMIN_PASSWORD));

                // For development, mark admin user as fully verified and active
                adminUser.markEmailVerifiedByOAuth("development", "admin-setup");

                // Set roles (ADMIN and USER roles)
                Set<Role> roles = new HashSet<>();
                Optional<Role> userRole = roleRepository.findByName("ROLE_USER");
                Optional<Role> adminRole = roleRepository.findByName("ROLE_ADMIN");

                userRole.ifPresent(roles::add);
                adminRole.ifPresent(roles::add);

                // If roles don't exist, create them
                if (!userRole.isPresent()) {
                    try {
                        Role newUserRole = new Role("ROLE_USER");
                        newUserRole = Objects.requireNonNull(roleRepository.saveAndFlush(newUserRole),
                            "Failed to save ROLE_USER");
                        roles.add(newUserRole);
                    } catch (Exception e) {
                        log.warn("Error creating ROLE_USER, trying to fetch it again: {}", e.getMessage());
                        roleRepository.findByName("ROLE_USER").ifPresent(roles::add);
                    }
                }

                if (!adminRole.isPresent()) {
                    try {
                        Role newAdminRole = new Role("ROLE_ADMIN");
                        newAdminRole = Objects.requireNonNull(roleRepository.saveAndFlush(newAdminRole),
                            "Failed to save ROLE_ADMIN");
                        roles.add(newAdminRole);
                    } catch (Exception e) {
                        log.warn("Error creating ROLE_ADMIN, trying to fetch it again: {}", e.getMessage());
                        roleRepository.findByName("ROLE_ADMIN").ifPresent(roles::add);
                    }
                }

                // Verify that we have both roles
                boolean hasUserRole = roles.stream().anyMatch(role -> "ROLE_USER".equals(role.getName()));
                boolean hasAdminRole = roles.stream().anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));

                if (!hasUserRole || !hasAdminRole) {
                    log.error("Failed to create or retrieve required roles for admin user. User role: {}, Admin role: {}",
                        hasUserRole, hasAdminRole);
                    return null;
                }

                adminUser.setRoles(roles);

                // Save the admin user
                adminUser = Objects.requireNonNull(userRepository.saveAndFlush(adminUser),
                    "Failed to save admin user");
                log.info("Admin user created successfully");
            } else {
                log.info("Admin user already exists: {}", ADMIN_USERNAME);
                try {
                    adminUser = userRepository.findByUsername(ADMIN_USERNAME).orElse(null);
                    if (adminUser == null) {
                        log.error("Admin user exists but couldn't be retrieved: {}", ADMIN_USERNAME);
                    } else {
                        // For development, ensure existing admin user is fully verified and active
                        if (!adminUser.isEmailVerified() ||
                            adminUser.getAccountStatus() != com.autotrader.autotraderbackend.model.AccountStatus.VERIFIED) {
                            adminUser.markEmailVerifiedByOAuth("development", "admin-setup");
                            adminUser = userRepository.saveAndFlush(adminUser);
                            log.info("Updated existing admin user to verified status");
                        }
                    }
                } catch (Exception e) {
                    log.error("Error retrieving existing admin user {}: {}", ADMIN_USERNAME, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error creating or retrieving admin user: {}", e.getMessage());
        }

        return adminUser;
    }

    private User createDealerUser() {
        // Check if dealer user already exists
        User dealerUser = null;

        try {
            if (!userRepository.existsByUsername(DEALER_USERNAME)) {
                log.info("Creating dealer development user: {}", DEALER_USERNAME);

                // Create the user
                dealerUser = new User(DEALER_USERNAME, DEALER_EMAIL, passwordEncoder.encode(DEALER_PASSWORD));

                // For development, mark dealer user as fully verified and active
                dealerUser.markEmailVerifiedByOAuth("development", "dealer-setup");

                // Set roles (DEALER and USER roles)
                Set<Role> roles = new HashSet<>();
                Optional<Role> userRole = roleRepository.findByName("ROLE_USER");
                Optional<Role> dealerRole = roleRepository.findByName("ROLE_DEALER");

                userRole.ifPresent(roles::add);
                dealerRole.ifPresent(roles::add);

                // If roles don't exist, create them
                if (!userRole.isPresent()) {
                    try {
                        Role newUserRole = new Role("ROLE_USER");
                        newUserRole = Objects.requireNonNull(roleRepository.saveAndFlush(newUserRole),
                            "Failed to save ROLE_USER");
                        roles.add(newUserRole);
                    } catch (Exception e) {
                        log.warn("Error creating ROLE_USER, trying to fetch it again: {}", e.getMessage());
                        roleRepository.findByName("ROLE_USER").ifPresent(roles::add);
                    }
                }

                if (!dealerRole.isPresent()) {
                    try {
                        Role newDealerRole = new Role("ROLE_DEALER");
                        newDealerRole = Objects.requireNonNull(roleRepository.saveAndFlush(newDealerRole),
                            "Failed to save ROLE_DEALER");
                        roles.add(newDealerRole);
                    } catch (Exception e) {
                        log.warn("Error creating ROLE_DEALER, trying to fetch it again: {}", e.getMessage());
                        roleRepository.findByName("ROLE_DEALER").ifPresent(roles::add);
                    }
                }

                // Verify that we have both roles
                boolean hasUserRole = roles.stream().anyMatch(role -> "ROLE_USER".equals(role.getName()));
                boolean hasDealerRole = roles.stream().anyMatch(role -> "ROLE_DEALER".equals(role.getName()));

                if (!hasUserRole || !hasDealerRole) {
                    log.error("Failed to create or retrieve required roles for dealer user. User role: {}, Dealer role: {}",
                        hasUserRole, hasDealerRole);
                    return null;
                }

                dealerUser.setRoles(roles);

                // Save the dealer user
                dealerUser = Objects.requireNonNull(userRepository.saveAndFlush(dealerUser),
                    "Failed to save dealer user");
                log.info("Dealer user created successfully");

                // Create dealer profile
                try {
                    SignupRequest dealerSignupRequest = new SignupRequest();
                    dealerSignupRequest.setBusinessName(DEALER_BUSINESS_NAME);
                    dealerSignupRequest.setBusinessEmail(DEALER_BUSINESS_EMAIL);
                    dealerSignupRequest.setBusinessPhone(DEALER_BUSINESS_PHONE);
                    dealerSignupRequest.setVatNumber("TEST-VAT-12345");
                    dealerSignupRequest.setTradingAddress("Damascus Test Address");

                    dealerService.createDealer(dealerUser, dealerSignupRequest);
                    log.info("Dealer profile created successfully for user: {}", DEALER_USERNAME);
                } catch (Exception e) {
                    log.error("Error creating dealer profile: {}", e.getMessage());
                }

            } else {
                log.info("Dealer user already exists: {}", DEALER_USERNAME);
                try {
                    dealerUser = userRepository.findByUsername(DEALER_USERNAME).orElse(null);
                    if (dealerUser == null) {
                        log.error("Dealer user exists but couldn't be retrieved: {}", DEALER_USERNAME);
                    } else {
                        // For development, ensure existing dealer user is fully verified and active
                        if (!dealerUser.isEmailVerified() ||
                            dealerUser.getAccountStatus() != com.autotrader.autotraderbackend.model.AccountStatus.VERIFIED) {
                            dealerUser.markEmailVerifiedByOAuth("development", "dealer-setup");
                            dealerUser = userRepository.saveAndFlush(dealerUser);
                            log.info("Updated existing dealer user to verified status");
                        }
                        
                        // Check if dealer profile exists, create if missing
                        try {
                            if (!dealerService.getDealerByUserId(dealerUser.getId()).isPresent()) {
                                log.info("Dealer profile missing for user {}, creating...", DEALER_USERNAME);
                                SignupRequest dealerSignupRequest = new SignupRequest();
                                dealerSignupRequest.setBusinessName(DEALER_BUSINESS_NAME);
                                dealerSignupRequest.setBusinessEmail(DEALER_BUSINESS_EMAIL);
                                dealerSignupRequest.setBusinessPhone(DEALER_BUSINESS_PHONE);
                                dealerSignupRequest.setVatNumber("TEST-VAT-12345");
                                dealerSignupRequest.setTradingAddress("Damascus Test Address");
                                
                                dealerService.createDealer(dealerUser, dealerSignupRequest);
                                log.info("Dealer profile created successfully for existing user: {}", DEALER_USERNAME);
                            } else {
                                log.info("Dealer profile already exists for user: {}", DEALER_USERNAME);
                            }
                        } catch (Exception e) {
                            log.error("Error checking/creating dealer profile for existing user: {}", e.getMessage());
                        }
                    }
                } catch (Exception e) {
                    log.error("Error retrieving existing dealer user {}: {}", DEALER_USERNAME, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error creating or retrieving dealer user: {}", e.getMessage());
        }

        return dealerUser;
    }

    private void generateAndPrintDevTokens(User regularUser, User adminUser, User dealerUser) {
        try {
            if (Objects.isNull(regularUser)) {
                log.warn("Regular user is null, skipping token generation for regular user");
            }

            if (Objects.isNull(adminUser)) {
                log.warn("Admin user is null, skipping token generation for admin user");
            }

            if (Objects.isNull(dealerUser)) {
                log.warn("Dealer user is null, skipping token generation for dealer user");
            }

            // Generate tokens
            String regularUserToken = Objects.nonNull(regularUser) ? generateTokenForUser(regularUser) : null;
            String adminUserToken = Objects.nonNull(adminUser) ? generateTokenForUser(adminUser) : null;
            String dealerUserToken = Objects.nonNull(dealerUser) ? generateTokenForUser(dealerUser) : null;

            // Print tokens in a nice format
            log.info("\n\n====== DEVELOPMENT AUTHENTICATION TOKENS ======");
            log.info("These tokens can be used for testing without login:");
            log.info("");

            if (Objects.nonNull(regularUser) && Objects.nonNull(regularUserToken)) {
                log.info("REGULAR USER TOKEN ({})", regularUser.getUsername());
                log.info("--------------------------------------------");
                log.info("{}", regularUserToken);
                log.info("");
            }

            if (Objects.nonNull(adminUser) && Objects.nonNull(adminUserToken)) {
                log.info("ADMIN USER TOKEN ({})", adminUser.getUsername());
                log.info("--------------------------------------------");
                log.info("{}", adminUserToken);
                log.info("");
            }

            if (Objects.nonNull(dealerUser) && Objects.nonNull(dealerUserToken)) {
                log.info("DEALER USER TOKEN ({})", dealerUser.getUsername());
                log.info("--------------------------------------------");
                log.info("{}", dealerUserToken);
                log.info("");
            }

            log.info("To use: Add the following header to your HTTP requests:");
            log.info("Authorization: Bearer <token>");
            log.info("==============================================\n");
        } catch (Exception e) {
            log.error("Error generating development tokens", e);
        }
    }

    private String generateTokenForUser(User user) {
        // Check if user is null using Objects utility
        if (Objects.isNull(user)) {
            log.error("Cannot generate token for null user");
            return "TOKEN_GENERATION_FAILED_NULL_USER";
        }

        // Check if user roles is null using Objects utility
        if (Objects.isNull(user.getRoles())) {
            log.error("Cannot generate token for user with null roles: {}", user.getUsername());
            return "TOKEN_GENERATION_FAILED_NULL_ROLES";
        }

        try {
            // Create authorities from roles - using safe null handling
            Set<Role> roles = Objects.requireNonNull(user.getRoles(), "User roles cannot be null");
            List<SimpleGrantedAuthority> authorities = roles.stream()
                    .filter(Objects::nonNull)
                    .map(role -> new SimpleGrantedAuthority(role.getName()))
                    .collect(Collectors.toList());

            // Create a UserDetails object - safe access to required fields
            String username = Objects.requireNonNull(user.getUsername(), "Username cannot be null");
            String password = Objects.requireNonNull(user.getPassword(), "Password cannot be null");
            UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                    username,
                    password,
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
        } catch (Exception e) {
            log.error("Error generating token for user {}: {}", user.getUsername(), e.getMessage());
            return "TOKEN_GENERATION_FAILED: " + e.getMessage();
        }
    }
}

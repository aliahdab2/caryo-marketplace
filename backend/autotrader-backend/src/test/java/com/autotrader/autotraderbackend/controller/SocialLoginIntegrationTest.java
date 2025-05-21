package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.dto.SocialLoginRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for social login functionality.
 * Tests both new user creation via social login and existing user authentication.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class SocialLoginIntegrationTest extends IntegrationTestWithS3 {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String baseUrl;

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        
        // Clean up database - delete car listings first due to foreign key constraints
        carListingRepository.deleteAll();
        userRepository.deleteAll();
        
        // Ensure we have the USER role available
        if (!roleRepository.findByName("ROLE_USER").isPresent()) {
            Role userRole = new Role("ROLE_USER");
            roleRepository.save(userRole);
        }
    }

    @Test
    public void testSocialLogin_NewUser_ShouldCreateAccountAndAuthenticate() {
        // Create social login request for a new user
        String randomId = UUID.randomUUID().toString().substring(0, 8);
        String email = "google_" + randomId + "@example.com";
        String name = "Google User " + randomId;
        
        SocialLoginRequest request = new SocialLoginRequest();
        request.setEmail(email);
        request.setName(name);
        request.setProvider("google");
        request.setProviderAccountId(randomId);
        request.setImage("https://example.com/profile.jpg");
        
        // Call the social login endpoint
        ResponseEntity<JwtResponse> response = restTemplate.postForEntity(
                baseUrl + "/api/auth/social-login",
                request,
                JwtResponse.class
        );
        
        // Verify successful response
        assertEquals(HttpStatus.OK, response.getStatusCode(), "Social login should succeed");
        
        // Verify response contains token and user details
        JwtResponse jwtResponse = response.getBody();
        assertNotNull(jwtResponse, "JWT response should not be null");
        assertNotNull(jwtResponse.getToken(), "JWT token should not be null");
        assertFalse(jwtResponse.getToken().isEmpty(), "JWT token should not be empty");
        
        // Verify username is derived from email
        assertTrue(jwtResponse.getUsername().startsWith(email.split("@")[0]), 
                "Username should be derived from email");
                
        // Verify email matches
        assertEquals(email, jwtResponse.getEmail(), "Email should match the request");
        
        // Verify user role is assigned
        assertTrue(jwtResponse.getRoles().contains("ROLE_USER"), 
                "User should have USER role");
                
        // Verify user was created in the database
        Optional<User> savedUser = userRepository.findByEmail(email);
        assertTrue(savedUser.isPresent(), "User should be saved in the database");
    }

    @Test
    public void testSocialLogin_ExistingUser_ShouldAuthenticate() {
        // Create an existing user first
        String email = "existing_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        String username = email.split("@")[0];
        
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("irrelevant-for-social-login"));
        
        // Add USER role
        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName("ROLE_USER")
            .orElseThrow(() -> new RuntimeException("Role not found"));
        roles.add(userRole);
        user.setRoles(roles);
        
        userRepository.save(user);
        
        // Now try to login with social credentials matching this user's email
        SocialLoginRequest request = new SocialLoginRequest();
        request.setEmail(email);
        request.setName("Existing User");
        request.setProvider("google");
        request.setProviderAccountId(UUID.randomUUID().toString());
        
        // Call the social login endpoint
        ResponseEntity<JwtResponse> response = restTemplate.postForEntity(
                baseUrl + "/api/auth/social-login",
                request,
                JwtResponse.class
        );
        
        // Verify successful response
        assertEquals(HttpStatus.OK, response.getStatusCode(), "Social login for existing user should succeed");
        
        // Verify response contains token and user details
        JwtResponse jwtResponse = response.getBody();
        assertNotNull(jwtResponse, "JWT response should not be null");
        assertNotNull(jwtResponse.getToken(), "JWT token should not be null");
        
        // Verify the username matches our existing user
        assertEquals(username, jwtResponse.getUsername(), "Should use existing username");
        
        // Verify email matches
        assertEquals(email, jwtResponse.getEmail(), "Email should match the existing user");
    }

    @Test
    public void testSocialLogin_InvalidRequest_ShouldReturnBadRequest() {
        // Create an invalid social login request (missing required fields)
        SocialLoginRequest request = new SocialLoginRequest();
        // Only set email, missing other required fields
        request.setEmail("invalid@example.com");
        
        // Call the social login endpoint
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/auth/social-login",
                request,
                String.class
        );
        
        // Verify bad request response
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode(), 
                "Invalid request should return 400 Bad Request");
    }
}

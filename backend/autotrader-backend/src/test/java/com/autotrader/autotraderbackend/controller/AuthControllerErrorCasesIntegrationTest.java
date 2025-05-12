package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Enhanced Authentication tests that focus on error cases
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AuthControllerErrorCasesIntegrationTest extends IntegrationTestWithS3 {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String baseUrl;

    @BeforeEach
    void setUp() {
        baseUrl = "http://localhost:" + port; // Removed "/api"
        
        // Configure TestRestTemplate for error handling
        // Use a more modern approach without deprecated methods
        restTemplate = new TestRestTemplate(
            new RestTemplateBuilder()
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(5))
        );
    }

    @Test
    public void testInvalidCredentials() {
        // Test login with invalid credentials
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("nonexistent_user");
        loginRequest.setPassword("wrong_password");
        
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/auth/signin",
                loginRequest,
                String.class
        );
        
        // Verify unauthorized status
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode(), "Invalid credentials should return 401 Unauthorized");
    }
    
    @Test
    public void testDuplicateUsername() {
        // Register a user first
        String username = "testuser_" + UUID.randomUUID().toString().substring(0, 8);
        String email = username + "@example.com";
        String password = "password123";
        
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername(username);
        signupRequest.setEmail(email);
        signupRequest.setPassword(password);
        
        // First registration should be successful
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/auth/signup",
                signupRequest,
                String.class
        );
        
        assertEquals(HttpStatus.OK, response.getStatusCode(), "First registration should succeed");
        
        // Try to register with the same username
        SignupRequest duplicateUserRequest = new SignupRequest();
        duplicateUserRequest.setUsername(username);
        duplicateUserRequest.setEmail("different_" + email);
        duplicateUserRequest.setPassword(password);
        
        ResponseEntity<String> duplicateResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/signup",
                duplicateUserRequest,
                String.class
        );
        
        // Verify that duplicate username is rejected
        assertEquals(HttpStatus.BAD_REQUEST, duplicateResponse.getStatusCode(), "Duplicate username should be rejected");
    }
    
    @Test
    public void testDuplicateEmail() {
        // Register a user first
        String username = "testuser_" + UUID.randomUUID().toString().substring(0, 8);
        String email = username + "@example.com";
        String password = "password123";
        
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername(username);
        signupRequest.setEmail(email);
        signupRequest.setPassword(password);
        
        // First registration should be successful
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/auth/signup",
                signupRequest,
                String.class
        );
        
        assertEquals(HttpStatus.OK, response.getStatusCode(), "First registration should succeed");
        
        // Try to register with the same email
        SignupRequest duplicateEmailRequest = new SignupRequest();
        duplicateEmailRequest.setUsername("different_" + username);
        duplicateEmailRequest.setEmail(email);
        duplicateEmailRequest.setPassword(password);
        
        ResponseEntity<String> duplicateResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/signup",
                duplicateEmailRequest,
                String.class
        );
        
        // Verify that duplicate email is rejected
        assertEquals(HttpStatus.BAD_REQUEST, duplicateResponse.getStatusCode(), "Duplicate email should be rejected");
    }
    
    @Test
    public void testNonExistentUser() {
        // Try to login with a non-existent user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("user_that_doesnt_exist_" + UUID.randomUUID());
        loginRequest.setPassword("some_password");
        
        ResponseEntity<String> response = restTemplate.postForEntity(
                baseUrl + "/api/auth/signin",
                loginRequest,
                String.class
        );
        
        // Verify unauthorized status
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode(), "Non-existent user login should be unauthorized");
    }
    
    @Test
    public void testValidationErrors() {
        // Create an invalid signup request with empty fields
        SignupRequest invalidRequest = new SignupRequest();
        // Leave all fields empty to trigger validation errors
        
        ResponseEntity<String> invalidResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/signup",
                invalidRequest,
                String.class
        );
        
        // Verify registration fails with 400 Bad Request due to validation
        assertEquals(HttpStatus.BAD_REQUEST, invalidResponse.getStatusCode(), "Invalid data should fail validation");
    }
    
    @Test
    public void testUnauthorizedResourceAccess() {
        // Try to access protected resource without authentication
        ResponseEntity<String> unauthorizedResponse = restTemplate.getForEntity(
                baseUrl + "/api/test/user",
                String.class
        );
        
        // Verify access is denied with 401 Unauthorized
        assertEquals(HttpStatus.UNAUTHORIZED, unauthorizedResponse.getStatusCode(), "Unauthenticated access should be denied");
    }
    
    @Test
    public void testForbiddenResourceAccess() {
        // Use a simple username that definitely meets the validation requirements (between 3 and 20 chars)
        String username = "testuser123";
        String email = username + "@example.com";
        String password = "password123";
        
        try {
            // Register the user
            SignupRequest signupRequest = new SignupRequest();
            signupRequest.setUsername(username);
            signupRequest.setEmail(email);
            signupRequest.setPassword(password);
            
            ResponseEntity<String> signupResponse = restTemplate.postForEntity(
                    baseUrl + "/api/auth/signup",
                    signupRequest,
                    String.class
            );
            
            // Verify signup was successful
            assertEquals(HttpStatus.OK, signupResponse.getStatusCode(), 
                "User registration should succeed. Response body: " + signupResponse.getBody());
            
            // Login to get JWT token
            LoginRequest loginRequest = new LoginRequest();
            loginRequest.setUsername(username);
            loginRequest.setPassword(password);
            
            ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                    baseUrl + "/api/auth/signin",
                    loginRequest,
                    JwtResponse.class
            );
            
            // Verify login was successful
            assertEquals(HttpStatus.OK, loginResponse.getStatusCode(), "Login should succeed");
            assertThat(loginResponse.getBody()).isNotNull();
            
            // Extract token and ensure it's not null or empty
            JwtResponse jwtResponse = loginResponse.getBody();
            assertThat(jwtResponse).isNotNull();
            String token = java.util.Objects.requireNonNull(jwtResponse).getToken();
            assertThat(token).isNotBlank();
            
            // Create headers with token
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token); // Use setBearerAuth instead of manually adding the header
            
            // Try to access admin resource as regular user
            ResponseEntity<String> forbiddenResponse = restTemplate.exchange(
                    baseUrl + "/api/test/admin",
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    String.class
            );
            
            // Verify access is forbidden (403)
            assertEquals(HttpStatus.FORBIDDEN, forbiddenResponse.getStatusCode(), "Regular user should be forbidden from admin resources");
        } finally {
            // Cleanup will be handled by test resource cleanup service
        }
    }
}

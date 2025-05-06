package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3; // Extend the base class
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class CarListingValidationIntegrationTest extends IntegrationTestWithS3 { // Extend base class

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.autotrader.autotraderbackend.repository.CarListingRepository carListingRepository;

    private String baseUrl;
    private String jwtToken;

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        // Clear listings and user data before each test (child table first)
        carListingRepository.deleteAll();
        userRepository.deleteAll();
        // Register and login a user to get JWT token for authenticated requests
        registerAndLoginUser();
    }
    
    private void registerAndLoginUser() {
        // Register a new user
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("validatoruser");
        signupRequest.setEmail("validator@example.com");
        signupRequest.setPassword("password123");
        Set<String> roles = new HashSet<>();
        roles.add("user");
        signupRequest.setRole(roles);

        restTemplate.postForEntity(
                baseUrl + "/auth/signup",
                signupRequest,
                Object.class
        );

        // Login with the registered user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("validatoruser");
        loginRequest.setPassword("password123");

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/auth/signin",
                loginRequest,
                JwtResponse.class
        );
        
        assertNotNull(loginResponse.getBody(), "Login response body should not be null");
        jwtToken = loginResponse.getBody().getToken();
        assertNotNull(jwtToken, "JWT token should not be null");
    }

    private CreateListingRequest createValidListingRequest() {
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Valid Title");
        request.setBrand("ValidBrand");
        request.setModel("ValidModel");
        request.setModelYear(2020);
        request.setMileage(10000);
        request.setPrice(new BigDecimal("20000.00"));
        request.setLocationId(1L); // Use setLocationId instead of setLocation
        request.setDescription("Valid description.");
        return request;
    }

    @Test
    public void testCreateListing_MissingTitle_ShouldFail() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        
        CreateListingRequest request = createValidListingRequest();
        request.setTitle(null); // Make title invalid (null)
        
        HttpEntity<CreateListingRequest> entity = new HttpEntity<>(request, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/api/listings",
                HttpMethod.POST,
                entity,
                Map.class // Expecting error response body
        );
        
        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatusCode().value(), "Should return 400 Bad Request for missing title");
        // Optionally, assert specific error message in the response body if available
        // assertNotNull(response.getBody());
        // assertTrue(response.getBody().toString().contains("Title is mandatory")); 
    }

    @Test
    public void testCreateListing_InvalidPrice_ShouldFail() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        
        CreateListingRequest request = createValidListingRequest();
        request.setPrice(new BigDecimal("-100.00")); // Make price invalid (negative)
        
        HttpEntity<CreateListingRequest> entity = new HttpEntity<>(request, headers);
        
        ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/api/listings",
                HttpMethod.POST,
                entity,
                Map.class // Expecting error response body
        );
        
        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatusCode().value(), "Should return 400 Bad Request for negative price");
        // Optionally, assert specific error message
        // assertNotNull(response.getBody());
        // assertTrue(response.getBody().toString().contains("Price must be positive")); 
    }
    
    // Add more validation tests for other fields (brand, model, year, mileage, location, description)
    // Example: Test for blank title, invalid model year, negative mileage etc.
}
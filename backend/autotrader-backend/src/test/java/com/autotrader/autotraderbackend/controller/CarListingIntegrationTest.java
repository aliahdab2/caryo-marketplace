package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class CarListingIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CarListingRepository carListingRepository;

    private String baseUrl;
    private String jwtToken;

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        // Clear data before each test
        carListingRepository.deleteAll();
        userRepository.deleteAll();
        
        // Register and login a user to get JWT token
        registerAndLoginUser();
    }
    
    private void registerAndLoginUser() {
        // 1. Register a new user
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername("carowner");
        signupRequest.setEmail("owner@example.com");
        signupRequest.setPassword("password123");
        Set<String> roles = new HashSet<>();
        roles.add("user");
        signupRequest.setRole(roles);

        restTemplate.postForEntity(
                baseUrl + "/auth/signup",
                signupRequest,
                Object.class
        );

        // 2. Login with the registered user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("carowner");
        loginRequest.setPassword("password123");

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/auth/signin",
                loginRequest,
                JwtResponse.class
        );
        
        assertNotNull(loginResponse.getBody(), "Login response body should not be null");
        jwtToken = loginResponse.getBody().getToken();
    }

    @Test
    public void testCreateAndRetrieveCarListing() {
        // Create HTTP headers with JWT token
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        
        // 1. Create a car listing
        CreateListingRequest createRequest = new CreateListingRequest();
        createRequest.setTitle("2022 Toyota Camry");
        createRequest.setBrand("Toyota");
        createRequest.setModel("Camry");
        createRequest.setYear(2022);
        createRequest.setMileage(15000);
        createRequest.setPrice(new BigDecimal("25000.00"));
        createRequest.setLocation("New York");
        createRequest.setDescription("Excellent condition, one owner");
        
        HttpEntity<CreateListingRequest> createEntity = new HttpEntity<>(createRequest, headers);
        
        ResponseEntity<Map> createResponse = restTemplate.exchange(
                baseUrl + "/api/listings",
                HttpMethod.POST,
                createEntity,
                Map.class
        );
        
        assertEquals(201, createResponse.getStatusCodeValue());
        assertNotNull(createResponse.getBody());
        assertNotNull(createResponse.getBody().get("id"));
        
        // Get the ID of the created listing
        Number listingId = (Number) createResponse.getBody().get("id");
        
        // 2. Retrieve the car listing
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        
        ResponseEntity<Map> getResponse = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId,
                HttpMethod.GET,
                getEntity,
                Map.class
        );
        
        assertEquals(200, getResponse.getStatusCodeValue());
        assertNotNull(getResponse.getBody());
        assertEquals("Toyota", getResponse.getBody().get("brand"));
        assertEquals("Camry", getResponse.getBody().get("model"));
        assertEquals(2022, ((Number) getResponse.getBody().get("year")).intValue());
        
        // 3. Verify the listing exists in the database
        assertTrue(carListingRepository.findById(listingId.longValue()).isPresent());
        
        // 4. Attempt to access without authentication (should fail)
        ResponseEntity<Map> unauthorizedResponse = restTemplate.getForEntity(
                baseUrl + "/api/listings/" + listingId,
                Map.class
        );
        
        assertEquals(403, unauthorizedResponse.getStatusCodeValue());
    }
}

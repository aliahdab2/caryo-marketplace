package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
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
import java.util.HashMap; // <-- Added import
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class CarListingIntegrationTestWithS3 extends IntegrationTestWithS3 {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CarListingRepository carListingRepository;

    private String baseUrl;

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        // Clear data before each test
        carListingRepository.deleteAll();
        userRepository.deleteAll();

        // Register users needed for tests
        registerUser("testuser", "password", Set.of("user"));
        registerUser("adminuser", "password", Set.of("admin", "user")); // Register admin
    }

    private void registerUser(String username, String password, Set<String> roles) {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername(username);
        signupRequest.setEmail(username + "@example.com");
        signupRequest.setPassword(password);
        signupRequest.setRole(roles);

        ResponseEntity<Object> response = restTemplate.postForEntity(
                baseUrl + "/auth/signup",
                signupRequest,
                Object.class
        );
        // Optionally assert response status if needed
        // assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    // Helper method to login and get auth headers
    private HttpHeaders getAuthHeaders(String username, String password) {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/auth/signin",
                loginRequest,
                JwtResponse.class
        );

        assertEquals(HttpStatus.OK, loginResponse.getStatusCode(), "Login failed for user: " + username);
        assertNotNull(loginResponse.getBody(), "Login response body should not be null for user: " + username);
        String token = loginResponse.getBody().getToken();
        assertNotNull(token, "JWT token should not be null for user: " + username);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        return headers;
    }

    @Test
    public void testCreateRetrieveApproveRetrieveCarListing() { // Renamed test
        // --- 1. Create Listing (as regular user) ---
        HttpHeaders userHeaders = getAuthHeaders("testuser", "password"); // Use the helper
        Map<String, Object> createPayload = new HashMap<>();
        createPayload.put("title", "Test Car for Approval");
        // ... add other required fields ...
        createPayload.put("brand", "TestBrand");
        createPayload.put("model", "TestModel");
        createPayload.put("modelYear", 2021);
        createPayload.put("price", 19999.99);
        createPayload.put("mileage", 15000);
        createPayload.put("location", "Test City");
        createPayload.put("description", "A car to test approval");

        HttpEntity<Map<String, Object>> createEntity = new HttpEntity<>(createPayload, userHeaders);

        ResponseEntity<Map> createResponse = restTemplate.exchange(
                baseUrl + "/api/listings",
                HttpMethod.POST,
                createEntity,
                Map.class
        );

        assertEquals(HttpStatus.CREATED.value(), createResponse.getStatusCode().value());
        assertNotNull(createResponse.getBody());
        assertNotNull(createResponse.getBody().get("id"));
        Number listingIdNumber = (Number) createResponse.getBody().get("id");
        Long listingId = listingIdNumber.longValue(); // Get the ID as Long

        // --- 2. Attempt to Retrieve Unapproved Listing (Publicly) ---
        HttpEntity<String> getEntityPublic = new HttpEntity<>(new HttpHeaders()); // No auth needed for public GET
        ResponseEntity<Map> getResponseUnapproved = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId,
                HttpMethod.GET,
                getEntityPublic, // Use public headers
                Map.class
        );

        assertEquals(HttpStatus.NOT_FOUND.value(), getResponseUnapproved.getStatusCode().value(),
            "Retrieving a newly created (unapproved) listing publicly should return 404 Not Found");

        // --- 3. Approve Listing (as admin) ---
        HttpHeaders adminHeaders = getAuthHeaders("adminuser", "password"); // Use the helper
        HttpEntity<String> approveEntity = new HttpEntity<>(adminHeaders);

        // Assuming PUT /api/listings/{id}/approve endpoint exists
        ResponseEntity<Map> approveResponse = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId + "/approve",
                HttpMethod.PUT, // Or POST, depending on your API design
                approveEntity,
                Map.class
        );

        assertEquals(HttpStatus.OK.value(), approveResponse.getStatusCode().value(), "Approving the listing should return 200 OK");
        assertNotNull(approveResponse.getBody());
        assertEquals(Boolean.TRUE, approveResponse.getBody().get("approved"), "Response body should indicate approved: true");

        // --- 4. Retrieve Approved Listing (Publicly) ---
        ResponseEntity<Map> getResponseApproved = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId,
                HttpMethod.GET,
                getEntityPublic, // Use public headers again
                Map.class
        );

        assertEquals(HttpStatus.OK.value(), getResponseApproved.getStatusCode().value(),
            "Retrieving an approved listing publicly should return 200 OK");
        assertNotNull(getResponseApproved.getBody());
        assertEquals(listingId, ((Number) getResponseApproved.getBody().get("id")).longValue());
        assertEquals("Test Car for Approval", getResponseApproved.getBody().get("title"));
        assertEquals(Boolean.TRUE, getResponseApproved.getBody().get("approved"), "Retrieved listing should be approved");

        // Optional: Add more assertions about the retrieved listing details
    }

    // ... other tests ...
}

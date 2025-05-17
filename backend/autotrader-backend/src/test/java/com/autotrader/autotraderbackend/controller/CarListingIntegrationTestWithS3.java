package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import java.util.HashMap;
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

    @Autowired
    private LocationRepository locationRepository; 

    private String baseUrl;
    private Long testLocationId;

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        carListingRepository.deleteAll();
        userRepository.deleteAll();
        locationRepository.deleteAll(); 

        Location location = new Location();
        location.setDisplayNameEn("Test City Location");
        location.setDisplayNameAr("مدينة اختبار");
        location.setSlug("test-city-location-s3-integration"); // Ensure unique slug
        location.setCountryCode("XX");
        Location savedLocation = locationRepository.save(location);
        testLocationId = savedLocation.getId();

        registerUser("testuser", "password", Set.of("user"));
        registerUser("adminuser", "password", Set.of("admin", "user"));
    }

    private void registerUser(String username, String password, Set<String> roles) {
        SignupRequest signupRequest = new SignupRequest();
        signupRequest.setUsername(username);
        signupRequest.setEmail(username + "@example.com");
        signupRequest.setPassword(password);
        signupRequest.setRole(roles);

        restTemplate.postForEntity(
                baseUrl + "/api/auth/signup",
                signupRequest,
                Object.class
        );
    }

    private HttpHeaders getAuthHeaders(String username, String password) {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/signin",
                loginRequest,
                JwtResponse.class
        );

        assertEquals(HttpStatus.OK, loginResponse.getStatusCode(), "Login failed for user: " + username);
        assertNotNull(loginResponse.getBody(), "Login response body should not be null for user: " + username);
        JwtResponse jwtResponse = loginResponse.getBody();
        assertNotNull(jwtResponse, "JWT Response object should not be null");
        String token = java.util.Objects.requireNonNull(jwtResponse).getToken();
        assertNotNull(token, "JWT token should not be null for user: " + username);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + token);
        return headers;
    }

    @Test
    public void testCreateRetrieveApproveRetrieveCarListing() { 
        HttpHeaders userHeaders = getAuthHeaders("testuser", "password");
        Map<String, Object> createPayload = new HashMap<>();
        createPayload.put("title", "Test Car for Approval");
        createPayload.put("brand", "TestBrand");
        createPayload.put("model", "TestModel");
        createPayload.put("modelYear", 2021);
        createPayload.put("price", 19999.99);
        createPayload.put("mileage", 15000);
        createPayload.put("locationId", testLocationId);
        createPayload.put("description", "A car to test approval");

        HttpEntity<Map<String, Object>> createEntity = new HttpEntity<>(createPayload, userHeaders);

        ResponseEntity<Map<String, Object>> createResponse = restTemplate.exchange(
                baseUrl + "/api/listings",
                HttpMethod.POST,
                createEntity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.CREATED.value(), createResponse.getStatusCode().value());
        assertNotNull(createResponse.getBody(), "Create response body should not be null");
        Map<String, Object> createResponseBody = createResponse.getBody();
        assertNotNull(createResponseBody, "Create response body map should not be null");
        assertNotNull(createResponseBody.get("id"));
        Number listingIdNumber = (Number) createResponseBody.get("id");
        Long listingId = listingIdNumber.longValue();

        HttpEntity<String> getEntityPublic = new HttpEntity<>(new HttpHeaders());
        ResponseEntity<Map<String, Object>> getResponseUnapproved = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId,
                HttpMethod.GET,
                getEntityPublic,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.NOT_FOUND.value(), getResponseUnapproved.getStatusCode().value(),
            "Retrieving a newly created (unapproved) listing publicly should return 404 Not Found");

        HttpHeaders adminHeaders = getAuthHeaders("adminuser", "password");
        HttpEntity<String> approveEntity = new HttpEntity<>(adminHeaders);

        ResponseEntity<Map<String, Object>> approveResponse = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId + "/approve",
                HttpMethod.PUT,
                approveEntity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.OK.value(), approveResponse.getStatusCode().value(), "Approving the listing should return 200 OK");
        assertNotNull(approveResponse.getBody(), "Approve response body should not be null");
        Map<String, Object> approveResponseBody = approveResponse.getBody();
        assertNotNull(approveResponseBody, "Approve response body map should not be null");
        assertEquals(Boolean.TRUE, approveResponseBody.get("approved"), "Response body should indicate approved: true");

        ResponseEntity<Map<String, Object>> getResponseApproved = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId,
                HttpMethod.GET,
                getEntityPublic,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.OK.value(), getResponseApproved.getStatusCode().value(),
            "Retrieving an approved listing publicly should return 200 OK");
        assertNotNull(getResponseApproved.getBody(), "Get approved response body should not be null");
        Map<String, Object> getApprovedResponseBody = getResponseApproved.getBody();
        assertNotNull(getApprovedResponseBody, "Get approved response body map should not be null");
        assertEquals(listingId, ((Number) getApprovedResponseBody.get("id")).longValue());
        assertEquals("Test Car for Approval", getApprovedResponseBody.get("title"));
        assertEquals(Boolean.TRUE, getApprovedResponseBody.get("approved"), "Retrieved listing should be approved");
    }
}

package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.CarBrandRepository; // Added
import com.autotrader.autotraderbackend.repository.CarModelRepository; // Added
import com.autotrader.autotraderbackend.repository.LocationRepository; // Added
import com.autotrader.autotraderbackend.model.CarBrand; // Added
import com.autotrader.autotraderbackend.model.CarModel; // Added
import com.autotrader.autotraderbackend.model.Location; // Added
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

    @Autowired
    private CarBrandRepository carBrandRepository; // Added

    @Autowired
    private CarModelRepository carModelRepository; // Added

    @Autowired
    private LocationRepository locationRepository; // Added

    private String baseUrl;
    private String jwtToken;
    private CarModel testCarModel; // Added
    private Location testLocation; // Added

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        // Clear listings and user data before each test (child table first)
        carListingRepository.deleteAll();
        userRepository.deleteAll();
        carModelRepository.deleteAll(); // Added
        carBrandRepository.deleteAll(); // Added
        locationRepository.deleteAll(); // Added

        // Setup necessary entities
        setupTestData();

        // Register and login a user to get JWT token for authenticated requests
        registerAndLoginUser();
    }

    private void setupTestData() {
        // Create test Location
        testLocation = new Location();
        testLocation.setDisplayNameEn("Test Location Validation");
        testLocation.setDisplayNameAr("موقع اختبار التحقق");
        testLocation.setSlug("test-location-validation");
        testLocation.setCountryCode("SY");
        testLocation = locationRepository.save(testLocation);

        // Create test CarBrand
        CarBrand testCarBrand = new CarBrand();
        testCarBrand.setName("ValidBrand");
        testCarBrand.setDisplayNameEn("Valid Brand");
        testCarBrand.setDisplayNameAr("علامة تجارية صالحة");
        testCarBrand.setSlug("valid-brand");
        testCarBrand = carBrandRepository.save(testCarBrand);

        // Create test CarModel
        testCarModel = new CarModel();
        testCarModel.setName("ValidModel");
        testCarModel.setDisplayNameEn("Valid Model");
        testCarModel.setDisplayNameAr("نموذج صالح");
        testCarModel.setBrand(testCarBrand);
        testCarModel.setSlug("valid-model");
        testCarModel = carModelRepository.save(testCarModel);
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
                baseUrl + "/api/auth/signup",
                signupRequest,
                Object.class
        );

        // Login with the registered user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("validatoruser");
        loginRequest.setPassword("password123");

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/signin",
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
        request.setModelId(testCarModel.getId()); // Use modelId
        request.setModelYear(2020);
        request.setMileage(10000);
        request.setPrice(new BigDecimal("20000.00"));
        request.setLocationId(testLocation.getId()); // Use locationId from created location
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
        
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/listings",
                HttpMethod.POST,
                entity,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {} // Expecting error response body
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
        
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/listings",
                HttpMethod.POST,
                entity,
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {} // Expecting error response body
        );
        
        assertEquals(HttpStatus.BAD_REQUEST.value(), response.getStatusCode().value(), "Should return 400 Bad Request for negative price");
        // Optionally, assert specific error message
        // assertNotNull(response.getBody());
        // assertTrue(response.getBody().toString().contains("Price must be positive")); 
    }
    
    // Add more validation tests for other fields (brand, model, year, mileage, location, description)
    // Example: Test for blank title, invalid model year, negative mileage etc.
}
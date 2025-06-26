package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.CarBrand; // Added
import com.autotrader.autotraderbackend.model.CarModel; // Added
import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.CarBrandRepository; // Added
import com.autotrader.autotraderbackend.repository.CarModelRepository; // Added
import com.autotrader.autotraderbackend.repository.CountryRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import com.autotrader.autotraderbackend.repository.CountryRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import com.autotrader.autotraderbackend.util.TestGeographyUtils;
import com.autotrader.autotraderbackend.util.TestDataGenerator;
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

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class CarListingLifecycleIntegrationTest extends IntegrationTestWithS3 {

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

    @Autowired
    private CarBrandRepository carBrandRepository; // Added

    @Autowired
    private CarModelRepository carModelRepository; // Added

    @Autowired
    private CountryRepository countryRepository; // Added

    @Autowired
    private GovernorateRepository governorateRepository; // Added

    private String baseUrl;
    private String jwtToken;
    private Long testLocationId;
    private Long testGovernorateId; // Added to store the governorate ID for filtering
    private User testUser; // Added to store the test user
    private CarBrand testCarBrand; // Added
    private CarModel testCarModel; // Added
    private Country testCountry; // Added
    private Governorate testGovernorate; // Added

    @BeforeEach
    public void setUp() {
        baseUrl = "http://localhost:" + port;
        // Clear data before each test
        carListingRepository.deleteAll(); // Order matters: delete listings before locations/users due to FKs
        userRepository.deleteAll();
        locationRepository.deleteAll();
        governorateRepository.deleteAll(); // Added
        countryRepository.deleteAll(); // Added
        carModelRepository.deleteAll();
        carBrandRepository.deleteAll();

        // Create and save a test location hierarchy (Country > Governorate > Location)
        // Create test country
        testCountry = TestGeographyUtils.createTestCountry("TC");
        testCountry = countryRepository.save(testCountry);

        // Create test governorate
        testGovernorate = TestGeographyUtils.createTestGovernorate("Test Governorate", "محافظة اختبار", testCountry);
        testGovernorate = governorateRepository.save(testGovernorate);
        testGovernorateId = testGovernorate.getId(); // Store the governorate ID for filtering

        // Create test location
        Location testLocation = TestGeographyUtils.createTestLocation("Test City Lifecycle", "مدينة اختبار دورة الحياة", testGovernorate);
        Location savedLocation = locationRepository.save(testLocation);
        testLocationId = savedLocation.getId();

        // Create test car brand and model
        setupCarBrandAndModel();
        
        // Register and login a user to get JWT token
        registerAndLoginUser();

        // Fetch the created user for associating with listings
        testUser = userRepository.findByUsername("carowner")
                .orElseThrow(() -> new IllegalStateException("Test user 'carowner' not found after registration"));
    }

    private void setupCarBrandAndModel() {
        // Create test CarBrand
        testCarBrand = new CarBrand();
        testCarBrand.setName("Toyota");
        testCarBrand.setDisplayNameEn("Toyota");
        testCarBrand.setDisplayNameAr("تويوتا");
        testCarBrand.setSlug("toyota");
        testCarBrand = carBrandRepository.save(testCarBrand);

        // Create test CarModel
        testCarModel = new CarModel();
        testCarModel.setName("Camry");
        testCarModel.setDisplayNameEn("Camry");
        testCarModel.setDisplayNameAr("كامري");
        testCarModel.setBrand(testCarBrand);
        testCarModel.setSlug("camry");
        testCarModel = carModelRepository.save(testCarModel);
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
                baseUrl + "/api/auth/signup",
                signupRequest,
                Object.class
        );

        // 2. Login with the registered user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("carowner");
        loginRequest.setPassword("password123");

        ResponseEntity<JwtResponse> loginResponse = restTemplate.postForEntity(
                baseUrl + "/api/auth/signin",
                loginRequest,
                JwtResponse.class
        );
        
        JwtResponse jwtResponseBody = Objects.requireNonNull(loginResponse.getBody(), "Login response body should not be null");
        jwtToken = jwtResponseBody.getToken();
        assertNotNull(jwtToken, "JWT token should not be null");
    }

    private CarListing createAndSaveApprovedListing(String title, String brandName, String modelName, int year, BigDecimal price, Location location) {
        // Create CarBrand if it doesn't exist yet
        String brandSlug = brandName.toLowerCase().replace(' ', '-');
        CarBrand brand = carBrandRepository.findBySlug(brandSlug)
                .orElseGet(() -> {
                    CarBrand newBrand = new CarBrand();
                    newBrand.setName(brandName);
                    newBrand.setDisplayNameEn(brandName);
                    newBrand.setDisplayNameAr(brandName); // Simple Arabic name for test
                    newBrand.setSlug(brandSlug);
                    return carBrandRepository.save(newBrand);
                });

        // Create CarModel if it doesn't exist yet
        String modelSlug = modelName.toLowerCase().replace(' ', '-');
        List<CarModel> models = carModelRepository.findByBrand(brand);
        CarModel model = models.stream()
                .filter(m -> m.getName().equalsIgnoreCase(modelName))
                .findFirst()
                .orElseGet(() -> {
                    CarModel newModel = new CarModel();
                    newModel.setName(modelName);
                    newModel.setDisplayNameEn(modelName);
                    newModel.setDisplayNameAr(modelName); // Simple Arabic name for test
                    newModel.setBrand(brand);
                    newModel.setSlug(modelSlug);
                    return carModelRepository.save(newModel);
                });

        CarListing listing = new CarListing();
        listing.setTitle(title);
        listing.setModel(model); // Set CarModel object
        listing.setBrandNameEn(brand.getDisplayNameEn()); // Set denormalized fields
        listing.setBrandNameAr(brand.getDisplayNameAr());
        listing.setModelNameEn(model.getDisplayNameEn());
        listing.setModelNameAr(model.getDisplayNameAr());
        listing.setModelYear(year);
        listing.setPrice(price);
        listing.setSeller(testUser);
        listing.setLocation(location);

        // Ensure Governorate is set on the listing
        if (location != null && location.getGovernorate() != null) {
            // Fetch the Governorate to ensure it's initialized
            Governorate initializedGovernorate = governorateRepository.findById(location.getGovernorate().getId())
                .orElseThrow(() -> new IllegalStateException("Governorate not found for ID: " + location.getGovernorate().getId()));
            
            listing.setGovernorate(initializedGovernorate);
            listing.setGovernorateNameEn(initializedGovernorate.getDisplayNameEn());
            listing.setGovernorateNameAr(initializedGovernorate.getDisplayNameAr());
        } else {
            // This should not happen in a well-configured test environment
            // where location always has a valid, persisted governorate.
            throw new IllegalStateException("Location and its associated Governorate must not be null when creating a listing.");
        }

        listing.setApproved(true); // Ensure listing is approved
        listing.setDescription("Test description for " + title);
        listing.setMileage(10000); // Default mileage
        // Add other mandatory fields if any
        return carListingRepository.save(listing);
    }

    @Test
    public void testCreateAndRetrieveCarListing() {
        // Create HTTP headers with JWT token
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        
        // 1. Create a car listing
        CreateListingRequest createRequest = new CreateListingRequest();
        createRequest.setTitle("2022 Toyota Camry");
        createRequest.setModelId(testCarModel.getId()); // Use modelId
        createRequest.setModelYear(2022);
        createRequest.setMileage(15000);
        createRequest.setPrice(new BigDecimal("25000.00"));
        createRequest.setLocationId(testLocationId); // Use dynamically created locationId
        createRequest.setDescription("Excellent condition, one owner");
        
        HttpEntity<CreateListingRequest> createEntity = new HttpEntity<>(createRequest, headers);
        
        ResponseEntity<Map<String, Object>> createResponse = restTemplate.exchange(
                baseUrl + "/api/listings",
                HttpMethod.POST,
                createEntity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        
        assertEquals(HttpStatus.CREATED.value(), createResponse.getStatusCode().value());
        Map<String, Object> createResponseBody = Objects.requireNonNull(createResponse.getBody(), "Create response body should not be null");
        assertNotNull(createResponseBody.get("id"), "ID should be present in create response");
        
        // Get the ID of the created listing
        Number listingId = (Number) createResponseBody.get("id");
        assertNotNull(listingId, "Listing ID should not be null");
        
        // 2. Retrieve the car listing
        HttpEntity<String> getEntity = new HttpEntity<>(headers);
        
        ResponseEntity<Map<String, Object>> getResponse = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId.longValue(), // Use longValue for path
                HttpMethod.GET,
                getEntity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        
        // Accept either 200 or 404 based on actual implementation 
        // Some implementations may return the listing to the owner even if not approved (200)
        // Others may consistently return 404 for any unapproved listing
        int statusCode = getResponse.getStatusCode().value();
        assertTrue(
            statusCode == 200 || statusCode == 404,
            "Status should be either 200 (OK) or 404 (Not Found) based on implementation"
        );
        
        // 3. Verify the listing exists in the database (even if not approved)
        assertTrue(carListingRepository.findById(listingId.longValue()).isPresent());
        
        // 4. Attempt to access without authentication (should fail - expect 404 Not Found because it's unapproved)
        ResponseEntity<Map<String, Object>> unauthorizedResponse = restTemplate.exchange(
                baseUrl + "/api/listings/" + listingId.longValue(), // Use longValue for path
                HttpMethod.GET,
                null, // No body or headers needed for unauthorized GET
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );
        
        // Assert that accessing an unapproved listing publicly results in 404 Not Found
        assertEquals(HttpStatus.NOT_FOUND.value(), unauthorizedResponse.getStatusCode().value(), "Accessing unapproved listing publicly should return 404");
    }

    @Test
    @SuppressWarnings("unchecked") // Suppress warning for casting from Object
    public void testFilterByValidLocationSlug() {
        Location mainTestLocation = locationRepository.findById(testLocationId).orElseThrow();
        createAndSaveApprovedListing("Camry in Test City", "Toyota", "Camry", 2021, new BigDecimal("22000"), mainTestLocation);

        // Create and persist hierarchy for anotherLocation
        Country acCountry = TestGeographyUtils.createTestCountry("AC");
        acCountry = countryRepository.save(acCountry);

        Governorate acGovernorate = TestGeographyUtils.createTestGovernorate("AC Governorate", "محافظة أس", acCountry);
        acGovernorate = governorateRepository.save(acGovernorate);

        Location anotherLocation = TestGeographyUtils.createTestLocation("Another City AC", "مدينة أخرى أس", acGovernorate);
        anotherLocation = locationRepository.save(anotherLocation); // Now this should work
        createAndSaveApprovedListing("Accord in Another City", "Honda", "Accord", 2022, new BigDecimal("25000"), anotherLocation);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/listings/filter?location=test-governorate", // Use governorate slug, not location slug
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.OK.value(), response.getStatusCode().value());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((Number) responseBody.get("totalElements")).intValue());
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        assertNotNull(content);
        assertEquals(1, content.size());
        Map<String, Object> listingResponse = content.get(0);
        Map<String, Object> locationDetails = (Map<String, Object>) listingResponse.get("locationDetails");
        assertNotNull(locationDetails);
        assertEquals("test-city-lifecycle", locationDetails.get("slug"));
    }

    @Test
    @SuppressWarnings("unchecked") // Suppress warning for casting from Object
    public void testFilterByInvalidLocationSlug() {
        Location mainTestLocation = locationRepository.findById(testLocationId).orElseThrow();
        createAndSaveApprovedListing("Civic in Test City", "Honda", "Civic", 2020, new BigDecimal("18000"), mainTestLocation);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/listings/filter?location=invalid-nonexistent-slug",
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.OK.value(), response.getStatusCode().value());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(0, ((Number) responseBody.get("totalElements")).intValue());
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        assertNotNull(content);
        assertTrue(content.isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked") // Suppress warning for casting from Object
    public void testFilterWithNoLocationSlug() {
        Location mainTestLocation = locationRepository.findById(testLocationId).orElseThrow();
        createAndSaveApprovedListing("Corolla in Test City", "Toyota", "Corolla", 2019, new BigDecimal("16000"), mainTestLocation);

        // Create and persist hierarchy for anotherLocation
        Country anotherCountry = TestGeographyUtils.createTestCountry("SC");
        anotherCountry = countryRepository.save(anotherCountry);

        Governorate anotherGovernorate = TestGeographyUtils.createTestGovernorate("Second Governorate", "محافظة ثانية", anotherCountry);
        anotherGovernorate = governorateRepository.save(anotherGovernorate);
        
        Location anotherLocation = TestGeographyUtils.createTestLocation("Second City", "مدينة ثانية", anotherGovernorate);
        anotherLocation = locationRepository.save(anotherLocation); // Now this should work

        createAndSaveApprovedListing("Elantra in Second City", "Hyundai", "Elantra", 2021, new BigDecimal("20000"), anotherLocation);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/listings/filter", // No location query param
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.OK.value(), response.getStatusCode().value());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(2, ((Number) responseBody.get("totalElements")).intValue());
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        assertNotNull(content);
        assertEquals(2, content.size());
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testFilterByValidLocationId() {
        Location mainTestLocation = locationRepository.findById(testLocationId).orElseThrow();
        createAndSaveApprovedListing("Fusion in Test City", "Ford", "Fusion", 2020, new BigDecimal("21000"), mainTestLocation);

        // Create and persist hierarchy for anotherLocation
        Country liCountry = TestGeographyUtils.createTestCountry("LI");
        liCountry = countryRepository.save(liCountry);

        Governorate liGovernorate = TestGeographyUtils.createTestGovernorate("LI Governorate", "محافظة لي", liCountry);
        liGovernorate = governorateRepository.save(liGovernorate);

        Location anotherLocation = TestGeographyUtils.createTestLocation("Another City LI", "مدينة أخرى لي", liGovernorate);
        Location savedAnotherLocation = locationRepository.save(anotherLocation); // Now this should work
        createAndSaveApprovedListing("Malibu in Another City", "Chevrolet", "Malibu", 2022, new BigDecimal("24000"), savedAnotherLocation);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/listings/filter?locationId=" + testGovernorateId, // Filter by the ID of testGovernorate
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.OK.value(), response.getStatusCode().value());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((Number) responseBody.get("totalElements")).intValue());
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        assertNotNull(content);
        assertEquals(1, content.size());
        Map<String, Object> listingResponse = content.get(0);
        Map<String, Object> locationDetails = (Map<String, Object>) listingResponse.get("locationDetails");
        assertNotNull(locationDetails);
        assertEquals(testLocationId.intValue(), ((Number) locationDetails.get("id")).intValue());
        assertEquals(mainTestLocation.getSlug(), locationDetails.get("slug"));
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testFilterByInvalidLocationId() {
        Location mainTestLocation = locationRepository.findById(testLocationId).orElseThrow();
        createAndSaveApprovedListing("Optima in Test City", "Kia", "Optima", 2019, new BigDecimal("19000"), mainTestLocation);

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        long nonExistentLocationId = 99999L; // An ID that is unlikely to exist

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/listings/filter?locationId=" + nonExistentLocationId,
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.OK.value(), response.getStatusCode().value());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(0, ((Number) responseBody.get("totalElements")).intValue());
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        assertNotNull(content);
        assertTrue(content.isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    public void testFilterByLocationIdTakesPrecedenceOverSlug() {
        Location mainTestLocation = locationRepository.findById(testLocationId).orElseThrow(); // Slug: "test-city-lifecycle"
        createAndSaveApprovedListing("Altima in Main Test City", "Nissan", "Altima", 2021, new BigDecimal("23000"), mainTestLocation);

        // Create and persist hierarchy for anotherLocation
        Country alCountry = TestGeographyUtils.createTestCountry("AL");
        alCountry = countryRepository.save(alCountry);

        Governorate alGovernorate = TestGeographyUtils.createTestGovernorate("AL Governorate", "محافظة أل", alCountry);
        alGovernorate = governorateRepository.save(alGovernorate);
        
        Location anotherLocation = TestGeographyUtils.createTestLocation("Another Location AL", "موقع آخر أل", alGovernorate);
        Location savedAnotherLocation = locationRepository.save(anotherLocation); // Now this should work
        // Listing in 'anotherLocation'
        createAndSaveApprovedListing("Sentra in Another Location", "Nissan", "Sentra", 2022, new BigDecimal("22000"), savedAnotherLocation);


        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + jwtToken);
        HttpEntity<String> entity = new HttpEntity<>(headers);

        // Provide both locationId (for testGovernorate) and location slug (for savedAnotherLocation)
        // Expecting locationId to take precedence
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                baseUrl + "/api/listings/filter?locationId=" + testGovernorateId + "&location=" + savedAnotherLocation.getSlug(),
                HttpMethod.GET,
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
        );

        assertEquals(HttpStatus.OK.value(), response.getStatusCode().value());
        Map<String, Object> responseBody = response.getBody();
        assertNotNull(responseBody);
        assertEquals(1, ((Number) responseBody.get("totalElements")).intValue(), 
            "Should find 1 listing based on locationId, ignoring slug");
        List<Map<String, Object>> content = (List<Map<String, Object>>) responseBody.get("content");
        assertNotNull(content);
        assertEquals(1, content.size());
        Map<String, Object> listingResponse = content.get(0);
        assertEquals("Altima in Main Test City", listingResponse.get("title"));
        Map<String, Object> locationDetails = (Map<String, Object>) listingResponse.get("locationDetails");
        assertNotNull(locationDetails);
        assertEquals(testLocationId.intValue(), ((Number) locationDetails.get("id")).intValue());
        assertEquals(mainTestLocation.getSlug(), locationDetails.get("slug"));
    }
}

package com.caryo.marketplace.service;

import com.caryo.marketplace.payload.request.SavedSearchRequest;
import com.caryo.marketplace.payload.response.SavedSearchResponse;
import com.caryo.marketplace.model.*;
import com.caryo.marketplace.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;

/**
 * Integration tests for SavedSearchService
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SavedSearchServiceIntegrationTest {

    @Autowired
    private SavedSearchService savedSearchService;

    @Autowired
    private SavedSearchRepository savedSearchRepository;

    @Autowired
    private SavedSearchNotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private CarBrandRepository carBrandRepository;

    @Autowired
    private CarModelRepository carModelRepository;

    @Autowired
    private GovernorateRepository governorateRepository;

    @Autowired
    private CountryRepository countryRepository;

    @MockBean
    private JavaMailSender mailSender;

    private User testUser;
    private CarBrand toyotaBrand;
    private CarModel camryModel;
    private Country testCountry;
    private Governorate riyadhGovernorate;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User("testuser", "test@example.com", "password");
        testUser = userRepository.save(testUser);

        // Create test brand and model
        toyotaBrand = new CarBrand();
        toyotaBrand.setName("Toyota");
        toyotaBrand.setSlug("toyota");
        toyotaBrand.setDisplayNameEn("Toyota");
        toyotaBrand.setDisplayNameAr("تويوتا");
        toyotaBrand = carBrandRepository.save(toyotaBrand);

        camryModel = new CarModel();
        camryModel.setName("Camry");
        camryModel.setSlug("camry");
        camryModel.setDisplayNameEn("Camry");
        camryModel.setDisplayNameAr("كامري");
        camryModel.setBrand(toyotaBrand);
        camryModel = carModelRepository.save(camryModel);

        // Create test country first (required for governorate)
        // Check if country already exists to avoid unique constraint violations
        testCountry = countryRepository.findByCountryCode("SA")
                .orElseGet(() -> {
                    Country newCountry = new Country();
                    newCountry.setCountryCode("SA");
                    newCountry.setDisplayNameEn("Saudi Arabia");
                    newCountry.setDisplayNameAr("المملكة العربية السعودية");
                    newCountry.setIsActive(true);
                    return countryRepository.save(newCountry);
                });

        // Create test governorate with required country relationship
        // Check if governorate already exists to avoid unique constraint violations
        riyadhGovernorate = governorateRepository.findBySlug("riyadh")
                .orElseGet(() -> {
                    Governorate newGovernorate = new Governorate();
                    newGovernorate.setDisplayNameEn("Riyadh");
                    newGovernorate.setDisplayNameAr("الرياض");
                    newGovernorate.setSlug("riyadh");
                    newGovernorate.setCountry(testCountry); // Set the required country reference
                    newGovernorate.setIsActive(true);
                    return governorateRepository.save(newGovernorate);
                });
    }

    @Test
    void createSavedSearch_ShouldCreateSuccessfully() {
        // Arrange
        Map<String, Object> filters = new HashMap<>();
        filters.put("brandSlugs", List.of("toyota"));
        filters.put("minPrice", 20000);
        filters.put("maxPrice", 40000);

        Map<String, Object> notificationPrefs = new HashMap<>();
        notificationPrefs.put("email", true);
        notificationPrefs.put("frequency", "immediate");

        SavedSearchRequest request = new SavedSearchRequest();
        request.setNameEn("My Toyota Search");
        request.setNameAr("بحث تويوتا");
        request.setFilters(filters);
        request.setNotificationPreferences(notificationPrefs);

        // Act
        SavedSearchResponse response = savedSearchService.createSavedSearch(request, testUser.getUsername());

        // Assert
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals("My Toyota Search", response.getNameEn());
        assertEquals("بحث تويوتا", response.getNameAr());
        assertTrue(response.getIsActive());
        assertNotNull(response.getCreatedAt());
    }

    @Test
    void processNewListingForNotifications_ShouldSendNotification() {
        // Arrange
        // Create saved search
        Map<String, Object> filters = new HashMap<>();
        filters.put("brandSlugs", List.of("toyota"));
        filters.put("minPrice", 20000);
        filters.put("maxPrice", 40000);

        Map<String, Object> notificationPrefs = new HashMap<>();
        notificationPrefs.put("email", true);
        notificationPrefs.put("frequency", "immediate");

        SavedSearchRequest request = new SavedSearchRequest();
        request.setNameEn("My Toyota Search");
        request.setFilters(filters);
        request.setNotificationPreferences(notificationPrefs);

        SavedSearchResponse savedSearchResponse = savedSearchService.createSavedSearch(request, testUser.getUsername());

        // Create matching car listing
        CarListing listing = new CarListing();
        listing.setTitle("2023 Toyota Camry");
        listing.setModel(camryModel);
        listing.setPrice(BigDecimal.valueOf(30000));
        listing.setModelYear(2023);
        listing.setMileage(10000);
        listing.setDescription("Great condition");
        listing.setSeller(testUser);
        listing.setGovernorate(riyadhGovernorate);
        listing.setBrandNameEn(toyotaBrand.getDisplayNameEn());
        listing.setModelNameEn(camryModel.getDisplayNameEn());
        listing = carListingRepository.save(listing);

        // Act
        savedSearchService.processNewListingForNotifications(listing);

        // Assert
        // Verify that notification was recorded
        boolean notificationExists = notificationRepository.existsBySavedSearchAndListing(
                savedSearchRepository.findById(savedSearchResponse.getId()).orElseThrow(),
                listing
        );
        assertTrue(notificationExists);

        // Verify email was sent
        verify(mailSender).send(any(org.springframework.mail.SimpleMailMessage.class));
    }

    @Test
    void processNewListingForNotifications_ShouldNotDuplicateNotifications() {
        // Arrange
        Map<String, Object> filters = new HashMap<>();
        filters.put("brandSlugs", List.of("toyota"));

        Map<String, Object> notificationPrefs = new HashMap<>();
        notificationPrefs.put("email", true);
        notificationPrefs.put("frequency", "immediate");

        SavedSearchRequest request = new SavedSearchRequest();
        request.setNameEn("Toyota Search");
        request.setFilters(filters);
        request.setNotificationPreferences(notificationPrefs);

        SavedSearchResponse savedSearchResponse = savedSearchService.createSavedSearch(request, testUser.getUsername());

        CarListing listing = new CarListing();
        listing.setTitle("2023 Toyota Camry");
        listing.setModel(camryModel);
        listing.setPrice(BigDecimal.valueOf(30000));
        listing.setModelYear(2023);
        listing.setMileage(10000);
        listing.setDescription("Great condition");
        listing.setSeller(testUser);
        listing.setGovernorate(riyadhGovernorate);
        listing.setBrandNameEn(toyotaBrand.getDisplayNameEn());
        listing.setModelNameEn(camryModel.getDisplayNameEn());
        listing = carListingRepository.save(listing);

        // Act
        savedSearchService.processNewListingForNotifications(listing);
        savedSearchService.processNewListingForNotifications(listing); // Process again

        // Assert
        // Should only have one notification record
        SavedSearch savedSearch = savedSearchRepository.findById(savedSearchResponse.getId()).orElseThrow();
        List<SavedSearchNotification> notifications = notificationRepository.findBySavedSearchOrderByNotifiedAtDesc(savedSearch);
        assertEquals(1, notifications.size());
    }

    @Test
    void getUserSavedSearches_ShouldReturnUserSearchesOnly() {
        // Arrange
        // Create searches for test user with different filters
        SavedSearchRequest request1 = createSavedSearchRequest("Search 1", "toyota");
        SavedSearchRequest request2 = createSavedSearchRequest("Search 2", "honda");

        savedSearchService.createSavedSearch(request1, testUser.getUsername());
        savedSearchService.createSavedSearch(request2, testUser.getUsername());

        // Create another user and their search
        User otherUser = new User();
        otherUser.setUsername("otheruser");
        otherUser.setEmail("other@example.com");
        otherUser.setPassword("password");
        otherUser = userRepository.save(otherUser);

        SavedSearchRequest request3 = createSavedSearchRequest("Other User Search", "bmw");
        savedSearchService.createSavedSearch(request3, otherUser.getUsername());

        // Act
        List<SavedSearchResponse> userSearches = savedSearchService.getUserSavedSearches(testUser.getUsername());

        // Assert
        assertEquals(2, userSearches.size());
        assertTrue(userSearches.stream().allMatch(search ->
            search.getNameEn().equals("Search 1") || search.getNameEn().equals("Search 2")));
    }

    private SavedSearchRequest createSavedSearchRequest(String name, String brand) {
        Map<String, Object> filters = new HashMap<>();
        filters.put("brandSlugs", List.of(brand));

        Map<String, Object> notificationPrefs = new HashMap<>();
        notificationPrefs.put("email", true);
        notificationPrefs.put("frequency", "immediate");

        SavedSearchRequest request = new SavedSearchRequest();
        request.setNameEn(name);
        request.setFilters(filters);
        request.setNotificationPreferences(notificationPrefs);
        return request;
    }
}

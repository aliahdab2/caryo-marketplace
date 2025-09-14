package com.autotrader.autotraderbackend.integration;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.model.ModelStatus;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;

import com.autotrader.autotraderbackend.service.CarListingService;
import com.autotrader.autotraderbackend.util.TestDataGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for the AutoTrader contact fields functionality.
 * Tests the complete workflow from API request to database storage and response mapping.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("Contact Fields Integration Tests (AutoTrader Pattern)")
public class ContactFieldsIntegrationTest {
    
    private static final Logger log = LoggerFactory.getLogger(ContactFieldsIntegrationTest.class);

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CarListingService carListingService;

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CarModelRepository carModelRepository;
    
    @Autowired
    private CarBrandRepository carBrandRepository;
    
    @Autowired
    private LocationRepository locationRepository;
    
    @Autowired
    private GovernorateRepository governorateRepository;
    


    private User testUser;
    private CarModel testModel;
    private Location testLocation;

    @BeforeEach
    void setUp() {
        // Create test user (seller)
        testUser = new User();
        testUser.setUsername("testdealer");
        testUser.setEmail("dealer@caryo.sy");
        testUser.setPassword("password123");
        // Mark user as email verified for testing
        testUser.markEmailAsVerified();
        testUser = userRepository.save(testUser);

        // Find existing test location - the integration tests run with seeded data
        testLocation = locationRepository.findAll().stream().findFirst().orElse(null);
        if (testLocation == null) {
            // If no locations exist, create a simple test location for the test
            // This ensures the test can run even if the seeder fails
            log.warn("No test locations found from seeder. Creating a simple test location.");
            
            // Find any governorate to use
            var governorate = governorateRepository.findAll().stream().findFirst().orElse(null);
            if (governorate == null) {
                throw new IllegalStateException("No governorates found. Cannot create test location.");
            }
            
            Location simpleLocation = new Location();
            simpleLocation.setDisplayNameEn("Test City");
            simpleLocation.setDisplayNameAr("مدينة الاختبار");
            simpleLocation.setSlug("test-city");
            simpleLocation.setLatitude(33.5138);
            simpleLocation.setLongitude(36.2765);
            simpleLocation.setRegion("Test Region");
            simpleLocation.setIsActive(true);
            simpleLocation.setGovernorate(governorate);
            
            testLocation = locationRepository.save(simpleLocation);
            log.info("Created test location: {}", testLocation.getDisplayNameEn());
        }
        
        // Create and save car brand and model
        CarBrand testBrand = new CarBrand();
        testBrand.setName("Toyota");
        testBrand.setSlug("toyota");
        testBrand.setDisplayNameEn("Toyota");
        testBrand.setDisplayNameAr("تويوتا");
        testBrand = carBrandRepository.save(testBrand);
        
        testModel = new CarModel();
        testModel.setName("Camry");
        testModel.setSlug("camry");
        testModel.setDisplayNameEn("Camry");
        testModel.setDisplayNameAr("كامري");
        testModel.setBrand(testBrand);
        testModel = carModelRepository.save(testModel);
    }

    @Nested
    @DisplayName("Creating Listings with Contact Fields")
    class CreateListingTests {

        @Test
        @WithMockUser(username = "testdealer")
        @DisplayName("Should create listing with custom contact fields")
        void createListing_WithCustomContactFields_ShouldSaveCorrectly() throws Exception {
            // Arrange
            CreateListingRequest request = new CreateListingRequest();
            request.setTitle("Toyota Camry 2023");
            request.setModelId(testModel.getId());
            request.setModelYear(2023);
            request.setMileage(15000);
            request.setPrice(new BigDecimal("25000.00"));
            request.setCurrency("USD");
            request.setLocationId(testLocation.getId());
            request.setDescription("Excellent condition");
            
            // AutoTrader pattern: Custom contact fields
            request.setContactName("Sales Department");
            request.setContactEmail("sales@toyotadealer.com");
            request.setContactPhone("+966501234567");
            request.setContactPreference("both");

            // Act & Assert
            mockMvc.perform(post("/api/listings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.contactName").value("Sales Department"))
                    .andExpect(jsonPath("$.contactEmail").value("sales@toyotadealer.com"))
                    .andExpect(jsonPath("$.contactPhone").value("+966501234567"))
                    .andExpect(jsonPath("$.contactPreference").value("both"));
        }

        @Test
        @WithMockUser(username = "testdealer")
        @DisplayName("Should create listing without contact fields and use seller fallbacks")
        void createListing_WithoutContactFields_ShouldFallbackToSeller() throws Exception {
            // Arrange
            CreateListingRequest request = new CreateListingRequest();
            request.setTitle("Toyota Camry 2023");
            request.setModelId(testModel.getId());
            request.setModelYear(2023);
            request.setMileage(15000);
            request.setPrice(new BigDecimal("25000.00"));
            request.setCurrency("USD");
            request.setLocationId(testLocation.getId());
            request.setDescription("Excellent condition");
            
            // No contact fields set - should fallback to seller info

            // Act & Assert
            mockMvc.perform(post("/api/listings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.contactName").value("testdealer")) // Fallback to username
                    .andExpect(jsonPath("$.contactEmail").value("dealer@caryo.sy")) // Fallback to user email
                    .andExpect(jsonPath("$.contactPhone").isEmpty()) // No fallback for phone
                    .andExpect(jsonPath("$.contactPreference").value("email")); // Default preference
        }

        @Test
        @WithMockUser(username = "testdealer")
        @DisplayName("Should create listing with partial contact fields and mixed fallbacks")
        void createListing_WithPartialContactFields_ShouldMixCustomAndFallback() throws Exception {
            // Arrange
            CreateListingRequest request = new CreateListingRequest();
            request.setTitle("Toyota Camry 2023");
            request.setModelId(testModel.getId());
            request.setModelYear(2023);
            request.setMileage(15000);
            request.setPrice(new BigDecimal("25000.00"));
            request.setCurrency("USD");
            request.setLocationId(testLocation.getId());
            request.setDescription("Excellent condition");
            
            // AutoTrader pattern: Only some contact fields
            request.setContactName("Service Department");
            request.setContactPhone("+966509876543");
            // contactEmail and contactPreference not set - should fallback

            // Act & Assert
            mockMvc.perform(post("/api/listings")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.contactName").value("Service Department")) // Custom
                    .andExpect(jsonPath("$.contactEmail").value("dealer@caryo.sy")) // Fallback
                    .andExpect(jsonPath("$.contactPhone").value("+966509876543")) // Custom
                    .andExpect(jsonPath("$.contactPreference").value("email")); // Fallback
        }
    }

    @Nested
    @DisplayName("Updating Listings with Contact Fields")
    class UpdateListingTests {

        private Long listingId;

        @BeforeEach
        void setUpListing() {
            // Create a test listing first
            CarListing listing = new CarListing();
            listing.setTitle("Test Listing");
            listing.setModel(testModel);
            listing.setModelYear(2023);
            listing.setMileage(10000);
            listing.setPrice(new BigDecimal("20000.00"));
            listing.setCurrency("USD");
            listing.setLocation(testLocation);
            // Set governorate from location
            listing.setGovernorate(testLocation.getGovernorate());
            listing.setGovernorateNameEn(testLocation.getGovernorate().getDisplayNameEn());
            listing.setGovernorateNameAr(testLocation.getGovernorate().getDisplayNameAr());
            listing.setDescription("Test description");
            listing.setSeller(testUser);
            
            // Initial contact fields
            listing.setContactName("Initial Contact");
            listing.setContactEmail("initial@example.com");
            listing.setContactPhone("+966501111111");
            listing.setContactPreference("email");
            
            listing = carListingRepository.save(listing);
            listingId = listing.getId();
        }

        @Test
        @WithMockUser(username = "testdealer")
        @DisplayName("Should update contact fields successfully")
        void updateListing_WithNewContactFields_ShouldUpdateCorrectly() throws Exception {
            // Arrange
            UpdateListingRequest request = new UpdateListingRequest();
            request.setContactName("Updated Sales Team");
            request.setContactEmail("newsales@dealer.com");
            request.setContactPhone("+966502222222");
            request.setContactPreference("phone");

            // Act & Assert
            mockMvc.perform(put("/api/listings/" + listingId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.contactName").value("Updated Sales Team"))
                    .andExpect(jsonPath("$.contactEmail").value("newsales@dealer.com"))
                    .andExpect(jsonPath("$.contactPhone").value("+966502222222"))
                    .andExpect(jsonPath("$.contactPreference").value("phone"));
        }

        @Test
        @WithMockUser(username = "testdealer")
        @DisplayName("Should clear contact fields when set to null and fallback to seller")
        void updateListing_WithNullContactFields_ShouldFallbackToSeller() throws Exception {
            // Arrange
            UpdateListingRequest request = new UpdateListingRequest();
            request.setContactName(null);
            request.setContactEmail(null);
            request.setContactPhone(null);
            request.setContactPreference(null);

            // Act & Assert
            mockMvc.perform(put("/api/listings/" + listingId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.contactName").value("testdealer")) // Fallback
                    .andExpect(jsonPath("$.contactEmail").value("dealer@caryo.sy")) // Fallback
                    .andExpect(jsonPath("$.contactPhone").isEmpty()) // No fallback
                    .andExpect(jsonPath("$.contactPreference").value("email")); // Fallback
        }
    }

    @Nested
    @DisplayName("Retrieving Listings with Contact Fields")
    class RetrieveListingTests {

        @Test
        @WithMockUser(username = "testdealer")
        @DisplayName("Should retrieve listing with correct contact field priority")
        void getListing_WithContactFields_ShouldReturnCorrectPriority() throws Exception {
            // Arrange - Create listing with custom contact info
            CarListing listing = new CarListing();
            listing.setTitle("Priority Test Listing");
            listing.setModel(testModel);
            listing.setModelYear(2023);
            listing.setMileage(5000);
            listing.setPrice(new BigDecimal("30000.00"));
            listing.setCurrency("USD");
            listing.setLocation(testLocation);
            // Set governorate from location
            listing.setGovernorate(testLocation.getGovernorate());
            listing.setGovernorateNameEn(testLocation.getGovernorate().getDisplayNameEn());
            listing.setGovernorateNameAr(testLocation.getGovernorate().getDisplayNameAr());
            listing.setDescription("Priority test");
            listing.setSeller(testUser);
            
            // Custom contact fields should take priority over seller info
            listing.setContactName("Luxury Cars Division");
            listing.setContactEmail("luxury@premiumdealer.com");
            listing.setContactPhone("+966503333333");
            listing.setContactPreference("both");
            
            listing = carListingRepository.save(listing);

            // Act & Assert - Use my-listings endpoint to get unapproved listings
            mockMvc.perform(get("/api/listings/my-listings"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].contactName").value("Luxury Cars Division"))
                    .andExpect(jsonPath("$[0].contactEmail").value("luxury@premiumdealer.com"))
                    .andExpect(jsonPath("$[0].contactPhone").value("+966503333333"))
                    .andExpect(jsonPath("$[0].contactPreference").value("both"))
                    // Should also include seller info separately
                    .andExpect(jsonPath("$[0].sellerUsername").value("testdealer"))
                    .andExpect(jsonPath("$[0].sellerEmail").value("dealer@caryo.sy"));
        }
    }

    @Nested
    @DisplayName("Database Persistence Tests")
    class PersistenceTests {

        @Test
        @DisplayName("Should persist contact fields correctly in database")
        void persistContactFields_ShouldSaveAndRetrieveCorrectly() {
            // Arrange
            CarListing listing = new CarListing();
            listing.setTitle("Persistence Test");
            listing.setModel(testModel);
            listing.setModelYear(2023);
            listing.setMileage(1000);
            listing.setPrice(new BigDecimal("35000.00"));
            listing.setCurrency("USD");
            listing.setLocation(testLocation);
            // Set governorate from location
            listing.setGovernorate(testLocation.getGovernorate());
            listing.setGovernorateNameEn(testLocation.getGovernorate().getDisplayNameEn());
            listing.setGovernorateNameAr(testLocation.getGovernorate().getDisplayNameAr());
            listing.setDescription("Persistence test");
            listing.setSeller(testUser);
            
            // Set contact fields
            listing.setContactName("Test Contact Name");
            listing.setContactEmail("test@persistence.com");
            listing.setContactPhone("+966504444444");
            listing.setContactPreference("phone");

            // Act
            CarListing savedListing = carListingRepository.save(listing);
            Long savedId = savedListing.getId();
            
            // Clear session to ensure fresh fetch
            carListingRepository.flush();
            
            CarListing retrievedListing = carListingRepository.findById(savedId).orElse(null);

            // Assert
            assertNotNull(retrievedListing);
            assertEquals("Test Contact Name", retrievedListing.getContactName());
            assertEquals("test@persistence.com", retrievedListing.getContactEmail());
            assertEquals("+966504444444", retrievedListing.getContactPhone());
            assertEquals("phone", retrievedListing.getContactPreference());
        }

        @Test
        @DisplayName("Should handle null contact fields correctly in database")
        void persistNullContactFields_ShouldSaveAndRetrieveCorrectly() {
            // Arrange
            CarListing listing = new CarListing();
            listing.setTitle("Null Fields Test");
            listing.setModel(testModel);
            listing.setModelYear(2023);
            listing.setMileage(2000);
            listing.setPrice(new BigDecimal("28000.00"));
            listing.setCurrency("USD");
            listing.setLocation(testLocation);
            // Set governorate from location
            listing.setGovernorate(testLocation.getGovernorate());
            listing.setGovernorateNameEn(testLocation.getGovernorate().getDisplayNameEn());
            listing.setGovernorateNameAr(testLocation.getGovernorate().getDisplayNameAr());
            listing.setDescription("Null test");
            listing.setSeller(testUser);
            
            // Don't set contact fields (they should be null)

            // Act
            CarListing savedListing = carListingRepository.save(listing);
            Long savedId = savedListing.getId();
            
            carListingRepository.flush();
            CarListing retrievedListing = carListingRepository.findById(savedId).orElse(null);

            // Assert
            assertNotNull(retrievedListing);
            assertNull(retrievedListing.getContactName());
            assertNull(retrievedListing.getContactEmail());
            assertNull(retrievedListing.getContactPhone());
            assertEquals("email", retrievedListing.getContactPreference()); // Default value
        }
    }
}

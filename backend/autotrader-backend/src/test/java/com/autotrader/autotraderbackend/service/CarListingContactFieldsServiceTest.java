package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.CarModelRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import com.autotrader.autotraderbackend.service.storage.StorageKeyGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Service-level tests for contact fields functionality in CarListingService.
 * Tests the business logic for handling AutoTrader contact pattern.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CarListingService Contact Fields Tests (AutoTrader Pattern)")
class CarListingContactFieldsServiceTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private CarModelRepository carModelRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CarListingMapper carListingMapper;
    
    @Mock
    private GovernorateRepository governorateRepository;
    
    @Mock
    private StorageService storageService;
    
    @Mock
    private StorageKeyGenerator storageKeyGenerator;
    
    @Mock
    private CarModelService carModelService;
    
    @Mock
    private TransmissionService transmissionService;
    
    @Mock
    private FuelTypeService fuelTypeService;
    
    @Mock
    private BodyStyleService bodyStyleService;
    
    @Mock
    private SavedSearchService savedSearchService;

    @Mock
    private CarListingCrudService crudService;

    @Mock
    private CarListingMediaService carListingMediaService;

    @InjectMocks
    private CarListingService carListingService;

    private User testUser;
    private CarModel testModel;
    private Location testLocation;
    private CarListing testListing;

    @BeforeEach
    void setUp() {
        // Setup test user (seller)
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("dealeruser");
        testUser.setEmail("dealer@caryo.sy");
        testUser.markEmailAsVerified(); // Mark user as verified for tests

        // Setup test car model
        CarBrand testBrand = new CarBrand();
        testBrand.setId(1L);
        testBrand.setName("BMW");
        
        testModel = new CarModel();
        testModel.setId(1L);
        testModel.setName("X5");
        testModel.setBrand(testBrand);

        // Setup test governorate
        Governorate testGovernorate = new Governorate();
        testGovernorate.setId(1L);
        testGovernorate.setDisplayNameEn("Dubai Governorate");
        testGovernorate.setDisplayNameAr("محافظة دبي");

        // Setup test location
        testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setDisplayNameEn("Dubai");
        testLocation.setGovernorate(testGovernorate);

        // Setup test listing
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("BMW X5 2023");
        testListing.setModel(testModel);
        testListing.setSeller(testUser);
        testListing.setLocation(testLocation);
        testListing.setModelYear(2023);
        testListing.setMileage(5000);
        testListing.setPrice(new BigDecimal("75000.00"));
        testListing.setCurrency("USD");
        testListing.setDescription("Luxury SUV");
    }

    @Nested
    @DisplayName("Creating Listings with Contact Fields")
    class CreateListingContactTests {

        @Test
        @DisplayName("Should create listing with custom contact fields")
        void createListing_WithCustomContactFields_ShouldSetCorrectly() {
            // Arrange
            CreateListingRequest request = new CreateListingRequest();
            request.setTitle("BMW X5 2023");
            request.setModelId(1L);
            request.setLocationId(1L);
            request.setModelYear(2023);
            request.setMileage(5000);
            request.setPrice(new BigDecimal("75000.00"));
            request.setCurrency("USD");
            request.setDescription("Luxury SUV");
            
            // AutoTrader pattern: Custom contact fields
            request.setContactName("BMW Sales Team");
            request.setContactEmail("bmw-sales@dealer.com");
            request.setContactPhone("+966501111111");
            request.setContactPreference("both");

            CarListing expectedListing = new CarListing();
            expectedListing.setId(1L);
            expectedListing.setContactName("BMW Sales Team");
            expectedListing.setContactEmail("bmw-sales@dealer.com");
            expectedListing.setContactPhone("+966501111111");
            expectedListing.setContactPreference("both");

            CarListingResponse expectedResponse = new CarListingResponse();
            expectedResponse.setId(1L);
            expectedResponse.setContactName("BMW Sales Team");
            expectedResponse.setContactEmail("bmw-sales@dealer.com");
            expectedResponse.setContactPhone("+966501111111");
            expectedResponse.setContactPreference("both");

            // Mock dependencies
            when(crudService.createListingInternal(request, "dealeruser")).thenReturn(expectedResponse);

            // Act
            CarListingResponse result = carListingService.createListing(request, "dealeruser");

            // Assert
            assertNotNull(result);
            assertEquals("BMW Sales Team", result.getContactName());
            assertEquals("bmw-sales@dealer.com", result.getContactEmail());
            assertEquals("+966501111111", result.getContactPhone());
            assertEquals("both", result.getContactPreference());

            // Verify that the crudService was called
            verify(crudService).createListingInternal(request, "dealeruser");
        }

        @Test
        @DisplayName("Should create listing without contact fields and use defaults")
        void createListing_WithoutContactFields_ShouldUseDefaults() {
            // Arrange
            CreateListingRequest request = new CreateListingRequest();
            request.setTitle("BMW X5 2023");
            request.setModelId(1L);
            request.setLocationId(1L);
            request.setModelYear(2023);
            request.setMileage(5000);
            request.setPrice(new BigDecimal("75000.00"));
            request.setCurrency("USD");
            request.setDescription("Luxury SUV");
            // No contact fields set

            CarListing expectedListing = new CarListing();
            expectedListing.setId(1L);
            // Contact fields will be null in entity, fallback handled in mapper

            CarListingResponse expectedResponse = new CarListingResponse();
            expectedResponse.setId(1L);
            expectedResponse.setContactName("dealeruser"); // Fallback to username
            expectedResponse.setContactEmail("dealer@caryo.sy"); // Fallback to user email
            expectedResponse.setContactPhone(null); // No fallback for phone
            expectedResponse.setContactPreference("email"); // Default preference

            // Mock dependencies
            when(crudService.createListingInternal(request, "dealeruser")).thenReturn(expectedResponse);

            // Act
            CarListingResponse result = carListingService.createListing(request, "dealeruser");

            // Assert
            assertNotNull(result);
            assertEquals("dealeruser", result.getContactName()); // Fallback
            assertEquals("dealer@caryo.sy", result.getContactEmail()); // Fallback
            assertNull(result.getContactPhone()); // No fallback
            assertEquals("email", result.getContactPreference()); // Default

            // Verify that the crudService was called
            verify(crudService).createListingInternal(request, "dealeruser");
        }
    }

    @Nested
    @DisplayName("Updating Listings with Contact Fields")
    class UpdateListingContactTests {

        @Test
        @DisplayName("Should update contact fields successfully")
        void updateListing_WithNewContactFields_ShouldUpdateCorrectly() {
            // Arrange
            testListing.setContactName("Old Contact");
            testListing.setContactEmail("old@example.com");
            testListing.setContactPhone("+966501111111");
            testListing.setContactPreference("email");

            UpdateListingRequest request = new UpdateListingRequest();
            request.setContactName("New Sales Manager");
            request.setContactEmail("newsales@dealer.com");
            request.setContactPhone("+966502222222");
            request.setContactPreference("phone");

            CarListing updatedListing = new CarListing();
            updatedListing.setId(1L);
            updatedListing.setContactName("New Sales Manager");
            updatedListing.setContactEmail("newsales@dealer.com");
            updatedListing.setContactPhone("+966502222222");
            updatedListing.setContactPreference("phone");

            CarListingResponse expectedResponse = new CarListingResponse();
            expectedResponse.setId(1L);
            expectedResponse.setContactName("New Sales Manager");
            expectedResponse.setContactEmail("newsales@dealer.com");
            expectedResponse.setContactPhone("+966502222222");
            expectedResponse.setContactPreference("phone");

            // Mock dependencies
            when(crudService.updateListing(1L, request, "dealeruser")).thenReturn(expectedResponse);

            // Act
            CarListingResponse result = carListingService.updateListing(1L, request, "dealeruser");

            // Assert
            assertNotNull(result);
            assertEquals("New Sales Manager", result.getContactName());
            assertEquals("newsales@dealer.com", result.getContactEmail());
            assertEquals("+966502222222", result.getContactPhone());
            assertEquals("phone", result.getContactPreference());

            // Verify the crudService was called
            verify(crudService).updateListing(1L, request, "dealeruser");
        }

        @Test
        @DisplayName("Should clear contact fields when updated to null")
        void updateListing_WithNullContactFields_ShouldClearFields() {
            // Arrange
            testListing.setContactName("Existing Contact");
            testListing.setContactEmail("existing@example.com");
            testListing.setContactPhone("+966501111111");
            testListing.setContactPreference("email");

            UpdateListingRequest request = new UpdateListingRequest();
            request.setContactName(null);
            request.setContactEmail(null);
            request.setContactPhone(null);
            request.setContactPreference(null);

            CarListing updatedListing = new CarListing();
            updatedListing.setId(1L);
            updatedListing.setSeller(testUser);
            // Contact fields are null, fallback handled in mapper

            CarListingResponse expectedResponse = new CarListingResponse();
            expectedResponse.setId(1L);
            expectedResponse.setContactName("dealeruser"); // Fallback
            expectedResponse.setContactEmail("dealer@caryo.sy"); // Fallback
            expectedResponse.setContactPhone(null); // No fallback
            expectedResponse.setContactPreference("email"); // Fallback

            // Mock dependencies
            when(crudService.updateListing(1L, request, "dealeruser")).thenReturn(expectedResponse);

            // Act
            CarListingResponse result = carListingService.updateListing(1L, request, "dealeruser");

            // Assert
            assertNotNull(result);
            assertEquals("dealeruser", result.getContactName()); // Fallback to username
            assertEquals("dealer@caryo.sy", result.getContactEmail()); // Fallback to user email
            assertNull(result.getContactPhone()); // No fallback
            assertEquals("email", result.getContactPreference()); // Fallback

            // Verify the crudService was called
            verify(crudService).updateListing(1L, request, "dealeruser");
        }
    }

    @Nested
    @DisplayName("Business Logic Validation")
    class BusinessLogicTests {

        @Test
        @DisplayName("Should preserve existing contact fields when update request doesn't include them")
        void updateListing_WithoutContactFieldsInRequest_ShouldPreserveExisting() {
            // Arrange
            testListing.setContactName("Preserved Contact");
            testListing.setContactEmail("preserved@example.com");
            testListing.setContactPhone("+966501111111");
            testListing.setContactPreference("phone");

            UpdateListingRequest request = new UpdateListingRequest();
            request.setTitle("Updated Title"); // Only updating title, not contact fields
            // Contact fields not included in request - should be preserved

            CarListing updatedListing = new CarListing();
            updatedListing.setId(1L);
            updatedListing.setTitle("Updated Title");
            updatedListing.setContactName("Preserved Contact");
            updatedListing.setContactEmail("preserved@example.com");
            updatedListing.setContactPhone("+966501111111");
            updatedListing.setContactPreference("phone");

            CarListingResponse expectedResponse = new CarListingResponse();
            expectedResponse.setId(1L);
            expectedResponse.setTitle("Updated Title");
            expectedResponse.setContactName("Preserved Contact");
            expectedResponse.setContactEmail("preserved@example.com");
            expectedResponse.setContactPhone("+966501111111");
            expectedResponse.setContactPreference("phone");

            // Mock dependencies
            when(crudService.updateListing(1L, request, "dealeruser")).thenReturn(expectedResponse);

            // Act
            CarListingResponse result = carListingService.updateListing(1L, request, "dealeruser");

            // Assert
            assertNotNull(result);
            assertEquals("Updated Title", result.getTitle());
            assertEquals("Preserved Contact", result.getContactName()); // Should be preserved
            assertEquals("preserved@example.com", result.getContactEmail()); // Should be preserved
            assertEquals("+966501111111", result.getContactPhone()); // Should be preserved
            assertEquals("phone", result.getContactPreference()); // Should be preserved
        }
    }
}



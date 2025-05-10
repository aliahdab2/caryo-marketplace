package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.LocationResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers; // Import ArgumentMatchers
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingServiceTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private com.autotrader.autotraderbackend.repository.LocationRepository locationRepository;

    @Mock // Add mock for the mapper
    private CarListingMapper carListingMapper;

    @InjectMocks // Ensure this injects all mocks into the service
    private CarListingService carListingService;

    private User testUser;
    private CarListing savedListing;
    private CarListing listingToSave;
    private CarListingResponse expectedResponse; // Add expected response object
    private User otherUser; // Added for pause/resume tests

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        otherUser = new User(); // Initialize otherUser
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");

        listingToSave = new CarListing();
        // ... set properties for listingToSave ...
        listingToSave.setSeller(testUser);
        listingToSave.setApproved(false);
        listingToSave.setTitle("Honda Civic");
        listingToSave.setBrand("Honda");
        listingToSave.setModel("Civic");
        listingToSave.setModelYear(2020);
        listingToSave.setPrice(new BigDecimal("20000.00"));
        listingToSave.setMileage(10000);
        // Use locationEntity instead of deprecated location string
        Location testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setDisplayNameEn("Test Location");
        testLocation.setDisplayNameAr("موقع اختبار");
        testLocation.setSlug("test-location");
        testLocation.setCountryCode("SY"); // Set the required countryCode field
        listingToSave.setLocation(testLocation);
        listingToSave.setDescription("Test Description");


        savedListing = new CarListing();
        // ... set properties for savedListing, including ID and CreatedAt ...
        savedListing.setId(1L);
        savedListing.setSeller(testUser);
        savedListing.setApproved(false);
        savedListing.setTitle("Honda Civic");
        savedListing.setBrand("Honda");
        savedListing.setModel("Civic");
        savedListing.setModelYear(2020);
        savedListing.setPrice(new BigDecimal("20000.00"));
        savedListing.setMileage(10000);
        // Use locationEntity instead of deprecated location string
        Location testLocationSaved = new Location();
        testLocationSaved.setId(1L);
        testLocationSaved.setDisplayNameEn("Test Location");
        testLocationSaved.setDisplayNameAr("موقع اختبار");
        testLocationSaved.setSlug("test-location");
        testLocationSaved.setCountryCode("SY"); // Set the required countryCode field
        savedListing.setLocation(testLocationSaved);
        savedListing.setDescription("Test Description");
        savedListing.setCreatedAt(LocalDateTime.now());

        // Setup expected response (can be simple or detailed)
        expectedResponse = new CarListingResponse();
        expectedResponse.setId(savedListing.getId());
        expectedResponse.setTitle(savedListing.getTitle());
        expectedResponse.setBrand(savedListing.getBrand());
        expectedResponse.setModel(savedListing.getModel());
        expectedResponse.setModelYear(savedListing.getModelYear());
        expectedResponse.setPrice(savedListing.getPrice());
        expectedResponse.setMileage(savedListing.getMileage());
        // Use locationDetails instead of deprecated location string
        LocationResponse locationResp = new LocationResponse();
        locationResp.setId(1L);
        locationResp.setDisplayNameEn("Test Location");
        expectedResponse.setLocationDetails(locationResp);
        expectedResponse.setDescription(savedListing.getDescription());
        expectedResponse.setCreatedAt(savedListing.getCreatedAt());
        expectedResponse.setApproved(savedListing.getApproved());
        expectedResponse.setSellerId(testUser.getId());
        expectedResponse.setSellerUsername(testUser.getUsername());
        // ImageUrl might be null or mocked depending on the test
    }

    // --- Tests for createListing ---
    @Test
    void createListing_WithValidData_ShouldCreateAndReturnListing() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        // ... populate request ...
        request.setTitle("Honda Civic");
        request.setBrand("Honda");
        request.setModel("Civic");
        request.setModelYear(2020);
        request.setPrice(new BigDecimal("20000.00"));
        request.setMileage(10000);
        request.setLocationId(1L); // Use a valid mock location ID instead of deprecated location string
        request.setDescription("Test Description");

        // Mock locationRepository to return a location when findById is called
        Location testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setDisplayNameEn("Test Location");
        testLocation.setDisplayNameAr("موقع اختبار");
        testLocation.setSlug("test-location");
        testLocation.setCountryCode("SY"); // Set the required countryCode field
        when(locationRepository.findById(1L)).thenReturn(Optional.of(testLocation));

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        // Mock the save operation to return the listing with an ID
        when(carListingRepository.save(any(CarListing.class))).thenReturn(savedListing);
        // Mock the mapper call
        when(carListingMapper.toCarListingResponse(savedListing)).thenReturn(expectedResponse);

        // Act
        CarListingResponse response = carListingService.createListing(request, null, "testuser");

        // Assert
        assertNotNull(response);
        assertEquals(expectedResponse, response); // Compare with the mocked response
        // Verify repository save was called
        verify(carListingRepository).save(any(CarListing.class));
        // Verify mapper was called
        verify(carListingMapper).toCarListingResponse(savedListing);
    }

    @Test
    void createListing_WithNonExistentUser_ShouldThrowException() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest(); // Populate as needed
        String username = "nonexistentuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.createListing(request, null, username);
        });
        assertEquals("User not found with username : 'nonexistentuser'", exception.getMessage());
        verify(carListingRepository, never()).save(any());
        verify(carListingMapper, never()).toCarListingResponse(any()); // Mapper should not be called
    }

    @Test
    void createListing_WhenRepositorySaveFails_ShouldThrowRuntimeException() {
        // Arrange
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setBrand("TestBrand");
        request.setModel("TestModel");
        request.setModelYear(2022);
        request.setPrice(new BigDecimal("15000"));
        request.setMileage(5000);
        request.setLocationId(1L); // Use a valid mock location ID instead of deprecated location string
        request.setDescription("TestDesc");
        String username = "testuser";
        RuntimeException dbException = new RuntimeException("Database connection failed");

        // Mock locationRepository to return a location when findById is called
        Location testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setDisplayNameEn("Test Location");
        testLocation.setDisplayNameAr("موقع اختبار");
        testLocation.setSlug("test-location");
        testLocation.setCountryCode("SY"); // Set the required countryCode field
        when(locationRepository.findById(1L)).thenReturn(Optional.of(testLocation));

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        // Mock repository save to throw an exception
        when(carListingRepository.save(any(CarListing.class))).thenThrow(dbException);

        // Act & Assert
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            carListingService.createListing(request, null, username);
        });

        // Assert that the original exception message is thrown
        assertEquals("Database connection failed", thrown.getMessage());
        assertSame(dbException, thrown); // Verify it's the exact exception instance

        verify(userRepository).findByUsername(username);
        verify(carListingRepository).save(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponse(any()); // Mapper should not be called
    }

    // --- Tests for getListingById ---
    @Test
    void getListingById_Success_WhenApproved() { // Renamed for clarity
        // Arrange
        Long listingId = 1L;
        // Ensure the mock listing is approved for this test if needed, or assume findByIdAndApprovedTrue handles it
        savedListing.setApproved(true); // Explicitly set for clarity
        expectedResponse.setApproved(true); // Match expected response

        // Mock the repository call for an approved listing
        when(carListingRepository.findByIdAndApprovedTrue(listingId)).thenReturn(Optional.of(savedListing));
        // Mock the mapper call
        when(carListingMapper.toCarListingResponse(savedListing)).thenReturn(expectedResponse);

        // Act
        CarListingResponse response = carListingService.getListingById(listingId);

        // Assert
        assertNotNull(response);
        assertEquals(expectedResponse, response);
        // Verify the correct repository method was called
        verify(carListingRepository).findByIdAndApprovedTrue(listingId);
        verify(carListingMapper).toCarListingResponse(savedListing);
    }

    @Test
    void getListingById_NotFound_ThrowsResourceNotFoundException() {
        // Arrange
        Long nonExistentId = 999L;
        // Mock the repository call for an approved listing - returns empty
        when(carListingRepository.findByIdAndApprovedTrue(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.getListingById(nonExistentId);
        });
        assertEquals("CarListing not found with id : '999'", exception.getMessage());
        // Verify the correct repository method was called
        verify(carListingRepository).findByIdAndApprovedTrue(nonExistentId);
        verify(carListingMapper, never()).toCarListingResponse(any()); // Mapper should not be called
    }

    @Test
    void getListingById_ExistsButNotApproved_ThrowsResourceNotFoundException() {
        // Arrange
        Long listingId = 1L;
        savedListing.setApproved(false); // Ensure the listing exists but is not approved

        // Mock findByIdAndApprovedTrue to return empty, simulating it wasn't found because it's not approved
        when(carListingRepository.findByIdAndApprovedTrue(listingId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.getListingById(listingId);
        });

        // Assert that the correct exception is thrown
        assertEquals("CarListing not found with id : '1'", exception.getMessage());

        // Verify the correct repository method was called
        verify(carListingRepository).findByIdAndApprovedTrue(listingId);
        // Ensure the mapper is never called
        verify(carListingMapper, never()).toCarListingResponse(any());
    }


    // --- Tests for approveListing ---
    @Test
    void approveListing_Success() {
        // Arrange
        Long listingId = 1L;
        savedListing.setApproved(false); // Ensure it starts as not approved
        CarListing approvedListing = new CarListing(); // Create a separate instance for the state after save
        // Copy properties from savedListing
        approvedListing.setId(savedListing.getId());
        approvedListing.setTitle(savedListing.getTitle());
        // ... copy other properties ...
        approvedListing.setBrand(savedListing.getBrand());
        approvedListing.setModel(savedListing.getModel());
        approvedListing.setModelYear(savedListing.getModelYear());
        approvedListing.setPrice(savedListing.getPrice());
        approvedListing.setMileage(savedListing.getMileage());
        approvedListing.setLocation(savedListing.getLocation()); // Use location
        approvedListing.setDescription(savedListing.getDescription());
        approvedListing.setSeller(savedListing.getSeller());
        approvedListing.setApproved(true); // Set approved to true
        approvedListing.setCreatedAt(savedListing.getCreatedAt());

        CarListingResponse approvedResponse = new CarListingResponse(); // Expected response after approval
        // ... populate approvedResponse based on approvedListing ...
        approvedResponse.setId(approvedListing.getId());
        approvedResponse.setTitle(approvedListing.getTitle());
        approvedResponse.setBrand(approvedListing.getBrand());
        approvedResponse.setModel(approvedListing.getModel());
        approvedResponse.setModelYear(approvedListing.getModelYear());
        approvedResponse.setPrice(approvedListing.getPrice());
        approvedResponse.setMileage(approvedListing.getMileage());
        // Create and set LocationResponse for LocationDetails
        if (approvedListing.getLocation() != null) {
            LocationResponse locationResp = new LocationResponse();
            locationResp.setId(approvedListing.getLocation().getId());
            locationResp.setDisplayNameEn(approvedListing.getLocation().getDisplayNameEn());
            // Set other fields of locationResp if necessary
            approvedResponse.setLocationDetails(locationResp);
        }
        approvedResponse.setDescription(approvedListing.getDescription());
        approvedResponse.setCreatedAt(approvedListing.getCreatedAt());
        approvedResponse.setApproved(true);
        if (approvedListing.getSeller() != null) {
            approvedResponse.setSellerId(approvedListing.getSeller().getId());
            approvedResponse.setSellerUsername(approvedListing.getSeller().getUsername());
        }


        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(approvedListing); // Return the approved state
        // Mock the mapper call for the approved state
        when(carListingMapper.toCarListingResponse(approvedListing)).thenReturn(approvedResponse);

        // Act
        CarListingResponse response = carListingService.approveListing(listingId);

        // Assert
        assertNotNull(response);
        assertTrue(response.getApproved());
        assertEquals(approvedResponse, response);
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository).save(argThat(listing -> listing.getId().equals(listingId) && Boolean.TRUE.equals(listing.getApproved())));
        verify(carListingMapper).toCarListingResponse(approvedListing);
    }

    @Test
    void approveListing_NotFound_ThrowsResourceNotFoundException() {
        // Arrange
        Long nonExistentId = 999L;
        when(carListingRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.approveListing(nonExistentId);
        });
        assertEquals("CarListing not found with id : '999'", exception.getMessage());
        verify(carListingRepository).findById(nonExistentId);
        verify(carListingRepository, never()).save(any());
        verify(carListingMapper, never()).toCarListingResponse(any());
    }

    @Test
    void approveListing_AlreadyApproved_ThrowsIllegalStateException() {
        // Arrange
        Long listingId = 1L;
        savedListing.setApproved(true); // Start as already approved
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.approveListing(listingId);
        });
        assertEquals("Listing with ID 1 is already approved.", exception.getMessage());
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository, never()).save(any());
        verify(carListingMapper, never()).toCarListingResponse(any());
    }

    @Test
    void approveListing_WhenRepositorySaveFails_ShouldThrowRuntimeException() {
        // Arrange
        Long listingId = 1L;
        savedListing.setApproved(false); // Ensure it starts as not approved
        RuntimeException dbException = new RuntimeException("DB save failed");

        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        // Mock repository save to throw an exception
        when(carListingRepository.save(any(CarListing.class))).thenThrow(dbException);

        // Act & Assert
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            carListingService.approveListing(listingId);
        });

        // Assert that the original exception message is thrown
        assertEquals("DB save failed", thrown.getMessage()); // <-- Updated assertion
        assertSame(dbException, thrown); // Verify it's the exact exception instance

        verify(carListingRepository).findById(listingId);
        // Verify save was attempted with the correct state
        verify(carListingRepository).save(argThat(listing -> listing.getId().equals(listingId) && Boolean.TRUE.equals(listing.getApproved())));
        verify(carListingMapper, never()).toCarListingResponse(any()); // Mapper should not be called
    }

    // --- Tests for getAllApprovedListings & getFilteredListings ---
    @Test
    void getAllApprovedListings_ShouldReturnPageOfApprovedListings() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        CarListing approvedListing1 = new CarListing(); // Setup listing 1
        approvedListing1.setId(1L);
        approvedListing1.setApproved(true);
        approvedListing1.setSold(false);
        approvedListing1.setArchived(false);
        CarListing approvedListing2 = new CarListing(); // Setup listing 2
        approvedListing2.setId(2L);
        approvedListing2.setApproved(true);
        approvedListing2.setSold(false);
        approvedListing2.setArchived(false);
        List<CarListing> listings = Arrays.asList(approvedListing1, approvedListing2);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, listings.size());

        CarListingResponse response1 = new CarListingResponse(); // Setup response 1
        response1.setId(1L);
        response1.setApproved(true);
        CarListingResponse response2 = new CarListingResponse(); // Setup response 2
        response2.setId(2L);
        response2.setApproved(true);

        // Old: when(carListingRepository.findByApprovedTrue(pageable)).thenReturn(listingPage);
        when(carListingRepository.findAll(ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<CarListing>>any(), eq(pageable))).thenReturn(listingPage);
        // Mock mapper for each listing in the page
        when(carListingMapper.toCarListingResponse(approvedListing1)).thenReturn(response1);
        when(carListingMapper.toCarListingResponse(approvedListing2)).thenReturn(response2);

        // Act
        Page<CarListingResponse> responsePage = carListingService.getAllApprovedListings(pageable);

        // Assert
        assertNotNull(responsePage);
        assertEquals(2, responsePage.getTotalElements());
        assertEquals(2, responsePage.getContent().size());
        assertEquals(response1, responsePage.getContent().get(0));
        assertEquals(response2, responsePage.getContent().get(1));
        // verify(carListingRepository).findByApprovedTrue(pageable);
        verify(carListingRepository).findAll(ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<CarListing>>any(), eq(pageable));
        verify(carListingMapper, times(2)).toCarListingResponse(any(CarListing.class)); // Verify mapper called twice
    }

     @Test
    void getAllApprovedListings_WhenNoneFound_ShouldReturnEmptyPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<CarListing> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        // Old: when(carListingRepository.findByApprovedTrue(pageable)).thenReturn(emptyPage);
        when(carListingRepository.findAll(ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<CarListing>>any(), eq(pageable))).thenReturn(emptyPage);
        // No need to mock mapper as it won't be called for an empty page's map operation

        // Act
        Page<CarListingResponse> responsePage = carListingService.getAllApprovedListings(pageable);

        // Assert
        assertNotNull(responsePage);
        assertTrue(responsePage.isEmpty());
        assertEquals(0, responsePage.getTotalElements());
        // verify(carListingRepository).findByApprovedTrue(pageable);
        verify(carListingRepository).findAll(ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<CarListing>>any(), eq(pageable));
        verify(carListingMapper, never()).toCarListingResponse(any()); // Mapper should not be called
    }

    @Test
    void getFilteredListings_ShouldReturnFilteredAndApprovedListings() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        ListingFilterRequest filter = new ListingFilterRequest(); // Populate filter
        filter.setBrand("Honda");

        CarListing filteredListing = new CarListing(); // Setup listing
        filteredListing.setId(1L);
        filteredListing.setBrand("Honda");
        filteredListing.setApproved(true);
        List<CarListing> listings = Collections.singletonList(filteredListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        CarListingResponse filteredResponse = new CarListingResponse(); // Setup response
        filteredResponse.setId(1L);
        filteredResponse.setBrand("Honda");
        filteredResponse.setApproved(true);

        // FIX: Use ArgumentMatchers.<Specification<CarListing>>any() for type safety
        when(carListingRepository.findAll(ArgumentMatchers.<Specification<CarListing>>any(), eq(pageable))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(filteredListing)).thenReturn(filteredResponse);

        // Act
        Page<CarListingResponse> responsePage = carListingService.getFilteredListings(filter, pageable);

        // Assert
        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
        assertEquals(1, responsePage.getContent().size());
        assertEquals(filteredResponse, responsePage.getContent().get(0));
        // FIX: Use ArgumentMatchers.<Specification<CarListing>>any() for type safety
        verify(carListingRepository).findAll(ArgumentMatchers.<Specification<CarListing>>any(), eq(pageable));
        verify(carListingMapper).toCarListingResponse(filteredListing);
    }

    @Test
    void getFilteredListings_WhenNoneMatch_ShouldReturnEmptyPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        ListingFilterRequest filter = new ListingFilterRequest(); // Populate filter
        filter.setBrand("NonExistent");
        Page<CarListing> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        // FIX: Use ArgumentMatchers.<Specification<CarListing>>any() for type safety
        when(carListingRepository.findAll(ArgumentMatchers.<Specification<CarListing>>any(), eq(pageable))).thenReturn(emptyPage);

        // Act
        Page<CarListingResponse> responsePage = carListingService.getFilteredListings(filter, pageable);

        // Assert
        assertNotNull(responsePage);
        assertTrue(responsePage.isEmpty());
        // FIX: Use ArgumentMatchers.<Specification<CarListing>>any() for type safety
        verify(carListingRepository).findAll(ArgumentMatchers.<Specification<CarListing>>any(), eq(pageable));
        verify(carListingMapper, never()).toCarListingResponse(any());
    }

    // --- Tests for uploadListingImage ---
    @Test
    void uploadListingImage_Success() throws IOException {
        // Arrange
        Long listingId = savedListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile(
                "file", "hello.jpg", "image/jpeg", "Hello, World!".getBytes()
        );
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class); // Captor for the key

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        when(storageService.store(eq(file), keyCaptor.capture())).thenAnswer(invocation -> keyCaptor.getValue());
        // Mock save to capture the argument and verify the key was set
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(invocation -> {
             CarListing listingToSave = invocation.getArgument(0);
             assertNotNull(listingToSave.getMedia());
             assertFalse(listingToSave.getMedia().isEmpty());
             assertEquals(keyCaptor.getValue(), listingToSave.getMedia().get(0).getFileKey());
             return listingToSave;
        });

        // Act
        String returnedKey = carListingService.uploadListingImage(listingId, file, username);

        // Assert
        assertNotNull(returnedKey);
        assertEquals(returnedKey, keyCaptor.getValue());
        // Verify key is set on the entity object used in the test
        // Note: savedListing is the object *before* the save call in the service method.
        // The actual update happens on the instance fetched within the service method.
        // We verify the save call captures the correct state.

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(storageService).store(eq(file), eq(returnedKey));
        verify(carListingRepository).save(argThat(l -> {
            if (l.getId().equals(listingId) && !l.getMedia().isEmpty()) {
                ListingMedia media = l.getMedia().get(0);
                return returnedKey.equals(media.getFileKey());
            }
            return false;
        }));
    }

    @Test
    void uploadListingImage_ListingNotFound_ThrowsResourceNotFoundException() {
        // Arrange
        Long nonExistentId = 999L;
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser)); // Mock user lookup
        when(carListingRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.uploadListingImage(nonExistentId, file, username);
        });
        assertEquals("CarListing not found with id : '999'", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(nonExistentId);
        verify(storageService, never()).store(any(MultipartFile.class), anyString()); // Corrected signature
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_UnauthorizedUser_ThrowsSecurityException() { // Renamed test slightly for clarity
        // Arrange
        Long listingId = savedListing.getId();
        String wrongUsername = "wronguser";
        User wrongUser = new User();
        wrongUser.setId(99L);
        wrongUser.setUsername(wrongUsername);

        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        when(userRepository.findByUsername(wrongUsername)).thenReturn(Optional.of(wrongUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));

        // Act & Assert
        // FIX: Expect SecurityException instead of AccessDeniedException based on test output
        SecurityException exception = assertThrows(SecurityException.class, () -> {
            carListingService.uploadListingImage(listingId, file, wrongUsername);
        });
        assertEquals("User does not have permission to modify this listing.", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(wrongUsername);
        verify(carListingRepository).findById(listingId);
        verify(storageService, never()).store(any(MultipartFile.class), anyString());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_EmptyFile_ThrowsStorageException() {
        // Arrange
        Long listingId = savedListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]); // Empty file

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser)); // Mock user lookup
        // No need to mock findById for this path, as it shouldn't be reached

        // Act & Assert
        StorageException exception = assertThrows(StorageException.class, () -> {
            carListingService.uploadListingImage(listingId, emptyFile, username);
        });
        // FIX: Match the updated exception message from the service's validateFile helper
        assertEquals("File provided for upload is null or empty.", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(username); // This is called before the check
        // Verify findById is NOT called because the exception is thrown earlier
        verify(carListingRepository, never()).findById(anyLong());
        verify(storageService, never()).store(any(MultipartFile.class), anyString());
        verify(carListingRepository, never()).save(any());
    }


    @Test
    void uploadListingImage_StorageFailure_ThrowsRuntimeException() throws IOException { // Renamed test slightly for clarity
        // Arrange
        Long listingId = savedListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        // Mock storage service to throw an exception when store is called
        // Use the captor in the mock setup
        // FIX: Use doThrow().when() for void methods or methods returning a value where you want to throw
        doThrow(new StorageException("Disk full")).when(storageService).store(eq(file), keyCaptor.capture());

        // Act & Assert
        // FIX: Expect StorageException because the service now re-throws it specifically
        StorageException exception = assertThrows(StorageException.class, () -> {
             carListingService.uploadListingImage(listingId, file, username);
        });
        // Check the message and cause based on the refactored service logic
        assertEquals("Failed to store image file.", exception.getMessage());
        assertNotNull(exception.getCause());
        assertTrue(exception.getCause() instanceof StorageException);
        assertEquals("Disk full", exception.getCause().getMessage());


        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        // Verify store was attempted (use the captor to get the key it was called with)
        verify(storageService).store(eq(file), keyCaptor.capture());
        verify(carListingRepository, never()).save(any()); // Save should not happen if store fails
    }

    @Test
    void uploadListingImage_WhenRepositorySaveFailsAfterStore_ShouldThrowRuntimeException() throws IOException {
        // Arrange
        Long listingId = savedListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        RuntimeException dbException = new RuntimeException("DB save failed");
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        // Use thenAnswer to return the captured key, as it's dynamic
        when(storageService.store(eq(file), keyCaptor.capture())).thenAnswer(inv -> keyCaptor.getValue());
        // Mock repository save failure
        when(carListingRepository.save(any(CarListing.class))).thenThrow(dbException);

        // Act & Assert
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            carListingService.uploadListingImage(listingId, file, username);
        });

        assertEquals("Failed to update listing after image upload.", thrown.getMessage());
        assertSame(dbException, thrown.getCause());

        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        // Verify store was called with the captured key
        verify(storageService).store(eq(file), eq(keyCaptor.getValue()));
        verify(carListingRepository).save(any(CarListing.class)); // Verify save was attempted
    }

    @Test
    void uploadListingImage_WithNullOriginalFilename_ShouldGenerateSafeKey() throws IOException {
        // Arrange
        Long listingId = savedListing.getId();
        String username = testUser.getUsername();
        // File with null original filename
        MockMultipartFile file = new MockMultipartFile("file", null, "image/png", "content".getBytes());
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        // FIX: Use when(...).thenAnswer(...) because store returns String, and we need the captured value
        when(storageService.store(eq(file), keyCaptor.capture())).thenAnswer(inv -> keyCaptor.getValue());
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        String returnedKey = carListingService.uploadListingImage(listingId, file, username);

        // Assert
        assertNotNull(returnedKey);

        // Verify store was called and capture the key
        verify(storageService).store(eq(file), keyCaptor.capture());
        String capturedKey = keyCaptor.getValue();

        // Assert that the returned key matches the captured key
        assertEquals(returnedKey, capturedKey);

        // Assert the format of the captured/returned key
        assertTrue(capturedKey.startsWith("listings/" + listingId + "/"));
        // Update regex to match the actual output pattern (ends with _)
        assertTrue(capturedKey.matches("listings/" + listingId + "/\\d+_"),
                   "Generated key '" + capturedKey + "' did not match expected pattern.");

        // Verify save was called with the correct key
        verify(carListingRepository).save(argThat(l -> {
            if (!l.getMedia().isEmpty()) {
                ListingMedia media = l.getMedia().get(0);
                return capturedKey.equals(media.getFileKey());
            }
            return false;
        }));
    }

    // --- Test for getMyListings ---
    @Test
    void getMyListings_ShouldReturnUserListings() {
        // Arrange
        String username = testUser.getUsername();
        CarListing listing1 = new CarListing(); // Setup listing 1 for testUser
        listing1.setId(1L);
        listing1.setSeller(testUser);
        CarListing listing2 = new CarListing(); // Setup listing 2 for testUser
        listing2.setId(2L);
        listing2.setSeller(testUser);
        List<CarListing> userListings = Arrays.asList(listing1, listing2);

        CarListingResponse response1 = new CarListingResponse(); // Setup response 1
        response1.setId(1L);
        CarListingResponse response2 = new CarListingResponse(); // Setup response 2
        response2.setId(2L);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findBySeller(testUser)).thenReturn(userListings);
        // Mock mapper for each listing
        when(carListingMapper.toCarListingResponse(listing1)).thenReturn(response1);
        when(carListingMapper.toCarListingResponse(listing2)).thenReturn(response2);

        // Act
        List<CarListingResponse> responses = carListingService.getMyListings(username);

        // Assert
        assertNotNull(responses);
        assertEquals(2, responses.size());
        assertTrue(responses.contains(response1));
        assertTrue(responses.contains(response2));
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findBySeller(testUser);
        verify(carListingMapper, times(2)).toCarListingResponse(any(CarListing.class));
    }

     @Test
    void getMyListings_WhenUserNotFound_ShouldThrowException() {
        // Arrange
        String username = "nonexistentuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.getMyListings(username);
        });
        assertEquals("User not found with username : 'nonexistentuser'", exception.getMessage());
        verify(userRepository).findByUsername(username);
        verify(carListingRepository, never()).findBySeller(any());
        verify(carListingMapper, never()).toCarListingResponse(any());
    }

    @Test
    void getMyListings_WhenUserHasNoListings_ShouldReturnEmptyList() {
        // Arrange
        String username = testUser.getUsername();
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findBySeller(testUser)).thenReturn(Collections.emptyList());

        // Act
        List<CarListingResponse> responses = carListingService.getMyListings(username);

        // Assert
        assertNotNull(responses);
        assertTrue(responses.isEmpty());
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findBySeller(testUser);
        verify(carListingMapper, never()).toCarListingResponse(any()); // Mapper not called for empty list
    }

    // --- Tests for markListingAsSold ---
    @Test
    void markListingAsSold_Success() {
        // Arrange
        Long listingId = 1L;
        String username = testUser.getUsername();
        savedListing.setSold(false); // Ensure it's not already sold
        savedListing.setArchived(false); // Ensure it's not archived

        CarListingResponse expectedResponse = new CarListingResponse();
        expectedResponse.setId(listingId);
        expectedResponse.setIsSold(true);
        expectedResponse.setIsArchived(false);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(invocation -> {
            CarListing listingToSave = invocation.getArgument(0);
            assertTrue(listingToSave.getSold());
            return listingToSave;
        });
        when(carListingMapper.toCarListingResponse(savedListing)).thenReturn(expectedResponse);

        // Act
        CarListingResponse response = carListingService.markListingAsSold(listingId, username);

        // Assert
        assertNotNull(response);
        assertTrue(response.getIsSold());
        assertEquals(expectedResponse, response);
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository).save(argThat(l -> Boolean.TRUE.equals(l.getSold())));
        verify(carListingMapper).toCarListingResponse(savedListing);
    }

    @Test
    void markListingAsSold_ListingNotFound_ThrowsResourceNotFoundException() {
        // Arrange
        Long nonExistentId = 999L;
        String username = testUser.getUsername();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.markListingAsSold(nonExistentId, username);
        });
        assertEquals("CarListing not found with id : '999'", exception.getMessage());
        verify(carListingRepository).findById(nonExistentId);
        verify(carListingRepository, never()).save(any());
        verify(carListingMapper, never()).toCarListingResponse(any());
    }

    @Test
    void markListingAsSold_NotOwner_ThrowsSecurityException() {
        // Arrange
        Long listingId = 1L;
        String unauthorizedUsername = "unauthorized";
        User unauthorizedUser = new User();
        unauthorizedUser.setId(2L);
        unauthorizedUser.setUsername(unauthorizedUsername);

        CarListing listing = new CarListing();
        listing.setId(listingId);
        listing.setSeller(testUser);  // Owned by testUser, not unauthorizedUser

        when(userRepository.findByUsername(unauthorizedUsername)).thenReturn(Optional.of(unauthorizedUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(listing));

        // Act & Assert
        SecurityException exception = assertThrows(SecurityException.class, () -> {
            carListingService.markListingAsSold(listingId, unauthorizedUsername);
        });
        assertEquals("User does not have permission to modify this listing.", exception.getMessage());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void markListingAsSold_AlreadySold_ReturnsCurrentState() {
        // Arrange
        Long listingId = 1L;
        String username = testUser.getUsername();

        CarListing listing = new CarListing();
        listing.setId(listingId);
        listing.setSeller(testUser);
        listing.setSold(true);  // Already sold
        listing.setArchived(false);

        CarListingResponse expectedResponse = new CarListingResponse();
        expectedResponse.setId(listingId);
        expectedResponse.setIsSold(true);
        expectedResponse.setIsArchived(false);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(carListingMapper.toCarListingResponse(listing)).thenReturn(expectedResponse);

        // Act
        CarListingResponse response = carListingService.markListingAsSold(listingId, username);

        // Assert
        assertNotNull(response);
        assertTrue(response.getIsSold());
        verify(carListingRepository, never()).save(any());  // No save should happen
    }

    @Test
    void markListingAsSold_Archived_ThrowsIllegalStateException() {
        // Arrange
        Long listingId = 1L;
        String username = testUser.getUsername();

        CarListing listing = new CarListing();
        listing.setId(listingId);
        listing.setSeller(testUser);
        listing.setSold(false);
        listing.setArchived(true);  // Archived

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(listing));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.markListingAsSold(listingId, username);
        });
        assertEquals("Cannot mark an archived listing as sold. Please unarchive first.", exception.getMessage());
        verify(carListingRepository, never()).save(any());
    }

    // --- Tests for admin-specific listing status management ---
    // --- Tests for markListingAsSoldByAdmin ---

    @Test
    void markListingAsSoldByAdmin_Success() {
        // Setup
        savedListing.setSold(false); // Ensure not already sold
        savedListing.setArchived(false); // Not archived

        when(carListingRepository.findById(savedListing.getId())).thenReturn(Optional.of(savedListing));
        when(carListingRepository.save(any())).thenAnswer(invocation -> {
            CarListing savedListing = invocation.getArgument(0);
            assertTrue(savedListing.getSold()); // Verify it's now marked sold
            return savedListing;
        });
        
        // Mock the mapper response
        CarListingResponse mockResponse = new CarListingResponse();
        mockResponse.setId(savedListing.getId());
        mockResponse.setIsSold(true);
        when(carListingMapper.toCarListingResponseForAdmin(any(CarListing.class))).thenReturn(mockResponse);

        // Execute
        CarListingResponse response = carListingService.markListingAsSoldByAdmin(savedListing.getId());

        // Verify
        assertNotNull(response);
        assertTrue(response.getIsSold());
        verify(carListingRepository).findById(savedListing.getId());
        verify(carListingRepository).save(any(CarListing.class));
        verify(carListingMapper).toCarListingResponseForAdmin(any(CarListing.class));
    }

    @Test
    void markListingAsSoldByAdmin_ListingNotFound_ThrowsResourceNotFoundException() {
        // Setup
        when(carListingRepository.findById(999L)).thenReturn(Optional.empty());

        // Execute & Verify
        assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.markListingAsSoldByAdmin(999L);
        });

        verify(carListingRepository).findById(999L);
        verify(carListingRepository, never()).save(any(CarListing.class));
    }

    @Test
    void markListingAsSoldByAdmin_AlreadySold_ReturnsCurrentState() {
        // Setup
        savedListing.setSold(true); // Already sold
        savedListing.setArchived(false);

        when(carListingRepository.findById(savedListing.getId())).thenReturn(Optional.of(savedListing));
        
        // Mock the mapper response
        CarListingResponse mockResponse = new CarListingResponse();
        mockResponse.setId(savedListing.getId());
        mockResponse.setIsSold(true);
        when(carListingMapper.toCarListingResponseForAdmin(savedListing)).thenReturn(mockResponse);

        // Execute
        CarListingResponse response = carListingService.markListingAsSoldByAdmin(savedListing.getId());

        // Verify that no save was performed (idempotent)
        assertNotNull(response);
        assertTrue(response.getIsSold());
        verify(carListingRepository).findById(savedListing.getId());
        verify(carListingRepository, never()).save(any(CarListing.class));
        verify(carListingMapper).toCarListingResponseForAdmin(savedListing);
    }

    @Test
    void markListingAsSoldByAdmin_Archived_ThrowsIllegalStateException() {
        // Setup
        savedListing.setSold(false);
        savedListing.setArchived(true); // Archived listings can't be marked as sold

        when(carListingRepository.findById(savedListing.getId())).thenReturn(Optional.of(savedListing));

        // Execute & Verify
        assertThrows(IllegalStateException.class, () -> {
            carListingService.markListingAsSoldByAdmin(savedListing.getId());
        });

        verify(carListingRepository).findById(savedListing.getId());
        verify(carListingRepository, never()).save(any(CarListing.class));
    }

    // --- Tests for archiveListingByAdmin ---
    
    @Test
    void archiveListingByAdmin_Success() {
        // Setup
        savedListing.setArchived(false); // Not already archived
        
        when(carListingRepository.findById(savedListing.getId())).thenReturn(Optional.of(savedListing));
        when(carListingRepository.save(any())).thenAnswer(invocation -> {
            CarListing savedListing = invocation.getArgument(0);
            assertTrue(savedListing.getArchived()); // Verify it's now archived
            return savedListing;
        });
        
        // Mock the mapper response
        CarListingResponse mockResponse = new CarListingResponse();
        mockResponse.setId(savedListing.getId());
        mockResponse.setIsArchived(true);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(mockResponse);
        
        // Execute
        CarListingResponse response = carListingService.archiveListingByAdmin(savedListing.getId());
        
        // Verify
        assertNotNull(response);
        assertTrue(response.getIsArchived());
        verify(carListingRepository).findById(savedListing.getId());
        verify(carListingRepository).save(any(CarListing.class));
    }
    
    @Test
    void archiveListingByAdmin_ListingNotFound_ThrowsResourceNotFoundException() {
        // Setup
        when(carListingRepository.findById(999L)).thenReturn(Optional.empty());
        
        // Execute & Verify
        assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.archiveListingByAdmin(999L);
        });
        
        verify(carListingRepository).findById(999L);
        verify(carListingRepository, never()).save(any(CarListing.class));
    }
    
    @Test
    void archiveListingByAdmin_AlreadyArchived_ReturnsCurrentState() {
        // Setup
        savedListing.setArchived(true); // Already archived
        
        when(carListingRepository.findById(savedListing.getId())).thenReturn(Optional.of(savedListing));
        
        // Mock the mapper response
        CarListingResponse mockResponse = new CarListingResponse();
        mockResponse.setId(savedListing.getId());
        mockResponse.setIsArchived(true);
        when(carListingMapper.toCarListingResponse(savedListing)).thenReturn(mockResponse);
        
        // Execute
        CarListingResponse response = carListingService.archiveListingByAdmin(savedListing.getId());
        
        // Verify that no save was performed (idempotent)
        assertNotNull(response);
        assertTrue(response.getIsArchived());
        verify(carListingRepository).findById(savedListing.getId());
        verify(carListingRepository, never()).save(any(CarListing.class));
    }
    
    // --- Tests for unarchiveListingByAdmin ---
    
    @Test
    void unarchiveListingByAdmin_Success() {
        // Setup
        savedListing.setArchived(true); // Currently archived
        
        when(carListingRepository.findById(savedListing.getId())).thenReturn(Optional.of(savedListing));
        when(carListingRepository.save(any())).thenAnswer(invocation -> {
            CarListing savedListing = invocation.getArgument(0);
            assertFalse(savedListing.getArchived()); // Verify it's now unarchived
            return savedListing;
        });
        when(carListingMapper.toCarListingResponse(any())).thenAnswer(invocation -> {
            CarListing listing = invocation.getArgument(0);
            CarListingResponse response = new CarListingResponse();
            response.setId(listing.getId());
            response.setIsArchived(listing.getArchived());
            return response;
        });
        
        // Execute
        CarListingResponse response = carListingService.unarchiveListingByAdmin(savedListing.getId());
        
        // Verify
        assertNotNull(response);
        assertFalse(response.getIsArchived());
        verify(carListingRepository).findById(savedListing.getId());
        verify(carListingRepository).save(any(CarListing.class));
    }
    
    @Test
    void unarchiveListingByAdmin_ListingNotFound_ThrowsResourceNotFoundException() {
        // Setup
        when(carListingRepository.findById(999L)).thenReturn(Optional.empty());
        
        // Execute & Verify
        assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.unarchiveListingByAdmin(999L);
        });
        
        verify(carListingRepository).findById(999L);
        verify(carListingRepository, never()).save(any(CarListing.class));
    }
    
    @Test
    void unarchiveListingByAdmin_NotArchived_ThrowsIllegalStateException() {
        // Setup
        savedListing.setArchived(false); // Not archived
        
        when(carListingRepository.findById(savedListing.getId())).thenReturn(Optional.of(savedListing));
        
        // Execute & Verify
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.unarchiveListingByAdmin(savedListing.getId());
        });
        
        assertEquals("Listing with ID " + savedListing.getId() + " is not currently archived.", exception.getMessage());
        verify(carListingRepository).findById(savedListing.getId());
        verify(carListingRepository, never()).save(any(CarListing.class));
    }

    // --- Tests for pauseListing ---

    @Test
    void pauseListing_Success_ByOwner() {
        // Arrange
        Long listingId = 1L;
        String username = "testuser";
        savedListing.setSeller(testUser);
        savedListing.setApproved(true);
        savedListing.setSold(false);
        savedListing.setArchived(false);
        savedListing.setIsUserActive(true);

        CarListing pausedListing = new CarListing();
        pausedListing.setId(listingId);
        pausedListing.setSeller(testUser);
        pausedListing.setApproved(true);
        pausedListing.setSold(false);
        pausedListing.setArchived(false);
        pausedListing.setIsUserActive(false); // Paused

        CarListingResponse pausedResponse = new CarListingResponse();
        pausedResponse.setId(listingId);
        pausedResponse.setIsUserActive(false);


        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(pausedListing);
        when(carListingMapper.toCarListingResponse(pausedListing)).thenReturn(pausedResponse);

        // Act
        CarListingResponse response = carListingService.pauseListing(listingId, username);

        // Assert
        assertNotNull(response);
        assertFalse(response.getIsUserActive());
        verify(carListingRepository).save(argThat(listing -> !listing.getIsUserActive()));
        verify(carListingMapper).toCarListingResponse(pausedListing);
    }

    @Test
    void pauseListing_ThrowsSecurityException_IfNotOwner() {
        // Arrange
        Long listingId = 1L;
        String username = "otheruser"; // Not the owner
        savedListing.setSeller(testUser); // Owner is testUser
        savedListing.setApproved(true);
        savedListing.setSold(false);
        savedListing.setArchived(false);
        savedListing.setIsUserActive(true);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(otherUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));

        // Act & Assert
        SecurityException exception = assertThrows(SecurityException.class, () -> {
            carListingService.pauseListing(listingId, username);
        });
        assertEquals("User does not have permission to modify this listing.", exception.getMessage());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void pauseListing_ThrowsIllegalStateException_IfAlreadyPaused() {
        // Arrange
        Long listingId = 1L;
        String username = testUser.getUsername();
        savedListing.setApproved(true);
        savedListing.setSold(false);
        savedListing.setArchived(false);
        savedListing.setIsUserActive(false); // Already paused

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        // No need to mock carListingMapper or carListingRepository.save as an exception is expected

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.pauseListing(listingId, username);
        });
        assertEquals("Listing with ID " + listingId + " is already paused.", exception.getMessage());

        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository, never()).save(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponse(any(CarListing.class));
    }

    @Test
    void pauseListing_ThrowsIllegalStateException_IfArchived() {
        // Arrange
        Long listingId = 1L;
        String username = testUser.getUsername();
        savedListing.setApproved(true);
        savedListing.setSold(false);
        savedListing.setArchived(true); // Archived
        savedListing.setIsUserActive(true);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.pauseListing(listingId, username);
        });
        assertEquals("Cannot pause a listing that has been archived.", exception.getMessage()); // Adjusted to match service

        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository, never()).save(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponse(any(CarListing.class));
    }

    @Test
    void pauseListing_ThrowsIllegalStateException_IfNotApproved() {
        // Arrange
        Long listingId = 1L;
        String username = testUser.getUsername();
        savedListing.setApproved(false); // Not approved
        savedListing.setSold(false);
        savedListing.setArchived(false);
        savedListing.setIsUserActive(true);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.pauseListing(listingId, username);
        });
        assertEquals("Cannot pause a listing that is not yet approved.", exception.getMessage()); // Adjusted to match service

        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository, never()).save(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponse(any(CarListing.class));
    }

    @Test
    void pauseListing_ThrowsIllegalStateException_IfSold() {
        // Arrange
        Long listingId = 1L;
        String username = testUser.getUsername();
        savedListing.setApproved(true);
        savedListing.setSold(true); // Sold
        savedListing.setArchived(false);
        savedListing.setIsUserActive(true);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.pauseListing(listingId, username);
        });
        assertEquals("Cannot pause a listing that has been marked as sold.", exception.getMessage()); // Adjusted to match service

        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository, never()).save(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponse(any(CarListing.class));
    }

    // --- Tests for resumeListing ---

    @Test
    void resumeListing_Success_ByOwner() {
        // Arrange
        Long listingId = 1L;
        String username = "testuser";
        savedListing.setSeller(testUser);
        savedListing.setApproved(true);
        savedListing.setSold(false);
        savedListing.setArchived(false);
        savedListing.setIsUserActive(false); // Paused

        CarListing resumedListing = new CarListing();
        resumedListing.setId(listingId);
        resumedListing.setSeller(testUser);
        resumedListing.setApproved(true);
        resumedListing.setSold(false);
        resumedListing.setArchived(false);
        resumedListing.setIsUserActive(true); // Resumed

        CarListingResponse resumedResponse = new CarListingResponse();
        resumedResponse.setId(listingId);
        resumedResponse.setIsUserActive(true);

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(resumedListing);
        when(carListingMapper.toCarListingResponse(resumedListing)).thenReturn(resumedResponse);

        // Act
        CarListingResponse response = carListingService.resumeListing(listingId, username);

        // Assert
        assertNotNull(response);
        assertTrue(response.getIsUserActive());
        verify(carListingRepository).save(argThat(listing -> listing.getIsUserActive()));
        verify(carListingMapper).toCarListingResponse(resumedListing);
    }

    @Test
    void resumeListing_ThrowsSecurityException_IfNotOwner() {
        // Arrange
        Long listingId = 1L;
        String username = "otheruser"; // Not the owner
        savedListing.setSeller(testUser); // Owner is testUser
        savedListing.setApproved(true);
        savedListing.setIsUserActive(false); // Paused

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(otherUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));

        // Act & Assert
        SecurityException exception = assertThrows(SecurityException.class, () -> {
            carListingService.resumeListing(listingId, username);
        });
        assertEquals("User does not have permission to modify this listing.", exception.getMessage());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void resumeListing_ThrowsIllegalStateException_IfAlreadyActive() {
        // Arrange
        Long listingId = 1L;
        String username = testUser.getUsername();
        savedListing.setApproved(true);
        savedListing.setSold(false);
        savedListing.setArchived(false);
        savedListing.setIsUserActive(true); // Already active

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        // No need to mock carListingMapper or carListingRepository.save as an exception is expected

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.resumeListing(listingId, username);
        });
        assertEquals("Listing with ID " + listingId + " is already active.", exception.getMessage());

        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository, never()).save(any(CarListing.class));
        verify(carListingMapper, never()).toCarListingResponse(any(CarListing.class));
    }

    @Test
    void resumeListing_ThrowsResourceNotFoundException_IfListingNotFound() {
        // Arrange
        Long listingId = 999L; // Non-existent
        String username = "testuser";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.resumeListing(listingId, username);
        });
        assertEquals("CarListing not found with id : '999'", exception.getMessage());
        verify(carListingRepository, never()).save(any());
    }
}

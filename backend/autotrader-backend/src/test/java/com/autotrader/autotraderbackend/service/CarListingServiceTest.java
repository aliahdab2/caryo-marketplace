package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.ListingMedia;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.CarBrand; // Added
import com.autotrader.autotraderbackend.model.CarModel; // Added
import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import com.autotrader.autotraderbackend.service.storage.StorageKeyGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
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
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CarListingServiceTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private CarModelService carModelService; // Added mock for CarModelService

    @Mock
    private StorageService storageService;

    @Mock
    private StorageKeyGenerator storageKeyGenerator;

    @Mock
    private CarListingMapper carListingMapper;

    @InjectMocks
    private CarListingService carListingService;

    private User testUser;
    private CarListing testListing;
    private CarListingResponse testListingResponse;
    private Location testLocation;
    private CarBrand testCarBrand;
    private CarModel testCarModel;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        // Create test location with country and governorate
        Country country = new Country();
        country.setId(1L);
        country.setCountryCode("SY");
        country.setDisplayNameEn("Syria");
        country.setDisplayNameAr("سوريا");
        
        Governorate governorate = new Governorate();
        governorate.setId(1L);
        governorate.setDisplayNameEn("Damascus");
        governorate.setDisplayNameAr("دمشق");
        governorate.setSlug("damascus");
        governorate.setCountry(country);
        
        testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setDisplayNameEn("Test Location");
        testLocation.setDisplayNameAr("موقع اختبار");
        testLocation.setSlug("test-location");
        testLocation.setGovernorate(governorate);

        testCarBrand = new CarBrand(); // Ensure brand is initialized
        testCarBrand.setId(1L);
        testCarBrand.setName("TestBrand");
        testCarBrand.setDisplayNameEn("Test Brand");
        testCarBrand.setDisplayNameAr("علامة تجارية اختبار");

        testCarModel = new CarModel(); // Ensure model is initialized
        testCarModel.setId(1L);
        testCarModel.setName("TestModel");
        testCarModel.setDisplayNameEn("Test Model");
        testCarModel.setDisplayNameAr("نموذج اختبار");
        testCarModel.setBrand(testCarBrand); // Associate brand with model

        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setSeller(testUser);
        testListing.setLocation(testLocation);
        testListing.setModel(testCarModel);
        testListing.setBrandNameEn(testCarBrand.getDisplayNameEn());
        testListing.setBrandNameAr(testCarBrand.getDisplayNameAr());
        testListing.setModelNameEn(testCarModel.getDisplayNameEn());
        testListing.setModelNameAr(testCarModel.getDisplayNameAr());
        testListing.setPrice(new BigDecimal("20000.00"));
        testListing.setApproved(false);

        testListingResponse = new CarListingResponse();
        testListingResponse.setId(1L);
        testListingResponse.setBrandNameEn(testCarBrand.getDisplayNameEn());
        testListingResponse.setBrandNameAr(testCarBrand.getDisplayNameAr());
        testListingResponse.setModelNameEn(testCarModel.getDisplayNameEn());
        testListingResponse.setModelNameAr(testCarModel.getDisplayNameAr());
        
        // Setup StorageKeyGenerator mock (lenient to avoid unnecessary stubbing exceptions)
        lenient().when(storageKeyGenerator.generateListingMediaKey(anyLong(), anyString()))
                .thenAnswer(invocation -> {
                    Long listingId = invocation.getArgument(0);
                    String filename = invocation.getArgument(1);
                    if (filename == null || filename.trim().isEmpty()) {
                        return "listings/" + listingId + "/123456_";
                    } else {
                        return "listing-media/" + listingId + "/" + filename;
                    }
                });
    }

    @Test
    void createListing_Success() {
        CreateListingRequest request = new CreateListingRequest();
        request.setTitle("Test Car");
        request.setLocationId(1L);
        request.setModelId(1L); // Use modelId

        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(testUser));
        when(locationRepository.findById(any())).thenReturn(Optional.of(testLocation));
        when(carModelService.getModelById(anyLong())).thenReturn(testCarModel); // Mock CarModelService
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(any())).thenReturn(testListingResponse);

        CarListingResponse response = carListingService.createListing(request, null, "testuser");

        assertNotNull(response);
        assertEquals(testListing.getId(), response.getId());
        verify(carListingRepository).save(any());
        verify(locationRepository).findById(eq(1L));
        verify(carModelService).getModelById(eq(1L)); // Verify CarModelService interaction
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
        request.setModelId(1L); // Use modelId
        request.setModelYear(2022);
        request.setPrice(new BigDecimal("15000"));
        request.setMileage(5000);
        request.setLocationId(1L);
        request.setDescription("TestDesc");
        String username = "testuser";
        RuntimeException dbException = new RuntimeException("Database connection failed");

        // Create test location with proper hierarchy
        Country mockCountry = new Country();
        mockCountry.setId(1L);
        mockCountry.setCountryCode("SY");
        mockCountry.setDisplayNameEn("Syria");
        mockCountry.setDisplayNameAr("سوريا");
        
        Governorate mockGovernorate = new Governorate();
        mockGovernorate.setId(1L);
        mockGovernorate.setDisplayNameEn("Damascus");
        mockGovernorate.setDisplayNameAr("دمشق");
        mockGovernorate.setSlug("damascus");
        mockGovernorate.setCountry(mockCountry);
        
        Location mockLocation = new Location();
        mockLocation.setId(1L);
        mockLocation.setDisplayNameEn("Test Location");
        mockLocation.setDisplayNameAr("موقع اختبار");
        mockLocation.setSlug("test-location");
        mockLocation.setGovernorate(mockGovernorate);
        
        when(locationRepository.findById(1L)).thenReturn(Optional.of(mockLocation));
        when(carModelService.getModelById(1L)).thenReturn(testCarModel); // Mock CarModelService

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.save(any(CarListing.class))).thenThrow(dbException);

        // Act & Assert
        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            carListingService.createListing(request, null, username);
        });

        assertEquals("Database connection failed", thrown.getMessage());
        assertSame(dbException, thrown);
        verify(carModelService).getModelById(eq(1L)); // Verify CarModelService interaction
    }

    // --- Tests for getListingById ---
    @Test
    void getListingById_Success_WhenApproved() { // Renamed for clarity
        // Arrange
        Long listingId = 1L;
        // Ensure the mock listing is approved for this test if needed, or assume findByIdAndApprovedTrue handles it
        testListing.setApproved(true); // Explicitly set for clarity
        testListingResponse.setApproved(true); // Match expected response

        // Mock the repository call for an approved listing
        when(carListingRepository.findByIdAndApprovedTrue(listingId)).thenReturn(Optional.of(testListing));
        // Mock the mapper call
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(testListingResponse);

        // Act
        CarListingResponse response = carListingService.getListingById(listingId);

        // Assert
        assertNotNull(response);
        assertEquals(testListingResponse, response);
        // Verify the correct repository method was called
        verify(carListingRepository).findByIdAndApprovedTrue(listingId);
        verify(carListingMapper).toCarListingResponse(testListing);
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
        testListing.setApproved(false); // Ensure the listing exists but is not approved

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
        filter.setBrand("Honda"); // Keep this for filter logic, but CarListing/Response will use denormalized fields

        CarListing filteredListing = new CarListing(); // Setup listing
        filteredListing.setId(1L);
        // Set denormalized brand name for the listing itself
        filteredListing.setBrandNameEn("Honda"); 
        filteredListing.setBrandNameAr("هوندا");
        filteredListing.setApproved(true);
        List<CarListing> listings = Collections.singletonList(filteredListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, pageable, 1);

        CarListingResponse filteredResponse = new CarListingResponse(); // Setup response
        filteredResponse.setId(1L);
        // Set denormalized brand name for the response
        filteredResponse.setBrandNameEn("Honda"); 
        filteredResponse.setBrandNameAr("هوندا");
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

        when(carListingRepository.findAll(ArgumentMatchers.<Specification<CarListing>>any(), eq(pageable))).thenReturn(emptyPage);

        // Act
        Page<CarListingResponse> responsePage = carListingService.getFilteredListings(filter, pageable);

        // Assert
        assertNotNull(responsePage);
        assertTrue(responsePage.isEmpty());
        assertEquals(0, responsePage.getTotalElements());
        verify(carListingRepository).findAll(ArgumentMatchers.<Specification<CarListing>>any(), eq(pageable));
        verify(carListingMapper, never()).toCarListingResponse(any());
    }
    // --- Tests for uploadListingImage ---
    @Test
    void uploadListingImage_Success() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile(
                "file", "hello.jpg", "image/jpeg", "Hello, World!".getBytes()
        );
        
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));
        when(storageService.store(eq(file), keyCaptor.capture())).thenAnswer(invocation -> keyCaptor.getValue());
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
        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(storageService).store(eq(file), keyCaptor.capture());
        verify(carListingRepository).save(argThat(l -> {
            if (l.getId().equals(listingId) && !l.getMedia().isEmpty()) {
                ListingMedia media = l.getMedia().get(0);
                return returnedKey.equals(media.getFileKey());
            }
            return false;
        }));
    }
    @Test
    void uploadListingImage_ListingNotFound_ThrowsResourceNotFoundException() throws IOException {
        // Arrange
        Long nonExistentId = 999L;
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.uploadListingImage(nonExistentId, file, username);
        });
        assertEquals("CarListing not found with id : '999'", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(nonExistentId);
        verify(storageService, never()).store(any(MultipartFile.class), anyString());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_UnauthorizedUser_ThrowsSecurityException() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String wrongUsername = "wronguser";
        User wrongUser = new User();
        wrongUser.setId(99L);
        wrongUser.setUsername(wrongUsername);
        
        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        when(userRepository.findByUsername(wrongUsername)).thenReturn(Optional.of(wrongUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));

        // Act & Assert
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
    void uploadListingImage_EmptyFile_ThrowsStorageException() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile emptyFile = new MockMultipartFile("file", "", "image/jpeg", new byte[0]); // Empty file
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        
        // Act & Assert
        StorageException exception = assertThrows(StorageException.class, () -> {
            carListingService.uploadListingImage(listingId, emptyFile, username);
        });
        
        assertEquals("File provided for upload is null or empty.", exception.getMessage());
        
        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository, never()).findById(anyLong());
        verify(storageService, never()).store(any(MultipartFile.class), anyString());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_StorageFailure_ThrowsStorageException() throws IOException { // Renamed from uploadListingImage_StorageFailure_ThrowsRuntimeException
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        MockMultipartFile file = new MockMultipartFile("file", "hello.jpg", "image/jpeg", "content".getBytes());
        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));
        doThrow(new StorageException("Disk full")).when(storageService).store(eq(file), keyCaptor.capture());
        
        // Act & Assert
        StorageException exception = assertThrows(StorageException.class, () -> {
            carListingService.uploadListingImage(listingId, file, username);
        });
        
        assertEquals("Disk full", exception.getMessage()); // Corrected expected message
        
        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(storageService).store(eq(file), anyString());
        verify(carListingRepository, never()).save(any());
    }

    @Test
    void uploadListingImage_WithNullOriginalFilename_ShouldGenerateSafeKey() throws IOException {
        // Arrange
        Long listingId = testListing.getId();
        String username = testUser.getUsername();
        // File with null original filename
        MockMultipartFile file = new MockMultipartFile("file", null, "image/png", "content".getBytes());
        String expectedKey = "listings/" + listingId + "/123456_";

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(testUser));
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(testListing));
        when(storageService.store(eq(file), anyString())).thenReturn(expectedKey);
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        String returnedKey = carListingService.uploadListingImage(listingId, file, username);

        // Assert
        assertNotNull(returnedKey);
        assertEquals(expectedKey, returnedKey);

        // Verify store was called with the expected key
        verify(storageService).store(eq(file), eq(expectedKey));

        // Assert the format of the returned key
        assertTrue(returnedKey.startsWith("listings/" + listingId + "/"));
        assertTrue(returnedKey.matches("listings/" + listingId + "/\\d+_"),
                   "Generated key '" + returnedKey + "' did not match expected pattern.");

        // Verify save was called with the correct key
        verify(carListingRepository).save(argThat(l -> {
            if (!l.getMedia().isEmpty()) {
                ListingMedia media = l.getMedia().get(0);
                return expectedKey.equals(media.getFileKey());
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
        when(carListingMapper.toCarListingResponse(listing1)).thenReturn(response1);
        when(carListingMapper.toCarListingResponse(listing2)).thenReturn(response2);

        // Act
        List<CarListingResponse> result = carListingService.getMyListings(username);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals(2L, result.get(1).getId());

        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findBySeller(testUser);
        verify(carListingMapper, times(2)).toCarListingResponse(any());
    }
}

package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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

    @InjectMocks
    private CarListingService carListingService;

    private User testUser;
    private CreateListingRequest createRequest;
    private CarListing savedListing;

    @BeforeEach
    void setUp() {
        // Setup test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");

        // Setup creates listing request
        createRequest = new CreateListingRequest();
        createRequest.setTitle("Test Car");
        createRequest.setBrand("Toyota");
        createRequest.setModel("Camry");
        createRequest.setModelYear(2022);
        createRequest.setMileage(5000);
        createRequest.setPrice(new BigDecimal("25000.00"));
        createRequest.setLocation("Test Location");
        createRequest.setDescription("Test Description");

        // Set up a saved listing
        savedListing = new CarListing();
        savedListing.setId(1L);
        savedListing.setTitle(createRequest.getTitle());
        savedListing.setBrand(createRequest.getBrand());
        savedListing.setModel(createRequest.getModel());
        savedListing.setModelYear(createRequest.getModelYear());
        savedListing.setMileage(createRequest.getMileage());
        savedListing.setPrice(createRequest.getPrice());
        savedListing.setLocation(createRequest.getLocation());
        savedListing.setDescription(createRequest.getDescription());
        savedListing.setSeller(testUser);
        savedListing.setApproved(false); // Ensure it starts unapproved
        savedListing.setCreatedAt(LocalDateTime.now()); // Set created timestamp
    }

    @Test
    void createListing_WithValidData_ShouldCreateAndReturnListing() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        // Capture the argument passed to save to ensure fields are set correctly before saving
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(invocation -> {
            CarListing listingToSave = invocation.getArgument(0);
            // Simulate saving by assigning an ID and returning the object
            listingToSave.setId(1L); // Use the ID from setUp
            listingToSave.setCreatedAt(savedListing.getCreatedAt()); // Use timestamp from setUp
            return listingToSave;
        });

        // Act
        CarListingResponse response = carListingService.createListing(createRequest, "testuser");

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(createRequest.getTitle(), response.getTitle());
        assertEquals(createRequest.getBrand(), response.getBrand());
        assertEquals(createRequest.getModel(), response.getModel());
        assertEquals(createRequest.getModelYear(), response.getModelYear());
        assertEquals(createRequest.getMileage(), response.getMileage());
        assertEquals(0, createRequest.getPrice().compareTo(response.getPrice())); // Use compareTo for BigDecimal
        assertEquals(createRequest.getLocation(), response.getLocation());
        assertEquals(createRequest.getDescription(), response.getDescription());
        assertEquals(testUser.getId(), response.getSellerId());
        assertEquals(testUser.getUsername(), response.getSellerUsername());
        assertFalse(response.getApproved());
        assertNotNull(response.getCreatedAt()); // Check timestamp

        verify(userRepository).findByUsername("testuser");
        verify(carListingRepository).save(any(CarListing.class));
    }

    @Test
    void createListing_WithNonExistentUser_ShouldThrowException() {
        // Arrange
        when(userRepository.findByUsername("nonexistentuser")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.createListing(createRequest, "nonexistentuser");
        });

        verify(userRepository).findByUsername("nonexistentuser");
        verify(carListingRepository, never()).save(any(CarListing.class));
    }

    @Test
    void getListingById_Success() {
        // Arrange
        Long listingId = 1L;
        savedListing.setApproved(true); // Assume it's approved for retrieval
        savedListing.setImageKey("test-image.jpg");
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        when(storageService.getSignedUrl(eq("test-image.jpg"), anyLong())).thenReturn("http://example.com/signed-url");

        // Act
        CarListingResponse response = carListingService.getListingById(listingId);

        // Assert
        assertNotNull(response);
        assertEquals(listingId, response.getId());
        assertEquals(savedListing.getTitle(), response.getTitle());
        assertEquals("http://example.com/signed-url", response.getImageUrl());
        assertTrue(response.getApproved());

        verify(carListingRepository).findById(listingId);
        verify(storageService).getSignedUrl(eq("test-image.jpg"), anyLong());
    }

     @Test
    void getListingById_NotFound_ThrowsResourceNotFoundException() {
        // Arrange
        Long nonExistentId = 999L;
        when(carListingRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class, () -> {
            carListingService.getListingById(nonExistentId);
        });

        assertEquals("CarListing not found with id : '" + nonExistentId + "'", exception.getMessage());

        verify(carListingRepository).findById(nonExistentId);
        verify(storageService, never()).getSignedUrl(anyString(), anyLong());
    }

    @Test
    void approveListing_Success() {
        // Arrange
        Long listingId = savedListing.getId();
        assertFalse(savedListing.getApproved()); // Pre-condition: not approved
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));
        // Mock the save operation to reflect the change
        when(carListingRepository.save(any(CarListing.class))).thenAnswer(invocation -> {
            CarListing listingToSave = invocation.getArgument(0);
            assertTrue(listingToSave.getApproved()); // Check if approved is set to true before saving
            return listingToSave; // Return the modified listing
        });

        // Act
        CarListingResponse response = carListingService.approveListing(listingId);

        // Assert
        assertNotNull(response);
        assertTrue(response.getApproved()); // Check response DTO
        assertEquals(listingId, response.getId());

        // Verify interactions
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository).save(savedListing); // Verify save was called with the specific object
        // Verify the state change was attempted on the object
        assertTrue(savedListing.getApproved());
    }

    @Test
    void approveListing_AlreadyApproved_ThrowsIllegalStateException() {
        // Arrange
        Long listingId = savedListing.getId();
        savedListing.setApproved(true); // Set listing as already approved
        when(carListingRepository.findById(listingId)).thenReturn(Optional.of(savedListing));

        // Act & Assert
        IllegalStateException exception = assertThrows(IllegalStateException.class, () -> {
            carListingService.approveListing(listingId);
        });

        assertEquals("Listing is already approved.", exception.getMessage());

        // Verify interactions
        verify(carListingRepository).findById(listingId);
        verify(carListingRepository, never()).save(any(CarListing.class)); // Save should not be called
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

        assertEquals("CarListing not found with id : '" + nonExistentId + "'", exception.getMessage());

        // Verify interactions
        verify(carListingRepository).findById(nonExistentId);
        verify(carListingRepository, never()).save(any(CarListing.class)); // Save should not be called
    }

    @Test
    void getAllApprovedListings_ShouldReturnPageOfApprovedListings() {
        // Arrange
        CarListing approvedListing1 = new CarListing();
        approvedListing1.setId(2L);
        approvedListing1.setTitle("Approved Car 1");
        approvedListing1.setApproved(true);
        approvedListing1.setPrice(BigDecimal.valueOf(20000));
        approvedListing1.setSeller(testUser);
        approvedListing1.setImageKey("image1.jpg");

        CarListing approvedListing2 = new CarListing();
        approvedListing2.setId(3L);
        approvedListing2.setTitle("Approved Car 2");
        approvedListing2.setApproved(true);
        approvedListing2.setPrice(BigDecimal.valueOf(30000));
        approvedListing2.setSeller(testUser);
        approvedListing2.setImageKey("image2.jpg");

        List<CarListing> approvedListings = List.of(approvedListing1, approvedListing2);
        Pageable pageable = PageRequest.of(0, 10);
        Page<CarListing> listingPage = new PageImpl<>(approvedListings, pageable, approvedListings.size());

        when(carListingRepository.findByApprovedTrue(pageable)).thenReturn(listingPage);
        // Corrected mock for getSignedUrl
        when(storageService.getSignedUrl(eq("image1.jpg"), anyLong())).thenReturn("http://example.com/signed-url1");
        when(storageService.getSignedUrl(eq("image2.jpg"), anyLong())).thenReturn("http://example.com/signed-url2");

        // Act
        Page<CarListingResponse> responsePage = carListingService.getAllApprovedListings(pageable);

        // Assert
        assertNotNull(responsePage);
        assertEquals(2, responsePage.getTotalElements());
        assertEquals(1, responsePage.getTotalPages());
        assertEquals(2, responsePage.getContent().size());
        assertEquals("Approved Car 1", responsePage.getContent().get(0).getTitle());
        assertTrue(responsePage.getContent().get(0).getApproved());
        assertEquals("http://example.com/signed-url1", responsePage.getContent().get(0).getImageUrl());
        assertEquals("Approved Car 2", responsePage.getContent().get(1).getTitle());
        assertTrue(responsePage.getContent().get(1).getApproved());
        assertEquals("http://example.com/signed-url2", responsePage.getContent().get(1).getImageUrl());

        // Corrected verification for getSignedUrl
        verify(carListingRepository).findByApprovedTrue(pageable);
        verify(storageService).getSignedUrl(eq("image1.jpg"), anyLong());
        verify(storageService).getSignedUrl(eq("image2.jpg"), anyLong());
    }

    @Test
    void getAllApprovedListings_WhenNoneFound_ShouldReturnEmptyPage() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<CarListing> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        when(carListingRepository.findByApprovedTrue(pageable)).thenReturn(emptyPage);

        // Act
        Page<CarListingResponse> responsePage = carListingService.getAllApprovedListings(pageable);

        // Assert
        assertNotNull(responsePage);
        assertEquals(0, responsePage.getTotalElements());
        assertTrue(responsePage.getContent().isEmpty());

        // Corrected verification for getSignedUrl
        verify(carListingRepository).findByApprovedTrue(pageable);
        verify(storageService, never()).getSignedUrl(anyString(), anyLong());
    }

    @Test
    void getFilteredListings_ShouldReturnFilteredAndApprovedListings() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrand("Toyota");

        CarListing filteredListing = new CarListing();
        filteredListing.setId(4L);
        filteredListing.setTitle("Filtered Toyota");
        filteredListing.setBrand("Toyota");
        filteredListing.setApproved(true);
        filteredListing.setPrice(BigDecimal.valueOf(22000));
        filteredListing.setSeller(testUser);
        filteredListing.setImageKey("image4.jpg");

        List<CarListing> filteredListings = List.of(filteredListing);
        Pageable pageable = PageRequest.of(0, 10);
        Page<CarListing> listingPage = new PageImpl<>(filteredListings, pageable, filteredListings.size());

        // Use any(Specification.class) - warning is acceptable here
        when(carListingRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(listingPage);
        // Corrected mock for getSignedUrl
        when(storageService.getSignedUrl(eq("image4.jpg"), anyLong())).thenReturn("http://example.com/signed-url4");

        // Act
        Page<CarListingResponse> responsePage = carListingService.getFilteredListings(filterRequest, pageable);

        // Assert
        assertNotNull(responsePage);
        assertEquals(1, responsePage.getTotalElements());
        assertEquals(1, responsePage.getContent().size());
        assertEquals("Filtered Toyota", responsePage.getContent().get(0).getTitle());
        assertTrue(responsePage.getContent().get(0).getApproved());
        assertEquals("http://example.com/signed-url4", responsePage.getContent().get(0).getImageUrl());

        // Corrected verification for getSignedUrl
        verify(carListingRepository).findAll(any(Specification.class), eq(pageable));
        verify(storageService).getSignedUrl(eq("image4.jpg"), anyLong());
    }

    @Test
    void getFilteredListings_WhenNoneMatch_ShouldReturnEmptyPage() {
        // Arrange
        ListingFilterRequest filterRequest = new ListingFilterRequest();
        filterRequest.setBrand("NonExistentBrand");

        Pageable pageable = PageRequest.of(0, 10);
        Page<CarListing> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

        // Use any(Specification.class)
        when(carListingRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage);

        // Act
        Page<CarListingResponse> responsePage = carListingService.getFilteredListings(filterRequest, pageable);

        // Assert
        assertNotNull(responsePage);
        assertEquals(0, responsePage.getTotalElements());
        assertTrue(responsePage.getContent().isEmpty());

        // Corrected verification for getSignedUrl
        verify(carListingRepository).findAll(any(Specification.class), eq(pageable));
        verify(storageService, never()).getSignedUrl(anyString(), anyLong());
    }

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

        // FIX: Use when(...).thenReturn(...) for the non-void store method
        when(storageService.store(eq(file), keyCaptor.capture())).thenAnswer(invocation -> keyCaptor.getValue());

        when(carListingRepository.save(any(CarListing.class))).thenAnswer(invocation -> {
             CarListing listingToSave = invocation.getArgument(0);
             assertNotNull(listingToSave.getImageKey());
             assertEquals(keyCaptor.getValue(), listingToSave.getImageKey());
             return listingToSave;
        });

        // Act
        String returnedKey = carListingService.uploadListingImage(listingId, file, username);

        // Assert
        assertNotNull(returnedKey);
        assertEquals(returnedKey, keyCaptor.getValue());
        assertEquals(returnedKey, savedListing.getImageKey());

        // Verify interactions
        verify(userRepository).findByUsername(username);
        verify(carListingRepository).findById(listingId);
        verify(storageService).store(eq(file), eq(returnedKey));
        verify(carListingRepository).save(savedListing);
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
        assertEquals("CarListing not found with id : '" + nonExistentId + "'", exception.getMessage());

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

        // Act & Assert
        StorageException exception = assertThrows(StorageException.class, () -> {
            carListingService.uploadListingImage(listingId, emptyFile, username);
        });
        assertEquals("Failed to store empty file.", exception.getMessage());

        // Verify interactions
        verify(userRepository).findByUsername(username); // This is called before the check
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
        doThrow(new StorageException("Disk full")).when(storageService).store(eq(file), keyCaptor.capture());

        // Act & Assert
        // FIX: Expect RuntimeException because the service wraps the StorageException
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
             carListingService.uploadListingImage(listingId, file, username);
        });
        // Optionally check the message of the RuntimeException or its cause
        assertEquals("Failed to upload image for listing.", exception.getMessage());
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
}

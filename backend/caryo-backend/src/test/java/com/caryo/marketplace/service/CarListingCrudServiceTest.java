package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.mapper.CarListingMapper;
import com.caryo.marketplace.model.*;
import com.caryo.marketplace.payload.request.CreateListingRequest;
import com.caryo.marketplace.payload.request.UpdateListingRequest;
import com.caryo.marketplace.payload.response.CarListingResponse;
import com.caryo.marketplace.repository.*;
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
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CarListingCrudServiceTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private GovernorateRepository governorateRepository;

    @Mock
    private CarListingMapper carListingMapper;

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

    @InjectMocks
    private CarListingCrudService crudService;

    private User testUser;
    private CarListing testListing;
    private CreateListingRequest createRequest;
    private UpdateListingRequest updateRequest;
    private CarListingResponse listingResponse;
    private CarModel testCarModel;
    private CarBrand testCarBrand;
    private Location testLocation;
    private Governorate testGovernorate;

    @BeforeEach
    void setup() {
        // Setup test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setEmailVerified(true);
        testUser.setAccountStatus(AccountStatus.VERIFIED);

        // Setup test car brand and model
        testCarBrand = new CarBrand();
        testCarBrand.setId(1L);
        testCarBrand.setDisplayNameEn("Toyota");
        testCarBrand.setDisplayNameAr("تويوتا");

        testCarModel = new CarModel();
        testCarModel.setId(1L);
        testCarModel.setDisplayNameEn("Camry");
        testCarModel.setDisplayNameAr("كامري");
        testCarModel.setBrand(testCarBrand);

        // Setup test location and governorate
        testGovernorate = new Governorate();
        testGovernorate.setId(1L);
        testGovernorate.setDisplayNameEn("Cairo");
        testGovernorate.setDisplayNameAr("القاهرة");

        testLocation = new Location();
        testLocation.setId(1L);
        testLocation.setGovernorate(testGovernorate);

        // Setup test listing
        testListing = new CarListing();
        testListing.setId(1L);
        testListing.setTitle("Test Car");
        testListing.setSeller(testUser);
        testListing.setApproved(true);
        testListing.setSold(false);
        testListing.setArchived(false);

        // Setup create request
        createRequest = new CreateListingRequest();
        createRequest.setTitle("New Test Car");
        createRequest.setModelId(1L);
        createRequest.setModelYear(2020);
        createRequest.setPrice(BigDecimal.valueOf(10000.0));
        createRequest.setCurrency("USD");
        createRequest.setMileage(50000);
        createRequest.setDescription("Test description");
        createRequest.setLocationId(1L);

        // Setup update request
        updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Car");
        updateRequest.setPrice(BigDecimal.valueOf(12000.0));

        // Setup response
        listingResponse = new CarListingResponse();
        listingResponse.setId(1L);
        listingResponse.setTitle("Test Car");
    }

    @Test
    void canUserCreateListings_WhenUserCanCreate_ShouldReturnTrue() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Act
        boolean result = crudService.canUserCreateListings("testuser");

        // Assert
        assertTrue(result);
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void canUserCreateListings_WhenUserCannotCreate_ShouldReturnFalse() {
        // Arrange
        testUser.setEmailVerified(false);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Act
        boolean result = crudService.canUserCreateListings("testuser");

        // Assert
        assertFalse(result);
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void canUserCreateListings_WhenUserNotFound_ShouldReturnFalse() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        boolean result = crudService.canUserCreateListings("nonexistent");

        // Assert
        assertFalse(result);
        verify(userRepository).findByUsername("nonexistent");
    }

    @Test
    void getListingById_WhenExistsAndApproved_ShouldReturnListing() {
        // Arrange
        when(carListingRepository.findByIdAndApprovedTrueWithMedia(1L)).thenReturn(Optional.of(testListing));
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(listingResponse);

        // Act
        CarListingResponse result = crudService.getListingById(1L);

        // Assert
        assertEquals(listingResponse, result);
        verify(carListingRepository).findByIdAndApprovedTrueWithMedia(1L);
        verify(carListingMapper).toCarListingResponse(testListing);
    }

    @Test
    void getListingById_WhenNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carListingRepository.findByIdAndApprovedTrueWithMedia(999L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> crudService.getListingById(999L));

        assertEquals("CarListing", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(999L, exception.getFieldValue());
    }

    @Test
    void getMyListings_ShouldReturnUserListings() {
        // Arrange
        List<CarListing> listings = Arrays.asList(testListing);
        List<CarListingResponse> responses = Arrays.asList(listingResponse);

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(carListingRepository.findBySeller(testUser)).thenReturn(listings);
        when(carListingMapper.toCarListingResponse(any(CarListing.class))).thenReturn(listingResponse);

        // Act
        List<CarListingResponse> result = crudService.getMyListings("testuser");

        // Assert
        assertEquals(1, result.size());
        assertEquals(responses.get(0), result.get(0));
        verify(userRepository).findByUsername("testuser");
        verify(carListingRepository).findBySeller(testUser);
        verify(carListingMapper).toCarListingResponse(testListing);
    }

    @Test
    void getMyListings_WhenUserNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> crudService.getMyListings("nonexistent"));

        assertEquals("User", exception.getResourceName());
        assertEquals("username", exception.getFieldName());
        assertEquals("nonexistent", exception.getFieldValue());
    }

    @Test
    void updateListing_WhenOwnerUpdates_ShouldUpdateSuccessfully() {
        // Arrange
        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(listingResponse);

        // Act
        CarListingResponse result = crudService.updateListing(1L, updateRequest, "testuser");

        // Assert
        assertEquals(listingResponse, result);
        assertEquals("Updated Car", testListing.getTitle());
        assertEquals(BigDecimal.valueOf(12000.0), testListing.getPrice());
        verify(carListingRepository).findById(1L);
        verify(carListingRepository).save(testListing);
        verify(carListingMapper).toCarListingResponse(testListing);
    }

    @Test
    void updateListing_WhenAdminUpdates_ShouldUpdateSuccessfully() {
        // Arrange
        User adminUser = new User();
        adminUser.setId(2L);
        adminUser.setUsername("admin");
        adminUser.setRoles(Set.of(createAdminRole()));

        CarListing otherListing = new CarListing();
        otherListing.setId(2L);
        otherListing.setTitle("Other Car");
        otherListing.setSeller(testUser); // Different owner

        when(carListingRepository.findById(2L)).thenReturn(Optional.of(otherListing));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(adminUser));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(otherListing);
        when(carListingMapper.toCarListingResponse(otherListing)).thenReturn(listingResponse);

        // Act
        CarListingResponse result = crudService.updateListing(2L, updateRequest, "admin");

        // Assert
        assertEquals(listingResponse, result);
        assertEquals("Updated Car", otherListing.getTitle());
        verify(carListingRepository).findById(2L);
        verify(carListingRepository).save(otherListing);
    }

    @Test
    void updateListing_WhenUnauthorizedUser_ShouldThrowSecurityException() {
        // Arrange
        User otherUser = new User();
        otherUser.setId(3L);
        otherUser.setUsername("otheruser");

        CarListing otherListing = new CarListing();
        otherListing.setId(2L);
        otherListing.setSeller(testUser); // Different owner

        when(carListingRepository.findById(2L)).thenReturn(Optional.of(otherListing));
        when(userRepository.findByUsername("otheruser")).thenReturn(Optional.of(otherUser));

        // Act & Assert
        SecurityException exception = assertThrows(SecurityException.class,
                () -> crudService.updateListing(2L, updateRequest, "otheruser"));

        assertEquals("You are not authorized to update this listing", exception.getMessage());
    }

    @Test
    void updateListing_WhenListingNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carListingRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> crudService.updateListing(999L, updateRequest, "testuser"));

        assertEquals("CarListing", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(999L, exception.getFieldValue());
    }

    @Test
    void deleteListing_ShouldDeleteSuccessfully() {
        // Arrange
        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));

        // Act
        crudService.deleteListing(1L, "testuser");

        // Assert
        verify(carListingRepository).findById(1L);
        verify(carListingRepository).delete(testListing);
    }

    @Test
    void deleteListing_WhenUnauthorizedUser_ShouldThrowSecurityException() {
        // Arrange
        CarListing otherListing = new CarListing();
        otherListing.setId(2L);
        otherListing.setSeller(testUser); // Different owner

        when(carListingRepository.findById(2L)).thenReturn(Optional.of(otherListing));

        // Act & Assert
        SecurityException exception = assertThrows(SecurityException.class,
                () -> crudService.deleteListing(2L, "otheruser"));

        assertEquals("You are not authorized to delete this listing", exception.getMessage());
    }

    @Test
    void deleteListingAsAdmin_ShouldDeleteSuccessfully() {
        // Arrange
        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));

        // Act
        crudService.deleteListingAsAdmin(1L);

        // Assert
        verify(carListingRepository).findById(1L);
        verify(carListingRepository).delete(testListing);
    }

    @Test
    void deleteListingAsAdmin_WhenListingNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carListingRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> crudService.deleteListingAsAdmin(999L));

        assertEquals("CarListing", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(999L, exception.getFieldValue());
    }

    @Test
    void approveListingAsAdmin_ShouldApproveSuccessfully() {
        // Arrange
        testListing.setApproved(false);
        when(carListingRepository.findById(1L)).thenReturn(Optional.of(testListing));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(testListing);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(listingResponse);

        // Act
        CarListingResponse result = crudService.approveListingAsAdmin(1L);

        // Assert
        assertEquals(listingResponse, result);
        assertTrue(testListing.getApproved());
        verify(carListingRepository).findById(1L);
        verify(carListingRepository).save(testListing);
        verify(carListingMapper).toCarListingResponse(testListing);
    }

    @Test
    void approveListingAsAdmin_WhenListingNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(carListingRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> crudService.approveListingAsAdmin(999L));

        assertEquals("CarListing", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(999L, exception.getFieldValue());
    }

    @Test
    void getAllListingsAsAdmin_ShouldReturnAllListings() {
        // Arrange
        List<CarListing> listings = Arrays.asList(testListing);
        Page<CarListing> listingPage = new PageImpl<>(listings, PageRequest.of(0, 10), 1);
        Page<CarListingResponse> responsePage = new PageImpl<>(Arrays.asList(listingResponse), PageRequest.of(0, 10), 1);

        when(carListingRepository.findAll(any(Pageable.class))).thenReturn(listingPage);
        when(carListingMapper.toCarListingResponse(testListing)).thenReturn(listingResponse);

        // Act
        Page<CarListingResponse> result = crudService.getAllListingsAsAdmin(PageRequest.of(0, 10));

        // Assert
        assertEquals(1, result.getTotalElements());
        assertEquals(listingResponse, result.getContent().get(0));
        verify(carListingRepository).findAll(PageRequest.of(0, 10));
        verify(carListingMapper).toCarListingResponse(testListing);
    }

    @Test
    void createListingInternal_ShouldCreateSuccessfully() {
        // Arrange
        CarListing newListing = new CarListing();
        newListing.setId(2L);
        newListing.setTitle("New Test Car");

        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(carModelService.getModelById(1L)).thenReturn(testCarModel);
        when(locationRepository.findById(1L)).thenReturn(Optional.of(testLocation));
        when(carListingRepository.save(any(CarListing.class))).thenReturn(newListing);
        when(carListingMapper.toCarListingResponse(newListing)).thenReturn(listingResponse);

        // Act
        CarListingResponse result = crudService.createListingInternal(createRequest, "testuser");

        // Assert
        assertEquals(listingResponse, result);
        verify(userRepository).findByUsername("testuser");
        verify(carModelService).getModelById(1L);
        verify(locationRepository).findById(1L);
        verify(carListingRepository).save(any(CarListing.class));
    }

    @Test
    void createListingInternal_WhenUserNotVerified_ShouldThrowSecurityException() {
        // Arrange
        testUser.setEmailVerified(false);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Act & Assert
        SecurityException exception = assertThrows(SecurityException.class,
                () -> crudService.createListingInternal(createRequest, "testuser"));

        assertTrue(exception.getMessage().contains("Email verification required"));
    }

    @Test
    void createListingInternal_WhenLocationNotFound_ShouldThrowResourceNotFoundException() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(carModelService.getModelById(1L)).thenReturn(testCarModel);
        when(locationRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        ResourceNotFoundException exception = assertThrows(ResourceNotFoundException.class,
                () -> crudService.createListingInternal(createRequest, "testuser"));

        assertEquals("Location", exception.getResourceName());
        assertEquals("id", exception.getFieldName());
        assertEquals(1L, exception.getFieldValue());
    }

    private Role createAdminRole() {
        Role adminRole = new Role();
        adminRole.setId(1);
        adminRole.setName("ROLE_ADMIN");
        return adminRole;
    }
}

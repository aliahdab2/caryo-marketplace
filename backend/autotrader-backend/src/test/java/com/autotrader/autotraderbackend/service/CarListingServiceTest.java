package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CarListingServiceTest {

    @Mock
    private CarListingRepository carListingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CarListingService carListingService;

    private User testUser;
    private CreateListingRequest createRequest;

    @BeforeEach
    void setUp() {
        // Setup test user
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");

        // Setup create listing request
        createRequest = new CreateListingRequest();
        createRequest.setTitle("Test Car");
        createRequest.setBrand("Toyota");
        createRequest.setModel("Camry");
        createRequest.setModelYear(2022);
        createRequest.setMileage(5000);
        createRequest.setPrice(new BigDecimal("25000.00"));
        createRequest.setLocation("Test Location");
        createRequest.setDescription("Test Description");
    }

    @Test
    void createListing_WithValidData_ShouldCreateAndReturnListing() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        
        CarListing savedCarListing = new CarListing();
        savedCarListing.setId(1L);
        savedCarListing.setTitle(createRequest.getTitle());
        savedCarListing.setBrand(createRequest.getBrand());
        savedCarListing.setModel(createRequest.getModel());
        savedCarListing.setModelYear(createRequest.getModelYear());
        savedCarListing.setMileage(createRequest.getMileage());
        savedCarListing.setPrice(createRequest.getPrice());
        savedCarListing.setLocation(createRequest.getLocation());
        savedCarListing.setDescription(createRequest.getDescription());
        savedCarListing.setSeller(testUser);
        savedCarListing.setApproved(false);

        when(carListingRepository.save(any(CarListing.class))).thenReturn(savedCarListing);

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
        assertEquals(createRequest.getPrice(), response.getPrice());
        assertEquals(createRequest.getLocation(), response.getLocation());
        assertEquals(createRequest.getDescription(), response.getDescription());
        assertEquals(testUser.getId(), response.getSellerId());
        assertEquals(testUser.getUsername(), response.getSellerUsername());
        assertFalse(response.getApproved());

        verify(userRepository).findByUsername("testuser");
        verify(carListingRepository).save(any(CarListing.class));
    }

    @Test
    void createListing_WithNonExistentUser_ShouldThrowException() {
        // Arrange
        when(userRepository.findByUsername("nonexistentuser")).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(UsernameNotFoundException.class, () -> {
            carListingService.createListing(createRequest, "nonexistentuser");
        });

        verify(userRepository).findByUsername("nonexistentuser");
        verify(carListingRepository, never()).save(any(CarListing.class));
    }
}

package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class CarListingCrudIntegrationTest extends IntegrationTestWithS3 {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private LocationRepository locationRepository;
    
    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private CarListing testListing;
    private User testUser;
    private User adminUser;
    private Location testLocation;
    private String userToken;
    private String adminToken;
    private Long listingId;
    
    // Use the same JWT secret as in application.properties
    @Value("${autotrader.app.jwtSecret}")
    private String jwtSecret;
    
    private static final long JWT_EXPIRATION = 3600000; // 1 hour

    @BeforeEach
    void setUp() {
        // Clean up before test
        carListingRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword(passwordEncoder.encode("password"));
        
        // Create and set user role
        Role userRole = roleRepository.findByName("ROLE_USER")
            .orElseGet(() -> {
                Role newRole = new Role("ROLE_USER");
                return roleRepository.save(newRole);
            });
            
        Set<Role> userRoles = new HashSet<>();
        userRoles.add(userRole);
        testUser.setRoles(userRoles);
        testUser = userRepository.save(testUser);
        
        // Create admin user
        adminUser = new User();
        adminUser.setUsername("admin");
        adminUser.setEmail("admin@example.com");
        adminUser.setPassword(passwordEncoder.encode("password"));
        
        // Create and set admin role
        Role adminRole = roleRepository.findByName("ROLE_ADMIN")
            .orElseGet(() -> {
                Role newRole = new Role("ROLE_ADMIN");
                return roleRepository.save(newRole);
            });
            
        Set<Role> adminRoles = new HashSet<>();
        adminRoles.add(adminRole);
        // Also add user role to admin
        adminRoles.add(userRole);
        adminUser.setRoles(adminRoles);
        adminUser = userRepository.save(adminUser);
        
        // Create test location
        testLocation = new Location();
        testLocation.setDisplayNameEn("Test Location");
        testLocation.setDisplayNameAr("موقع اختبار");
        testLocation.setSlug("test-location");
        testLocation.setCountryCode("SY");
        testLocation = locationRepository.save(testLocation);

        // Create test listing
        testListing = new CarListing();
        testListing.setTitle("Test Car");
        testListing.setBrand("Test Brand");
        testListing.setModel("Test Model");
        testListing.setModelYear(2020);
        testListing.setMileage(10000);
        testListing.setPrice(new BigDecimal("15000.00"));
        testListing.setLocation(testLocation);
        testListing.setDescription("Test Description");
        testListing.setTransmission("Manual");
        testListing.setApproved(true);
        testListing.setSeller(testUser);
        testListing.setCreatedAt(LocalDateTime.now());
        testListing = carListingRepository.save(testListing);
        listingId = testListing.getId();

        // Generate tokens
        userToken = generateToken(testUser.getUsername());
        adminToken = generateToken(adminUser.getUsername());
    }

    @AfterEach
    void tearDown() {
        // Clean up resources manually
        carListingRepository.deleteAll();
        userRepository.deleteAll();
        locationRepository.deleteAll(); // Add this line
    }
    
    /**
     * Helper method to generate JWT tokens for testing
     */
    private String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new java.util.Date())
                .setExpiration(new java.util.Date(System.currentTimeMillis() + JWT_EXPIRATION))
                .signWith(Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret)), SignatureAlgorithm.HS256)
                .compact();
    }

    @Test
    public void updateListing_asOwner_shouldSucceed() throws Exception {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setPrice(new BigDecimal("16000.00"));
        updateRequest.setDescription("Updated Description");

        // Act
        ResultActions result = mockMvc.perform(put("/api/listings/" + listingId)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + userToken)
                .content(objectMapper.writeValueAsString(updateRequest)));

        // Assert
        result.andExpect(status().isOk())
              .andExpect(jsonPath("$.id").value(listingId))
              .andExpect(jsonPath("$.title").value("Updated Title"))
              .andExpect(jsonPath("$.price").value(16000.0))
              .andExpect(jsonPath("$.description").value("Updated Description"));

        // Verify database was updated
        Optional<CarListing> updatedListing = carListingRepository.findById(listingId);
        assertTrue(updatedListing.isPresent());
        assertEquals("Updated Title", updatedListing.get().getTitle());
        assertEquals(0, new BigDecimal("16000.00").compareTo(updatedListing.get().getPrice()));
        assertEquals("Updated Description", updatedListing.get().getDescription());
        assertEquals("Test Model", updatedListing.get().getModel()); // Unchanged field
    }

    @Test
    public void updateListing_asDifferentUser_shouldFail() throws Exception {
        // Arrange
        UpdateListingRequest updateRequest = new UpdateListingRequest();
        updateRequest.setTitle("Updated Title");

        // Act
        ResultActions result = mockMvc.perform(put("/api/listings/" + listingId)
                .contentType(MediaType.APPLICATION_JSON)
                .header("Authorization", "Bearer " + adminToken) // Using admin as different user
                .content(objectMapper.writeValueAsString(updateRequest)));

        // Assert
        result.andExpect(status().isForbidden());

        // Verify database was not updated
        Optional<CarListing> listing = carListingRepository.findById(listingId);
        assertTrue(listing.isPresent());
        assertEquals("Test Car", listing.get().getTitle());
    }

    @Test
    public void deleteListing_asOwner_shouldSucceed() throws Exception {
        // Act
        ResultActions result = mockMvc.perform(delete("/api/listings/" + listingId)
                .header("Authorization", "Bearer " + userToken));

        // Assert
        result.andExpect(status().isNoContent());

        // Verify listing was deleted
        Optional<CarListing> deletedListing = carListingRepository.findById(listingId);
        assertFalse(deletedListing.isPresent());
    }

    @Test
    public void deleteListing_asDifferentUser_shouldFail() throws Exception {
        // Act
        ResultActions result = mockMvc.perform(delete("/api/listings/" + listingId)
                .header("Authorization", "Bearer " + adminToken)); // Using admin as different user

        // Assert
        result.andExpect(status().isForbidden());

        // Verify listing still exists
        Optional<CarListing> listing = carListingRepository.findById(listingId);
        assertTrue(listing.isPresent());
    }

    @Test
    public void deleteListingAsAdmin_shouldSucceed() throws Exception {
        // Act
        ResultActions result = mockMvc.perform(delete("/api/listings/admin/" + listingId)
                .header("Authorization", "Bearer " + adminToken));

        // Assert
        result.andExpect(status().isNoContent());

        // Verify listing was deleted
        Optional<CarListing> deletedListing = carListingRepository.findById(listingId);
        assertFalse(deletedListing.isPresent());
    }

    @Test
    public void deleteListingAsAdmin_asNonAdmin_shouldFail() throws Exception {
        // Act
        ResultActions result = mockMvc.perform(delete("/api/listings/admin/" + listingId)
                .header("Authorization", "Bearer " + userToken));

        // Assert
        result.andExpect(status().isForbidden());

        // Verify listing still exists
        Optional<CarListing> listing = carListingRepository.findById(listingId);
        assertTrue(listing.isPresent());
    }
}

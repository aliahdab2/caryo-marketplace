package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.LoginRequest;
import com.autotrader.autotraderbackend.payload.response.JwtResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.test.IntegrationTestWithS3;
import com.autotrader.autotraderbackend.util.TestDataGenerator;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AdminListingStatusIntegrationTest extends IntegrationTestWithS3 {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    private static final String ADMIN_USERNAME = "admin_test";
    private static final String ADMIN_PASSWORD = "admin123";
    private static final String USER_USERNAME = "user_test";
    private static final String USER_PASSWORD = "user123";
    
    private Long listingId;
    private String adminToken;
    private String userToken;

    @BeforeEach
    public void setUp() throws Exception {
        // Clear repositories
        carListingRepository.deleteAll();
        // Use specific deleteByUsername for cleaner test setup
        userRepository.deleteByUsername(ADMIN_USERNAME);
        userRepository.deleteByUsername(USER_USERNAME);

        // Fetch persisted roles
        var adminRole = roleRepository.findByName("ROLE_ADMIN").orElseThrow(() -> new RuntimeException("ROLE_ADMIN not found"));
        var userRole = roleRepository.findByName("ROLE_USER").orElseThrow(() -> new RuntimeException("ROLE_USER not found"));

        // Create admin user with only the persisted admin role
        User adminUser = new User();
        adminUser.setUsername(ADMIN_USERNAME);
        adminUser.setEmail(ADMIN_USERNAME + "@example.com");
        adminUser.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        adminUser.setRoles(java.util.Set.of(adminRole));
        userRepository.save(adminUser);
        adminToken = getAuthToken(ADMIN_USERNAME, ADMIN_PASSWORD);

        // Create regular user with only the persisted user role
        User normalUser = new User();
        normalUser.setUsername(USER_USERNAME);
        normalUser.setEmail(USER_USERNAME + "@example.com");
        normalUser.setPassword(passwordEncoder.encode(USER_PASSWORD));
        normalUser.setRoles(java.util.Set.of(userRole));
        userRepository.save(normalUser);
        userToken = getAuthToken(USER_USERNAME, USER_PASSWORD);

        // Create a test listing
        CarListing listing = TestDataGenerator.createTestListing(normalUser);
        listing.setApproved(true); // Already approved
        listing.setSold(false);
        listing.setArchived(false);
        CarListing savedListing = carListingRepository.save(listing);
        listingId = savedListing.getId();
    }
    
    private String getAuthToken(String username, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(username);
        loginRequest.setPassword(password);

        MvcResult result = mockMvc.perform(post("/api/auth/signin")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        JwtResponse response = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                JwtResponse.class
        );

        return response.getToken();
    }
    
    @Test
    @Transactional
    public void adminCanMarkListingAsSold() throws Exception {
        // Verify listing is not sold initially
        Optional<CarListing> initialListing = carListingRepository.findById(listingId);
        assertTrue(initialListing.isPresent());
        assertFalse(initialListing.get().getSold());
        
        // Admin marks listing as sold
        mockMvc.perform(post("/api/admin/listings/{id}/mark-sold", listingId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listingId))
                .andExpect(jsonPath("$.isSold").value(true));
        
        // Verify database was updated
        Optional<CarListing> updatedListing = carListingRepository.findById(listingId);
        assertTrue(updatedListing.isPresent());
        assertTrue(updatedListing.get().getSold());
    }
    
    @Test
    @Transactional
    public void regularUserCannotAccessAdminMarkAsSold() throws Exception {
        mockMvc.perform(post("/api/admin/listings/{id}/mark-sold", listingId)
                .header("Authorization", "Bearer " + userToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
        
        // Verify listing wasn't changed
        Optional<CarListing> listing = carListingRepository.findById(listingId);
        assertTrue(listing.isPresent());
        assertFalse(listing.get().getSold());
    }
    
    @Test
    public void adminCanArchiveListing() throws Exception {
        // Verify listing is not archived initially
        Optional<CarListing> initialListing = carListingRepository.findById(listingId);
        assertTrue(initialListing.isPresent());
        assertFalse(initialListing.get().getArchived());
        
        // Admin archives listing
        mockMvc.perform(post("/api/admin/listings/{id}/archive", listingId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listingId))
                .andExpect(jsonPath("$.isArchived").value(true));
        
        // Verify database was updated
        Optional<CarListing> updatedListing = carListingRepository.findById(listingId);
        assertTrue(updatedListing.isPresent());
        assertTrue(updatedListing.get().getArchived());
    }
    
    @Test
    @Transactional
    public void adminCanUnarchiveListing() throws Exception {
        // First archive the listing
        CarListing listing = carListingRepository.findById(listingId).orElseThrow();
        listing.setArchived(true);
        carListingRepository.save(listing);
        
        // Admin unarchives listing
        mockMvc.perform(post("/api/admin/listings/{id}/unarchive", listingId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(listingId))
                .andExpect(jsonPath("$.isArchived").value(false));
        
        // Verify database was updated
        Optional<CarListing> updatedListing = carListingRepository.findById(listingId);
        assertTrue(updatedListing.isPresent());
        assertFalse(updatedListing.get().getArchived());
    }
    
    @Test
    @WithMockUser(username = ADMIN_USERNAME, roles = {"ADMIN"})
    @Transactional
    public void tryMarkArchivedListingAsSold_ReturnConflict() throws Exception {
        // First archive the listing
        CarListing listing = carListingRepository.findById(listingId).orElseThrow();
        listing.setArchived(true);
        carListingRepository.save(listing);
        
        // Try to mark archived listing as sold
        mockMvc.perform(post("/api/admin/listings/{id}/mark-sold", listingId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }
    
    @Test
    @WithMockUser(username = ADMIN_USERNAME, roles = {"ADMIN"})
    @Transactional
    public void tryUnarchiveNonArchivedListing_ReturnConflict() throws Exception {
        // Ensure listing is not archived
        CarListing listing = carListingRepository.findById(listingId).orElseThrow();
        listing.setArchived(false);
        carListingRepository.save(listing);
        
        // Try to unarchive a non-archived listing
        mockMvc.perform(post("/api/admin/listings/{id}/unarchive", listingId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").exists());
    }
}

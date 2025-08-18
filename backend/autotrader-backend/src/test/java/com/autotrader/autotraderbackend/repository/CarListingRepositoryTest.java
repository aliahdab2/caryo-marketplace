package com.autotrader.autotraderbackend.repository;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.FuelType;
import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.model.Governorate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@ActiveProfiles("test")
class CarListingRepositoryTest {

    @Autowired
    private TestEntityManager entityManager;

    @Autowired
    private CarListingRepository carListingRepository;

    private User testUser;
    private Location testLocation;
    private CarBrand testBrand;
    private CarModel testModel;
    private FuelType gasolineFuelType;
    private FuelType dieselFuelType;
    private FuelType electricFuelType;

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("password");
        testUser = entityManager.persistAndFlush(testUser);

        // Create test location
        Country country = new Country();
        country.setCountryCode("SY");
        country.setDisplayNameEn("Syria");
        country.setDisplayNameAr("سوريا");
        country = entityManager.persistAndFlush(country);

        Governorate governorate = new Governorate();
        governorate.setDisplayNameEn("Damascus");
        governorate.setDisplayNameAr("دمشق");
        governorate.setSlug("damascus");
        governorate.setCountry(country);
        governorate = entityManager.persistAndFlush(governorate);

        testLocation = new Location();
        testLocation.setDisplayNameEn("Damascus");
        testLocation.setDisplayNameAr("دمشق");
        testLocation.setSlug("damascus");
        testLocation.setGovernorate(governorate);
        testLocation = entityManager.persistAndFlush(testLocation);

        // Create test brand and model
        testBrand = new CarBrand();
        testBrand.setName("toyota");
        testBrand.setSlug("toyota");
        testBrand.setDisplayNameEn("Toyota");
        testBrand.setDisplayNameAr("تويوتا");
        testBrand = entityManager.persistAndFlush(testBrand);

        testModel = new CarModel();
        testModel.setName("camry");
        testModel.setSlug("camry");
        testModel.setDisplayNameEn("Camry");
        testModel.setDisplayNameAr("كامري");
        testModel.setBrand(testBrand);
        testModel = entityManager.persistAndFlush(testModel);

        // Create fuel types
        gasolineFuelType = new FuelType();
        gasolineFuelType.setName("gasoline");
        gasolineFuelType.setSlug("gasoline");
        gasolineFuelType.setDisplayNameEn("Gasoline");
        gasolineFuelType.setDisplayNameAr("بنزين");
        gasolineFuelType = entityManager.persistAndFlush(gasolineFuelType);

        dieselFuelType = new FuelType();
        dieselFuelType.setName("diesel");
        dieselFuelType.setSlug("diesel");
        dieselFuelType.setDisplayNameEn("Diesel");
        dieselFuelType.setDisplayNameAr("ديزل");
        dieselFuelType = entityManager.persistAndFlush(dieselFuelType);

        electricFuelType = new FuelType();
        electricFuelType.setName("electric");
        electricFuelType.setSlug("electric");
        electricFuelType.setDisplayNameEn("Electric");
        electricFuelType.setDisplayNameAr("كهربائي");
        electricFuelType = entityManager.persistAndFlush(electricFuelType);
    }

    @Test
    void findDistinctFuelTypesWithCounts_ShouldReturnCorrectCounts() {
        // Given - Create test listings with different fuel types
        createTestListing("Car 1", gasolineFuelType, true);
        createTestListing("Car 2", gasolineFuelType, true);
        createTestListing("Car 3", dieselFuelType, true);
        createTestListing("Car 4", electricFuelType, true);
        createTestListing("Car 5", gasolineFuelType, true);
        
        // Create some listings that should not be counted (not approved)
        createTestListing("Car 6", gasolineFuelType, false); // not approved
        // Note: sold/archived filtering is now handled at service layer, not repository layer

        // When
        List<Object[]> results = carListingRepository.findDistinctFuelTypesWithCounts();

        // Then
        assertNotNull(results);
        assertEquals(3, results.size());

        // Verify counts
        boolean foundGasoline = false, foundDiesel = false, foundElectric = false;
        for (Object[] result : results) {
            String fuelTypeName = (String) result[0];
            Long count = (Long) result[1];
            
            switch (fuelTypeName) {
                case "gasoline":
                    assertEquals(3L, count);
                    foundGasoline = true;
                    break;
                case "diesel":
                    assertEquals(1L, count);
                    foundDiesel = true;
                    break;
                case "electric":
                    assertEquals(1L, count);
                    foundElectric = true;
                    break;
            }
        }
        
        assertTrue(foundGasoline, "Gasoline fuel type should be found");
        assertTrue(foundDiesel, "Diesel fuel type should be found");
        assertTrue(foundElectric, "Electric fuel type should be found");
    }

    @Test
    void findDistinctFuelTypesWithCounts_WithNoApprovedListings_ShouldReturnEmptyList() {
        // Given - Create only non-approved listings
        createTestListing("Car 1", gasolineFuelType, false);
        createTestListing("Car 2", dieselFuelType, false);

        // When
        List<Object[]> results = carListingRepository.findDistinctFuelTypesWithCounts();

        // Then
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    // Note: Tests for sold/archived filtering removed as this logic is now handled at service layer
    // Repository layer only handles basic database queries with approved/non-approved filtering

    @Test
    void findDistinctFuelTypesWithCounts_WithNullFuelType_ShouldHandleGracefully() {
        // Given - Create listing with null fuel type
        createTestListing("Car 1", null, true);

        // When
        List<Object[]> results = carListingRepository.findDistinctFuelTypesWithCounts();

        // Then
        assertNotNull(results);
        // The query should handle null fuel types gracefully
        // The exact behavior depends on the database, but it shouldn't crash
    }

    private CarListing createTestListing(String title, FuelType fuelType, boolean approved) {
        CarListing listing = new CarListing();
        listing.setTitle(title);
        listing.setModel(testModel);
        listing.setModelYear(2022);
        listing.setMileage(5000);
        listing.setPrice(new BigDecimal("25000.00"));
        listing.setLocation(testLocation);
        listing.setGovernorate(testLocation.getGovernorate());
        listing.setDescription("Test description");
        listing.setSeller(testUser);
        listing.setApproved(approved);
        listing.setFuelType(fuelType);
        
        // Note: sold and archived are now computed from ListingModerationAction table
        // Repository tests focus on basic database queries, service tests handle business logic
        
        return entityManager.persistAndFlush(listing);
    }
} 
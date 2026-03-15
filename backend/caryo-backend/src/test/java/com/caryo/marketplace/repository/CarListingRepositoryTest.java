package com.caryo.marketplace.repository;

import com.caryo.marketplace.model.CarListing;
import com.caryo.marketplace.model.FuelType;
import com.caryo.marketplace.model.CarBrand;
import com.caryo.marketplace.model.CarModel;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.model.Location;
import com.caryo.marketplace.model.Country;
import com.caryo.marketplace.model.Governorate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
        createTestListing("Car 1", gasolineFuelType, true, false, false);
        createTestListing("Car 2", gasolineFuelType, true, false, false);
        createTestListing("Car 3", dieselFuelType, true, false, false);
        createTestListing("Car 4", electricFuelType, true, false, false);
        createTestListing("Car 5", gasolineFuelType, true, false, false);

        // Create some listings that should not be counted (not approved, sold, or
        // archived)
        createTestListing("Car 6", gasolineFuelType, false, false, false); // not approved
        createTestListing("Car 7", dieselFuelType, true, true, false); // sold
        createTestListing("Car 8", electricFuelType, true, false, true); // archived

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
        createTestListing("Car 1", gasolineFuelType, false, false, false);
        createTestListing("Car 2", dieselFuelType, false, false, false);

        // When
        List<Object[]> results = carListingRepository.findDistinctFuelTypesWithCounts();

        // Then
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void findDistinctFuelTypesWithCounts_WithSoldListings_ShouldNotCountSoldListings() {
        // Given - Create approved but sold listings
        createTestListing("Car 1", gasolineFuelType, true, true, false);
        createTestListing("Car 2", gasolineFuelType, true, true, false);
        createTestListing("Car 3", dieselFuelType, true, true, false);

        // When
        List<Object[]> results = carListingRepository.findDistinctFuelTypesWithCounts();

        // Then
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void findDistinctFuelTypesWithCounts_WithArchivedListings_ShouldNotCountArchivedListings() {
        // Given - Create approved but archived listings
        createTestListing("Car 1", gasolineFuelType, true, false, true);
        createTestListing("Car 2", dieselFuelType, true, false, true);

        // When
        List<Object[]> results = carListingRepository.findDistinctFuelTypesWithCounts();

        // Then
        assertNotNull(results);
        assertTrue(results.isEmpty());
    }

    @Test
    void findDistinctFuelTypesWithCounts_WithNullFuelType_ShouldHandleGracefully() {
        // Given - Create listing with null fuel type
        createTestListing("Car 1", null, true, false, false);

        // When
        List<Object[]> results = carListingRepository.findDistinctFuelTypesWithCounts();

        // Then
        assertNotNull(results);
        // The query should handle null fuel types gracefully
        // The exact behavior depends on the database, but it shouldn't crash
    }

    @Test
    void countActiveListingsByUser_ShouldExcludeExpiredAndArchived() {
        // Given
        // 1. Active listing
        createTestListingWithStatus(testUser, true, false, false, false, null);

        // 2. Not approved (should be excluded)
        createTestListingWithStatus(testUser, false, false, false, false, null);

        // 3. Sold (should be excluded)
        createTestListingWithStatus(testUser, true, true, false, false, null);

        // 4. Archived (should be excluded)
        createTestListingWithStatus(testUser, true, false, true, false, null);

        // 5. Expired flag (should be excluded)
        createTestListingWithStatus(testUser, true, false, false, true, null);

        // 6. Expired by date (should be excluded)
        createTestListingWithStatus(testUser, true, false, false, false, LocalDateTime.now().minusDays(1));

        // 7. Active with future expiration (should be counted)
        createTestListingWithStatus(testUser, true, false, false, false, LocalDateTime.now().plusDays(30));

        // When
        long count = carListingRepository.countActiveListingsByUser(testUser);

        // Then
        assertEquals(2, count, "Should only count valid active listings");
    }

    private CarListing createTestListing(String title, FuelType fuelType, boolean approved, boolean sold,
            boolean archived) {
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
        listing.setSold(sold);
        listing.setArchived(archived);
        listing.setFuelType(fuelType);

        return entityManager.persistAndFlush(listing);
    }

    private void createTestListingWithStatus(User user, boolean approved, boolean sold,
            boolean archived, boolean expired, LocalDateTime expirationDate) {
        CarListing listing = new CarListing();
        listing.setTitle("Test Car");
        listing.setModel(testModel);
        listing.setModelYear(2022);
        listing.setMileage(5000);
        listing.setPrice(new BigDecimal("25000.00"));
        listing.setLocation(testLocation);
        listing.setGovernorate(testLocation.getGovernorate());
        listing.setDescription("Test description");
        listing.setSeller(user);
        listing.setApproved(approved);
        listing.setSold(sold);
        listing.setArchived(archived);
        listing.setExpired(expired);
        listing.setExpirationDate(expirationDate);
        listing.setFuelType(gasolineFuelType);

        entityManager.persistAndFlush(listing);
    }
}
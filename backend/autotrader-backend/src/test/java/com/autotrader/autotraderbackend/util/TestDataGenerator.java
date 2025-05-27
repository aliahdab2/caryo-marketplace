package com.autotrader.autotraderbackend.util;

import com.autotrader.autotraderbackend.model.CarBrand;
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.CarModel;
import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.repository.CarBrandRepository;
import com.autotrader.autotraderbackend.repository.CountryRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

/**
 * Utility class for generating test data
 */
public class TestDataGenerator {

    private static int brandCounter = 1;

    /**
     * Creates a test user with ROLE_USER
     * @param username Username for the test user
     * @param encodedPassword Encoded password for the test user
     * @return User entity
     */
    public static User createTestUser(String username, String encodedPassword) {
        User user = new User();
        // Do NOT set ID here; let JPA/Hibernate assign it
        user.setUsername(username);
        user.setEmail(username + "@example.com");
        user.setPassword(encodedPassword);
        Set<Role> roles = new HashSet<>();
        Role userRole = new Role();
        userRole.setName("ROLE_USER");
        roles.add(userRole);
        user.setRoles(roles);
        return user;
    }

    /**
     * Creates a test admin user with ROLE_ADMIN
     * @param username Username for the admin user
     * @param encodedPassword Encoded password for the admin user
     * @return User entity with admin role
     */
    public static User createTestAdminUser(String username, String encodedPassword) {
        User adminUser = createTestUser(username, encodedPassword);
        Role adminRole = new Role();
        adminRole.setName("ROLE_ADMIN");
        adminUser.getRoles().add(adminRole);
        return adminUser;
    }

    /**
     * Creates a test CarBrand with unique name and slug.
     * @return CarBrand entity.
     */
    public static CarBrand createTestCarBrand() {
        String uniqueSuffix = String.format("-%d", brandCounter++);
        CarBrand brand = new CarBrand();
        brand.setName("toyota" + uniqueSuffix);
        brand.setSlug("toyota" + uniqueSuffix);
        brand.setDisplayNameEn("Toyota" + uniqueSuffix);
        brand.setDisplayNameAr("تويوتا" + uniqueSuffix);
        brand.setIsActive(true);
        return brand;
    }

    /**
     * Creates a test CarModel.
     * @param brand The CarBrand for this model.
     * @return CarModel entity.
     */
    public static CarModel createTestCarModel(CarBrand brand) {
        CarModel model = new CarModel();
        // Do NOT set ID here; let JPA/Hibernate assign it
        model.setName("camry"); // Adding required name field
        model.setSlug("toyota-camry"); // Adding required slug field
        model.setDisplayNameEn("Camry");
        model.setDisplayNameAr("كامري");
        model.setBrand(brand);
        model.setIsActive(true);
        return model;
    }

    /**
     * Creates a test car listing
     * @param seller The user who is selling the car
     * @param carModel The CarModel for this listing
     * @param governorate The Governorate for this listing
     * @return CarListing entity
     */
    public static CarListing createTestListing(User seller, CarModel carModel, Governorate governorate) {
        CarListing listing = new CarListing();
        listing.setTitle("Test Car Listing");
        
        listing.setModel(carModel); // Set the CarModel relationship
        if (carModel != null && carModel.getBrand() != null) {
            listing.setBrandNameEn(carModel.getBrand().getDisplayNameEn());
            listing.setBrandNameAr(carModel.getBrand().getDisplayNameAr());
            listing.setModelNameEn(carModel.getDisplayNameEn());
            listing.setModelNameAr(carModel.getDisplayNameAr());
        }
        
        // Set the governorate relationship and names
        listing.setGovernorate(governorate);
        if (governorate != null) {
            listing.setGovernorateNameEn(governorate.getDisplayNameEn());
            listing.setGovernorateNameAr(governorate.getDisplayNameAr());
        }
        
        listing.setModelYear(2022);
        listing.setPrice(new BigDecimal("25000.00"));
        listing.setMileage(5000);
        listing.setDescription("This is a test car listing for integration tests.");
        listing.setSeller(seller);
        listing.setApproved(false);
        listing.setSold(false);
        listing.setArchived(false);
        listing.setCreatedAt(LocalDateTime.now());
        listing.setUpdatedAt(LocalDateTime.now());
        return listing;
    }
    
    /**
     * Creates a test governorate associated with the specified country
     * @param countryCode The country code to use
     * @return Governorate entity
     */
    public static Governorate createTestGovernorate(String countryCode) {
        Country country = TestGeographyUtils.createTestCountry(countryCode);
        return TestGeographyUtils.createTestGovernorate("Test Governorate", "محافظة الاختبار", country);
    }
    
    /**
     * Creates a test location associated with the specified governorate
     * @param governorate The governorate for this location
     * @return Location entity
     */
    public static Location createTestLocation(Governorate governorate) {
        return TestGeographyUtils.createTestLocation("Test Location", "موقع الاختبار", governorate);
    }
    
    /**
     * Creates a complete hierarchy of test location data (Country > Governorate > Location)
     * @param countryCode The country code to use
     * @return Location entity with associated governorate and country
     */
    public static Location createTestLocationWithHierarchy(String countryCode) {
        Country country = TestGeographyUtils.createTestCountry(countryCode);
        Governorate governorate = TestGeographyUtils.createTestGovernorate("Test Governorate", "محافظة الاختبار", country);
        return TestGeographyUtils.createTestLocation("Test Location", "موقع الاختبار", governorate);
    }
    
    /**
     * Creates a test country entity
     * @param countryCode ISO country code
     * @return Country entity
     */
    public static Country createTestCountry(String countryCode) {
        return TestGeographyUtils.createTestCountry(countryCode);
    }
    
    /**
     * Creates a test country for the given country code, checking if one already exists in the repository
     * @param countryCode ISO country code (e.g., "SY" for Syria)
     * @param countryRepository Repository to check for existing country
     * @return The existing or newly created country
     */
    public static Country createOrFindTestCountry(String countryCode, CountryRepository countryRepository) {
        Optional<Country> existingCountry = countryRepository.findByCountryCode(countryCode);
        if (existingCountry.isPresent()) {
            return existingCountry.get();
        } else {
            Country testCountry = TestGeographyUtils.createTestCountry(countryCode);
            return countryRepository.save(testCountry);
        }
    }
    
    /**
     * Creates a test governorate with the given country
     * @param nameEn English name of the governorate
     * @param nameAr Arabic name of the governorate 
     * @param country The country the governorate belongs to
     * @return A test governorate entity
     */
    public static Governorate createTestGovernorateWithCountry(String nameEn, String nameAr, Country country) {
        return TestGeographyUtils.createTestGovernorate(nameEn, nameAr, country);
    }

    /**
     * Creates or finds a test CarBrand with the given name and slug.
     * @param name The name of the CarBrand.
     * @param slug The slug of the CarBrand.
     * @return CarBrand entity.
     */
    public static CarBrand createOrFindTestCarBrand(String name, String slug, CarBrandRepository carBrandRepository) {
        Optional<CarBrand> existingBrand = carBrandRepository.findBySlug(slug);
        if (existingBrand.isPresent()) {
            return existingBrand.get();
        } else {
            CarBrand newBrand = new CarBrand();
            newBrand.setName(name);
            newBrand.setSlug(slug);
            newBrand.setDisplayNameEn(name);
            newBrand.setDisplayNameAr(name);
            newBrand.setIsActive(true);
            return carBrandRepository.save(newBrand);
        }
    }
    
    /**
     * Creates a test car brand for the given slug, checking if one already exists in the repository
     * @param slug The slug for the car brand (e.g., "test-brand")
     * @param carBrandRepository Repository to check for existing car brand
     * @return The existing or newly created car brand
     */
    public static CarBrand createOrFindTestCarBrand(String slug, CarBrandRepository carBrandRepository) {
        Optional<CarBrand> existingBrand = carBrandRepository.findBySlug(slug);
        if (existingBrand.isPresent()) {
            return existingBrand.get();
        } else {
            CarBrand testBrand = new CarBrand();
            testBrand.setName(slug);
            testBrand.setSlug(slug);
            testBrand.setDisplayNameEn(slug.substring(0, 1).toUpperCase() + slug.substring(1).replace("-", " "));
            testBrand.setDisplayNameAr("علامة تجارية اختبار");
            testBrand.setIsActive(true);
            return carBrandRepository.save(testBrand);
        }
    }
}

package com.autotrader.autotraderbackend.model;

import com.autotrader.autotraderbackend.repository.ListingMediaRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.FavoriteRepository;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.CarBrandRepository; // Added
import com.autotrader.autotraderbackend.repository.CarModelRepository; // Added
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.Attribute;
import jakarta.persistence.metamodel.EntityType;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * This test validates that the JPA entity mappings match the expected database schema.
 * It's important to run this test to ensure that the JPA entities are correctly mapping
 * to the database tables and that any schema changes are reflected in the application.
 * 
 * The test cases cover:
 * 1. Entity-to-table mappings validation
 * 2. Attribute presence and naming verification
 * 3. Relationship mappings (OneToMany, ManyToOne, etc.)
 * 4. Full CRUD operations testing for each entity
 * 5. Validation of bidirectional relationship behavior
 */
import org.springframework.transaction.annotation.Transactional;

@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
public class SchemaValidationTest {

    @Autowired
    private TestEntityManager testEntityManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    @Autowired
    private CarListingRepository carListingRepository;

    @Autowired
    private CarBrandRepository carBrandRepository; // Added

    @Autowired
    private CarModelRepository carModelRepository; // Added

    // Repositories for the relevant entities
    @Autowired 
    private ListingMediaRepository listingMediaRepository;

    // Helper method to check if an entity has a specific attribute
    private <T> boolean hasAttribute(EntityType<T> entityType, String attributeName) {
        try {
            entityType.getAttribute(attributeName);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    // Helper method to find or create a role
    private Role findOrCreateRole(String roleName) {
        return roleRepository.findByName(roleName)
                .orElseGet(() -> roleRepository.save(new Role(roleName)));
    }

    // Helper method to find or create a location
    private Location findOrCreateLocation(String slug, String displayNameEn, String displayNameAr, String countryCode, String region, double latitude, double longitude, boolean isActive) {
        return locationRepository.findBySlug(slug)
                .orElseGet(() -> {
                    Location newLocation = new Location();
                    newLocation.setSlug(slug);
                    newLocation.setDisplayNameEn(displayNameEn);
                    newLocation.setDisplayNameAr(displayNameAr);
                    newLocation.setCountryCode(countryCode);
                    newLocation.setRegion(region);
                    newLocation.setLatitude(latitude);
                    newLocation.setLongitude(longitude);
                    newLocation.setIsActive(isActive);
                    return locationRepository.save(newLocation);
                });
    }

    @Test
    public void testUserEntityMapping() {
        EntityManager entityManager = testEntityManager.getEntityManager();
        EntityType<User> userEntity = entityManager.getMetamodel().entity(User.class);
        
        // Get the actual table name from Hibernate metadata
        String actualTableName = userEntity.getJavaType().getAnnotation(jakarta.persistence.Table.class).name();
        assertEquals("users", actualTableName);
        
        // Verify key attributes
        assertTrue(hasAttribute(userEntity, "id"));
        assertTrue(hasAttribute(userEntity, "username"));
        assertTrue(hasAttribute(userEntity, "email"));
        assertTrue(hasAttribute(userEntity, "password"));
        assertTrue(hasAttribute(userEntity, "createdAt"));
        assertTrue(hasAttribute(userEntity, "updatedAt"));
        assertTrue(hasAttribute(userEntity, "roles"));
        
        // Verify JoinTable for many-to-many relationship with roles
        User user = new User("testuser", "test@example.com", "password");
        Role role = findOrCreateRole("ROLE_USER"); // Use helper method
        
        // Create a set of roles and add the role to it
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        
        // Save the user
        User savedUser = userRepository.save(user);
        
        // Clear the persistence context to ensure we\'re getting fresh data
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Retrieve the user and check if the role is associated
        User retrievedUser = userRepository.findById(savedUser.getId()).orElse(null);
        assertNotNull(retrievedUser);
        assertEquals(1, retrievedUser.getRoles().size());
        assertEquals("ROLE_USER", retrievedUser.getRoles().iterator().next().getName());
    }
    
    @Test
    public void testRoleEntityMapping() {
        EntityManager entityManager = testEntityManager.getEntityManager();
        EntityType<Role> roleEntity = entityManager.getMetamodel().entity(Role.class);
        
        // Get the actual table name from Hibernate metadata
        String actualTableName = roleEntity.getJavaType().getAnnotation(jakarta.persistence.Table.class).name();
        assertEquals("roles", actualTableName);
        
        // Verify key attributes
        assertTrue(hasAttribute(roleEntity, "id"));
        assertTrue(hasAttribute(roleEntity, "name"));
        
        // Verify role record creation and retrieval
        findOrCreateRole("ROLE_ADMIN"); // Use helper method, no need to assign to unused variable
        
        testEntityManager.flush();
        testEntityManager.clear();
        
        Role retrievedRole = roleRepository.findByName("ROLE_ADMIN").orElse(null); // Find by name
        assertNotNull(retrievedRole);
        assertEquals("ROLE_ADMIN", retrievedRole.getName());
    }
    
    @Test
    public void testUserRolesRelationship() {
        // Create user and roles
        User user = new User("relationuser", "relation@example.com", "password");
        Role userRole = findOrCreateRole("ROLE_USER"); // Use helper method
        Role adminRole = findOrCreateRole("ROLE_MODERATOR"); // Use helper method
        
        // Assign both roles to user
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        roles.add(adminRole);
        user.setRoles(roles);
        
        // Save user with roles
        User savedUser = userRepository.save(user);
        
        // Clear persistence context
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Verify that the user has both roles
        User retrievedUser = userRepository.findById(savedUser.getId()).orElse(null);
        assertNotNull(retrievedUser);
        assertEquals(2, retrievedUser.getRoles().size());
        
        // Verify role names
        Set<String> roleNames = new HashSet<>();
        retrievedUser.getRoles().forEach(retrievedRole -> roleNames.add(retrievedRole.getName()));
        
        assertTrue(roleNames.contains("ROLE_USER"));
        assertTrue(roleNames.contains("ROLE_MODERATOR"));
    }
    
    @Test
    public void testLocationEntityMapping() {
        EntityManager entityManager = testEntityManager.getEntityManager();
        EntityType<Location> locationEntity = entityManager.getMetamodel().entity(Location.class);
        
        // Get the actual table name from Hibernate metadata
        String actualTableName = locationEntity.getJavaType().getAnnotation(jakarta.persistence.Table.class).name();
        assertEquals("locations", actualTableName);
        
        // Verify key attributes based on the database schema
        assertTrue(hasAttribute(locationEntity, "id"));
        assertTrue(hasAttribute(locationEntity, "displayNameEn"));
        assertTrue(hasAttribute(locationEntity, "displayNameAr"));
        assertTrue(hasAttribute(locationEntity, "slug"));
        assertTrue(hasAttribute(locationEntity, "countryCode"));
        assertTrue(hasAttribute(locationEntity, "region"));
        assertTrue(hasAttribute(locationEntity, "latitude"));
        assertTrue(hasAttribute(locationEntity, "longitude"));
        assertTrue(hasAttribute(locationEntity, "isActive"));
        
        // Verify Location record creation and retrieval using findOrCreateLocation
        findOrCreateLocation("damascus", "Damascus", "دمشق", "SY", "Central Syria", 33.5138, 36.2765, true);
        
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Retrieve the location and verify its properties
        Location retrievedLocation = locationRepository.findBySlug("damascus").orElse(null);
        assertNotNull(retrievedLocation);
        assertEquals("Damascus", retrievedLocation.getDisplayNameEn());
        assertEquals("دمشق", retrievedLocation.getDisplayNameAr());
        assertEquals("damascus", retrievedLocation.getSlug());
        assertEquals("SY", retrievedLocation.getCountryCode());
        assertEquals("Central Syria", retrievedLocation.getRegion());
        assertEquals(33.5138, retrievedLocation.getLatitude());
        assertEquals(36.2765, retrievedLocation.getLongitude());
        assertTrue(retrievedLocation.getIsActive());
        
        // Test the getLocalizedName method
        assertEquals("Damascus", retrievedLocation.getLocalizedName(false)); // English
        assertEquals("دمشق", retrievedLocation.getLocalizedName(true));     // Arabic
    }
    
    @Test
    public void testCarListingEntityMapping() {
        EntityManager entityManager = testEntityManager.getEntityManager();
        EntityType<CarListing> carListingEntity = entityManager.getMetamodel().entity(CarListing.class);
        
        // Get the actual table name from Hibernate metadata
        String actualTableName = carListingEntity.getJavaType().getAnnotation(jakarta.persistence.Table.class).name();
        assertEquals("car_listings", actualTableName);
        
        // Verify key attributes from the car_listings table in the schema
        assertTrue(hasAttribute(carListingEntity, "id"));
        assertTrue(hasAttribute(carListingEntity, "title"));
        assertTrue(hasAttribute(carListingEntity, "description"));
        assertTrue(hasAttribute(carListingEntity, "price"));
        assertTrue(hasAttribute(carListingEntity, "mileage"));
        assertTrue(hasAttribute(carListingEntity, "modelYear"));
        assertTrue(hasAttribute(carListingEntity, "model")); // Updated: now refers to CarModel entity
        assertTrue(hasAttribute(carListingEntity, "brandNameEn")); // Added: denormalized field
        assertTrue(hasAttribute(carListingEntity, "brandNameAr")); // Added: denormalized field
        assertTrue(hasAttribute(carListingEntity, "modelNameEn")); // Added: denormalized field
        assertTrue(hasAttribute(carListingEntity, "modelNameAr")); // Added: denormalized field
        assertTrue(hasAttribute(carListingEntity, "seller"));
        assertTrue(hasAttribute(carListingEntity, "approved"));
        assertTrue(hasAttribute(carListingEntity, "sold"));
        assertTrue(hasAttribute(carListingEntity, "archived"));
        assertTrue(hasAttribute(carListingEntity, "createdAt"));
        assertTrue(hasAttribute(carListingEntity, "updatedAt"));
        
        // Verify the relationship with Location (updated name)
        assertTrue(hasAttribute(carListingEntity, "location"));
        
        // Verify relationship with Location
        Attribute<? super CarListing, ?> locationAttribute = carListingEntity.getAttribute("location");
        assertNotNull(locationAttribute);
        assertTrue(jakarta.persistence.metamodel.SingularAttribute.class.isAssignableFrom(locationAttribute.getClass()));
        
        // Verify relationship with ListingMedia
        assertTrue(hasAttribute(carListingEntity, "media"));
        Attribute<? super CarListing, ?> mediaAttribute = carListingEntity.getAttribute("media");
        assertNotNull(mediaAttribute);
        assertTrue(jakarta.persistence.metamodel.PluralAttribute.class.isAssignableFrom(mediaAttribute.getClass()));
    }
    
    @Test
    public void testListingMediaEntityMapping() {
        EntityManager entityManager = testEntityManager.getEntityManager();
        EntityType<ListingMedia> listingMediaEntity = entityManager.getMetamodel().entity(ListingMedia.class);
        
        // Get the actual table name from Hibernate metadata
        String actualTableName = listingMediaEntity.getJavaType().getAnnotation(jakarta.persistence.Table.class).name();
        assertEquals("listing_media", actualTableName);
        
        // Verify key attributes based on the database schema
        assertTrue(hasAttribute(listingMediaEntity, "id"));
        assertTrue(hasAttribute(listingMediaEntity, "listingId"));
        assertTrue(hasAttribute(listingMediaEntity, "fileKey"));
        assertTrue(hasAttribute(listingMediaEntity, "fileName"));
        assertTrue(hasAttribute(listingMediaEntity, "contentType"));
        assertTrue(hasAttribute(listingMediaEntity, "size"));
        assertTrue(hasAttribute(listingMediaEntity, "sortOrder"));
        assertTrue(hasAttribute(listingMediaEntity, "isPrimary"));
        assertTrue(hasAttribute(listingMediaEntity, "mediaType"));
        assertTrue(hasAttribute(listingMediaEntity, "createdAt"));
        
        // Verify relationship with CarListing
        assertTrue(hasAttribute(listingMediaEntity, "carListing"));
        Attribute<? super ListingMedia, ?> carListingAttribute = listingMediaEntity.getAttribute("carListing");
        assertNotNull(carListingAttribute);
        assertTrue(jakarta.persistence.metamodel.SingularAttribute.class.isAssignableFrom(carListingAttribute.getClass()));
    }
    
    @Test
    public void testCarListingAndMediaRelationship() {
        // Create a user as the seller
        User seller = new User("mediaseller", "mediaseller@example.com", "password123");
        userRepository.save(seller);

        // Create CarBrand and CarModel
        CarBrand testBrand = new CarBrand();
        testBrand.setName("Toyota");
        testBrand.setDisplayNameEn("Toyota");
        testBrand.setDisplayNameAr("تويوتا");
        testBrand.setSlug("toyota-media-test");
        carBrandRepository.save(testBrand);

        CarModel testModel = new CarModel();
        testModel.setName("Camry");
        testModel.setDisplayNameEn("Camry");
        testModel.setDisplayNameAr("كامري");
        testModel.setBrand(testBrand);
        testModel.setSlug("camry-media-test");
        carModelRepository.save(testModel);
        
        // Create a car listing
        CarListing carListing = new CarListing();
        carListing.setTitle("Test Car with Media");
        carListing.setDescription("A car listing to test media relationship");
        carListing.setModel(testModel);
        carListing.setBrandNameEn(testBrand.getDisplayNameEn());
        carListing.setBrandNameAr(testBrand.getDisplayNameAr());
        carListing.setModelNameEn(testModel.getDisplayNameEn());
        carListing.setModelNameAr(testModel.getDisplayNameAr());
        carListing.setModelYear(2020);
        carListing.setMileage(15000);
        carListing.setPrice(new java.math.BigDecimal("25000.00"));
        carListing.setSeller(seller);
        
        // Save the car listing
        testEntityManager.persist(carListing);
        testEntityManager.flush();
        
        // Create and add media items to the car listing
        ListingMedia primaryImage = new ListingMedia();
        primaryImage.setCarListing(carListing);
        primaryImage.setFileKey("primary-image-key");
        primaryImage.setFileName("primary.jpg");
        primaryImage.setContentType("image/jpeg");
        primaryImage.setSize(1024L);
        primaryImage.setSortOrder(0);
        primaryImage.setIsPrimary(true);
        primaryImage.setMediaType("image");
        
        ListingMedia secondaryImage = new ListingMedia();
        secondaryImage.setCarListing(carListing);
        secondaryImage.setFileKey("secondary-image-key");
        secondaryImage.setFileName("secondary.jpg");
        secondaryImage.setContentType("image/jpeg");
        secondaryImage.setSize(2048L);
        secondaryImage.setSortOrder(1);
        secondaryImage.setIsPrimary(false);
        secondaryImage.setMediaType("image");
        
        // Add the media to the car listing using helper method
        carListing.addMedia(primaryImage);
        carListing.addMedia(secondaryImage);
        
        // Save the car listing with media
        testEntityManager.persist(carListing);
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Retrieve the car listing and verify the media relationship
        CarListing retrievedListing = testEntityManager.find(CarListing.class, carListing.getId());
        assertNotNull(retrievedListing);
        assertNotNull(retrievedListing.getMedia());
        assertEquals(2, retrievedListing.getMedia().size());
        
        // Ensure getPrimaryMedia is used correctly
        ListingMedia primaryMedia = retrievedListing.getPrimaryMedia();
        assertNotNull(primaryMedia);
        assertEquals("primary-image-key", primaryMedia.getFileKey());
        
        // Verify we can retrieve media via the repository as well
        java.util.List<ListingMedia> mediaList = listingMediaRepository.findByListingIdOrderBySortOrderAsc(retrievedListing.getId());
        assertEquals(2, mediaList.size());
        assertEquals(0, mediaList.get(0).getSortOrder());
        assertEquals(1, mediaList.get(1).getSortOrder());
        
        java.util.List<ListingMedia> primaryMediaList = listingMediaRepository.findByListingIdAndIsPrimaryTrue(retrievedListing.getId());
        assertEquals(1, primaryMediaList.size());
        assertTrue(primaryMediaList.get(0).getIsPrimary());
        assertEquals("primary-image-key", primaryMediaList.get(0).getFileKey());
        
        // Test removing media
        retrievedListing.removeMedia(retrievedListing.getMedia().get(0));
        testEntityManager.persist(retrievedListing);
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Verify the media was removed
        CarListing updatedListing = testEntityManager.find(CarListing.class, carListing.getId());
        assertEquals(1, updatedListing.getMedia().size());
        assertEquals("secondary-image-key", updatedListing.getMedia().get(0).getFileKey());
    }
    
    @Test
    public void testLocationRepository() {
        // Use findOrCreateLocation to ensure no duplicates
        findOrCreateLocation("test-city", "Test City", "مدينة اختبار", "SY", "Test Region", 33.5138, 36.2765, true);

        Optional<Location> foundOptional = locationRepository.findBySlug("test-city");
        assertThat(foundOptional).isPresent();
        Location found = foundOptional.get();
        assertThat(found.getDisplayNameEn()).isEqualTo("Test City");
        assertThat(found.getDisplayNameAr()).isEqualTo("مدينة اختبار");
        assertThat(found.getCountryCode()).isEqualTo("SY");
    }

    @Test
    public void testFavoriteEntityMapping() {
        EntityManager entityManager = testEntityManager.getEntityManager();
        EntityType<Favorite> favoriteEntity = entityManager.getMetamodel().entity(Favorite.class);

        // Verify table name
        String actualTableName = favoriteEntity.getJavaType().getAnnotation(jakarta.persistence.Table.class).name();
        assertEquals("favorites", actualTableName);

        // Verify key attributes
        assertTrue(hasAttribute(favoriteEntity, "id"));
        assertTrue(hasAttribute(favoriteEntity, "user"));
        assertTrue(hasAttribute(favoriteEntity, "carListing"));
        assertTrue(hasAttribute(favoriteEntity, "createdAt"));

        // Create a User
        User user = new User("favuser", "favuser@example.com", "password");
        userRepository.save(user); // Ensure user is persisted

        // Create CarBrand and CarModel for the CarListing
        CarBrand favTestBrand = new CarBrand();
        favTestBrand.setName("TestBrandFav");
        favTestBrand.setDisplayNameEn("Test Brand Fav");
        favTestBrand.setDisplayNameAr("العلامة التجارية المفضلة للاختبار");
        favTestBrand.setSlug("test-brand-fav");
        carBrandRepository.save(favTestBrand);

        CarModel favTestModel = new CarModel();
        favTestModel.setName("TestModelFav");
        favTestModel.setDisplayNameEn("Test Model Fav");
        favTestModel.setDisplayNameAr("نموذج الاختبار المفضل");
        favTestModel.setBrand(favTestBrand);
        favTestModel.setSlug("test-model-fav");
        carModelRepository.save(favTestModel);

        // Create a CarListing
        CarListing carListing = new CarListing();
        carListing.setTitle("Favorite Test Car");
        carListing.setModel(favTestModel);
        carListing.setBrandNameEn(favTestBrand.getDisplayNameEn());
        carListing.setBrandNameAr(favTestBrand.getDisplayNameAr());
        carListing.setModelNameEn(favTestModel.getDisplayNameEn());
        carListing.setModelNameAr(favTestModel.getDisplayNameAr());
        carListing.setModelYear(2023);
        carListing.setPrice(new java.math.BigDecimal("10000"));
        carListing.setDescription("A test description for the favorite car listing."); // Added description
        carListing.setMileage(10000); // Added mileage
        carListing.setSeller(user); // Assuming seller is the same user for simplicity
        carListingRepository.save(carListing); // Ensure carListing is persisted

        // Create a Favorite
        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setCarListing(carListing);

        Favorite savedFavorite = favoriteRepository.save(favorite);
        testEntityManager.flush();
        testEntityManager.clear();

        // Retrieve and verify
        Favorite retrievedFavorite = favoriteRepository.findById(savedFavorite.getId()).orElse(null);
        assertNotNull(retrievedFavorite);
        assertNotNull(retrievedFavorite.getUser());
        assertEquals(user.getId(), retrievedFavorite.getUser().getId());
        assertNotNull(retrievedFavorite.getCarListing());
        assertEquals(carListing.getId(), retrievedFavorite.getCarListing().getId());
        assertNotNull(retrievedFavorite.getCreatedAt());
    }

    // Add more tests for other entities if needed
}

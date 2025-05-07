package com.autotrader.autotraderbackend.model;

import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.repository.RoleRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import jakarta.persistence.EntityManager;
import jakarta.persistence.metamodel.EntityType;
import jakarta.persistence.metamodel.Attribute;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * This test validates that the JPA entity mappings match the expected database schema.
 * It's important to run this test to ensure that the JPA entities are correctly mapping
 * to the database tables and that any schema changes are reflected in the application.
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class SchemaValidationTest {

    @Autowired
    private TestEntityManager testEntityManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
    
    @Autowired
    private LocationRepository locationRepository;

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
        Role role = new Role("ROLE_USER");
        
        // Save the role first
        roleRepository.save(role);
        
        // Create a set of roles and add the role to it
        Set<Role> roles = new HashSet<>();
        roles.add(role);
        user.setRoles(roles);
        
        // Save the user
        User savedUser = userRepository.save(user);
        
        // Clear the persistence context to ensure we're getting fresh data
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
        Role role = new Role("ROLE_ADMIN");
        Role savedRole = roleRepository.save(role);
        
        testEntityManager.flush();
        testEntityManager.clear();
        
        Role retrievedRole = roleRepository.findById(savedRole.getId()).orElse(null);
        assertNotNull(retrievedRole);
        assertEquals("ROLE_ADMIN", retrievedRole.getName());
    }
    
    @Test
    public void testUserRolesRelationship() {
        // Create user and roles
        User user = new User("relationuser", "relation@example.com", "password");
        Role userRole = new Role("ROLE_USER");
        Role adminRole = new Role("ROLE_MODERATOR");
        
        // Save roles first
        roleRepository.save(userRole);
        roleRepository.save(adminRole);
        
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
        retrievedUser.getRoles().forEach(role -> roleNames.add(role.getName()));
        
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
        
        // Verify Location record creation and retrieval
        Location location = new Location();
        location.setDisplayNameEn("Damascus");
        location.setDisplayNameAr("دمشق");
        location.setSlug("damascus");
        location.setCountryCode("SY");
        location.setRegion("Central Syria");
        location.setLatitude(33.5138);
        location.setLongitude(36.2765);
        location.setIsActive(true);
        
        Location savedLocation = locationRepository.save(location);
        
        testEntityManager.flush();
        testEntityManager.clear();
        
        // Retrieve the location and verify its properties
        Location retrievedLocation = locationRepository.findById(savedLocation.getId()).orElse(null);
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
    
    /**
     * Helper method to check if an entity has a specific attribute
     */
    private <T> boolean hasAttribute(EntityType<T> entityType, String attributeName) {
        try {
            Attribute<? super T, ?> attribute = entityType.getAttribute(attributeName);
            return attribute != null;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
}

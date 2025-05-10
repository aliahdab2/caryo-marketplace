package com.autotrader.autotraderbackend.util;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.Role;
import com.autotrader.autotraderbackend.model.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Utility class for generating test data
 */
public class TestDataGenerator {

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
     * Creates a test car listing
     * @param seller The user who is selling the car
     * @return CarListing entity
     */
    public static CarListing createTestListing(User seller) {
        CarListing listing = new CarListing();
        listing.setTitle("Test Car Listing");
        listing.setBrand("Toyota");
        listing.setModel("Camry");
        listing.setModelYear(2022);
        listing.setPrice(new BigDecimal("25000.00"));
        listing.setMileage(5000);
        listing.setDescription("This is a test car listing for integration tests.");
        listing.setSeller(seller);
        listing.setApproved(false);
        listing.setSold(false);
        listing.setArchived(false);
        listing.setCreatedAt(LocalDateTime.now());
        return listing;
    }
}

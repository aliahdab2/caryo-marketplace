package com.caryo.marketplace.util;

import com.caryo.marketplace.model.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Utility class for creating properly configured test entities.
 * This ensures that all required fields and constraints are satisfied.
 */
public class TestDataBuilder {

    /**
     * Creates a minimal but valid CarListing for testing purposes.
     * Includes all required fields to satisfy database constraints.
     * Note: This method creates the entities but does NOT persist them.
     * You must persist the dependencies (Country, Governorate, CarBrand, CarModel) first.
     */
    public static CarListing createValidCarListing(User seller) {
        CarListing listing = new CarListing();
        listing.setTitle("Test Car");
        listing.setDescription("A test car listing for testing purposes");
        listing.setModelYear(2020);
        listing.setMileage(50000);
        listing.setPrice(BigDecimal.valueOf(25000));
        listing.setCurrency("USD");
        listing.setSeller(seller);

        // Set required fields
        listing.setGovernorate(createTestGovernorate());
        listing.setModel(createTestCarModel());

        return listing;
    }

    /**
     * Creates a minimal but valid User for testing purposes.
     */
    public static User createValidUser(String username, String email) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword("password");
        return user;
    }

    /**
     * Creates a minimal but valid Country for testing purposes.
     */
    public static Country createTestCountry() {
        Country country = new Country();
        country.setCountryCode("SY");
        country.setDisplayNameEn("Syria");
        country.setDisplayNameAr("سوريا");
        country.setIsActive(true);
        country.setCreatedAt(Instant.now());
        country.setUpdatedAt(Instant.now());
        return country;
    }

    /**
     * Creates a minimal but valid Governorate for testing purposes.
     * Note: Does not set the Country relationship - set it after persistence.
     */
    public static Governorate createTestGovernorate() {
        Governorate governorate = new Governorate();
        governorate.setDisplayNameEn("Test Governorate");
        governorate.setDisplayNameAr("محافظة تجريبية");
        governorate.setSlug("test-governorate");
        governorate.setIsActive(true);
        governorate.setCreatedAt(Instant.now());
        governorate.setUpdatedAt(Instant.now());
        return governorate;
    }

    /**
     * Creates a minimal but valid CarModel for testing purposes.
     * Note: Does not set the Brand relationship - set it after persistence.
     */
    public static CarModel createTestCarModel() {
        CarModel model = new CarModel();
        model.setName("Test Model");
        model.setSlug("test-model");
        model.setDisplayNameEn("Test Model");
        model.setDisplayNameAr("موديل تجريبي");
        model.setIsActive(true);
        return model;
    }

    /**
     * Creates a minimal but valid CarBrand for testing purposes.
     */
    public static CarBrand createTestCarBrand() {
        CarBrand brand = new CarBrand();
        brand.setName("Test Brand");
        brand.setDisplayNameEn("Test Brand");
        brand.setDisplayNameAr("ماركة تجريبية");
        brand.setSlug("test-brand");
        brand.setIsActive(true);
        return brand;
    }

    /**
     * Creates a minimal but valid Conversation for testing purposes.
     */
    public static Conversation createValidConversation(CarListing listing, User buyer, User seller) {
        return Conversation.builder()
                .listing(listing)
                .buyer(buyer)
                .seller(seller)
                .status(ConversationStatus.ACTIVE)
                .lastMessageAt(LocalDateTime.now())
                .build();
    }

    /**
     * Creates a minimal but valid Message for testing purposes.
     */
    public static Message createValidMessage(Conversation conversation, User sender, String content) {
        return Message.builder()
                .conversation(conversation)
                .sender(sender)
                .content(content)
                .messageType(MessageType.TEXT)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();
    }

    /**
     * Creates a minimal but valid ConversationParticipant for testing purposes.
     */
    public static ConversationParticipant createValidParticipant(Conversation conversation, User user, ParticipantRole role) {
        return ConversationParticipant.builder()
                .conversation(conversation)
                .user(user)
                .role(role)
                .joinedAt(LocalDateTime.now())
                .build();
    }
}

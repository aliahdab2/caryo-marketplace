package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper;
import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.UpdateListingRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Service responsible for basic CRUD operations on car listings.
 * Handles creation, reading, updating, and deletion of listings.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CarListingCrudService {

    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final LocationRepository locationRepository;
    private final GovernorateRepository governorateRepository;
    private final CarListingMapper carListingMapper;
    private final CarModelService carModelService;
    private final TransmissionService transmissionService;
    private final FuelTypeService fuelTypeService;
    private final BodyStyleService bodyStyleService;
    private final SavedSearchService savedSearchService;

    /**
     * Check if user can create listings (email verified and account active).
     */
    public boolean canUserCreateListings(String username) {
        try {
            User user = findUserByUsername(username);
            return user.canCreateListings();
        } catch (Exception e) {
            log.warn("Error checking listing permissions for user {}: {}", username, e.getMessage());
            return false;
        }
    }

    /**
     * Create a new car listing without media (internal use).
     */
    @Transactional
    public CarListingResponse createListingInternal(CreateListingRequest request, String username) {
        Objects.requireNonNull(request, "CreateListingRequest cannot be null");
        if (StringUtils.isBlank(username)) {
            throw new IllegalArgumentException("Username cannot be blank");
        }
        log.info("Creating listing for user: {}", username);

        User user = findUserByUsername(username);

        // Enforce verified email and active account status at service layer (defense in depth)
        if (!user.isEmailVerified() || !user.isActive()) {
            log.warn("User {} attempted to create listing without verified/active account (verified={}, active={})",
                    username, user.isEmailVerified(), user.isActive());
            throw new SecurityException("Email verification required to create listings. Please verify your account.");
        }

        CarListing carListing = buildCarListingFromRequest(request, user);
        CarListing savedListing = carListingRepository.save(carListing);

        log.info("Successfully created listing with ID: {} for user: {}", savedListing.getId(), username);

        return carListingMapper.toCarListingResponse(savedListing);
    }

    /**
     * Get car listing details by ID. Only returns approved listings.
     */
    @Transactional(readOnly = true)
    public CarListingResponse getListingById(Long id) {
        log.debug("Fetching approved listing details for ID: {}", id);
        CarListing carListing = carListingRepository.findByIdAndApprovedTrueWithMedia(id)
                .orElseThrow(() -> {
                    log.warn("Approved CarListing lookup failed for ID: {}", id);
                    return new ResourceNotFoundException("CarListing", "id", id);
                });
        return carListingMapper.toCarListingResponse(carListing);
    }

    /**
     * Get all listings for a user (approved or not).
     */
    @Transactional(readOnly = true)
    public List<CarListingResponse> getMyListings(String username) {
        log.debug("Fetching all listings for user: {}", username);
        User user = findUserByUsername(username);
        List<CarListing> listings = carListingRepository.findBySeller(user);
        log.info("Found {} listings for user: {}", listings.size(), username);
        return listings.stream()
                .map(carListingMapper::toCarListingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update an existing car listing.
     */
    @Transactional
    public CarListingResponse updateListing(Long id, UpdateListingRequest request, String username) {
        log.info("Attempting to update listing with ID: {} by user: {}", id, username);

        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", id));

        // Check if the user owns this listing or is an admin
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        boolean isOwner = existingListing.getSeller().getUsername().equals(username);
        boolean isAdmin = user.getRoles().stream()
                .anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));

        if (!isOwner && !isAdmin) {
            log.warn("User {} attempted to update listing {} owned by {}",
                    username, id, existingListing.getSeller().getUsername());
            throw new SecurityException("You are not authorized to update this listing");
        }

        if (isAdmin && !isOwner) {
            log.info("Admin {} updating listing {} owned by {}",
                    username, id, existingListing.getSeller().getUsername());
        }

        // Update only non-null fields
        if (request.getTitle() != null) {
            existingListing.setTitle(request.getTitle());
        }
        if (request.getModelId() != null) {
            CarModel carModel = carModelService.getModelById(request.getModelId());
            existingListing.setModel(carModel);
            existingListing.setBrandNameEn(carModel.getBrand().getDisplayNameEn());
            existingListing.setBrandNameAr(carModel.getBrand().getDisplayNameAr());
            existingListing.setModelNameEn(carModel.getDisplayNameEn());
            existingListing.setModelNameAr(carModel.getDisplayNameAr());
        }
        if (request.getModelYear() != null) {
            existingListing.setModelYear(request.getModelYear());
        }
        if (request.getPrice() != null) {
            existingListing.setPrice(request.getPrice());
        }
        if (request.getCurrency() != null) {
            existingListing.setCurrency(request.getCurrency());
        }
        if (request.getMileage() != null) {
            existingListing.setMileage(request.getMileage());
        }

        // Handle location updates
        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> {
                    log.warn("Location lookup failed for ID: {}", request.getLocationId());
                    return new ResourceNotFoundException("Location", "id", request.getLocationId());
                });
            existingListing.setLocation(location);

            Governorate governorate = location.getGovernorate();
            if (governorate != null) {
                existingListing.setGovernorate(governorate);
                existingListing.setGovernorateNameEn(governorate.getDisplayNameEn());
                existingListing.setGovernorateNameAr(governorate.getDisplayNameAr());
            } else {
                log.error("Location {} has no associated governorate during update.", location.getId());
                throw new IllegalStateException("Location must have an associated governorate for listing update.");
            }
        }

        if (request.getDescription() != null) {
            existingListing.setDescription(request.getDescription());
        }
        if (request.getTransmission() != null) {
            existingListing.setTransmission(request.getTransmission());
        }

        // Update isSold and isArchived if provided in the request
        if (request.getIsSold() != null) {
            existingListing.setSold(request.getIsSold());
        }
        if (request.getIsArchived() != null) {
            existingListing.setArchived(request.getIsArchived());
        }

        // Handle contact field updates
        boolean allContactFieldsNull = request.getContactName() == null &&
                                     request.getContactEmail() == null &&
                                     request.getContactPhone() == null &&
                                     request.getContactPreference() == null;

        if (allContactFieldsNull) {
            // Clear all contact fields to use seller fallbacks
            existingListing.setContactName(null);
            existingListing.setContactEmail(null);
            existingListing.setContactPhone(null);
            existingListing.setContactPreference(null);
        } else {
            // Update individual contact fields if provided
            if (request.getContactName() != null) {
                existingListing.setContactName(request.getContactName());
            }
            if (request.getContactEmail() != null) {
                existingListing.setContactEmail(request.getContactEmail());
            }
            if (request.getContactPhone() != null) {
                existingListing.setContactPhone(request.getContactPhone());
            }
            if (request.getContactPreference() != null) {
                existingListing.setContactPreference(request.getContactPreference());
            }
        }

        CarListing updatedListing = carListingRepository.save(existingListing);
        log.info("Successfully updated listing ID: {} by user: {}", id, username);

        return carListingMapper.toCarListingResponse(updatedListing);
    }

    /**
     * Delete a car listing.
     */
    @Transactional
    public void deleteListing(Long id, String username) {
        log.info("Attempting to delete listing with ID: {} by user: {}", id, username);

        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", id));

        // Check if the user owns this listing
        if (!existingListing.getSeller().getUsername().equals(username)) {
            log.warn("User {} attempted to delete listing {} owned by {}",
                    username, id, existingListing.getSeller().getUsername());
            throw new SecurityException("You are not authorized to delete this listing");
        }

        carListingRepository.delete(existingListing);
        log.info("Successfully deleted listing with ID: {}", id);
    }

    /**
     * Admin-only method to delete any car listing.
     */
    @Transactional
    public void deleteListingAsAdmin(Long id) {
        log.info("Admin attempting to delete listing with ID: {}", id);

        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", id));

        carListingRepository.delete(existingListing);
        log.info("Admin successfully deleted listing with ID: {}", id);
    }

    /**
     * Admin-only method to approve any car listing.
     */
    public CarListingResponse approveListingAsAdmin(Long id) {
        log.info("Admin attempting to approve listing with ID: {}", id);

        CarListing existingListing = carListingRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Admin approval failed - listing not found with ID: {}", id);
                    return new ResourceNotFoundException("CarListing", "id", id);
                });

        existingListing.setApproved(true);
        CarListing approvedListing = carListingRepository.save(existingListing);
        log.info("Admin successfully approved listing with ID: {}", id);

        return carListingMapper.toCarListingResponse(approvedListing);
    }

    /**
     * Admin-only method to get all car listings regardless of approval status.
     */
    public Page<CarListingResponse> getAllListingsAsAdmin(Pageable pageable) {
        log.info("Admin retrieving all listings with pagination: {}", pageable);

        Page<CarListing> listings = carListingRepository.findAll(pageable);
        log.info("Found {} total listings for admin", listings.getTotalElements());

        return listings.map(carListingMapper::toCarListingResponse);
    }

    // Helper methods

    private User findUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> {
                    log.warn("User lookup failed for username: {}", username);
                    return new ResourceNotFoundException("User", "username", username);
                });
    }

    private CarListing findListingById(Long listingId) {
        return carListingRepository.findById(listingId)
                .orElseThrow(() -> {
                    log.warn("CarListing lookup failed for ID: {}", listingId);
                    return new ResourceNotFoundException("CarListing", "id", listingId);
                });
    }

    private void authorizeListingModification(CarListing listing, User user, String action) {
        if (listing.getSeller() == null || !listing.getSeller().getId().equals(user.getId())) {
            log.warn("Authorization failed: User '{}' (ID: {}) attempted to {} listing ID {} owned by '{}' (ID: {})",
                     user.getUsername(), user.getId(), action, listing.getId(),
                     listing.getSeller() != null ? listing.getSeller().getUsername() : "unknown",
                     listing.getSeller() != null ? listing.getSeller().getId() : "unknown");
            throw new SecurityException("User does not have permission to modify this listing.");
        }
    }

    private CarListing buildCarListingFromRequest(CreateListingRequest request, User user) {
        CarListing carListing = new CarListing();
        carListing.setTitle(request.getTitle());

        CarModel carModel = carModelService.getModelById(request.getModelId());
        carListing.setModel(carModel);

        carListing.setModelYear(request.getModelYear());
        carListing.setPrice(request.getPrice());
        carListing.setCurrency(request.getCurrency() != null ? request.getCurrency() : "USD");
        carListing.setMileage(request.getMileage());
        carListing.setDescription(request.getDescription());

        // Set transmission, fuel type, and body style if provided
        if (request.getTransmissionId() != null) {
            Transmission transmission = transmissionService.getTransmissionById(request.getTransmissionId());
            carListing.setTransmissionType(transmission);
        }
        if (request.getFuelTypeId() != null) {
            FuelType fuelType = fuelTypeService.getFuelTypeById(request.getFuelTypeId());
            carListing.setFuelType(fuelType);
        }
        if (request.getBodyStyleId() != null) {
            BodyStyle bodyStyle = bodyStyleService.getBodyStyleById(request.getBodyStyleId());
            carListing.setBodyStyle(bodyStyle);
        }

        // Set denormalized fields from the CarModel and CarBrand entities
        carListing.setBrandNameEn(carModel.getBrand().getDisplayNameEn());
        carListing.setBrandNameAr(carModel.getBrand().getDisplayNameAr());
        carListing.setModelNameEn(carModel.getDisplayNameEn());
        carListing.setModelNameAr(carModel.getDisplayNameAr());

        // Handle location and governorate
        if (request.getLocationId() != null) {
            Location location = locationRepository.findById(request.getLocationId())
                .orElseThrow(() -> {
                    log.warn("Location lookup failed for ID: {}", request.getLocationId());
                    return new ResourceNotFoundException("Location", "id", request.getLocationId());
                });
            carListing.setLocation(location);

            Governorate governorate = location.getGovernorate();
            if (governorate != null) {
                carListing.setGovernorate(governorate);
                carListing.setGovernorateNameEn(governorate.getDisplayNameEn());
                carListing.setGovernorateNameAr(governorate.getDisplayNameAr());
            } else {
                log.error("Location {} has no associated governorate", location.getId());
                throw new IllegalStateException("Location must have an associated governorate");
            }
        } else {
            log.error("LocationId is required to create a car listing");
            throw new IllegalArgumentException("LocationId is required");
        }

        carListing.setSeller(user);
        carListing.setApproved(false);
        carListing.setSold(request.getIsSold() != null ? request.getIsSold() : false);
        carListing.setArchived(request.getIsArchived() != null ? request.getIsArchived() : false);

        // Handle contact fields with fallbacks
        if (StringUtils.isNotBlank(request.getContactName())) {
            carListing.setContactName(request.getContactName());
        } else {
            carListing.setContactName(user.getUsername());
        }

        if (StringUtils.isNotBlank(request.getContactEmail())) {
            carListing.setContactEmail(request.getContactEmail());
        } else {
            carListing.setContactEmail(user.getEmail());
        }

        if (StringUtils.isNotBlank(request.getContactPhone())) {
            carListing.setContactPhone(request.getContactPhone());
        }

        if (StringUtils.isNotBlank(request.getContactPreference())) {
            carListing.setContactPreference(request.getContactPreference());
        } else {
            carListing.setContactPreference("email");
        }

        return carListing;
    }
}

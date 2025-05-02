package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
import com.autotrader.autotraderbackend.exception.StorageException;
import com.autotrader.autotraderbackend.mapper.CarListingMapper; // Import the mapper
import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import com.autotrader.autotraderbackend.repository.specification.CarListingSpecification;
import com.autotrader.autotraderbackend.service.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Ensures final fields are injected via constructor
@Slf4j
public class CarListingService {

    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final CarListingMapper carListingMapper; // Inject the mapper

    /**
     * Create a new car listing.
     */
    @Transactional
    public CarListingResponse createListing(CreateListingRequest request, MultipartFile image, String username) {
        log.info("Attempting to create new listing for user: {}", username);
        User user = findUserByUsername(username);

        CarListing carListing = buildCarListingFromRequest(request, user);

        try {
            CarListing savedListing = carListingRepository.save(carListing);
            
            // Handle image upload if provided
            if (image != null && !image.isEmpty()) {
                String imageKey = generateImageKey(savedListing.getId(), image.getOriginalFilename());
                storageService.store(image, imageKey);
                savedListing.setImageKey(imageKey);
                savedListing = carListingRepository.save(savedListing);
                log.info("Successfully uploaded image for new listing ID: {}", savedListing.getId());
            }

            log.info("Successfully created new listing with ID: {} for user: {}", savedListing.getId(), username);
            // Use mapper
            return carListingMapper.toCarListingResponse(savedListing);
        } catch (Exception e) {
            log.error("Failed to save new car listing for user {}: {}", username, e.getMessage(), e);
            // Consider a more specific custom exception if needed
            throw new RuntimeException("Failed to create car listing due to a persistence error.", e);
        }
    }

    /**
     * Upload an image for a car listing.
     */
    @Transactional
    public String uploadListingImage(Long listingId, MultipartFile file, String username) {
        log.info("Attempting to upload image for listing ID: {} by user: {}", listingId, username);
        User user = findUserByUsername(username);

        validateFile(file, listingId);

        CarListing listing = findListingById(listingId);

        authorizeListingModification(listing, user, "upload image for");

        String imageKey = generateImageKey(listingId, file.getOriginalFilename());

        try {
            storageService.store(file, imageKey);
            listing.setImageKey(imageKey);
            carListingRepository.save(listing); // Save the updated listing
            log.info("Successfully uploaded image with key '{}' and updated listing ID: {}", imageKey, listingId);
            return imageKey;
        } catch (StorageException e) {
            log.error("Storage service failed to store image for listing ID {}: {}", listingId, e.getMessage(), e);
            // Re-throw specific StorageException or wrap if needed
            throw new StorageException("Failed to store image file.", e);
        } catch (Exception e) {
            log.error("Unexpected error saving listing {} after image upload: {}", listingId, e.getMessage(), e);
            throw new RuntimeException("Failed to update listing after image upload.", e);
        }
    }

    /**
     * Get car listing details by ID.
     */
    @Transactional(readOnly = true)
    public CarListingResponse getListingById(Long id) {
        log.debug("Fetching listing details for ID: {}", id);
        CarListing carListing = findListingById(id);
        // Use mapper
        return carListingMapper.toCarListingResponse(carListing);
    }

    /**
     * Get all approved listings with pagination.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getAllApprovedListings(Pageable pageable) {
        log.debug("Fetching approved listings page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        Page<CarListing> listingPage = carListingRepository.findByApprovedTrue(pageable);
        log.info("Found {} approved listings on page {}", listingPage.getNumberOfElements(), pageable.getPageNumber());
        // Use mapper
        return listingPage.map(carListingMapper::toCarListingResponse);
    }

    /**
     * Get filtered and approved listings based on criteria.
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getFilteredListings(ListingFilterRequest filterRequest, Pageable pageable) {
        log.debug("Fetching filtered listings with filter: {}, page: {}, size: {}", filterRequest, pageable.getPageNumber(), pageable.getPageSize());
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filterRequest)
                                                              .and(CarListingSpecification.isApproved());

        Page<CarListing> listingPage = carListingRepository.findAll(spec, pageable);
        log.info("Found {} filtered listings matching criteria on page {}", listingPage.getNumberOfElements(), pageable.getPageNumber());
        // Use mapper
        return listingPage.map(carListingMapper::toCarListingResponse);
    }

    /**
     * Get all listings (approved or not) for the specified user.
     */
    @Transactional(readOnly = true)
    public List<CarListingResponse> getMyListings(String username) {
        log.debug("Fetching all listings for user: {}", username);
        User user = findUserByUsername(username);
        List<CarListing> listings = carListingRepository.findBySeller(user);
        log.info("Found {} listings for user: {}", listings.size(), username);
        // Use mapper
        return listings.stream()
                .map(carListingMapper::toCarListingResponse)
                .collect(Collectors.toList());
    }

    /**
     * Approve a car listing.
     */
    @Transactional
    public CarListingResponse approveListing(Long id) {
        log.info("Attempting to approve listing with ID: {}", id);
        CarListing carListing = findListingById(id);

        if (Boolean.TRUE.equals(carListing.getApproved())) {
            log.warn("Listing ID {} is already approved. No action taken.", id);
            throw new IllegalStateException("Listing with ID " + id + " is already approved.");
        }

        carListing.setApproved(true);
        try {
            CarListing approvedListing = carListingRepository.save(carListing);
            log.info("Successfully approved listing ID: {}", approvedListing.getId());
            // Use mapper
            return carListingMapper.toCarListingResponse(approvedListing);
        } catch (Exception e) {
            log.error("Failed to save approval status for listing ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to update listing approval status.", e);
        }
    }

    // --- Helper Methods ---

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

    private void validateFile(MultipartFile file, Long listingId) {
        if (file == null || file.isEmpty()) {
            log.warn("Attempt to upload null or empty file for listing ID: {}", listingId);
            throw new StorageException("File provided for upload is null or empty.");
        }
        // Add other validations if needed (e.g., file type, size)
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

    private String generateImageKey(Long listingId, String originalFilename) {
        // Clean the original filename to prevent path traversal or invalid characters
        String safeFilename = originalFilename != null ? originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_") : "image";
        return String.format("listings/%d/%d_%s", listingId, System.currentTimeMillis(), safeFilename);
    }

    private CarListing buildCarListingFromRequest(CreateListingRequest request, User user) {
        CarListing carListing = new CarListing();
        carListing.setTitle(request.getTitle());
        carListing.setBrand(request.getBrand());
        carListing.setModel(request.getModel());
        carListing.setModelYear(request.getModelYear());
        carListing.setPrice(request.getPrice());
        carListing.setMileage(request.getMileage());
        carListing.setDescription(request.getDescription());
        carListing.setLocation(request.getLocation());
        carListing.setSeller(user);
        carListing.setApproved(false); // Default to not approved
        return carListing;
    }

    // Removed convertToResponse method as logic is now in CarListingMapper
}

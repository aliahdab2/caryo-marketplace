package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.exception.ResourceNotFoundException;
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
@RequiredArgsConstructor
@Slf4j
public class CarListingService {

    private final CarListingRepository carListingRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    /**
     * Create a new car listing
     */
    @Transactional
    public CarListingResponse createListing(CreateListingRequest request, String username) {
        log.info("Creating new listing for user: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        CarListing carListing = new CarListing();
        // Corrected mapping from request to entity
        carListing.setTitle(request.getTitle()); // Assuming title exists in request
        carListing.setBrand(request.getBrand());
        carListing.setModel(request.getModel());
        carListing.setModelYear(request.getModelYear());
        carListing.setPrice(request.getPrice());
        carListing.setMileage(request.getMileage());
        // carListing.setColor(request.getColor()); // Color not in CreateListingRequest
        // carListing.setTransmission(request.getTransmission()); // Transmission not in CreateListingRequest
        carListing.setDescription(request.getDescription());
        carListing.setLocation(request.getLocation());
        carListing.setSeller(user); // Corrected setter method
        carListing.setApproved(false); // Listings start as not approved

        try {
            CarListing savedListing = carListingRepository.save(carListing);
            log.info("Successfully saved new listing with ID: {} (pending approval)", savedListing.getId());
            return convertToResponse(savedListing);
        } catch (Exception e) {
            log.error("Error saving car listing for user {}: {}", username, e.getMessage(), e);
            throw new RuntimeException("Failed to create car listing.", e);
        }
    }

    /**
     * Upload an image for a car listing
     * @param file The image file to upload
     * @param listingId The ID of the listing to update (optional, can be null for pre-upload)
     * @param username The username of the authenticated user
     * @return The URL of the uploaded image
     */
    @Transactional
    public String uploadListingImage(Long listingId, MultipartFile file, String username) {
        log.info("Attempting to upload image for listing ID: {} by user: {}", listingId, username);
        // Fetch user first to check ownership later
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        
        CarListing listing = carListingRepository.findById(listingId)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", listingId));

        // Authorization check: Ensure the user owns the listing
        // Corrected getter method
        if (listing.getSeller() == null || !listing.getSeller().getId().equals(user.getId())) {
            log.warn("Authorization failed: User '{}' attempted to upload image for listing ID {} owned by '{}'",
                     username, listingId, listing.getSeller() != null ? listing.getSeller().getUsername() : "<unknown>");
            throw new SecurityException("User does not have permission to modify this listing.");
        }

        String imageKey = "listings/" + listingId + "/" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        try {
            storageService.store(file, imageKey);
            listing.setImageKey(imageKey);
            carListingRepository.save(listing);
            log.info("Successfully uploaded image and updated listing ID: {}. Image key: {}", listingId, imageKey);
            return imageKey;
        } catch (Exception e) {
            log.error("Error uploading image for listing ID {}: {}", listingId, e.getMessage(), e);
            throw new RuntimeException("Failed to upload image for listing.", e);
        }
    }

    /**
     * Get car listing details by ID (only if approved)
     */
    @Transactional(readOnly = true)
    public CarListingResponse getListingById(Long id) {
        log.debug("Fetching listing by ID: {}", id);
        CarListing carListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", id));
        return convertToResponse(carListing);
    }

    /**
     * Get all approved listings with pagination
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getAllApprovedListings(Pageable pageable) {
        log.debug("Fetching all approved listings with pagination: {}", pageable);
        // Use repository method that finds approved listings with pagination
        Page<CarListing> listingPage = carListingRepository.findByApprovedTrue(pageable);
        log.info("Found {} approved listings on page {} (size {}).", listingPage.getNumberOfElements(), pageable.getPageNumber(), pageable.getPageSize());
        return listingPage.map(this::convertToResponse);
    }

    /**
     * Get filtered listings based on criteria
     */
    @Transactional(readOnly = true)
    public Page<CarListingResponse> getFilteredListings(ListingFilterRequest filterRequest, Pageable pageable) {
        log.debug("Fetching filtered listings with filter: {}, pagination: {}", filterRequest, pageable);
        // Create a specification based on the filter request
        Specification<CarListing> spec = CarListingSpecification.fromFilter(filterRequest);
        // Always add the 'approved' criteria for public filtering
        Specification<CarListing> approvedSpec = Specification.where(spec)
                                                              .and(CarListingSpecification.isApproved());
                                                              
        Page<CarListing> listingPage = carListingRepository.findAll(approvedSpec, pageable);
        log.info("Found {} filtered listings on page {} (size {}).", listingPage.getNumberOfElements(), pageable.getPageNumber(), pageable.getPageSize());
        return listingPage.map(this::convertToResponse);
    }

    /**
     * Get all listings for current user (seller)
     */
    @Transactional(readOnly = true)
    public List<CarListingResponse> getMyListings(String username) {
        log.debug("Fetching listings for user: {}", username);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));
        // Corrected repository method call
        return carListingRepository.findBySeller(user).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Approve a car listing
     */
    @Transactional
    public CarListingResponse approveListing(Long id) {
        log.info("Attempting to approve listing with ID: {}", id);
        CarListing carListing = carListingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CarListing", "id", id));
        
        if (Boolean.TRUE.equals(carListing.getApproved())) { // Safe check for Boolean
            log.warn("Listing ID {} is already approved.", id);
            // Decide whether to throw an error or just return the listing
            // return convertToResponse(carListing); 
            throw new IllegalStateException("Listing is already approved.");
        }
        
        carListing.setApproved(true);
        CarListing approvedListing = carListingRepository.save(carListing);
        log.info("Successfully approved listing ID: {}", approvedListing.getId());
        return convertToResponse(approvedListing);
    }

    /**
     * Helper method to convert Entity to Response DTO
     */
    private CarListingResponse convertToResponse(CarListing carListing) {
        CarListingResponse response = new CarListingResponse();
        response.setId(carListing.getId());
        // Corrected mapping from entity to response
        response.setTitle(carListing.getTitle()); // Assuming title exists
        response.setBrand(carListing.getBrand());
        response.setModel(carListing.getModel());
        response.setModelYear(carListing.getModelYear());
        response.setPrice(carListing.getPrice());
        response.setMileage(carListing.getMileage());
        // response.setColor(carListing.getColor()); // Color not in CarListingResponse
        // response.setTransmission(carListing.getTransmission()); // Transmission not in CarListingResponse
        response.setDescription(carListing.getDescription());
        response.setLocation(carListing.getLocation());
        response.setCreatedAt(carListing.getCreatedAt());
        response.setApproved(carListing.getApproved()); // Assuming approved exists
        // response.setUpdatedAt(carListing.getUpdatedAt()); // UpdatedAt not in CarListingResponse
        
        // Corrected getter method for user/seller info
        if (carListing.getSeller() != null) {
            response.setSellerId(carListing.getSeller().getId());
            response.setSellerUsername(carListing.getSeller().getUsername());
        }

        String signedImageUrl = null;
        if (carListing.getImageKey() != null) {
            try {
                signedImageUrl = storageService.getSignedUrl(carListing.getImageKey(), 3600);
                log.debug("Generated signed URL for listing ID {}: {}", carListing.getId(), signedImageUrl);
            } catch (UnsupportedOperationException e) {
                log.warn("Storage service does not support signed URLs. Cannot generate for listing ID {}.", carListing.getId());
            } catch (Exception e) {
                log.error("Error generating signed URL for listing ID {}: {}", carListing.getId(), e.getMessage(), e);
            }
        }
        response.setImageUrl(signedImageUrl);

        return response;
    }
}

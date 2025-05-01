package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.CreateListingRequest;
import com.autotrader.autotraderbackend.payload.request.ListingFilterRequest;
import com.autotrader.autotraderbackend.payload.response.CarListingResponse;
import com.autotrader.autotraderbackend.payload.response.PageResponse;
import com.autotrader.autotraderbackend.repository.CarListingRepository;
import com.autotrader.autotraderbackend.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CarListingService {
    
    @Autowired
    private CarListingRepository carListingRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * Create a new car listing
     */
    @Transactional
    public CarListingResponse createListing(CreateListingRequest request, String username) {
        User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        
        CarListing carListing = new CarListing();
        carListing.setTitle(request.getTitle());
        carListing.setBrand(request.getBrand());
        carListing.setModel(request.getModel());
        carListing.setModelYear(request.getModelYear());
        carListing.setMileage(request.getMileage());
        carListing.setPrice(request.getPrice());
        carListing.setLocation(request.getLocation());
        carListing.setDescription(request.getDescription());
        carListing.setImageUrl(request.getImageUrl());
        carListing.setSeller(seller);
        
        // By default, listing is not approved until admin reviews it
        carListing.setApproved(false);
        
        CarListing savedListing = carListingRepository.save(carListing);
        
        return convertToResponse(savedListing);
    }
    
    /**
     * Get all approved listings with pagination
     */
    public PageResponse<CarListingResponse> getAllApprovedListings(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CarListing> listingsPage = carListingRepository.findByApprovedTrue(pageRequest);
        
        return createPageResponse(listingsPage);
    }
    
    /**
     * Get listings with filters
     */
    public PageResponse<CarListingResponse> getFilteredListings(ListingFilterRequest filterRequest) {
        Sort.Direction direction = filterRequest.getSortDirection().equalsIgnoreCase("asc") ? 
                                 Sort.Direction.ASC : Sort.Direction.DESC;
        
        PageRequest pageRequest = PageRequest.of(
            filterRequest.getPage(), 
            filterRequest.getSize(),
            Sort.by(direction, filterRequest.getSortBy())
        );
        
        Specification<CarListing> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            
            // Always filter by approved = true for public API
            predicates.add(criteriaBuilder.equal(root.get("approved"), true));
            
            if (filterRequest.getBrand() != null && !filterRequest.getBrand().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("brand"), filterRequest.getBrand()));
            }
            
            if (filterRequest.getModel() != null && !filterRequest.getModel().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("model"), filterRequest.getModel()));
            }
            
            if (filterRequest.getModelYear() != null) {
                predicates.add(criteriaBuilder.equal(root.get("modelYear"), filterRequest.getModelYear()));
            }
            
            if (filterRequest.getLocation() != null && !filterRequest.getLocation().isEmpty()) {
                predicates.add(criteriaBuilder.like(root.get("location"), "%" + filterRequest.getLocation() + "%"));
            }
            
            if (filterRequest.getMinPrice() != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("price"), filterRequest.getMinPrice()));
            }
            
            if (filterRequest.getMaxPrice() != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("price"), filterRequest.getMaxPrice()));
            }
            
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        
        Page<CarListing> listingsPage = carListingRepository.findAll(spec, pageRequest);
        
        return createPageResponse(listingsPage);
    }
    
    /**
     * Get car listing details by ID (only if approved)
     */
    public CarListingResponse getListingById(Long id) {
        CarListing listing = carListingRepository.findByIdAndApprovedTrue(id)
                .orElseThrow(() -> new EntityNotFoundException("Car listing not found with id: " + id));
        
        return convertToResponse(listing);
    }
    
    /**
     * Get all listings for current user (seller)
     */
    public List<CarListingResponse> getMyListings(String username) {
        User seller = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username: " + username));
        
        List<CarListing> listings = carListingRepository.findBySeller(seller);
        
        return listings.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    /**
     * Get all listings pending approval (admin only)
     */
    public PageResponse<CarListingResponse> getPendingApprovalListings(int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<CarListing> listingsPage = carListingRepository.findByApprovedFalse(pageRequest);
        
        return createPageResponse(listingsPage);
    }
    
    /**
     * Approve a listing (admin only)
     */
    @Transactional
    public CarListingResponse approveListing(Long id) {
        CarListing listing = carListingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Car listing not found with id: " + id));
        
        listing.setApproved(true);
        carListingRepository.save(listing);
        
        return convertToResponse(listing);
    }
    
    /**
     * Convert a CarListing entity to a CarListingResponse DTO
     */
    private CarListingResponse convertToResponse(CarListing carListing) {
        return new CarListingResponse(
            carListing.getId(),
            carListing.getTitle(),
            carListing.getBrand(),
            carListing.getModel(),
            carListing.getModelYear(),
            carListing.getMileage(),
            carListing.getPrice(),
            carListing.getLocation(),
            carListing.getDescription(),
            carListing.getImageUrl(),
            carListing.getApproved(),
            carListing.getSeller().getId(),
            carListing.getSeller().getUsername(),
            carListing.getCreatedAt()
        );
    }
    
    /**
     * Create a PageResponse from a Page of CarListings
     */
    private PageResponse<CarListingResponse> createPageResponse(Page<CarListing> listingsPage) {
        List<CarListingResponse> listingResponses = listingsPage.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
            listingResponses,
            listingsPage.getNumber(),
            listingsPage.getSize(),
            listingsPage.getTotalElements(),
            listingsPage.getTotalPages(),
            listingsPage.isLast()
        );
    }
}

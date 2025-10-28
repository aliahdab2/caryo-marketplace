package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.Dealer;
import com.autotrader.autotraderbackend.model.User;
import com.autotrader.autotraderbackend.payload.request.SignupRequest;
import com.autotrader.autotraderbackend.repository.DealerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealerService {

    private final DealerRepository dealerRepository;

    /**
     * Create dealer profile from signup request
     */
    @Transactional
    public Dealer createDealer(User user, SignupRequest signupRequest) {
        log.info("Creating dealer profile for user: {}", user.getUsername());

        Dealer dealer = Dealer.builder()
                .user(user)
                .businessName(signupRequest.getBusinessName())
                .vatNumber(signupRequest.getVatNumber())
                .tradingAddress(signupRequest.getTradingAddress())
                .businessEmail(signupRequest.getBusinessEmail())
                .businessPhone(signupRequest.getBusinessPhone())
                .logoUrl(signupRequest.getLogoUrl())
                .build();

        Dealer savedDealer = dealerRepository.save(dealer);
        log.info("Dealer profile created successfully with ID: {}", savedDealer.getId());

        return savedDealer;
    }

    /**
     * Get dealer by user
     */
    public Optional<Dealer> getDealerByUser(User user) {
        return dealerRepository.findByUser(user);
    }

    /**
     * Get dealer by user ID
     */
    public Optional<Dealer> getDealerByUserId(Long userId) {
        return dealerRepository.findByUserId(userId);
    }

    /**
     * Get dealer by dealer ID
     */
    public Optional<Dealer> getDealerById(Long dealerId) {
        return dealerRepository.findById(dealerId);
    }

    /**
     * Check if user is a dealer
     */
    public boolean isDealer(User user) {
        return dealerRepository.existsByUser(user);
    }

    /**
     * Validate dealer data before creation
     */
    public void validateDealerData(SignupRequest signupRequest) {
        if (signupRequest == null) {
            throw new IllegalArgumentException("Signup request cannot be null");
        }

        // Validate business name
        if (signupRequest.getBusinessName() == null || signupRequest.getBusinessName().trim().isEmpty()) {
            throw new IllegalArgumentException("Business name is required for dealers");
        }

        if (signupRequest.getBusinessName().length() < 2 || signupRequest.getBusinessName().length() > 100) {
            throw new IllegalArgumentException("Business name must be between 2 and 100 characters");
        }

        // Check if VAT number is already taken
        if (signupRequest.getVatNumber() != null && !signupRequest.getVatNumber().trim().isEmpty()) {
            if (dealerRepository.existsByVatNumber(signupRequest.getVatNumber().trim(), null)) {
                throw new IllegalArgumentException("VAT number is already in use");
            }
        }

        // Check if business email is already taken
        if (signupRequest.getBusinessEmail() != null && !signupRequest.getBusinessEmail().trim().isEmpty()) {
            if (dealerRepository.existsByBusinessEmail(signupRequest.getBusinessEmail().trim(), null)) {
                throw new IllegalArgumentException("Business email is already in use");
            }
        }

        // Validate business email format if provided
        if (signupRequest.getBusinessEmail() != null && !signupRequest.getBusinessEmail().trim().isEmpty()) {
            if (!signupRequest.getBusinessEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                throw new IllegalArgumentException("Invalid business email format");
            }
        }

        // Validate logo URL if provided
        if (signupRequest.getLogoUrl() != null && !signupRequest.getLogoUrl().trim().isEmpty()) {
            if (!signupRequest.getLogoUrl().matches("^https?://.*")) {
                throw new IllegalArgumentException("Logo URL must be a valid HTTP/HTTPS URL");
            }
        }
    }

    /**
     * Update dealer profile
     */
    @Transactional
    public Dealer updateDealer(Dealer dealer, SignupRequest updateRequest) {
        log.info("Updating dealer profile for user: {}", dealer.getUser().getUsername());

        // Validate unique constraints if they're being updated
        if (updateRequest.getVatNumber() != null &&
            !updateRequest.getVatNumber().trim().equals(dealer.getVatNumber())) {
            if (dealerRepository.existsByVatNumber(updateRequest.getVatNumber().trim(), dealer.getId())) {
                throw new IllegalArgumentException("VAT number is already in use");
            }
            dealer.setVatNumber(updateRequest.getVatNumber().trim());
        }

        if (updateRequest.getBusinessEmail() != null &&
            !updateRequest.getBusinessEmail().trim().equals(dealer.getBusinessEmail())) {
            // Validate email format
            if (!updateRequest.getBusinessEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                throw new IllegalArgumentException("Invalid business email format");
            }
            if (dealerRepository.existsByBusinessEmail(updateRequest.getBusinessEmail().trim(), dealer.getId())) {
                throw new IllegalArgumentException("Business email is already in use");
            }
            dealer.setBusinessEmail(updateRequest.getBusinessEmail().trim());
        }

        // Update other fields
        if (updateRequest.getBusinessName() != null) {
            dealer.setBusinessName(updateRequest.getBusinessName());
        }
        if (updateRequest.getTradingAddress() != null) {
            dealer.setTradingAddress(updateRequest.getTradingAddress());
        }
        if (updateRequest.getBusinessPhone() != null) {
            dealer.setBusinessPhone(updateRequest.getBusinessPhone());
        }
        if (updateRequest.getLogoUrl() != null) {
            dealer.setLogoUrl(updateRequest.getLogoUrl());
        }

        Dealer savedDealer = dealerRepository.save(dealer);
        log.info("Dealer profile updated successfully for ID: {}", savedDealer.getId());

        return savedDealer;
    }
}

package com.caryo.marketplace.service;

import com.caryo.marketplace.model.Dealer;
import com.caryo.marketplace.model.User;
import com.caryo.marketplace.payload.request.SignupRequest;
import com.caryo.marketplace.repository.DealerRepository;
import com.caryo.marketplace.service.storage.StorageKeyGenerator;
import com.caryo.marketplace.service.storage.StorageService;
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
    private final StorageService storageService;
    private final StorageKeyGenerator storageKeyGenerator;

    /**
     * Create dealer profile from signup request.
     * If a logo URL is provided and points to a temp/ location, the file is moved
     * to dealers/logos/ for permanent storage.
     */
    @Transactional
    public Dealer createDealer(User user, SignupRequest signupRequest) {
        log.info("Creating dealer profile for user: {}", user.getUsername());

        String logoUrl = signupRequest.getLogoUrl();
        String finalLogoUrl = relocateTempLogo(logoUrl);

        Dealer dealer = Dealer.builder()
                .user(user)
                .businessName(signupRequest.getBusinessName())
                .vatNumber(signupRequest.getVatNumber())
                .tradingAddress(signupRequest.getTradingAddress())
                .businessEmail(signupRequest.getBusinessEmail())
                .businessPhone(signupRequest.getBusinessPhone())
                .logoUrl(finalLogoUrl)
                .build();

        Dealer savedDealer = dealerRepository.save(dealer);
        log.info("Dealer profile created successfully with ID: {}", savedDealer.getId());

        return savedDealer;
    }

    /**
     * Relocate a logo file from temp/ to dealers/logos/.
     * If the key is not in temp/, returns the original URL unchanged (graceful fallback).
     *
     * @param logoUrl The logo URL (may be a full URL or a storage key)
     * @return The new URL/key pointing to the permanent location, or the original if not in temp/
     */
    private String relocateTempLogo(String logoUrl) {
        if (logoUrl == null || logoUrl.trim().isEmpty()) {
            return logoUrl;
        }

        try {
            String sourceKey = storageKeyGenerator.extractKeyFromUrl(logoUrl);

            // Only relocate if the file is in the temp/ prefix
            if (!sourceKey.startsWith("temp/")) {
                log.debug("Logo URL '{}' is not in temp/, keeping as-is", logoUrl);
                return logoUrl;
            }

            // Generate destination key: dealers/logos/{original-filename-from-temp-key}
            String filename = storageKeyGenerator.getFilename(sourceKey);
            String destKey = "dealers/logos/" + filename;

            storageService.move(sourceKey, destKey);
            log.info("Moved dealer logo from '{}' to '{}'", sourceKey, destKey);

            // Return the new key (caller can construct full URL if needed)
            return destKey;

        } catch (Exception e) {
            log.warn("Failed to relocate dealer logo from temp/. "
                    + "Keeping original URL '{}'. Error: {}", logoUrl, e.getMessage());
            // Graceful degradation: keep the temp URL. The file is still accessible
            // and the temp cleanup job will skip files that are referenced.
            return logoUrl;
        }
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

    /**
     * Update dealer public profile fields (Phase 1 MVP).
     */
    @Transactional
    public Dealer updatePublicProfile(Dealer dealer, com.caryo.marketplace.payload.request.DealerProfileUpdateRequest updateRequest) {
        log.info("Updating dealer public profile for user: {}", dealer.getUser().getUsername());

        if (updateRequest.getBusinessName() != null) {
            dealer.setBusinessName(updateRequest.getBusinessName().trim());
        }
        if (updateRequest.getTradingAddress() != null) {
            dealer.setTradingAddress(updateRequest.getTradingAddress().trim());
        }
        if (updateRequest.getBusinessPhone() != null) {
            dealer.setBusinessPhone(updateRequest.getBusinessPhone().trim());
        }
        if (updateRequest.getBusinessEmail() != null) {
            String email = updateRequest.getBusinessEmail().trim();
            if (!email.isEmpty()) {
                if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                    throw new IllegalArgumentException("Invalid business email format");
                }
                if (dealerRepository.existsByBusinessEmail(email, dealer.getId())) {
                    throw new IllegalArgumentException("Business email is already in use");
                }
            }
            dealer.setBusinessEmail(email.isEmpty() ? null : email);
        }

        if (updateRequest.getLogoUrl() != null) {
            String newLogoUrl = updateRequest.getLogoUrl().trim();
            if (!newLogoUrl.isEmpty() && !isValidFileUrl(newLogoUrl)) {
                throw new IllegalArgumentException("Logo URL must be a valid HTTP/HTTPS URL or /api/ path");
            }
            String oldLogoUrl = dealer.getLogoUrl();
            String newValue = newLogoUrl.isEmpty() ? null : newLogoUrl;

            // Delete old logo file if changed and old one exists
            if (oldLogoUrl != null && !oldLogoUrl.equals(newValue)) {
                deleteOldFile(oldLogoUrl);
            }

            dealer.setLogoUrl(newValue);
        }

        if (updateRequest.getBannerUrl() != null) {
            String newBannerUrl = updateRequest.getBannerUrl().trim();
            if (!newBannerUrl.isEmpty() && !isValidFileUrl(newBannerUrl)) {
                throw new IllegalArgumentException("Banner URL must be a valid HTTP/HTTPS URL or /api/ path");
            }
            String oldBannerUrl = dealer.getBannerUrl();
            String newValue = newBannerUrl.isEmpty() ? null : newBannerUrl;

            // Delete old banner file if changed and old one exists
            if (oldBannerUrl != null && !oldBannerUrl.equals(newValue)) {
                deleteOldFile(oldBannerUrl);
            }

            dealer.setBannerUrl(newValue);
        }

        if (updateRequest.getDescription() != null) {
            dealer.setDescription(updateRequest.getDescription());
        }
        if (updateRequest.getDescriptionAr() != null) {
            dealer.setDescriptionAr(updateRequest.getDescriptionAr());
        }
        if (updateRequest.getWorkingHours() != null) {
            dealer.setWorkingHours(updateRequest.getWorkingHours());
        }
        if (updateRequest.getSocialLinks() != null) {
            dealer.setSocialLinks(updateRequest.getSocialLinks());
        }

        Dealer savedDealer = dealerRepository.save(dealer);
        log.info("Dealer public profile updated successfully for ID: {}", savedDealer.getId());

        return savedDealer;
    }

    /**
     * Check if a URL is valid for file storage (HTTP/HTTPS URL or /api/ relative path).
     */
    private boolean isValidFileUrl(String url) {
        return url.matches("^https?://.*") || url.startsWith("/api/v1/");
    }

    /**
     * Delete an old file from storage. Best-effort — failures are logged but not thrown.
     */
    private void deleteOldFile(String fileUrl) {
        try {
            String key = storageKeyGenerator.extractKeyFromUrl(fileUrl);
            if (key != null && !key.trim().isEmpty()) {
                boolean deleted = storageService.delete(key);
                if (deleted) {
                    log.info("Deleted old file: {}", key);
                } else {
                    log.debug("Could not delete old file (may not exist): {}", key);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to delete old file '{}'. It will be orphaned. Error: {}",
                    fileUrl, e.getMessage());
        }
    }
}

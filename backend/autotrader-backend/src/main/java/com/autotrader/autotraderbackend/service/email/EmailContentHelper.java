package com.autotrader.autotraderbackend.service.email;

import com.autotrader.autotraderbackend.model.CarListing;
import com.autotrader.autotraderbackend.util.ArabicTextUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service responsible for generating email content and formatting.
 * Handles listing titles, website names, and other content generation.
 */
@Service
@RequiredArgsConstructor
public class EmailContentHelper {

    @Value("${app.website.name}")
    private String websiteName;

    @Value("${app.website.name.ar}")
    private String websiteNameAr;

    @Value("${app.website.url}")
    private String websiteUrl;

    /**
     * Generate a listing title for emails based on language.
     *
     * @param listing the car listing
     * @param language the target language
     * @return formatted listing title
     */
    public String getListingTitle(CarListing listing, String language) {
        if (listing == null) {
            return "ar".equals(language) ? "إعلان غير معروف" : "Unknown Listing";
        }

        StringBuilder title = new StringBuilder();

        if (listing.getBrandNameEn() != null) {
            title.append(listing.getBrandNameEn());
        }

        if (listing.getModelNameEn() != null) {
            if (title.length() > 0) title.append(" ");
            title.append(listing.getModelNameEn());
        }

        if (listing.getModelYear() != null) {
            if (title.length() > 0) title.append(" ");
            title.append(listing.getModelYear());
        }

        if (listing.getPrice() != null) {
            if (title.length() > 0) title.append(" - ");
            title.append("$").append(listing.getPrice());
        }

        return title.length() > 0 ? title.toString() :
            ("ar".equals(language) ? "إعلان سيارة" : "Car Listing");
    }

    /**
     * Get website name based on language with proper Arabic text normalization.
     *
     * @param language the target language
     * @return website name in the specified language
     */
    public String getWebsiteName(String language) {
        String name = "ar".equals(language) ? websiteNameAr : websiteName;

        if (name == null) {
            return "ar".equals(language) ? "كاريو" : "Caryo Marketplace";
        }

        return ArabicTextUtils.normalizeArabicText(name);
    }

    /**
     * Build a listing URL.
     *
     * @param listingId the listing ID
     * @return full URL to the listing
     */
    public String buildListingUrl(Long listingId) {
        return websiteUrl + "/listings/" + listingId;
    }

    /**
     * Build a verification URL.
     *
     * @param token the verification token
     * @return full verification URL
     */
    public String buildVerificationUrl(String token) {
        return websiteUrl + "/auth/verify-email?token=" + token;
    }

    /**
     * Build a feedback URL for a listing.
     *
     * @param listingId the listing ID
     * @return full feedback URL
     */
    public String buildFeedbackUrl(Long listingId) {
        return websiteUrl + "/feedback?listing=" + listingId;
    }

    /**
     * Get the website URL.
     *
     * @return the base website URL
     */
    public String getWebsiteUrl() {
        return websiteUrl;
    }

    /**
     * Get a default reason message based on language.
     *
     * @param language the target language
     * @return default reason message
     */
    public String getDefaultReason(String language) {
        return "ar".equals(language) ? "غير محدد" : "No specific reason provided";
    }
}

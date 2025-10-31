package com.autotrader.autotraderbackend.controller;

import com.autotrader.autotraderbackend.payload.response.ApiResponse;
import lombok.Builder;
import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Simple Pricing Controller
 * 
 * 🎯 Industry Best Practice: Single Source of Truth
 * - Prices configured in application.properties
 * - This endpoint just exposes them
 * - Frontend reads from here (no hardcoding)
 * 
 * ✅ Benefits:
 * - Change prices → Update only application.properties → Frontend automatically shows new prices
 * - No frontend redeployment needed
 * - Single source of truth
 * - Follows SaaS industry standards (Stripe, PayPal pattern)
 */
@RestController
@RequestMapping("/api/pricing")
public class PricingController {

    @Value("${subscription.basic.price}")
    private int basicPrice;

    @Value("${subscription.basic.listing_limit}")
    private int basicListingLimit;

    @Value("${subscription.advanced.price}")
    private int advancedPrice;

    @Value("${subscription.advanced.listing_limit}")
    private int advancedListingLimit;

    @Value("${subscription.professional.price}")
    private int professionalPrice;

    @Value("${subscription.professional.listing_limit}")
    private int professionalListingLimit;

    @GetMapping("/tiers")
    public ResponseEntity<ApiResponse<List<SubscriptionTier>>> getSubscriptionTiers() {
        List<SubscriptionTier> tiers = List.of(
            createTier("basic", "Basic", basicPrice, basicListingLimit),
            createTier("advanced", "Advanced", advancedPrice, advancedListingLimit, true, true),
            createTier("professional", "Professional", professionalPrice, professionalListingLimit)
        );

        return ResponseEntity.ok(ApiResponse.success(tiers, "Subscription tiers retrieved successfully"));
    }

    private SubscriptionTier createTier(String id, String name, int price, int listingLimit, boolean... flags) {
        boolean recommended = flags.length > 0 && flags[0];
        boolean popular = flags.length > 1 && flags[1];

        return SubscriptionTier.builder()
            .id(id)
            .name(name)
            .price(price)
            .currency("USD")
            .listingLimit(listingLimit)
            .features(getFeatures(id, listingLimit))
            .recommended(recommended)
            .popular(popular)
            .build();
    }

    private List<String> getFeatures(String tierId, int listingLimit) {
        return switch (tierId) {
            case "basic" -> List.of(
                "Up to " + listingLimit + " listings",
                "Basic analytics",
                "Email support",
                "Mobile responsive",
                "Photo uploads"
            );
            case "advanced" -> List.of(
                "Up to " + listingLimit + " listings",
                "Advanced analytics",
                "Priority support",
                "Featured listings",
                "Video uploads",
                "Custom branding"
            );
            case "professional" -> List.of(
                "Unlimited listings",
                "Premium analytics",
                "Dedicated support",
                "API access",
                "White-label options",
                "Custom integrations",
                "Priority placement"
            );
            default -> List.of();
        };
    }

    @Data
    @Builder
    public static class SubscriptionTier {
        private String id;
        private String name;
        private int price;
        private String currency;
        private int listingLimit;
        private List<String> features;
        private boolean recommended;
        private boolean popular;
    }
}

package com.autotrader.autotraderbackend.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        // Using simple in-memory cache. For production, consider using Redis or similar
        return new ConcurrentMapCacheManager(
            // User-related caches
            "favorites",
            
            // Location caches
            "locations",
            "locationsByCountry",
            "locationsByGovernorate",
            
            // Car reference data caches
            "carBrands",           // All brands
            "activeBrands",        // Active brands only
            "carModels",           // All models
            "modelsByBrand",       // Models filtered by brand
            "bodyStyles",          // Body styles (Sedan, SUV, etc.)
            "fuelTypes",           // Fuel types (Gasoline, Diesel, Electric, etc.)
            "transmissionTypes",   // Transmission types (Manual, Automatic, etc.)
            "driveTypes",          // Drive types (FWD, AWD, etc.)
            "carConditions",       // Car conditions (New, Used, etc.)
            
            // System reference data
            "sellerTypes"
        );
    }
}

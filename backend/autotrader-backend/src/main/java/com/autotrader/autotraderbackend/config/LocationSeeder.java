package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Initializes the system with default location data on startup.
 * Only runs in development and test profiles.
 */
@Component
@Order(2) // Run after DataInitializer which has Order(1)
@Profile({"dev", "test"})
@RequiredArgsConstructor
@Slf4j
public class LocationSeeder implements ApplicationRunner {

    private final LocationRepository locationRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Check if we already have locations in the database
        long locationCount = locationRepository.count();
        if (locationCount > 0) {
            log.info("{} locations already exist, performing targeted seeding if needed", locationCount);
        } else {
            log.info("No locations found, starting initial data seeding");
        }

        // Each seed method will do its own checks to avoid duplicates
        log.info("Starting location data seeding...");
        seedSyrianCities();
        // Add more seeding methods here in the future (each with their own existence checks)
        // seedJordanianCities();
        // seedLebaneseLocations();
        log.info("Location data seeding completed");
    }

    /**
     * Seeds Syrian cities data
     */
    private void seedSyrianCities() {
        // Check for existing data to prevent duplicate seeding
        if (locationRepository.existsByDisplayNameEnOrDisplayNameAr("Damascus", "دمشق")) {
            log.info("Syrian cities already exist in database, skipping seed");
            return;
        }
        
        List<LocationSeedData> locationDataList = Arrays.asList(
            // Major cities with their regions
            new LocationSeedData("Damascus", "دمشق", "SY", "Central Syria", 33.5138, 36.2765),
            new LocationSeedData("Aleppo", "حلب", "SY", "Northern Syria", 36.2021, 37.1343),
            new LocationSeedData("Homs", "حمص", "SY", "Central Syria", 34.7324, 36.7137),
            new LocationSeedData("Latakia", "اللاذقية", "SY", "Coastal Syria", 35.5152, 35.7658),
            new LocationSeedData("Hama", "حماة", "SY", "Central Syria", 35.1318, 36.7518),
            new LocationSeedData("Deir ez-Zor", "دير الزور", "SY", "Eastern Syria", 35.3369, 40.1361),
            new LocationSeedData("Idlib", "إدلب", "SY", "Northern Syria", 35.9306, 36.6339),
            new LocationSeedData("Tartus", "طرطوس", "SY", "Coastal Syria", 34.8885, 35.8866),
            new LocationSeedData("Al-Hasakah", "الحسكة", "SY", "Northeastern Syria", 36.5024, 40.7563),
            new LocationSeedData("Raqqa", "الرقة", "SY", "Northern Syria", 35.9528, 39.0079),
            new LocationSeedData("Daraa", "درعا", "SY", "Southern Syria", 32.6189, 36.1055),
            new LocationSeedData("As-Suwayda", "السويداء", "SY", "Southern Syria", 32.7007, 36.5662),
            
            // Other significant locations
            new LocationSeedData("Qamishli", "القامشلي", "SY", "Northeastern Syria", 37.0750, 41.2182),
            new LocationSeedData("Manbij", "منبج", "SY", "Northern Syria", 36.5281, 37.9549),
            new LocationSeedData("Al-Bab", "الباب", "SY", "Northern Syria", 36.3705, 37.5176),
            new LocationSeedData("Douma", "دوما", "SY", "Damascus Countryside", 33.5718, 36.4032),
            new LocationSeedData("Palmyra", "تدمر", "SY", "Central Syria", 34.5646, 38.2670),
            new LocationSeedData("Kobani", "كوباني", "SY", "Northern Syria", 36.8909, 38.3564),
            new LocationSeedData("Afrin", "عفرين", "SY", "Northern Syria", 36.5122, 36.8699),
            new LocationSeedData("Safita", "صافيتا", "SY", "Coastal Syria", 34.8192, 36.1198),
            new LocationSeedData("Yabroud", "يبرود", "SY", "Damascus Countryside", 33.9693, 36.6572),
            new LocationSeedData("Al-Qutayfah", "القطيفة", "SY", "Damascus Countryside", 33.7382, 36.5985)
        );

        log.info("Seeding {} Syrian cities", locationDataList.size());
        
        // Use streaming with batch saving for better performance
        List<Location> locations = locationDataList.stream()
            .map(data -> {
                Location location = new Location();
                location.setDisplayNameEn(data.nameEn);
                location.setDisplayNameAr(data.nameAr);
                location.setSlug(SlugUtils.slugify(data.nameEn));
                location.setCountryCode(data.countryCode);
                location.setRegion(data.region);
                location.setLatitude(data.latitude);
                location.setLongitude(data.longitude);
                location.setActive(true);
                return location;
            })
            .collect(Collectors.toList());

        // Save all locations in a batch operation
        locationRepository.saveAll(locations);
        log.info("Successfully created {} locations", locations.size());
    }

    /**
     * Helper class for location seed data
     */
    private static class LocationSeedData {
        final String nameEn;
        final String nameAr;
        final String countryCode;
        final String region;
        final Double latitude;
        final Double longitude;

        public LocationSeedData(String nameEn, String nameAr, String countryCode, String region, Double latitude, Double longitude) {
            this.nameEn = nameEn;
            this.nameAr = nameAr;
            this.countryCode = countryCode;
            this.region = region;
            this.latitude = latitude;
            this.longitude = longitude;
        }
    }
}

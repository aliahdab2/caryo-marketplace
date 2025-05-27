package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.model.Location;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import com.autotrader.autotraderbackend.repository.LocationRepository;
import com.autotrader.autotraderbackend.util.SlugUtils;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Profile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Initializes location data for development and test environments.
 * Depends on GovernorateDataInitializer to ensure the hierarchical integrity
 * of the Country > Governorate > Location structure.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class LocationSeeder {

    private final LocationRepository locationRepository;
    private final GovernorateRepository governorateRepository;

    @Bean
    @Profile({"dev", "test"})
    @DependsOn("initializeGovernorates") // Make sure governorates are initialized first
    public CommandLineRunner seedLocations() {
        return args -> {
            if (locationRepository.count() > 0) {
                log.info("Locations already exist. Skipping seeding.");
                return;
            }

            log.info("Seeding location data...");
            
            // Get Syrian governorates for reference
            List<Governorate> syrianGovernorates = governorateRepository.findByCountry_CountryCodeOrderByDisplayNameEnAsc("SY");
            
            if (syrianGovernorates.isEmpty()) {
                log.error("No Syrian governorates found. Cannot seed locations. Make sure governorates are initialized first.");
                return;
            }
            
            // Create a map of governorate name -> governorate for easy lookup
            Map<String, Governorate> governorateMap = syrianGovernorates.stream()
                    .collect(Collectors.toMap(Governorate::getDisplayNameEn, Function.identity()));
            
            // Default to Damascus governorate if specific governorate not found
            Governorate defaultGovernorate = governorateMap.getOrDefault("Damascus", syrianGovernorates.get(0));

            // Create list of location data using the builder pattern
            List<LocationData> locationDataList = createLocationDataList();

            log.info("Seeding {} Syrian cities", locationDataList.size());
            
            // Use streaming with batch saving for better performance
            List<Location> locations = locationDataList.stream()
                .map(data -> createLocation(data, governorateMap, defaultGovernorate))
                .collect(Collectors.toList());

            // Save all locations in a batch operation
            locationRepository.saveAll(locations);
            log.info("Successfully created {} locations", locations.size());
        };
    }
    
    /**
     * Creates a Location entity from the provided data
     */
    private Location createLocation(LocationData data, Map<String, Governorate> governorateMap, Governorate defaultGovernorate) {
        Objects.requireNonNull(data, "Location data cannot be null");
        
        if (StringUtils.isBlank(data.getNameEn())) {
            throw new IllegalArgumentException("English name cannot be blank");
        }
        if (StringUtils.isBlank(data.getNameAr())) {
            throw new IllegalArgumentException("Arabic name cannot be blank");
        }
        
        Location location = new Location();
        location.setDisplayNameEn(data.getNameEn());
        location.setDisplayNameAr(data.getNameAr());
        location.setSlug(SlugUtils.slugify(data.getNameEn()));
        
        // Find the appropriate governorate or use default
        Governorate governorate = governorateMap.getOrDefault(
            StringUtils.trimToEmpty(data.getGovernorateNameEn()), 
            defaultGovernorate
        );
        location.setGovernorate(governorate);
        
        location.setRegion(StringUtils.trimToNull(data.getRegion()));
        location.setLatitude(data.getLatitude());
        location.setLongitude(data.getLongitude());
        location.setIsActive(true);
        
        return location;
    }
    
    /**
     * Creates a list of location data for seeding
     */
    private List<LocationData> createLocationDataList() {
        return Arrays.asList(
            LocationData.builder()
                .nameEn("Damascus")
                .nameAr("دمشق")
                .governorateNameEn("Damascus")
                .region("Damascus")
                .latitude(33.5138)
                .longitude(36.2765)
                .build(),
                
            LocationData.builder()
                .nameEn("Aleppo")
                .nameAr("حلب")
                .governorateNameEn("Aleppo")
                .region("Northern Syria")
                .latitude(36.2021)
                .longitude(37.1343)
                .build(),
                
            LocationData.builder()
                .nameEn("Homs")
                .nameAr("حمص")
                .governorateNameEn("Homs")
                .region("Central Syria")
                .latitude(34.7324)
                .longitude(36.7137)
                .build(),
                
            LocationData.builder()
                .nameEn("Latakia")
                .nameAr("اللاذقية")
                .governorateNameEn("Latakia")
                .region("Coastal Syria")
                .latitude(35.5317)
                .longitude(35.7915)
                .build(),
                
            LocationData.builder()
                .nameEn("Hama")
                .nameAr("حماة")
                .governorateNameEn("Hama")
                .region("Central Syria")
                .latitude(35.1353)
                .longitude(36.7520)
                .build(),
                
            LocationData.builder()
                .nameEn("Deir ez-Zor")
                .nameAr("دير الزور")
                .governorateNameEn("Damascus") // Default
                .region("Eastern Syria")
                .latitude(35.3359)
                .longitude(40.1408)
                .build(),
                
            LocationData.builder()
                .nameEn("Al-Hasakah")
                .nameAr("الحسكة")
                .governorateNameEn("Damascus") // Default
                .region("Northeastern Syria")
                .latitude(36.5024)
                .longitude(40.7477)
                .build(),
                
            LocationData.builder()
                .nameEn("Raqqa")
                .nameAr("الرقة")
                .governorateNameEn("Damascus") // Default
                .region("Northern Syria")
                .latitude(35.9528)
                .longitude(39.0100)
                .build(),
                
            LocationData.builder()
                .nameEn("Daraa")
                .nameAr("درعا")
                .governorateNameEn("Damascus") // Default
                .region("Southern Syria")
                .latitude(32.6189)
                .longitude(36.1060)
                .build(),
                
            LocationData.builder()
                .nameEn("Idlib")
                .nameAr("إدلب")
                .governorateNameEn("Damascus") // Default
                .region("Northwestern Syria")
                .latitude(35.9306)
                .longitude(36.6339)
                .build(),
                
            LocationData.builder()
                .nameEn("Al-Bab")
                .nameAr("الباب")
                .governorateNameEn("Aleppo")
                .region("Northern Syria")
                .latitude(36.3705)
                .longitude(37.5176)
                .build(),
                
            LocationData.builder()
                .nameEn("Douma")
                .nameAr("دوما")
                .governorateNameEn("Damascus")
                .region("Damascus Countryside")
                .latitude(33.5718)
                .longitude(36.4032)
                .build()
        );
    }

    /**
     * Data class for holding location information using Lombok
     */
    @Data
    @Builder
    private static class LocationData {
        private String nameEn;
        private String nameAr;
        private String governorateNameEn;
        private String region;
        private Double latitude;
        private Double longitude;
    }
}

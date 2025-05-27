package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.repository.CountryRepository;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Initializes governorate data for development and test environments.
 * This class provides reference data for the geographic hierarchy (Country > Governorate > Location).
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class GovernorateDataInitializer {

    private final GovernorateRepository governorateRepository;
    private final CountryRepository countryRepository;

    @Bean
    @Profile({"dev", "test"})
    public CommandLineRunner initializeGovernorates() {
        return args -> {
            if (governorateRepository.count() > 0) {
                log.info("Governorates already exist. Skipping initialization.");
                return;
            }

            log.info("Initializing governorates data...");

            // Ensure countries exist before creating governorates
            ensureCountriesExist();
            
            // Get all countries by code for reference
            Map<String, Country> countryMap = countryRepository.findAll().stream()
                    .collect(Collectors.toMap(Country::getCountryCode, Function.identity()));
            
            if (countryMap.isEmpty()) {
                log.error("No countries found in the database. Cannot initialize governorates.");
                return;
            }

            // Create governorates using the builder pattern
            List<Governorate> governorates = createGovernorates(countryMap);

            governorateRepository.saveAll(governorates);
            log.info("Successfully initialized {} governorates.", governorates.size());
        };
    }
    
    /**
     * Creates the list of governorates to be saved
     */
    private List<Governorate> createGovernorates(Map<String, Country> countryMap) {
        return Arrays.asList(
            // Syrian governorates (primary focus)
            createGovernorate(GovernorateData.builder()
                .slug("damascus")
                .nameEn("Damascus")
                .nameAr("دمشق")
                .country(countryMap.get("SY"))
                .region("Damascus")
                .latitude(33.5138)
                .longitude(36.2765)
                .build()),
                
            createGovernorate(GovernorateData.builder()
                .slug("aleppo")
                .nameEn("Aleppo")
                .nameAr("حلب")
                .country(countryMap.get("SY"))
                .region("Northern Syria")
                .latitude(36.2021)
                .longitude(37.1343)
                .build()),
                
            createGovernorate(GovernorateData.builder()
                .slug("homs")
                .nameEn("Homs")
                .nameAr("حمص")
                .country(countryMap.get("SY"))
                .region("Central Syria")
                .latitude(34.7324)
                .longitude(36.7137)
                .build()),
                
            createGovernorate(GovernorateData.builder()
                .slug("latakia")
                .nameEn("Latakia")
                .nameAr("اللاذقية")
                .country(countryMap.get("SY"))
                .region("Coastal Syria")
                .latitude(35.5317)
                .longitude(35.7915)
                .build()),
                
            createGovernorate(GovernorateData.builder()
                .slug("hama")
                .nameEn("Hama")
                .nameAr("حماة")
                .country(countryMap.get("SY"))
                .region("Central Syria")
                .latitude(35.1353)
                .longitude(36.7520)
                .build()),
                
            // Additional governorates from other countries (for future reference)
            createGovernorate(GovernorateData.builder()
                .slug("riyadh")
                .nameEn("Riyadh")
                .nameAr("الرياض")
                .country(countryMap.get("SA"))
                .region("Central")
                .latitude(24.7136)
                .longitude(46.6753)
                .build()),
                
            createGovernorate(GovernorateData.builder()
                .slug("jeddah")
                .nameEn("Jeddah")
                .nameAr("جدة")
                .country(countryMap.get("SA"))
                .region("Western")
                .latitude(21.4858)
                .longitude(39.1925)
                .build()),
                
            createGovernorate(GovernorateData.builder()
                .slug("dubai")
                .nameEn("Dubai")
                .nameAr("دبي")
                .country(countryMap.get("AE"))
                .region("Dubai")
                .latitude(25.2048)
                .longitude(55.2708)
                .build()),
                
            createGovernorate(GovernorateData.builder()
                .slug("kuwait-city")
                .nameEn("Kuwait City")
                .nameAr("مدينة الكويت")
                .country(countryMap.get("KW"))
                .region("Al Asimah")
                .latitude(29.3759)
                .longitude(47.9774)
                .build())
        );
    }
    
    /**
     * Ensures that the necessary countries exist in the database
     */
    private void ensureCountriesExist() {
        if (countryRepository.count() == 0) {
            log.info("No countries found, creating default countries...");
            
            List<Country> countries = Arrays.asList(
                createCountry("SY", "Syria", "سوريا"),
                createCountry("SA", "Saudi Arabia", "المملكة العربية السعودية"),
                createCountry("AE", "United Arab Emirates", "الإمارات العربية المتحدة"),
                createCountry("QA", "Qatar", "قطر"),
                createCountry("KW", "Kuwait", "الكويت")
            );
            
            countryRepository.saveAll(countries);
            log.info("Created {} default countries", countries.size());
        }
    }
    
    /**
     * Helper method to create a Country entity
     */
    private Country createCountry(String code, String nameEn, String nameAr) {
        Country country = new Country();
        country.setCountryCode(code);
        country.setDisplayNameEn(nameEn);
        country.setDisplayNameAr(nameAr);
        country.setIsActive(true);
        return country;
    }

    /**
     * Creates a Governorate entity from the provided data
     */
    private Governorate createGovernorate(GovernorateData data) {
        // Validate required inputs
        Objects.requireNonNull(data, "Governorate data cannot be null");
        Objects.requireNonNull(data.getCountry(), "Country cannot be null");
        
        if (StringUtils.isBlank(data.getSlug())) {
            throw new IllegalArgumentException("Slug cannot be blank");
        }
        if (StringUtils.isBlank(data.getNameEn())) {
            throw new IllegalArgumentException("English name cannot be blank");
        }
        if (StringUtils.isBlank(data.getNameAr())) {
            throw new IllegalArgumentException("Arabic name cannot be blank");
        }

        Governorate governorate = new Governorate();
        governorate.setSlug(StringUtils.trim(data.getSlug()));
        governorate.setDisplayNameEn(StringUtils.trim(data.getNameEn()));
        governorate.setDisplayNameAr(StringUtils.trim(data.getNameAr()));
        governorate.setCountry(data.getCountry());
        governorate.setRegion(StringUtils.trimToNull(data.getRegion()));
        governorate.setLatitude(data.getLatitude());
        governorate.setLongitude(data.getLongitude());
        governorate.setIsActive(true);
        return governorate;
    }
    
    /**
     * Data class to hold governorate creation information
     */
    @Data
    @Builder
    private static class GovernorateData {
        private String slug;
        private String nameEn;
        private String nameAr;
        private Country country;
        private String region;
        private Double latitude;
        private Double longitude;
    }
}

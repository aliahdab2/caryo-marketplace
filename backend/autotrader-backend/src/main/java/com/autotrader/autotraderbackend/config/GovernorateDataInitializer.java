package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.util.Arrays;
import java.util.List;
import java.util.Objects;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class GovernorateDataInitializer {

    private final GovernorateRepository governorateRepository;

    @Bean
    @Profile({"dev", "test"})
    public CommandLineRunner initializeGovernorates() {
        return args -> {
            if (governorateRepository.count() == 0) {
                log.info("Initializing governorates data...");

                List<Governorate> governorates = Arrays.asList(
                        createGovernorate("riyadh", "Riyadh", "الرياض", "SA", "Central", 24.7136, 46.6753),
                        createGovernorate("jeddah", "Jeddah", "جدة", "SA", "Western", 21.4858, 39.1925),
                        createGovernorate("mecca", "Mecca", "مكة المكرمة", "SA", "Western", 21.3891, 39.8579),
                        createGovernorate("medina", "Medina", "المدينة المنورة", "SA", "Western", 24.5247, 39.5692),
                        createGovernorate("dammam", "Dammam", "الدمام", "SA", "Eastern", 26.4207, 50.0888),
                        createGovernorate("dubai", "Dubai", "دبي", "AE", "Dubai", 25.2048, 55.2708),
                        createGovernorate("abu-dhabi", "Abu Dhabi", "أبو ظبي", "AE", "Abu Dhabi", 24.4539, 54.3773),
                        createGovernorate("sharjah", "Sharjah", "الشارقة", "AE", "Sharjah", 25.3463, 55.4209),
                        createGovernorate("doha", "Doha", "الدوحة", "QA", "Doha", 25.2854, 51.5310),
                        createGovernorate("kuwait-city", "Kuwait City", "مدينة الكويت", "KW", "Al Asimah", 29.3759, 47.9774)
                );

                governorateRepository.saveAll(governorates);
                log.info("Successfully initialized {} governorates.", governorates.size());
            } else {
                log.info("Governorates already exist. Skipping initialization.");
            }
        };
    }

    private Governorate createGovernorate(String slug, String nameEn, String nameAr, String countryCode,
                                         String region, Double latitude, Double longitude) {
        // Validate inputs
        if (StringUtils.isBlank(slug) || StringUtils.isBlank(nameEn) || StringUtils.isBlank(nameAr) || StringUtils.isBlank(countryCode)) {
            throw new IllegalArgumentException("Slug, names, and country code cannot be blank.");
        }
        Objects.requireNonNull(latitude, "Latitude cannot be null.");
        Objects.requireNonNull(longitude, "Longitude cannot be null.");

        Governorate governorate = new Governorate();
        governorate.setSlug(slug.trim());
        governorate.setDisplayNameEn(nameEn.trim());
        governorate.setDisplayNameAr(nameAr.trim());
        governorate.setCountryCode(countryCode.trim());
        governorate.setRegion(StringUtils.isBlank(region) ? null : region.trim()); // Allow region to be blank/null
        governorate.setLatitude(latitude);
        governorate.setLongitude(longitude);
        governorate.setIsActive(true);
        return governorate;
    }
}

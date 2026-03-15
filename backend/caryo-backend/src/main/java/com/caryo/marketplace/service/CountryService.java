package com.caryo.marketplace.service;

import com.caryo.marketplace.exception.ResourceAlreadyExistsException;
import com.caryo.marketplace.exception.ResourceNotFoundException;
import com.caryo.marketplace.mapper.CountryMapper;
import com.caryo.marketplace.model.Country;
import com.caryo.marketplace.payload.request.CountryRequest;
import com.caryo.marketplace.payload.response.CountryResponse;
import com.caryo.marketplace.repository.CountryRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

@Service
@Validated
@RequiredArgsConstructor
@Slf4j
public class CountryService {

    private final CountryRepository countryRepository;
    private final CountryMapper countryMapper;

    /**
     * Create a new country
     */
    @Transactional
    public CountryResponse createCountry(@Valid CountryRequest request) {
        log.info("Creating new country with code: {}", request.getCountryCode());

        // Check if country already exists with the same code
        if (countryRepository.existsByCountryCode(request.getCountryCode())) {
            throw new ResourceAlreadyExistsException("Country", "countryCode", request.getCountryCode());
        }

        // Create and save the new country
        Country country = countryMapper.toCountry(request);
        Country savedCountry = countryRepository.save(country);

        log.info("Successfully created country with ID: {}", savedCountry.getId());
        return countryMapper.toCountryResponse(savedCountry);
    }

    /**
     * Get a country by its ID
     */
    @Transactional(readOnly = true)
    public CountryResponse getCountryById(Long id) {
        log.debug("Fetching country with ID: {}", id);
        Country country = findCountryById(id);
        return countryMapper.toCountryResponse(country);
    }

    /**
     * Get a country by its code
     */
    @Transactional(readOnly = true)
    public CountryResponse getCountryByCode(String countryCode) {
        log.debug("Fetching country with code: {}", countryCode);
        Country country = countryRepository.findByCountryCode(countryCode)
            .orElseThrow(() -> new ResourceNotFoundException("Country", "countryCode", countryCode));
        return countryMapper.toCountryResponse(country);
    }

    /**
     * Get all countries with pagination
     */
    @Transactional(readOnly = true)
    public Page<CountryResponse> getAllCountries(Pageable pageable) {
        log.debug("Fetching countries page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        return countryRepository.findAll(pageable)
            .map(countryMapper::toCountryResponse);
    }

    /**
     * Update an existing country
     */
    @Transactional
    public CountryResponse updateCountry(Long id, @Valid CountryRequest request) {
        log.info("Updating country with ID: {}", id);

        Country country = findCountryById(id);

        // Check if new country code conflicts with existing one (excluding current country)
        if (!country.getCountryCode().equals(request.getCountryCode()) &&
            countryRepository.existsByCountryCode(request.getCountryCode())) {
            throw new ResourceAlreadyExistsException("Country", "countryCode", request.getCountryCode());
        }

        countryMapper.updateCountryFromRequest(country, request);
        Country updatedCountry = countryRepository.save(country);

        log.info("Successfully updated country with ID: {}", id);
        return countryMapper.toCountryResponse(updatedCountry);
    }

    /**
     * Delete a country by its ID
     */
    @Transactional
    public void deleteCountry(Long id) {
        log.info("Deleting country with ID: {}", id);
        Country country = findCountryById(id);
        countryRepository.delete(country);
        log.info("Successfully deleted country with ID: {}", id);
    }

    /**
     * Helper method to find a country by ID
     */
    private Country findCountryById(Long id) {
        return countryRepository.findById(id)
            .orElseThrow(() -> {
                log.warn("Country lookup failed for ID: {}", id);
                return new ResourceNotFoundException("Country", "id", id);
            });
    }
}

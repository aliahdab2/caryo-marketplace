package com.caryo.marketplace.service;

import com.caryo.marketplace.model.Governorate;
import com.caryo.marketplace.payload.response.GovernorateResponse;
import com.caryo.marketplace.repository.GovernorateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GovernorateService {

    private final GovernorateRepository governorateRepository;

    @Transactional(readOnly = true)
    public List<GovernorateResponse> getAllActiveGovernorates() {
        return governorateRepository.findByIsActiveTrue().stream()
                .map(GovernorateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GovernorateResponse> getGovernoratesByCountry(String countryCode) {
        return governorateRepository.findByCountry_CountryCodeOrderByDisplayNameEnAsc(countryCode).stream()
                .map(GovernorateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GovernorateResponse> getGovernoratesByCountryId(Long countryId) {
        return governorateRepository.findByCountry_IdOrderByDisplayNameEnAsc(countryId).stream()
                .map(GovernorateResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GovernorateResponse getGovernorateBySlug(String slug) {
        return governorateRepository.findBySlug(slug)
                .map(GovernorateResponse::fromEntity)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public Governorate findGovernorateBySlug(String slug) {
        return governorateRepository.findBySlug(slug).orElse(null);
    }
}

package com.autotrader.autotraderbackend.service;

import com.autotrader.autotraderbackend.model.Governorate;
import com.autotrader.autotraderbackend.payload.response.GovernorateResponse;
import com.autotrader.autotraderbackend.repository.GovernorateRepository;
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
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<GovernorateResponse> getGovernoratesByCountry(String countryCode) {
        return governorateRepository.findByCountryCodeOrderByDisplayNameEnAsc(countryCode).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public GovernorateResponse getGovernorateBySlug(String slug) {
        return governorateRepository.findBySlug(slug)
                .map(this::mapToResponse)
                .orElse(null);
    }
    
    @Transactional(readOnly = true)
    public Governorate findGovernorateBySlug(String slug) {
        return governorateRepository.findBySlug(slug).orElse(null);
    }

    private GovernorateResponse mapToResponse(Governorate governorate) {
        return GovernorateResponse.builder()
                .id(governorate.getId())
                .displayNameEn(governorate.getDisplayNameEn())
                .displayNameAr(governorate.getDisplayNameAr())
                .slug(governorate.getSlug())
                .countryCode(governorate.getCountryCode())
                .region(governorate.getRegion())
                .latitude(governorate.getLatitude())
                .longitude(governorate.getLongitude())
                .build();
    }
}

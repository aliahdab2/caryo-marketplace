package com.autotrader.autotraderbackend.payload.response;

import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
public class CountryResponse {
    private Long id;
    private String countryCode;
    private String displayNameEn;
    private String displayNameAr;
    private Boolean isActive;
    private Instant createdAt;
    private Instant updatedAt;
    // Consider adding a list of GovernorateResponse if needed for specific use cases,
    // but typically keep responses lean and fetch related data separately if required.
}

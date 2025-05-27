package com.autotrader.autotraderbackend.mapper;

import com.autotrader.autotraderbackend.model.Country;
import com.autotrader.autotraderbackend.payload.request.CountryRequest;
import com.autotrader.autotraderbackend.payload.response.CountryResponse;
import org.springframework.stereotype.Component;

@Component
public class CountryMapper {

    public CountryResponse toCountryResponse(Country country) {
        if (country == null) {
            return null;
        }

        CountryResponse response = new CountryResponse();
        response.setId(country.getId());
        response.setCountryCode(country.getCountryCode());
        response.setDisplayNameEn(country.getDisplayNameEn());
        response.setDisplayNameAr(country.getDisplayNameAr());
        response.setIsActive(country.getIsActive());
        response.setCreatedAt(country.getCreatedAt());
        response.setUpdatedAt(country.getUpdatedAt());
        return response;
    }

    public Country toCountry(CountryRequest request) {
        if (request == null) {
            return null;
        }

        Country country = new Country();
        updateCountryFromRequest(country, request);
        return country;
    }

    public void updateCountryFromRequest(Country country, CountryRequest request) {
        if (request == null || country == null) {
            return;
        }

        country.setCountryCode(request.getCountryCode());
        country.setDisplayNameEn(request.getDisplayNameEn());
        country.setDisplayNameAr(request.getDisplayNameAr());
        country.setIsActive(request.getIsActive() != null ? request.getIsActive() : true);
    }
}

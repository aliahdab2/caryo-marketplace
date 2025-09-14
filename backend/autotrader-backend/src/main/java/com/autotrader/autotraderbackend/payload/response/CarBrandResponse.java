package com.autotrader.autotraderbackend.payload.response;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for CarBrand API responses
 * Prevents lazy initialization issues by not including related entities
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CarBrandResponse {
    private Long id;
    private String name;
    private String slug;
    private String displayNameEn;
    private String displayNameAr;
    private String status;
    
    // Static factory method to create from entity
    public static CarBrandResponse fromEntity(com.autotrader.autotraderbackend.model.CarBrand brand) {
        if (brand == null) {
            return null;
        }
        
        return new CarBrandResponse(
            brand.getId(),
            brand.getName(),
            brand.getSlug(),
            brand.getDisplayNameEn(),
            brand.getDisplayNameAr(),
            brand.getStatus() != null ? brand.getStatus().toString() : "INACTIVE"
        );
    }
} 
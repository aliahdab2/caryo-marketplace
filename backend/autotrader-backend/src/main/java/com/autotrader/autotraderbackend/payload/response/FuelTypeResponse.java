package com.autotrader.autotraderbackend.payload.response;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for FuelType API responses
 * Prevents lazy initialization issues by not including related entities
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FuelTypeResponse {
    private Long id;
    private String name;
    private String slug;
    private String displayNameEn;
    private String displayNameAr;

    // Static factory method to create from entity
    public static FuelTypeResponse fromEntity(com.autotrader.autotraderbackend.model.FuelType fuelType) {
        if (fuelType == null) {
            return null;
        }

        return new FuelTypeResponse(
            fuelType.getId(),
            fuelType.getName(),
            fuelType.getSlug(),
            fuelType.getDisplayNameEn(),
            fuelType.getDisplayNameAr()
        );
    }
}

package com.autotrader.autotraderbackend.payload.response;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for CarModel API responses
 * Includes brand information for admin data management
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CarModelResponse {
    private Long id;
    private String name;
    private String slug;
    private String displayNameEn;
    private String displayNameAr;
    private Boolean isActive;
    private Long brandId; // Include brand ID for reference
    private CarBrandResponse brand; // Include full brand information for admin interface

    // Static factory method to create from entity
    public static CarModelResponse fromEntity(com.autotrader.autotraderbackend.model.CarModel model) {
        if (model == null) {
            return null;
        }

        return new CarModelResponse(
            model.getId(),
            model.getName(),
            model.getSlug(),
            model.getDisplayNameEn(),
            model.getDisplayNameAr(),
            model.getIsActive(),
            model.getBrand() != null ? model.getBrand().getId() : null,
            model.getBrand() != null ? CarBrandResponse.fromEntity(model.getBrand()) : null
        );
    }
}
package com.autotrader.autotraderbackend.payload.response;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * DTO for Transmission API responses
 * Prevents lazy initialization issues by not including related entities
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TransmissionResponse {
    private Long id;
    private String name;
    private String slug;
    private String displayNameEn;
    private String displayNameAr;

    // Static factory method to create from entity
    public static TransmissionResponse fromEntity(com.autotrader.autotraderbackend.model.Transmission transmission) {
        if (transmission == null) {
            return null;
        }

        return new TransmissionResponse(
            transmission.getId(),
            transmission.getName(),
            transmission.getSlug(),
            transmission.getDisplayNameEn(),
            transmission.getDisplayNameAr()
        );
    }
}

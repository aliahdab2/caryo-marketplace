package com.caryo.marketplace.payload.request;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for updating car model information
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateModelRequest {

    @NotBlank(message = "Model name is required")
    @Size(max = 50, message = "Model name must not exceed 50 characters")
    private String name;

    @NotBlank(message = "English display name is required")
    @Size(max = 100, message = "English display name must not exceed 100 characters")
    private String displayNameEn;

    @NotBlank(message = "Arabic display name is required")
    @Size(max = 100, message = "Arabic display name must not exceed 100 characters")
    private String displayNameAr;

    @NotNull(message = "Active status is required")
    private Boolean isActive;

    @NotNull(message = "Brand ID is required")
    private Long brandId;

    @Override
    public String toString() {
        return "UpdateModelRequest{" +
                "name='" + name + '\'' +
                ", displayNameEn='" + displayNameEn + '\'' +
                ", displayNameAr='" + displayNameAr + '\'' +
                ", isActive=" + isActive +
                ", brandId=" + brandId +
                '}';
    }
}

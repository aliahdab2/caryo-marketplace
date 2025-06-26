package com.autotrader.autotraderbackend.payload.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request object for creating or updating seller types")
public class SellerTypeRequest {
    
    @NotBlank(message = "Seller type name is required")
    @Size(min = 2, max = 20, message = "Seller type name must be between 2 and 20 characters")
    @Schema(description = "Seller type name", example = "DEALER")
    private String name;
    
    @NotBlank(message = "English display name is required")
    @Size(min = 2, max = 50, message = "English display name must be between 2 and 50 characters")
    @Schema(description = "Display name in English", example = "Dealer")
    private String displayNameEn;
    
    @NotBlank(message = "Arabic display name is required")
    @Size(min = 2, max = 50, message = "Arabic display name must be between 2 and 50 characters")
    @Schema(description = "Display name in Arabic", example = "تاجر")
    private String displayNameAr;
}

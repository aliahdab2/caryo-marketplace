package com.autotrader.autotraderbackend.payload.response;

import com.autotrader.autotraderbackend.model.SellerType;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Seller type information")
public class SellerTypeResponse {
    
    @Schema(description = "Seller type ID", example = "1")
    private Long id;
    
    @Schema(description = "Seller type name", example = "DEALER")
    private String name;
    
    @Schema(description = "Display name in English", example = "Dealer")
    private String displayNameEn;
    
    @Schema(description = "Display name in Arabic", example = "تاجر")
    private String displayNameAr;
    
    @Schema(description = "Creation timestamp")
    private LocalDateTime createdAt;
    
    @Schema(description = "Last update timestamp")
    private LocalDateTime updatedAt;

    /**
     * Factory method to create SellerTypeResponse from SellerType entity
     */
    public static SellerTypeResponse fromEntity(SellerType sellerType) {
        if (sellerType == null) {
            return null;
        }
        
        return SellerTypeResponse.builder()
                .id(sellerType.getId())
                .name(sellerType.getName())
                .displayNameEn(sellerType.getDisplayNameEn())
                .displayNameAr(sellerType.getDisplayNameAr())
                .createdAt(sellerType.getCreatedAt())
                .updatedAt(sellerType.getUpdatedAt())
                .build();
    }
}

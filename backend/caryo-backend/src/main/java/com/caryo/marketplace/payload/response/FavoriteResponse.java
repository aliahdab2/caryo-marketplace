package com.caryo.marketplace.payload.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FavoriteResponse {
    private Long id;
    private Long userId;
    private Long carListingId;
    private LocalDateTime createdAt;

    // Add any additional fields needed for the response
}

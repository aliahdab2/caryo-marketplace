package com.autotrader.autotraderbackend.payload.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

/**
 * Request DTO for reordering media items in a car listing.
 * Each item specifies the media ID and its new sort order.
 */
@Getter
@Setter
public class MediaReorderRequest {
    
    @NotNull(message = "Media ID is required")
    private Long id;
    
    @NotNull(message = "Sort order is required")
    @PositiveOrZero(message = "Sort order must be zero or positive")
    private Integer sortOrder;
    
    public MediaReorderRequest() {}
    
    public MediaReorderRequest(Long id, Integer sortOrder) {
        this.id = id;
        this.sortOrder = sortOrder;
    }
    
    @Override
    public String toString() {
        return "MediaReorderRequest{" +
                "id=" + id +
                ", sortOrder=" + sortOrder +
                '}';
    }
}

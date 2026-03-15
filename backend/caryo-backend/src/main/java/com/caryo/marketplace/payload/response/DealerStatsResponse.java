package com.caryo.marketplace.payload.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DealerStatsResponse {
    private long totalListings;
    private long activeListings;
    private long soldCount;
}

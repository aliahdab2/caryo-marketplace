package com.caryo.marketplace.payload.response;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PublicDealerResponse {
    private Long id;
    private String businessName;
    private String businessPhone;
    private String tradingAddress;
    private String logoUrl;
    private String bannerUrl;
    private LocalDateTime memberSince;
    private String description;
    private String descriptionAr;
    private String workingHours;
    private String socialLinks;
    private DealerStatsResponse stats;
}

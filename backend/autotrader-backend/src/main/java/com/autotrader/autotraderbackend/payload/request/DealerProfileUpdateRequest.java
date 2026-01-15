package com.autotrader.autotraderbackend.payload.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DealerProfileUpdateRequest {
    private String businessName;
    private String tradingAddress;
    private String businessEmail;
    private String businessPhone;
    private String logoUrl;
    private String bannerUrl;
    private String description;
    private String descriptionAr;
    private String workingHours;
    private String socialLinks;
}

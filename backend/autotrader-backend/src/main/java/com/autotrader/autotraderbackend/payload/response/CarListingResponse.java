package com.autotrader.autotraderbackend.payload.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CarListingResponse {
    
    private Long id;
    private String title;
    private String brand;
    private String model;
    private Integer year;
    private Integer mileage;
    private BigDecimal price;
    private String location;
    private String description;
    private String imageUrl;
    private Boolean approved;
    private Long sellerId;
    private String sellerUsername;
    private LocalDateTime createdAt;
}

package com.autotrader.autotraderbackend.payload.response;

import com.autotrader.autotraderbackend.model.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CarReferenceDataResponse {
    private List<CarCondition> carConditions;
    private List<DriveType> driveTypes;
    private List<BodyStyle> bodyStyles;
    private List<FuelType> fuelTypes;
    private List<Transmission> transmissions;
    private List<SellerTypeResponse> sellerTypes;
}

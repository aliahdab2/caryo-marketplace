package com.autotrader.autotraderbackend.config;

import com.autotrader.autotraderbackend.model.*;
import com.autotrader.autotraderbackend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

/**
 * Initializes reference data for the application.
 * This ensures that basic lookup values exist in the database
 * even when using in-memory databases.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReferenceDataInitializer implements CommandLineRunner {

    private final CarConditionService carConditionService;
    private final DriveTypeService driveTypeService;
    private final BodyStyleService bodyStyleService;
    private final FuelTypeService fuelTypeService;
    private final TransmissionService transmissionService;
    private final SellerTypeService sellerTypeService;

    @Override
    public void run(String... args) {
        log.info("Initializing reference data...");

        initializeCarConditions();
        initializeDriveTypes();
        initializeBodyStyles();
        initializeFuelTypes();
        initializeTransmissions();
        initializeSellerTypes();

        log.info("Reference data initialization complete.");
    }

    private void initializeCarConditions() {
        List<CarCondition> conditions = Arrays.asList(
            createCarCondition("new", "New", "جديد"),
            createCarCondition("like_new", "Like New", "شبه جديد"),
            createCarCondition("excellent", "Excellent", "ممتاز"),
            createCarCondition("very_good", "Very Good", "جيد جداً"),
            createCarCondition("good", "Good", "جيد"),
            createCarCondition("fair", "Fair", "مقبول")
        );
        
        for (CarCondition condition : conditions) {
            try {
                // Try to find existing condition by name
                carConditionService.getConditionByName(condition.getName());
                log.debug("Car condition '{}' already exists", condition.getName());
            } catch (Exception e) {
                // If not found, create it
                carConditionService.createCondition(condition);
                log.info("Created car condition: {}", condition.getName());
            }
        }
    }
    
    private void initializeDriveTypes() {
        List<DriveType> driveTypes = Arrays.asList(
            createDriveType("fwd", "Front-Wheel Drive", "دفع أمامي"),
            createDriveType("rwd", "Rear-Wheel Drive", "دفع خلفي"),
            createDriveType("awd", "All-Wheel Drive", "دفع رباعي"),
            createDriveType("4wd", "Four-Wheel Drive", "دفع رباعي")
        );
        
        for (DriveType driveType : driveTypes) {
            try {
                driveTypeService.getDriveTypeByName(driveType.getName());
                log.debug("Drive type '{}' already exists", driveType.getName());
            } catch (Exception e) {
                driveTypeService.createDriveType(driveType);
                log.info("Created drive type: {}", driveType.getName());
            }
        }
    }
    
    private void initializeBodyStyles() {
        List<BodyStyle> bodyStyles = Arrays.asList(
            createBodyStyle("sedan", "Sedan", "سيدان"),
            createBodyStyle("suv", "SUV", "إس يو في"),
            createBodyStyle("hatchback", "Hatchback", "هاتشباك"),
            createBodyStyle("coupe", "Coupe", "كوبيه"),
            createBodyStyle("pickup", "Pickup Truck", "بيك أب"),
            createBodyStyle("convertible", "Convertible", "مكشوفة"),
            createBodyStyle("wagon", "Wagon", "ستيشن"),
            createBodyStyle("van", "Van", "فان"),
            createBodyStyle("minivan", "Minivan", "ميني فان"),
            createBodyStyle("crossover", "Crossover", "كروس أوفر")
        );
        
        for (BodyStyle bodyStyle : bodyStyles) {
            try {
                bodyStyleService.getBodyStyleByName(bodyStyle.getName());
                log.debug("Body style '{}' already exists", bodyStyle.getName());
            } catch (Exception e) {
                bodyStyleService.createBodyStyle(bodyStyle);
                log.info("Created body style: {}", bodyStyle.getName());
            }
        }
    }
    
    private void initializeFuelTypes() {
        List<FuelType> fuelTypes = Arrays.asList(
            createFuelType("gasoline", "Gasoline", "بنزين"),
            createFuelType("diesel", "Diesel", "ديزل"),
            createFuelType("hybrid", "Hybrid", "هجين"),
            createFuelType("electric", "Electric", "كهرباء"),
            createFuelType("cng", "CNG", "غاز طبيعي"),
            createFuelType("lpg", "LPG", "غاز مسال")
        );
        
        for (FuelType fuelType : fuelTypes) {
            try {
                fuelTypeService.getFuelTypeByName(fuelType.getName());
                log.debug("Fuel type '{}' already exists", fuelType.getName());
            } catch (Exception e) {
                fuelTypeService.createFuelType(fuelType);
                log.info("Created fuel type: {}", fuelType.getName());
            }
        }
    }
    
    private void initializeTransmissions() {
        List<Transmission> transmissions = Arrays.asList(
            createTransmission("automatic", "Automatic", "أوتوماتيك"),
            createTransmission("manual", "Manual", "عادي"),
            createTransmission("cvt", "CVT", "تعشيق مستمر"),
            createTransmission("semi_auto", "Semi-Automatic", "نصف أوتوماتيك"),
            createTransmission("dual_clutch", "Dual Clutch", "ثنائي القابض")
        );
        
        for (Transmission transmission : transmissions) {
            try {
                transmissionService.getTransmissionByName(transmission.getName());
                log.debug("Transmission '{}' already exists", transmission.getName());
            } catch (Exception e) {
                transmissionService.createTransmission(transmission);
                log.info("Created transmission: {}", transmission.getName());
            }
        }
    }
    
    private void initializeSellerTypes() {
        List<SellerType> sellerTypes = Arrays.asList(
            createSellerType("private", "Private Seller", "بائع خاص"),
            createSellerType("dealer", "Dealer", "معرض سيارات"),
            createSellerType("certified", "Certified Dealer", "معرض معتمد")
        );
        
        for (SellerType sellerType : sellerTypes) {
            try {
                sellerTypeService.getSellerTypeByName(sellerType.getName());
                log.debug("Seller type '{}' already exists", sellerType.getName());
            } catch (Exception e) {
                sellerTypeService.createSellerType(sellerType);
                log.info("Created seller type: {}", sellerType.getName());
            }
        }
    }

    // Helper methods for creating entities
    
    private CarCondition createCarCondition(String name, String displayNameEn, String displayNameAr) {
        CarCondition condition = new CarCondition();
        condition.setName(name);
        condition.setDisplayNameEn(displayNameEn);
        condition.setDisplayNameAr(displayNameAr);
        return condition;
    }
    
    private DriveType createDriveType(String name, String displayNameEn, String displayNameAr) {
        DriveType driveType = new DriveType();
        driveType.setName(name);
        driveType.setDisplayNameEn(displayNameEn);
        driveType.setDisplayNameAr(displayNameAr);
        return driveType;
    }
    
    private BodyStyle createBodyStyle(String name, String displayNameEn, String displayNameAr) {
        BodyStyle bodyStyle = new BodyStyle();
        bodyStyle.setName(name);
        bodyStyle.setDisplayNameEn(displayNameEn);
        bodyStyle.setDisplayNameAr(displayNameAr);
        return bodyStyle;
    }
    
    private FuelType createFuelType(String name, String displayNameEn, String displayNameAr) {
        FuelType fuelType = new FuelType();
        fuelType.setName(name);
        fuelType.setDisplayNameEn(displayNameEn);
        fuelType.setDisplayNameAr(displayNameAr);
        return fuelType;
    }
    
    private Transmission createTransmission(String name, String displayNameEn, String displayNameAr) {
        Transmission transmission = new Transmission();
        transmission.setName(name);
        transmission.setDisplayNameEn(displayNameEn);
        transmission.setDisplayNameAr(displayNameAr);
        return transmission;
    }
    
    private SellerType createSellerType(String name, String displayNameEn, String displayNameAr) {
        SellerType sellerType = new SellerType();
        sellerType.setName(name);
        sellerType.setDisplayNameEn(displayNameEn);
        sellerType.setDisplayNameAr(displayNameAr);
        return sellerType;
    }
}
